import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function WeeklyMealPlanPDF() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => new Date().toISOString().slice(0, 10));

  const load = (ws) => {
    setError('');
    setData(null);
    api.get('/custom-views/weekly-plan-pdf', { params: { week_start: ws } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || e.message));
  };

  useEffect(() => { load(weekStart); /* eslint-disable-line */ }, [weekStart]);

  const handleDownload = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableMod = await import('jspdf-autotable');
      const autoTable = autoTableMod.default || autoTableMod.autoTable;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(data.title, 14, 20);
      doc.setFontSize(10);
      doc.text(`Week starting: ${data.week_start}`, 14, 28);
      doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 34);
      doc.text(`Total calories: ${data.summary.total_calories} · Avg daily: ${data.summary.avg_daily_calories}`, 14, 40);

      const body = [];
      data.plan.forEach((d) => {
        d.meals.forEach((m, i) => {
          body.push([i === 0 ? d.day : '', m.meal, m.recipe, m.cuisine, `${m.calories} kcal`]);
        });
      });
      autoTable(doc, {
        head: [['Day', 'Meal', 'Recipe', 'Cuisine', 'Calories']],
        body,
        startY: 46,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] }
      });
      doc.save(data.filename);
    } catch (e) {
      // fallback: text-based download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = data.filename.replace('.pdf', '.json');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">Error: {error}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading weekly meal plan...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="weekly-meal-plan-pdf">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Meal Plan (PDF)</h3>
        <div className="flex items-center gap-2">
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm" />
          <button onClick={handleDownload}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700">
            Download PDF
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        {data.summary.total_meals} meals · {data.summary.total_calories} kcal total · {data.summary.avg_daily_calories} kcal/day avg
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Day</th>
              <th className="text-left px-3 py-2">Meal</th>
              <th className="text-left px-3 py-2">Recipe</th>
              <th className="text-left px-3 py-2">Cuisine</th>
              <th className="text-right px-3 py-2">Calories</th>
            </tr>
          </thead>
          <tbody>
            {data.plan.map((d) =>
              d.meals.map((m, i) => (
                <tr key={`${d.day}-${m.meal}`} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-800">{i === 0 ? d.day : ''}</td>
                  <td className="px-3 py-2 text-gray-700">{m.meal}</td>
                  <td className="px-3 py-2 text-gray-700">{m.recipe}</td>
                  <td className="px-3 py-2 text-gray-500">{m.cuisine}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{m.calories}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <strong>Shopping hints:</strong> {data.shoppingHints.join(' · ')}
      </div>
    </div>
  );
}
