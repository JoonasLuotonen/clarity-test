'use client';

export default function QuickWins({ items }) {
  if (!items || !items.length) return null;

  const Chip = ({ children }) => (
    <span className="inline-block text-xs rounded-full px-2 py-0.5 border bg-slate-50">
      {children}
    </span>
  );

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Quick Wins (top fixes)</h3>
      <ul className="space-y-3">
        {items.map((w,i)=>(
          <li key={i} className="border rounded-lg p-3 bg-white">
            <div className="font-medium">{w.title}</div>
            <div className="text-sm opacity-80 mt-1">{w.why}</div>
            <div className="text-sm mt-1">
              <span className="font-semibold">Action: </span>{w.action}
            </div>
            <div className="mt-2 flex gap-2">
              <Chip>Impact: {w.impact}</Chip>
              <Chip>Effort: {w.effort}</Chip>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
