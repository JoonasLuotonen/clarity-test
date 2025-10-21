'use client';

export default function SectionSuggestions({ sections }) {
  if (!sections || !sections.length) return null;
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Section improvements</h3>
      <div className="space-y-4">
        {sections.map(s => (
          <details key={s.id} className="border rounded-lg bg-white">
            <summary className="cursor-pointer px-3 py-2 flex items-center justify-between">
              <div className="font-medium">{s.label}</div>
              <div className="text-xs opacity-70">{s.snippet}</div>
            </summary>
            <div className="px-3 pb-3">
              {s.suggestions.length === 0 ? (
                <div className="text-sm opacity-70">Looks clear — no obvious fixes.</div>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {s.suggestions.map((it, idx)=>(
                    <li key={idx}>
                      <span className="font-medium">{it.title} — </span>
                      <span className="opacity-80">{it.why}</span>
                      <div><span className="font-semibold">How: </span>{it.how}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
