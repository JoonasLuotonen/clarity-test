'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import ClarityRadar from '../components/ClarityRadar';
import QuickWins from '../components/QuickWins';
import SectionSuggestions from '../components/SectionSuggestions';
import CompassAnalysis from '../components/CompassAnalysis';

function normalizeUrl(input) {
  if (!input) return null;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { return new URL(s).href; } catch { return null; }
}

export default function AppPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function analyze(e) {
    e.preventDefault();
    setError(''); setData(null);
    const fixed = normalizeUrl(url);
    if (!fixed) { setError('Please enter a valid URL like https://example.com'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fixed })
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Failed to analyze');
      else setData(json);
    } catch {
      setError('Network or CORS error. Some sites block bots.');
    } finally { setLoading(false); }
  }

  return (
    <section className="container py-10">
      <h1 className="text-3xl font-bold">Clarity Test 2.0</h1>
      <p className="text-slate-600 mt-1">
        Paste a public URL. We’ll analyze copy, headings, CTAs, tone, and hierarchy — then suggest specific fixes.
      </p>

      <form onSubmit={analyze} noValidate className="flex gap-3 mt-6">
        <input
          type="text"
          inputMode="url"
          placeholder="https://example.com (or just example.com)"
          value={url}
          onChange={e=>setUrl(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-3 bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Analyzing…' : 'Run test'}
        </button>
      </form>

      {error && (
        <div className="card mt-6 p-3 text-red-700 bg-red-50 border-red-200">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-8 space-y-8">
          {/* Compass (Radar) + Quick Wins */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="text-sm text-slate-500 mb-2">
                Compass (overall: {data.compass?.overall ?? '—'})
              </div>
              <ClarityRadar scores={data.compass} />
            </div>
            <div className="card p-5">
              <QuickWins items={data.quickWins} />
            </div>
          </section>

          {/* Compass Analysis (five areas) */}
          <section className="card p-5">
            <h3 className="text-xl font-semibold mb-3">Compass Analysis</h3>
            <CompassAnalysis insights={data.compassInsights} />
          </section>

          {/* Section improvement ideas */}
          <section className="card p-5">
            <SectionSuggestions sections={data.sections} />
          </section>

          <div className="text-xs text-slate-500">
            Some sites block bots; if analysis fails, try another URL.
          </div>
        </div>
      )}
    </section>
  );
}
