import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/ToastProvider';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function MealPrepPlan() {
  const [availableHours, setAvailableHours] = useState(3);
  const [prepDay, setPrepDay] = useState('Sunday');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [days, setDays] = useState(5);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [equipment, setEquipment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/meal-prep-plan', {
        availableHours: Number(availableHours),
        prepDay,
        mealsPerDay: Number(mealsPerDay),
        days: Number(days),
        dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : [],
        equipment: equipment ? equipment.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      setResult(res.data?.prepPlan || res.data || null);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 503
        ? 'AI service is not configured on the server.'
        : (err.response?.data?.error || 'Failed to build meal prep plan.');
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meal Prep Plan</h1>
        <p className="text-gray-600 text-sm mt-1">Batch-cooking schedule that minimises active cooking time across the week.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Available prep hours</label>
            <input type="number" min="1" step="0.5" value={availableHours} onChange={e => setAvailableHours(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prep day</label>
            <select value={prepDay} onChange={e => setPrepDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Meals per day</label>
            <input type="number" min="1" max="5" value={mealsPerDay} onChange={e => setMealsPerDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Days covered</label>
            <input type="number" min="1" max="7" value={days} onChange={e => setDays(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dietary restrictions (comma-separated)</label>
          <input type="text" value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)}
            placeholder="dairy-free, low-carb"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment (comma-separated)</label>
          <input type="text" value={equipment} onChange={e => setEquipment(e.target.value)}
            placeholder="instant pot, sheet pan, slow cooker"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Building plan...' : 'Build Prep Plan'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          Sequencing your prep session...
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Prep Plan</h2>
          {result.summary && <p className="text-sm text-gray-700">{result.summary}</p>}
          {typeof result.prep_session_minutes === 'number' && (
            <p className="text-sm text-gray-700"><strong>Active prep time:</strong> {result.prep_session_minutes} minutes</p>
          )}
          {Array.isArray(result.stages) && result.stages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Stages</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.stages.map((s, i) => (
                  <li key={i}>
                    Step {s.step}: {s.task} ({s.duration_min} min)
                    {s.parallel_with_step != null ? ` — parallel with step ${s.parallel_with_step}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(result.batch_recipes) && result.batch_recipes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Batch Recipes</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.batch_recipes.map((r, i) => (
                  <li key={i}>
                    <strong>{r.name}</strong> — yields {r.yields_servings} servings
                    {r.storage ? ` — fridge ${r.storage.fridge_days}d / freezer ${r.storage.freezer_days}d` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(result.daily_assembly) && result.daily_assembly.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Daily Assembly</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.daily_assembly.map((d, i) => (
                  <li key={i}><strong>{d.day}</strong> — B: {d.breakfast}; L: {d.lunch}; D: {d.dinner}</li>
                ))}
              </ul>
            </div>
          )}
          <Section title="Containers Needed" items={result.containers_needed} />
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

export default MealPrepPlan;
