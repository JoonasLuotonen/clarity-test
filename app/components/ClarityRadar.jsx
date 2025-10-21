'use client';

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ClarityRadar({ scores }) {
  if (!scores) return null;

  const labels = ['Message', 'Visual Hierarchy', 'Consistency', 'Conversion', 'Brand Tone'];
  const data = {
    labels,
    datasets: [
      {
        label: 'Clarity Profile',
        data: [
          scores.messageClarity,
          scores.visualHierarchy,
          scores.consistency,
          scores.conversionFocus,
          scores.brandTone
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      }
    ]
  };

  const options = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 20 },
        grid: { color: '#CBD5E1' },
        angleLines: { color: '#E2E8F0' },
        pointLabels: { color: '#334155' }
      }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="w-full max-w-md">
      <Radar data={data} options={options} />
    </div>
  );
}
