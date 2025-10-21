'use client';

function bucketColor(score) {
  if (score >= 75) return 'bg-green-500/70';
  if (score >= 55) return 'bg-yellow-500/70';
  return 'bg-red-500/70';
}

export default function ClarityMap({ sections }) {
  if (!sections || sections.length === 0) return null;

  const totalWords = sections.reduce((a, s) => a + (s.metrics.textWords || 0), 0) || 1;

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-slate-500">Clarity Map (by section)</div>
      <div className="relative border rounded-xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-white/10" />
          ))}
        </div>

        <div className="flex flex-col">
          {sections.map((s) => {
            const ratio = (s.metrics.textWords || 0) / totalWords;
            const heightRem = Math.max(3, Math.round(ratio * 24));
            return (
              <div
                key={s.id}
                className={`relative ${bucketColor(s.metrics.clarity)} text-white`}
                style={{ minHeight: `${heightRem}rem` }}
                title={`${s.label}: ${s.metrics.clarity}/100`}
              >
                <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-sm bg-black/30 rounded px-2 py-0.5">
                    {s.metrics.clarity}/100
                  </div>
                </div>
                <div className="absolute bottom-2 left-3 right-3 text-sm opacity-90">
                  {s.snippet}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 items-center mt-3 text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-500/70 rounded-sm" /> clear
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-yellow-500/70 rounded-sm" /> mixed
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-500/70 rounded-sm" /> unclear
        </div>
      </div>
    </div>
  );
}
