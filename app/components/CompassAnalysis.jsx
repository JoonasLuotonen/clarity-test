'use client';

export default function CompassAnalysis({ insights }) {
  if (!insights) return null;

  const Row = ({label, text}) => (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-1">{text}</div>
    </div>
  );

  return (
    <div className="space-y-3">
      <Row label="Message Clarity"   text={insights.messageClarity} />
      <Row label="Visual Hierarchy"  text={insights.visualHierarchy} />
      <Row label="Consistency"       text={insights.consistency} />
      <Row label="Conversion Focus"  text={insights.conversionFocus} />
      <Row label="Brand Tone"        text={insights.brandTone} />
    </div>
  );
}
