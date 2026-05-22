import React, { useEffect, useState } from 'react';
import api from '../api/axios';

function colorFor(v, max) {
  if (!max) return '#f3f4f6';
  const t = Math.min(1, v / max);
  // green ramp
  const r = Math.round(220 - 180 * t);
  const g = Math.round(252 - 80 * t);
  const b = Math.round(231 - 150 * t);
  return `rgb(${r},${g},${b})`;
}

export default function CuisineHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [weeks, setWeeks] = useState(8);

  useEffect(() => {
    let alive = true;
    api.get('/custom-views/cuisine-heatmap', { params: { weeks } })
      .then((r) => { if (alive) setData(r.data); })
      .catch((e) => { if (alive) setError(e.response?.data?.error || e.message); });
    return () => { alive = false; };
  }, [weeks]);

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">Error: {error}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading cuisine heatmap...</div>;

  const max = data.legend?.max || 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="cuisine-heatmap">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Cuisine Type Heatmap (cuisine x week)</h3>
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm">
          <option value={4}>4 weeks</option>
          <option value={8}>8 weeks</option>
          <option value={12}>12 weeks</option>
          <option value={26}>26 weeks</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-500 pr-3 pb-1">Cuisine</th>
              {data.weeks.map((w) => (
                <th key={w} className="px-1 text-gray-500 font-normal pb-1" style={{ minWidth: 42 }}>{w.slice(-3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.cuisine}>
                <td className="text-gray-700 pr-3 py-1 font-medium">{row.cuisine}</td>
                {row.cells.map((c, i) => (
                  <td key={i} className="p-0.5">
                    <div
                      title={`${row.cuisine} ${data.weeks[i]}: ${c}`}
                      className="rounded-sm flex items-center justify-center text-[10px] font-medium text-gray-800"
                      style={{ background: colorFor(c, max), width: 38, height: 26 }}
                    >
                      {c}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div key={t} className="w-5 h-3 rounded-sm" style={{ background: colorFor(t * max, max) }}></div>
        ))}
        <span>More ({max} max)</span>
      </div>
    </div>
  );
}
