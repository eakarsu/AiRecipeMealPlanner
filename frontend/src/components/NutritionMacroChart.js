import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const COLORS = { protein: '#8b5cf6', carbs: '#22d3ee', fat: '#f59e0b' };

export default function NutritionMacroChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => {
    let alive = true;
    api.get('/custom-views/nutrition-macros', { params: { days } })
      .then((r) => { if (alive) setData(r.data); })
      .catch((e) => { if (alive) setError(e.response?.data?.error || e.message); });
    return () => { alive = false; };
  }, [days]);

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">Error: {error}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading nutrition macros...</div>;

  const macros = data.macros || [];
  const W = 720, H = 280, P = 40;
  const maxVal = Math.max(1, ...macros.flatMap((m) => [m.protein_g, m.carbs_g, m.fat_g]));
  const groupW = (W - P * 2) / Math.max(1, macros.length);
  const barW = groupW / 4;

  const y = (v) => H - P - (v / maxVal) * (H - P * 2);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="nutrition-macro-chart">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Nutrition Macros per Meal</h3>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm">
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
        </select>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        Totals: <strong>{data.totals?.calories} kcal</strong> · P {data.totals?.protein_g}g · C {data.totals?.carbs_g}g · F {data.totals?.fat_g}g
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={P} x2={W - P} y1={y(g * maxVal)} y2={y(g * maxVal)} stroke="#e5e7eb" />
            <text x={6} y={y(g * maxVal) + 4} fill="#6b7280" fontSize="10">{Math.round(g * maxVal)}g</text>
          </g>
        ))}
        {macros.map((m, i) => {
          const gx = P + i * groupW + barW / 2;
          return (
            <g key={m.meal}>
              <rect x={gx} y={y(m.protein_g)} width={barW} height={H - P - y(m.protein_g)} fill={COLORS.protein} />
              <rect x={gx + barW} y={y(m.carbs_g)} width={barW} height={H - P - y(m.carbs_g)} fill={COLORS.carbs} />
              <rect x={gx + barW * 2} y={y(m.fat_g)} width={barW} height={H - P - y(m.fat_g)} fill={COLORS.fat} />
              <text x={gx + barW * 1.5} y={H - 12} fill="#374151" fontSize="11" textAnchor="middle">{m.meal}</text>
              <text x={gx + barW * 1.5} y={H - 2} fill="#9ca3af" fontSize="9" textAnchor="middle">{m.calories} kcal</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.protein }}></span> Protein</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.carbs }}></span> Carbs</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.fat }}></span> Fat</span>
      </div>
    </div>
  );
}
