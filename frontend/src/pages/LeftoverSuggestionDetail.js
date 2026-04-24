import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function LeftoverSuggestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchSuggestion();
  }, [id]);

  const fetchSuggestion = async () => {
    try {
      const response = await api.get(`/leftover-suggestions/${id}`);
      setSuggestion(response.data);
      setFormData({
        name: response.data.name,
        leftovers: response.data.leftovers?.join(', ') || ''
      });
    } catch (error) {
      showToast.error('Failed to load suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        leftovers: formData.leftovers.split(',').map(l => l.trim()).filter(l => l)
      };
      const response = await api.put(`/leftover-suggestions/${id}`, dataToSend);
      setSuggestion(response.data);
      setShowEditModal(false);
      showToast.success('Suggestion updated successfully');
    } catch (error) {
      showToast.error('Failed to update suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/leftover-suggestions/${id}`);
      showToast.success('Suggestion deleted');
      navigate('/leftover-suggestions');
    } catch (error) {
      showToast.error('Failed to delete suggestion');
    }
  };

  if (loading) return <CardGridSkeleton count={1} />;
  if (!suggestion) return <div className="text-center py-12">Suggestion not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/leftover-suggestions')} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Back to Suggestions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{suggestion.name}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Leftover Ingredients</h2>
        <div className="flex flex-wrap gap-2">
          {suggestion.leftovers?.map((l, i) => (
            <span key={i} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full">{l}</span>
          ))}
        </div>
      </div>

      {suggestion.suggestedRecipes && suggestion.suggestedRecipes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Suggested Recipes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestion.suggestedRecipes.map((recipe, i) => (
              <div key={i} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900">{recipe.title}</h3>
                <p className="text-sm text-orange-700 mt-1">{recipe.description}</p>
                {recipe.prepTime && <div className="text-xs text-orange-600 mt-2">Prep: {recipe.prepTime} min</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestion.aiRecommendations && Object.keys(suggestion.aiRecommendations).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">AI Recommendations</h2>
          {suggestion.aiRecommendations.priority && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-yellow-800">Priority</h3>
              <p className="text-yellow-700">{suggestion.aiRecommendations.priority}</p>
            </div>
          )}
          {suggestion.aiRecommendations.tips && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Storage Tips</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {suggestion.aiRecommendations.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Leftover Record" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leftovers (comma-separated)</label>
            <textarea value={formData.leftovers} onChange={(e) => setFormData({ ...formData, leftovers: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} />
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
        title="Delete Suggestion"
        message="Are you sure you want to delete this suggestion record? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default LeftoverSuggestionDetail;
