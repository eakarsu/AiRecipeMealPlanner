import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function DietaryProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/dietary-profiles/${id}`);
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        restrictions: response.data.restrictions?.join(', ') || '',
        allergies: response.data.allergies?.join(', ') || '',
        preferences: response.data.preferences || '',
        targetCalories: response.data.targetCalories,
        targetProtein: response.data.targetProtein,
        targetCarbs: response.data.targetCarbs,
        targetFat: response.data.targetFat
      });
    } catch (error) {
      showToast.error('Failed to load dietary profile');
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
        restrictions: formData.restrictions.split(',').map(r => r.trim()).filter(r => r),
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a)
      };
      const response = await api.put(`/dietary-profiles/${id}`, dataToSend);
      setProfile(response.data);
      setShowEditModal(false);
      showToast.success('Profile updated successfully');
    } catch (error) {
      showToast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/dietary-profiles/${id}`);
      showToast.success('Profile deleted');
      navigate('/dietary-profiles');
    } catch (error) {
      showToast.error('Failed to delete profile');
    }
  };

  if (loading) return <CardGridSkeleton count={1} />;
  if (!profile) return <div className="text-center py-12">Profile not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/dietary-profiles')} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Back to Profiles
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Edit
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Nutritional Targets</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{profile.targetCalories}</div>
              <div className="text-sm text-orange-500">Daily Calories</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.targetProtein}g</div>
              <div className="text-sm text-blue-500">Protein</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{profile.targetCarbs}g</div>
              <div className="text-sm text-yellow-500">Carbs</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{profile.targetFat}g</div>
              <div className="text-sm text-red-500">Fat</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Dietary Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Restrictions</h3>
              <div className="flex flex-wrap gap-2">
                {profile.restrictions?.length > 0 ? profile.restrictions.map((r, i) => (
                  <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">{r}</span>
                )) : <span className="text-gray-400">None</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {profile.allergies?.length > 0 ? profile.allergies.map((a, i) => (
                  <span key={i} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">⚠ {a}</span>
                )) : <span className="text-gray-400">None</span>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Preferences</h3>
              <p className="text-gray-700">{profile.preferences || 'No preferences specified'}</p>
            </div>
          </div>
        </div>

        {profile.aiRecommendations && Object.keys(profile.aiRecommendations).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">AI Recommendations</h2>
            {profile.aiRecommendations.tips && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tips</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {profile.aiRecommendations.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            )}
            {profile.aiRecommendations.mealIdeas && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Meal Ideas</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {profile.aiRecommendations.mealIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Dietary Profile" size="lg">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restrictions (comma-separated)</label>
            <input type="text" value={formData.restrictions} onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma-separated)</label>
            <input type="text" value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
            <textarea value={formData.preferences} onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Calories</label>
              <input type="number" value={formData.targetCalories} onChange={(e) => setFormData({ ...formData, targetCalories: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Protein (g)</label>
              <input type="number" value={formData.targetProtein} onChange={(e) => setFormData({ ...formData, targetProtein: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Carbs (g)</label>
              <input type="number" value={formData.targetCarbs} onChange={(e) => setFormData({ ...formData, targetCarbs: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Fat (g)</label>
              <input type="number" value={formData.targetFat} onChange={(e) => setFormData({ ...formData, targetFat: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
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
        title="Delete Dietary Profile"
        message="Are you sure you want to delete this dietary profile? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default DietaryProfileDetail;
