import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../components/ToastProvider';

function BudgetOptimizer() {
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [householdSize, setHouseholdSize] = useState(2);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [cuisinePreferences, setCuisinePreferences] = useState('');
  const [regionPriceLevel, setRegionPriceLevel] = useState('average');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/budget-optimizer', {
        weeklyBudget: Number(weeklyBudget),
        householdSize: Number(householdSize),
        dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : [],
        cuisinePreferences: cuisinePreferences ? cuisinePreferences.split(',').map(s => s.trim()).filter(Boolean) : [],
        regionPriceLevel,
      });
      setResult(res.data?.budgetPlan || res.data || null);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 503
        ? 'AI service is not configured on the server.'
        : (err.response?.data?.error || 'Failed to build budget plan.');
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budget Optimizer</h1>
        <p className="text-gray-600 text-sm mt-1">Cost-minimizing weekly meal plan with shopping list and savings strategies.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Weekly budget (USD)</label>
            <input type="number" min="10" value={weeklyBudget} onChange={e => setWeeklyBudget(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Household size</label>
            <input type="number" min="1" value={householdSize} onChange={e => setHouseholdSize(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dietary restrictions (comma-separated)</label>
          <input type="text" value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)}
            placeholder="vegetarian, gluten-free"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine preferences (comma-separated)</label>
          <input type="text" value={cuisinePreferences} onChange={e => setCuisinePreferences(e.target.value)}
            placeholder="Italian, Mexican"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Region price level</label>
          <select value={regionPriceLevel} onChange={e => setRegionPriceLevel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="low">Low</option>
            <option value="average">Average</option>
            <option value="high">High</option>
          </select>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? 'Building plan...' : 'Build Budget Plan'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          Optimising shopping list...
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Budget Plan</h2>
          {result.summary && <p className="text-sm text-gray-700">{result.summary}</p>}
          {typeof result.estimated_total_cost_usd === 'number' && (
            <p className="text-sm text-gray-700"><strong>Estimated total cost:</strong> ${result.estimated_total_cost_usd}</p>
          )}
          {Array.isArray(result.savings_strategies) && result.savings_strategies.length > 0 && (
            <Section title="Savings Strategies" items={result.savings_strategies} />
          )}
          {Array.isArray(result.meal_plan) && result.meal_plan.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Weekly Meal Plan</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.meal_plan.map((d, i) => (
                  <li key={i}>
                    <strong>{d.day}</strong> — B: {d.breakfast}; L: {d.lunch}; D: {d.dinner}
                    {typeof d.estimated_day_cost_usd === 'number' ? ` ($${d.estimated_day_cost_usd})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(result.shopping_list) && result.shopping_list.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Shopping List</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.shopping_list.map((s, i) => (
                  <li key={i}>{s.ingredient} — {s.qty} (${s.estimated_cost_usd}, {s.store_tier})</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(result.swap_suggestions) && result.swap_suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Swap Suggestions</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {result.swap_suggestions.map((s, i) => (
                  <li key={i}>{s.expensive_item} → {s.cheaper_alternative} (save ${s.savings_usd})</li>
                ))}
              </ul>
            </div>
          )}
          <Section title="Bulk Buy Recommendations" items={result.bulk_buy_recommendations} />
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

export default BudgetOptimizer;
