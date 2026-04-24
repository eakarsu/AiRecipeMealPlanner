import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function CookingTimerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchTimer();
  }, [id]);

  const fetchTimer = async () => {
    try {
      const response = await api.get(`/cooking-timers/${id}`);
      setTimer(response.data);
      setFormData({
        name: response.data.name,
        totalTime: response.data.totalTime
      });
    } catch (error) {
      showToast.error('Failed to load timer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.put(`/cooking-timers/${id}`, formData);
      setTimer(response.data);
      setShowEditModal(false);
      showToast.success('Timer updated successfully');
    } catch (error) {
      showToast.error('Failed to update timer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cooking-timers/${id}`);
      showToast.success('Timer deleted');
      navigate('/cooking-timers');
    } catch (error) {
      showToast.error('Failed to delete timer');
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const getStepTypeColor = (type) => {
    switch (type) {
      case 'prep': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'active': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'cooking': return 'bg-red-100 text-red-700 border-red-300';
      case 'rest': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) return <CardGridSkeleton count={1} />;
  if (!timer) return <div className="text-center py-12">Timer not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/cooking-timers')} className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Back to Timers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{timer.name}</h1>
          {timer.recipe && <p className="text-gray-500">Recipe: {timer.recipe.title}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-red-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold text-red-600">{formatTime(timer.totalTime)}</div>
          <div className="text-red-500">Total Time</div>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold text-blue-600">{timer.steps?.length || 0}</div>
          <div className="text-blue-500">Steps</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm p-6 text-center">
          <div className={`text-lg font-bold px-4 py-2 rounded-full inline-block ${
            timer.status === 'completed' ? 'bg-green-200 text-green-800' :
            timer.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
            'bg-gray-200 text-gray-800'
          }`}>
            {timer.status}
          </div>
          <div className="text-gray-500 mt-2">Status</div>
        </div>
      </div>

      {timer.steps && timer.steps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cooking Steps</h2>
          <div className="space-y-4">
            {timer.steps.map((step, i) => (
              <div key={i} className={`border-l-4 pl-4 py-3 ${getStepTypeColor(step.type)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                      {step.stepNumber || i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStepTypeColor(step.type)}`}>{step.type}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-600">{step.duration} min</div>
                </div>
                {step.description && (
                  <p className="text-gray-600 mt-2 ml-11">{step.description}</p>
                )}
                {step.tips && (
                  <p className="text-blue-600 text-sm mt-1 ml-11">💡 {step.tips}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {timer.aiTimingAdvice && Object.keys(timer.aiTimingAdvice).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">AI Timing Advice</h2>
          {timer.aiTimingAdvice.tips && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tips</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {timer.aiTimingAdvice.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
          {timer.aiTimingAdvice.multitasking && (
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-green-700">{timer.aiTimingAdvice.multitasking}</span>
            </div>
          )}
        </div>
      )}

      {timer.notifications && timer.notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-2">
            {timer.notifications.map((notif, i) => (
              <div key={i} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                <span className="text-yellow-800">{notif.message}</span>
                <span className="text-yellow-600 font-mono">{notif.time} min before</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Timer" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Time (minutes)</label>
            <input type="number" value={formData.totalTime} onChange={(e) => setFormData({ ...formData, totalTime: parseInt(e.target.value) })}
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
        title="Delete Timer"
        message="Are you sure you want to delete this cooking timer? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default CookingTimerDetail;
