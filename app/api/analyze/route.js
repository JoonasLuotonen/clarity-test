import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// --- keyword dictionaries ---
const CTA_WORDS = [
  'get started','start now','try free','buy','subscribe','sign up',
  'contact','book','demo','learn more','see pricing','join','order','add to cart'
];
const JARGON = [
  'synergy','leverage','solutionizing','paradigm','framework-agnostic',
  'best-in-class','world-class','cutting-edge','ecosystem','hypergrowth',
  'enablement','omnichannel','seamless experience','digital transformation'
];

// --- small helpers ---
const txt = (s='') => s.replace(/\s+/g,' ').trim();
const words = (s='') => (s.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9\'-]+/g) || []);
const avgSentenceLen = (s='') => {
  const sentences = s.split(/[.!?]+/).map(t=>t.trim()).filter(Boolean);
  if (!sentences.length) return 0;
  return words(s).length / sentences.length;
};
const complexRatio = (s='') => {
  const w = words(s);
  if (!w.length) return 0;
  return w.filter(x => x.length >= 12).length / w.length;
};
const countHas = (hay='', needles=[]) => {
  const low = hay.toLowerCase();
  return needles.reduce((a,n)=>a+(low.includes(n)?1:0),0);
};
const hasSingleH1 = $ => $('h1').length === 1;
const imgNoAltCount = $ => $('img').filter((_,el)=>!($(el).attr('alt')||'').trim()).length;

// --- extract content blocks ---
function extractSections($) {
  const natural = $('section').toArray();
  if (natural.length) return natural.map((el,i)=>({label:`Section ${i+1}`, root: $(el)}));

  // fallback: chunk around h2s
  const chunks=[]; const kids=$('body').children().toArray(); let buf=[];
  for (const n of kids) {
    if ($(n).is('h2') && buf.length) { chunks.push(buf); buf=[n]; }
    else buf.push(n);
  }
  if (buf.length) chunks.push(buf);

  return chunks.map((group,i)=>{
    const html = group.map(n=>$.html(n)).join('\n');
    const $tmp = cheerio.load(`<wrap>${html}</wrap>`);
    return { label:`Block ${i+1}`, root:$tmp('wrap') };
  });
}

// --- per-section metrics & suggestions ---
function sectionMetrics(sec$){
  const text = txt(sec$.root.text()||'');
  const asl = avgSentenceLen(text);
  const cwr = complexRatio(text);
  const hCount = sec$.root.find('h1,h2,h3').length;
  const buttons = sec$.root.find('button,[role="button"],a[role="button"]');
  const ctas = countHas(text, CTA_WORDS) + buttons.length;

  let clarity = 100;
  clarity -= Math.max(0,(asl-22)*2);
  clarity -= Math.max(0,(cwr-0.06)*600);
  clarity += Math.min(10,hCount*2);
  clarity += Math.min(15,ctas*5);
  clarity = Math.max(0, Math.min(100, Math.round(clarity)));

  const suggestions = [];
  if (asl > 22) suggestions.push({
    title: 'Shorten long sentences',
    why: 'Long sentences slow scanning and hide the point.',
    how: 'Split sentences to ≤20 words. Lead with the outcome, then add detail.'
  });
  if (cwr > 0.08) suggestions.push({
    title: 'Replace complex words',
    why: 'Multi-syllable words reduce comprehension.',
    how: 'Swap jargon/long words (≥12 chars) for simpler alternatives your users use.'
  });
  if (countHas(text, JARGON) > 0) suggestions.push({
    title: 'Cut jargon',
    why: 'Buzzwords feel vague and reduce trust.',
    how: 'Use concrete nouns and verbs with a quick example.'
  });
  if (ctas === 0) suggestions.push({
    title: 'Add a clear CTA',
    why: 'Users need an obvious next step.',
    how: 'Add one primary CTA (e.g., “Pyydä tarjous”) at the end of the section.'
  });
  if (hCount === 0) suggestions.push({
    title: 'Introduce a heading',
    why: 'Headings anchor scanning and hierarchy.',
    how: 'Add a short, descriptive H2 naming the section’s purpose.'
  });

  return {
    snippet: text.slice(0,160),
    metrics: {
      avgSentenceLength: Number(asl.toFixed(2)),
      complexWordRatio: Number(cwr.toFixed(3)),
      headingCount: hCount,
      ctaSignals: ctas,
      clarity
    },
    suggestions
  };
}

// --- 5-dimensional Compass scores ---
function computeCompass($, sections){
  const title = txt($('title').text()||'');
  const desc = txt($('meta[name="description"]').attr('content')||'');
  const body = txt($('body').text()||'');
  const titleOk = title.length>=12 && title.length<=85;
  const descOk  = desc.length>=40 && desc.length<=180;

  const messageClarity = Math.max(0, Math.min(100,
    (titleOk?45:30) + (descOk?35:20) - countHas(body,JARGON)*3
  ));

  const visualHierarchy = Math.min(100,
    (hasSingleH1($)?40:20) + Math.min(30, $('h2').length*5) + Math.min(30, $('h3').length*3)
  );

  const btnTexts = $('button,[role="button"],a[role="button"]').map((_,el)=>txt($(el).text()).toLowerCase()).get().filter(Boolean);
  const uniq = new Set(btnTexts);
  const consistency = Math.max(30, 100 - Math.max(0, uniq.size-4)*8);

  const conversionFocus = Math.min(100,
    (countHas(body,CTA_WORDS)?60:35) + Math.min(40, $('form,[type="submit"],a[href*="pricing"],a[href*="signup"],a[href*="demo"]').length*6)
  );

  const asl = avgSentenceLen(body);
  const cwr = complexRatio(body);
  let brandTone = 100;
  brandTone -= Math.max(0,(asl-22)*2);
  brandTone -= Math.max(0,(cwr-0.06)*600);
  brandTone = Math.max(0, Math.min(100, Math.round(brandTone)));

  const sectionAvg = sections.length ? Math.round(sections.reduce((a,s)=>a+s.metrics.clarity,0)/sections.length) : 0;
  const overall = Math.round((messageClarity+visualHierarchy+consistency+conversionFocus+brandTone+sectionAvg)/6);

  return { messageClarity, visualHierarchy, consistency, conversionFocus, brandTone, overall };
}

// --- AI-style blurbs for Compass ---
function compassInsights($, compass) {
  const body = txt($('body').text()||'');
  const h1 = txt($('h1').first().text()||'');
  const h2c = $('h2').length;
  const btnTexts = $('button,[role="button"],a[role="button"]').map((_,el)=>txt($(el).text())).get().filter(Boolean);
  const uniqueBtns = [...new Set(btnTexts.map(s=>s.toLowerCase()))];
  const words = body.split(/\s+/).filter(Boolean);
  const sentences = body.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const asl = sentences.length ? (words.length / sentences.length) : 0;
  const longWordRatio = (body.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9'-]{12,}/g) || []).length / Math.max(1, words.length);
  const hasJargon = JARGON.some(j => body.toLowerCase().includes(j));

  return {
    messageClarity:
      `Top-line message ${h1 ? 'exists' : 'is unclear'}. ` +
      (hasJargon ? 'Contains jargon; prefer plain terms. ' : '') +
      (asl > 22 ? 'Sentences are long; aim ≤20 words. ' : 'Sentences read clearly. ') +
      'Lead the first screen with the outcome and one proof point.',
    visualHierarchy:
      `${$('h1').length === 1 ? 'Single' : 'Multiple/No'} H1; ${h2c} H2${h2c===1?'':'s'}. ` +
      'Keep one main focal area (headline + CTA) above the fold; reduce competing elements.',
    consistency:
      `CTA labels ${uniqueBtns.length ? `found (${uniqueBtns.slice(0,4).join(', ')}${uniqueBtns.length>4?', …':''})` : 'not detected'}. ` +
      'Reuse 1–2 primary labels site-wide to reduce cognitive load.',
    conversionFocus:
      `${$('form,[type="submit"],a[href*="pricing"],a[href*="signup"],a[href*="demo"]').length} funnel elements detected. ` +
      (btnTexts.length ? 'Primary CTA present. ' : 'Primary CTA weak/absent. ') +
      'Place one strong CTA high, repeat after proof.',
    brandTone:
      (asl > 22 || longWordRatio > 0.06 ? 'Tone feels dense/technical. ' : 'Tone is plain and readable. ') +
      'Prefer short sentences, concrete verbs, and remove filler words.'
  };
}

// --- Quick Wins (clean version) ---
function makeQuickWins($) {
  const wins = [];

  if (!hasSingleH1($)) {
    wins.push({
      title: 'Use one clear H1',
      why: 'A single page title clarifies message hierarchy.',
      action: 'Pick the main promise as H1; demote others to H2.',
      impact: 'High', effort: 'Low'
    });
  }

  const metaDesc = txt($('meta[name="description"]').attr('content')||'');
  if (metaDesc.length < 40 || metaDesc.length > 180) {
    wins.push({
      title: 'Fix meta description',
      why: 'Clear previews increase click-through.',
      action: 'Write a 120–160 character summary with outcome + proof.',
      impact: 'Medium', effort: 'Low'
    });
  }

  const body = txt($('body').text()||'');
  if (avgSentenceLen(body) > 22) {
    wins.push({
      title: 'Shorten sentences',
      why: 'Short sentences scan faster; bounce rate drops.',
      action: 'Edit to ≤20 words; lead each paragraph with the key outcome.',
      impact: 'High', effort: 'Medium'
    });
  }

  if (countHas(body, JARGON) > 0) {
    wins.push({
      title: 'Remove jargon',
      why: 'Concrete language builds trust and comprehension.',
      action: 'Replace buzzwords with specific benefits and examples.',
      impact: 'High', effort: 'Low'
    });
  }

  const btns = $('button,[role="button"],a[role="button"]');
  if (btns.length === 0) {
    wins.push({
      title: 'Add a primary CTA above the fold',
      why: 'A single obvious next step increases conversions.',
      action: 'Use one clear label (e.g., “Pyydä demo” / “Katso hinnat”).',
      impact: 'High', effort: 'Low'
    });
  } else {
    const texts = btns.map((_,el)=>txt($(el).text()).toLowerCase()).get().filter(Boolean);
    if (new Set(texts).size > 4) {
      wins.push({
        title: 'Standardize CTA labels',
        why: 'Too many different buttons create friction.',
        action: 'Keep 1 primary and 1 secondary label across the site.',
        impact: 'Medium', effort: 'Low'
      });
    }
  }

  const h1 = txt($('h1').first().text()||'');
  if (h1) {
    wins.unshift({
      title: 'Make the outcome explicit in the headline',
      why: 'Users decide in ~3–5 seconds based on the top message.',
      action: 'Pattern: “Saat [tulos] ilman [iso este]”. Pidä pituus ≤70–80 merkkiä.',
      impact: 'High', effort: 'Low'
    });
  }

  return wins.slice(0,6);
}

// --- main route handler ---
export async function POST(req) {
  try {
    let { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL missing' }, { status: 400 });
    if (!/^https?:\/\//i.test(url)) url = 'https://' + String(url).trim();
    try { new URL(url); } catch { return NextResponse.json({ error: 'Provide a valid URL' }, { status: 400 }); }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ClarityTestBot/1.0 (+https://example.com)' },
      redirect: 'follow',
      cache: 'no-store'
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const sectionsRaw = extractSections($);
    const sections = sectionsRaw.map(({label, root}, i) => {
      const s$ = { root };
      const m = sectionMetrics(s$);
      return { id: i+1, label, snippet: m.snippet, metrics: m.metrics, suggestions: m.suggestions };
    });

    const compass = computeCompass($, sections);
    const quickWins = makeQuickWins($);
    const insights = compassInsights($, compass);

    return NextResponse.json({
      url,
      compass,
      compassInsights: insights,
      quickWins,
      sections
    });
  } catch (e) {
    console.error('Analyze error:', e);
    return NextResponse.json({ error: 'Failed to analyze this URL.' }, { status: 500 });
  }
}
