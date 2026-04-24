import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function NutritionBalanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [id]);

  const fetchBalance = async () => {
    try {
      const response = await api.get(`/nutrition-balances/${id}`);
      setBalance(response.data);
      setFormData({
        name: response.data.name,
        date: response.data.date
      });
    } catch (error) {
      showToast.error('Failed to load balance record');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.put(`/nutrition-balances/${id}`, formData);
      setBalance(response.data);
      setShowEditModal(false);
      showToast.success('Balance record updated');
    } catch (error) {
      showToast.error('Failed to update balance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/nutrition-balances/${id}`);
      showToast.success('Balance record deleted');
      navigate('/nutrition-balances');
    } catch (error) {
      showToast.error('Failed to delete balance record');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) return <CardGridSkeleton count={1} />;
  if (!balance) return <div className="text-center py-12">Balance not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/nutrition-balances')} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Back to Balances
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{balance.name}</h1>
          <p className="text-gray-500">{new Date(balance.date).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Balance Score</h2>
          <div className={`text-3xl font-bold px-6 py-3 rounded-full ${getScoreColor(balance.balanceScore)}`}>
            {balance.balanceScore}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {balance.currentIntake && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Current Intake</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-orange-600">{balance.currentIntake.calories || 0}</div>
                <div className="text-sm text-orange-500">Calories</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{balance.currentIntake.protein || 0}g</div>
                <div className="text-sm text-blue-500">Protein</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-600">{balance.currentIntake.carbs || 0}g</div>
                <div className="text-sm text-yellow-500">Carbs</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">{balance.currentIntake.fat || 0}g</div>
                <div className="text-sm text-red-500">Fat</div>
              </div>
            </div>
          </div>
        )}

        {balance.targetIntake && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Target Intake</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-600">{balance.targetIntake.calories || 0}</div>
                <div className="text-sm text-gray-500">Calories</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-600">{balance.targetIntake.protein || 0}g</div>
                <div className="text-sm text-gray-500">Protein</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-600">{balance.targetIntake.carbs || 0}g</div>
                <div className="text-sm text-gray-500">Carbs</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-600">{balance.targetIntake.fat || 0}g</div>
                <div className="text-sm text-gray-500">Fat</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {balance.deficiencies && balance.deficiencies.length > 0 && (
          <div className="bg-red-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-4">Deficiencies</h2>
            <div className="flex flex-wrap gap-2">
              {balance.deficiencies.map((d, i) => (
                <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full">↓ {d}</span>
              ))}
            </div>
          </div>
        )}

        {balance.excesses && balance.excesses.length > 0 && (
          <div className="bg-yellow-50 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">Excesses</h2>
            <div className="flex flex-wrap gap-2">
              {balance.excesses.map((e, i) => (
                <span key={i} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">↑ {e}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {balance.aiRecommendations && Object.keys(balance.aiRecommendations).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">AI Recommendations</h2>
          {balance.aiRecommendations.summary && (
            <p className="text-gray-700 mb-4">{balance.aiRecommendations.summary}</p>
          )}
          {balance.aiRecommendations.suggestions && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Suggestions</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {balance.aiRecommendations.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {balance.aiRecommendations.mealIdeas && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Meal Ideas</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {balance.aiRecommendations.mealIdeas.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Balance Record" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
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
        title="Delete Balance Record"
        message="Are you sure you want to delete this balance record? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default NutritionBalanceDetail;
