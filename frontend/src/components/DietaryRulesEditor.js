import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const EMPTY = { name: '', allergens: '', calorie_target: 2000, protein_g: 80, carbs_g: 250, fat_g: 65, notes: '', active: true };

export default function DietaryRulesEditor() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/custom-views/dietary-rules')
      .then((r) => setRules(r.data.rules || []))
      .catch((e) => setError(e.response?.data?.error || e.message));
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setEditId(null); setForm(EMPTY); };

  const submit = async () => {
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        allergens: form.allergens ? String(form.allergens).split(',').map((s) => s.trim()).filter(Boolean) : [],
        calorie_target: Number(form.calorie_target),
        protein_g: Number(form.protein_g),
        carbs_g: Number(form.carbs_g),
        fat_g: Number(form.fat_g)
      };
      if (editId) {
        await api.put(`/custom-views/dietary-rules/${editId}`, payload);
      } else {
        await api.post('/custom-views/dietary-rules', payload);
      }
      reset();
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      allergens: (r.allergens || []).join(', '),
      calorie_target: r.calorie_target,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      notes: r.notes || '',
      active: !!r.active
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this dietary rule?')) return;
    try {
      await api.delete(`/custom-views/dietary-rules/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" data-testid="dietary-rules-editor">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Dietary Rules Editor</h3>
      {error && <div className="p-2 mb-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Rule name (e.g., 'Keto Plan')"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Allergens (comma-separated)"
          value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} />
        <input type="number" className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Calorie target"
          value={form.calorie_target} onChange={(e) => setForm({ ...form, calorie_target: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" className="border border-gray-300 rounded-md px-2 py-2 text-sm" placeholder="Protein g"
            value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
          <input type="number" className="border border-gray-300 rounded-md px-2 py-2 text-sm" placeholder="Carbs g"
            value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
          <input type="number" className="border border-gray-300 rounded-md px-2 py-2 text-sm" placeholder="Fat g"
            value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} />
        </div>
        <input className="border border-gray-300 rounded-md px-3 py-2 text-sm md:col-span-2" placeholder="Notes"
          value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
        </label>
        <div className="flex gap-2">
          <button onClick={submit} disabled={saving}
            className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50">
            {editId ? 'Update Rule' : 'Add Rule'}
          </button>
          {editId && <button onClick={reset} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm">Cancel</button>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Allergens</th>
              <th className="text-right px-3 py-2">Calories</th>
              <th className="text-right px-3 py-2">P / C / F</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                <td className="px-3 py-2 text-gray-600">{(r.allergens || []).join(', ') || '—'}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.calorie_target}</td>
                <td className="px-3 py-2 text-right text-gray-600 text-xs">{r.protein_g}/{r.carbs_g}/{r.fat_g}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {r.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => edit(r)} className="text-primary-600 hover:underline text-xs mr-3">Edit</button>
                  <button onClick={() => remove(r.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No dietary rules yet. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
