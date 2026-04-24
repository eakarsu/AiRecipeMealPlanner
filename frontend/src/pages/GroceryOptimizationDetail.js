import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function GroceryOptimizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchOptimization();
  }, [id]);

  const fetchOptimization = async () => {
    try {
      const response = await api.get(`/grocery-optimizations/${id}`);
      setOptimization(response.data);
      setFormData({
        name: response.data.name,
        budget: response.data.budget,
        storePreference: response.data.storePreference || ''
      });
    } catch (error) {
      showToast.error('Failed to load optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.put(`/grocery-optimizations/${id}`, formData);
      setOptimization(response.data);
      setShowEditModal(false);
      showToast.success('Optimization updated successfully');
    } catch (error) {
      showToast.error('Failed to update optimization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/grocery-optimizations/${id}`);
      showToast.success('Optimization deleted');
      navigate('/grocery-optimizations');
    } catch (error) {
      showToast.error('Failed to delete optimization');
    }
  };

  if (loading) return <CardGridSkeleton count={1} />;
  if (!optimization) return <div className="text-center py-12">Optimization not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/grocery-optimizations')} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Back to Optimizations
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{optimization.name}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">${optimization.budget}</div>
          <div className="text-gray-500">Budget</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-green-600">${optimization.estimatedSavings?.toFixed(2) || '0.00'}</div>
          <div className="text-green-600">Estimated Savings</div>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{optimization.storePreference || 'Any'}</div>
          <div className="text-blue-600">Store</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {optimization.originalItems && optimization.originalItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Original Items</h2>
            <div className="space-y-2">
              {optimization.originalItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">{item.quantity} {item.unit} - ${item.price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {optimization.optimizedItems && optimization.optimizedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Optimized Items</h2>
            <div className="space-y-2">
              {optimization.optimizedItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="text-right">
                    <span className="text-gray-500">{item.quantity} {item.unit} - ${item.price?.toFixed(2)}</span>
                    {item.savings > 0 && <span className="ml-2 text-green-600 text-sm">(-${item.savings?.toFixed(2)})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {optimization.aiSuggestions && Object.keys(optimization.aiSuggestions).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">AI Suggestions</h2>
          {optimization.aiSuggestions.tips && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Shopping Tips</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {optimization.aiSuggestions.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
          {optimization.aiSuggestions.alternatives && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Alternative Options</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {optimization.aiSuggestions.alternatives.map((alt, i) => <li key={i}>{alt}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Optimization" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
            <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
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
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Optimization"
        message="Are you sure you want to delete this optimization record? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default GroceryOptimizationDetail;
