import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/ToastProvider';

const PRESET_RESTRICTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher', 'Low-FODMAP', 'Paleo'];

function DietaryRestrictionMapper() {
  const [restrictions, setRestrictions] = useState([]);
  const [customRestriction, setCustomRestriction] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleRestriction = (r) => {
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const addCustom = () => {
    const val = customRestriction.trim();
    if (val && !restrictions.includes(val)) {
      setRestrictions(prev => [...prev, val]);
      setCustomRestriction('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restrictions.length) {
      setError('Please select at least one restriction.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/dietary-restriction-mapper', { restrictions, cuisine: cuisine || undefined });
      setResult(res.data?.mapping || null);
      if (!res.data?.mapping) {
        showToast.info('AI returned an unstructured response.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to map restrictions.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dietary Restriction Mapper</h1>
        <p className="text-gray-600 text-sm mt-1">Convert dietary restrictions into concrete include/exclude ingredient lists, hidden sources, and label tips.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Restrictions</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_RESTRICTIONS.map(r => (
              <button
                type="button"
                key={r}
                onClick={() => toggleRestriction(r)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  restrictions.includes(r)
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customRestriction}
              onChange={e => setCustomRestriction(e.target.value)}
              placeholder="Add a custom restriction"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button type="button" onClick={addCustom} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium">
              Add
            </button>
          </div>
          {restrictions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 text-xs text-gray-600">
              Selected: {restrictions.map(r => <span key={r} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{r}</span>)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine context (optional)</label>
          <input
            type="text"
            value={cuisine}
            onChange={e => setCuisine(e.target.value)}
            placeholder="e.g. Italian, Indian, Mediterranean"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Mapping…' : 'Map Restrictions'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          Asking the AI dietitian…
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Mapping Result</h2>
          {result.summary && <p className="text-sm text-gray-700">{result.summary}</p>}

          <Section title="Exclude Ingredients" items={result.exclude_ingredients} />
          <Section title="Exclude Categories" items={result.exclude_ingredient_categories} />
          {Array.isArray(result.include_safe_alternatives) && result.include_safe_alternatives.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Safe Alternatives</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.include_safe_alternatives.map((a, i) => (
                  <li key={i}><strong>{a.replaces}</strong> &rarr; {a.alternative}</li>
                ))}
              </ul>
            </div>
          )}
          <Section title="Hidden Sources to Watch" items={result.hidden_sources_to_watch} />
          <Section title="Label-Reading Tips" items={result.label_reading_tips} />
          <Section title="Cross-Contamination Risks" items={result.cross_contamination_risks} />
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

export default DietaryRestrictionMapper;
