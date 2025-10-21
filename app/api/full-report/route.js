// app/api/full-report/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUrl(str) {
  try { const u = new URL(str); return /^https?:$/.test(u.protocol) && !!u.host; }
  catch { return false; }
}
function norm(s = "") { return s.replace(/\s+/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "").trim(); }

async function fetchPageText(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "ClarityTestBot/1.0", Accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${url}`);
  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html")) return "";
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();

  const title = norm($("title").first().text());
  const desc  = norm($('meta[name="description"]').attr("content") || "");
  const h     = $("h1, h2, h3").map((_, el) => norm($(el).text())).get().filter(Boolean).join("\n");
  const p     = $("p, li").map((_, el) => norm($(el).text())).get().filter(Boolean).join("\n");
  const links = $("a").map((_, el) => norm($(el).text())).get().filter(Boolean).slice(0,80).join(" | ");

  return [title, desc, h, p, `LINK_TEXTS: ${links}`].filter(Boolean).join("\n\n").slice(0,14000);
}

const systemPrompt = `
You are a senior CRO/UX auditor. Evaluate ONLY the provided page text.

Lenses:
1) Value Clarity — what it is, for whom, why now
2) Info Hierarchy & Readability — headings, scannability, language
3) Brand Signals & Trust — consistency, proof, credibility cues
4) Conversion Path & Friction — primary CTA, next steps, objections

Return STRICT JSON only. If a field has no data, use [] or 0. Do not omit any field.
{
  "language": "en|fi|...",
  "summary": "3–4 sentences, specific to the page",
  "overallScore": 0-100,
  "scores": {
    "valueClarity": 0-5,
    "hierarchyReadability": 0-5,
    "brandTrust": 0-5,
    "conversionFriction": 0-5
  },
  "findings": [
    { "lens": "Value Clarity|Info Hierarchy & Readability|Brand Signals & Trust|Conversion Path & Friction",
      "title": "short issue title",
      "severity": "high|medium|low",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "evidence": "quote or reference",
      "recommendation": "clear fix in 1–2 sentences" }
  ],
  "prioritizedActions": ["Top 5 actions in priority order"],
  "suggestedCTAs": ["CTA label"],
  "copyImprovements": [
    { "before": "short snippet", "after": "improved rewrite", "reason": "why this is clearer" }
  ]
}
`;

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !isValidUrl(url)) {
      return NextResponse.json({ error: "Please provide a valid URL starting with http(s)://" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY on server." }, { status: 500 });
    }

    let pageText = "";
    try { pageText = await fetchPageText(url); } catch { pageText = ""; }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userContent = pageText
      ? `URL: ${url}\n\nEXTRACTED PAGE TEXT (truncated):\n${pageText}`
      : `URL: ${url}\n\nWARNING: Could not fetch/parse page text. Provide a cautious audit referencing this limitation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return NextResponse.json({ ok: true, mode: "text", result: raw }); }

    const safe = {
      language: parsed?.language || "n/a",
      summary: parsed?.summary || "",
      overallScore: Number(parsed?.overallScore ?? 0),
      scores: {
        valueClarity: Number(parsed?.scores?.valueClarity ?? 0),
        hierarchyReadability: Number(parsed?.scores?.hierarchyReadability ?? 0),
        brandTrust: Number(parsed?.scores?.brandTrust ?? 0),
        conversionFriction: Number(parsed?.scores?.conversionFriction ?? 0),
      },
      findings: Array.isArray(parsed?.findings) ? parsed.findings.slice(0, 15) : [],
      prioritizedActions: Array.isArray(parsed?.prioritizedActions) ? parsed.prioritizedActions.slice(0, 10) : [],
      suggestedCTAs: Array.isArray(parsed?.suggestedCTAs) ? parsed.suggestedCTAs.slice(0, 10) : [],
      copyImprovements: Array.isArray(parsed?.copyImprovements) ? parsed.copyImprovements.slice(0, 10) : [],
    };

    return NextResponse.json({ ok: true, mode: "json", result: safe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "Unexpected server error." }, { status: 500 });
  }
}
