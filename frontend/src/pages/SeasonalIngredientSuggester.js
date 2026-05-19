import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/ToastProvider';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function SeasonalIngredientSuggester() {
  const [region, setRegion] = useState('');
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!region.trim()) {
      setError('Please enter a region.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/seasonal-ingredient-suggester', { region, month });
      setResult(res.data?.suggestion || res.data || null);
      if (!res.data?.suggestion && !res.data) {
        showToast.info('AI returned an unstructured response.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to fetch seasonal suggestions.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seasonal Ingredient Suggester</h1>
        <p className="text-gray-600 text-sm mt-1">Discover what's in season in your region with cost cues and recipe ideas.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
          <input
            type="text"
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="e.g. Pacific Northwest, Northern California, Southern Italy"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Looking up…' : 'Find Seasonal Picks'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          Searching seasonal produce…
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Seasonal Suggestions</h2>
          {result.summary && <p className="text-sm text-gray-700">{result.summary}</p>}

          {Array.isArray(result.in_season) && result.in_season.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">In Season</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.in_season.map((item, i) => (
                  <li key={i}>
                    {typeof item === 'string' ? item : (
                      <>
                        <strong>{item.name || item.ingredient}</strong>
                        {item.cost_cue && <span className="text-gray-500"> — {item.cost_cue}</span>}
                        {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Peak Picks" items={result.peak_picks} />
          <Section title="Out of Season (avoid)" items={result.out_of_season} />

          {Array.isArray(result.recipe_ideas) && result.recipe_ideas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recipe Ideas</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.recipe_ideas.map((r, i) => (
                  <li key={i}>{typeof r === 'string' ? r : (r.title ? <><strong>{r.title}</strong>{r.description ? ` — ${r.description}` : ''}</> : JSON.stringify(r))}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Tips" items={result.tips} />
        </div>
      )}
    </div>
  );
}

function Section({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
        {items.map((it, i) => <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>)}
      </ul>
    </div>
  );
}

export default SeasonalIngredientSuggester;
