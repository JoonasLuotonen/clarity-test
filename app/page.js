'use client';

import { useState } from 'react';
import ClarityRadar from './components/ClarityRadar';
import QuickWins from './components/QuickWins';
import SectionSuggestions from './components/SectionSuggestions';
import CompassAnalysis from './components/CompassAnalysis'; // <-- important

function normalizeUrl(input) {
  if (!input) return null;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { return new URL(s).href; } catch { return null; }
}

export default function Home() {
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
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 16px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Clarity Test 2.0</h1>
        <p style={{ opacity: 0.75, marginBottom: 24 }}>
          Practical analysis with Quick Wins. The Compass shows your clarity profile; insights and section suggestions show exactly what to fix.
        </p>

        <form onSubmit={analyze} noValidate style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com (or just example.com)"
            value={url}
            onChange={e=>setUrl(e.target.value)}
            style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: 8, padding: '10px 14px', background: '#000', color: '#fff',
              opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer'
            }}
          >
            {loading ? 'Analyzing…' : 'Run test'}
          </button>
        </form>

        {error && (
          <div style={{ marginBottom: 24, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '10px 12px' }}>
            {error}
          </div>
        )}

        {data && (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Compass (Radar) + Quick Wins */}
            <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, background: '#fff' }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                  Compass (overall: {data.compass?.overall ?? '—'})
                </div>
                <ClarityRadar scores={data.compass} />
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, background: '#fff' }}>
                <QuickWins items={data.quickWins} />
              </div>
            </section>

            {/* Compass Analysis (the five areas) */}
            <section style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, background: '#fff' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Compass Analysis</h3>
              <CompassAnalysis insights={data.compassInsights} />
            </section>

            {/* Section improvement ideas */}
            <section style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, background: '#fff' }}>
              <SectionSuggestions sections={data.sections} />
            </section>

            <section style={{ fontSize: 12, opacity: 0.65 }}>
              Some sites block bots; if analysis fails, try another URL.
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
