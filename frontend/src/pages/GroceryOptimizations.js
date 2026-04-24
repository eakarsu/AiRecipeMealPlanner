import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function GroceryOptimizations() {
  const navigate = useNavigate();
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    budget: 100,
    storePreference: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({
    items: '',
    budget: 100,
    storePreference: '',
    prioritizeFresh: true,
    familySize: 4
  });
  const [aiResult, setAiResult] = useState(null);

  const fetchOptimizations = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const response = await api.get('/grocery-optimizations', { params });
      setOptimizations(response.data.data || response.data);
      setPagination(response.data.pagination || null);
    } catch (error) {
      showToast.error('Failed to fetch optimizations');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchOptimizations(); }, [fetchOptimizations]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.name.length > 100) errors.name = 'Name must be under 100 characters';
    if (formData.budget && (isNaN(formData.budget) || formData.budget < 0)) errors.budget = 'Invalid budget';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', budget: 100, storePreference: '' });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (showEditModal && selectedOpt) {
        await api.put(`/grocery-optimizations/${selectedOpt.id}`, formData);
        showToast.success('Optimization updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/grocery-optimizations', formData);
        showToast.success('Optimization created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchOptimizations();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save optimization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/grocery-optimizations/${id}`);
      showToast.success('Optimization deleted');
      fetchOptimizations();
    } catch (error) {
      showToast.error('Failed to delete optimization');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/grocery-optimizations/bulk-delete', { ids });
      showToast.success(`${ids.length} optimizations deleted`);
      fetchOptimizations();
    } catch (error) {
      showToast.error('Failed to delete optimizations');
    }
  };

  const handleEdit = (opt) => {
    setSelectedOpt(opt);
    setFormData({
      name: opt.name || '',
      budget: opt.budget || 100,
      storePreference: opt.storePreference || ''
    });
    setShowEditModal(true);
  };

  const handleRowClick = (opt) => {
    setSelectedOpt(opt);
    setShowDetailModal(true);
  };

  const handleAIOptimize = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const items = aiInput.items.split('\n').map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { name: parts[0], quantity: parts[1] || '1', unit: parts[2] || 'item' };
      }).filter(item => item.name);

      const response = await api.post('/ai/optimize-grocery', {
        items,
        budget: aiInput.budget,
        storePreference: aiInput.storePreference,
        prioritizeFresh: aiInput.prioritizeFresh,
        familySize: aiInput.familySize
      });
      if (response.data.optimization) {
        setAiResult(response.data.optimization);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return a valid optimization');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to optimize grocery list');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSampleData = () => {
    setAiInput({
      items: `Ribeye Steak, 2, lbs
Organic Chicken Breast, 3, lbs
Fresh Salmon, 1, lb
Broccoli, 2, heads
Spinach, 1, bag
Avocados, 4, pieces
Greek Yogurt, 2, containers
Almond Milk, 1, gallon
Olive Oil, 1, bottle
Quinoa, 1, bag`,
      budget: 100,
      storePreference: 'Any',
      prioritizeFresh: true,
      familySize: 4
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    { key: 'budget', label: 'Budget', sortable: true, accessor: 'budget', render: (row) => row.budget ? `$${row.budget}` : '-' },
    { key: 'storePreference', label: 'Store', accessor: 'storePreference', render: (row) => row.storePreference || '-' },
    { key: 'estimatedSavings', label: 'Savings', accessor: 'estimatedSavings', render: (row) => row.estimatedSavings ? `$${row.estimatedSavings.toFixed(2)}` : '-' },
    {
      key: 'status', label: 'Status', accessor: 'status',
      render: (row) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status || 'pending'}
        </span>
      )
    },
    {
      key: 'createdAt', label: 'Created', sortable: true, accessor: 'createdAt',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
    },
  ];

  if (loading) return <CardGridSkeleton count={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="e.g., Weekly Shopping" />
          {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
          <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.budget ? 'border-red-300' : 'border-gray-300'}`} />
          {formErrors.budget && <p className="mt-1 text-sm text-red-600">{formErrors.budget}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Preference</label>
          <select value={formData.storePreference} onChange={(e) => setFormData({ ...formData, storePreference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="">Any Store</option>
            <option value="Walmart">Walmart</option>
            <option value="Costco">Costco</option>
            <option value="Whole Foods">Whole Foods</option>
            <option value="Trader Joes">Trader Joe's</option>
            <option value="Aldi">Aldi</option>
            <option value="Kroger">Kroger</option>
            <option value="Target">Target</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Optimization' : 'Create Optimization')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Grocery Optimizer</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || optimizations.length} optimization records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Optimize
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> New Record
          </button>
        </div>
      </div>

      <DataTable
        data={optimizations}
        columns={columns}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={(val) => { setSearch(val); setPage(1); }}
        searchValue={search}
        onSort={(field, order) => { setSortBy(field); setSortOrder(order); setPage(1); }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        title="Grocery Optimizations"
        exportFilename="grocery-optimizations"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Optimization Record" size="md">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Optimization" size="md">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Optimization Details" size="lg">
        {selectedOpt && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                selectedOpt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedOpt.status || 'pending'}
              </span>
              {selectedOpt.storePreference && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{selectedOpt.storePreference}</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{selectedOpt.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-semibold">${selectedOpt.budget || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600">Savings</p>
                <p className="font-semibold text-green-700">${selectedOpt.estimatedSavings?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600">Store</p>
                <p className="font-semibold text-blue-800">{selectedOpt.storePreference || 'Any'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">Original Items</p>
                <p className="font-semibold">{selectedOpt.originalItems?.length || 0}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg text-center">
                <p className="text-xs text-emerald-600">Optimized Items</p>
                <p className="font-semibold text-emerald-700">{selectedOpt.optimizedItems?.length || 0}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedOpt.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedOpt); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit
              </button>
              <button onClick={() => navigate(`/grocery-optimizations/${selectedOpt.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Optimize Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Grocery Optimizer" size="lg">
        <form onSubmit={handleAIOptimize} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shopping Items (one per line: name, quantity, unit)</label>
            <textarea
              value={aiInput.items}
              onChange={(e) => setAiInput({ ...aiInput, items: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              rows={8}
              placeholder={"Chicken Breast, 2, lbs\nBroccoli, 1, head\nRice, 1, bag"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
              <input
                type="number"
                value={aiInput.budget}
                onChange={(e) => setAiInput({ ...aiInput, budget: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Family Size</label>
              <input
                type="number"
                value={aiInput.familySize}
                onChange={(e) => setAiInput({ ...aiInput, familySize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Preference</label>
              <select
                value={aiInput.storePreference}
                onChange={(e) => setAiInput({ ...aiInput, storePreference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any Store</option>
                <option value="Walmart">Walmart</option>
                <option value="Costco">Costco</option>
                <option value="Whole Foods">Whole Foods</option>
                <option value="Trader Joes">Trader Joe's</option>
                <option value="Aldi">Aldi</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiInput.prioritizeFresh}
                  onChange={(e) => setAiInput({ ...aiInput, prioritizeFresh: e.target.checked })}
                  className="rounded text-primary-600"
                />
                <span className="text-sm text-gray-700">Prioritize Fresh Produce</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button type="button" onClick={loadSampleData} className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
              Load Sample
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAIModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
                {aiLoading ? <><LoadingSpinner size="sm" /> Optimizing...</> : <><span>&#10024;</span> Optimize</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="Optimization Results" size="lg">
        {aiResult && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <p className="text-green-800">{aiResult.summary}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">${aiResult.originalEstimate?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Original</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${aiResult.optimizedEstimate?.toFixed(2)}</div>
                  <div className="text-xs text-green-600">Optimized</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">${aiResult.savings?.toFixed(2)}</div>
                  <div className="text-xs text-emerald-600">{aiResult.savingsPercentage}% Saved</div>
                </div>
              </div>
            </div>

            {aiResult.substitutions && aiResult.substitutions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Smart Substitutions</h4>
                <div className="space-y-2">
                  {aiResult.substitutions.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 line-through text-sm">{sub.original}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="text-green-600 font-medium text-sm">{sub.substitute}</span>
                      </div>
                      <span className="text-green-600 font-bold text-sm">-${sub.savings?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResult.optimizedItems && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Optimized Shopping List</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Est. Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiResult.optimizedItems.map((item, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{item.quantity} {item.unit}</td>
                          <td className="py-2">${item.estimatedPrice?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {aiResult.shoppingTips && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Shopping Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {aiResult.shoppingTips.map((tip, i) => (
                    <li key={i}>&bull; {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowAIResultModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GroceryOptimizations;
