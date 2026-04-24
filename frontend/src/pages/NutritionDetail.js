import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function NutritionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nutritionLog, setNutritionLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchNutritionLog = async () => {
      try {
        const response = await api.get(`/nutrition/${id}`);
        setNutritionLog(response.data);
        setFormData({
          date: response.data.date || '',
          mealType: response.data.mealType || 'breakfast',
          calories: response.data.calories || '',
          protein: response.data.protein || '',
          carbs: response.data.carbs || '',
          fat: response.data.fat || '',
          notes: response.data.notes || ''
        });
      } catch (error) {
        showToast.error('Failed to load nutrition log');
      } finally {
        setLoading(false);
      }
    };

    fetchNutritionLog();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/nutrition/${id}`, formData);
      setNutritionLog(response.data);
      setShowEditModal(false);
      showToast.success('Nutrition log updated');
    } catch (error) {
      showToast.error('Failed to update nutrition log');
    }
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const response = await api.post('/ai/analyze-nutrition', {
        foods: [{
          meal: nutritionLog.mealType,
          calories: nutritionLog.calories,
          protein: nutritionLog.protein,
          carbs: nutritionLog.carbs,
          fat: nutritionLog.fat,
          notes: nutritionLog.notes
        }],
        goals: 'balanced nutrition'
      });
      setAiAnalysis(response.data.analysis);
      setShowAIModal(true);
    } catch (error) {
      showToast.error('Failed to get AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/nutrition/${id}`);
      showToast.success('Nutrition log deleted');
      navigate('/nutrition');
    } catch (error) {
      showToast.error('Failed to delete nutrition log');
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎'
    };
    return icons[mealType] || '🍽️';
  };

  const calculateMacroPercentages = () => {
    const totalCals = (nutritionLog.protein * 4) + (nutritionLog.carbs * 4) + (nutritionLog.fat * 9);
    if (totalCals === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round((nutritionLog.protein * 4 / totalCals) * 100),
      carbs: Math.round((nutritionLog.carbs * 4 / totalCals) * 100),
      fat: Math.round((nutritionLog.fat * 9 / totalCals) * 100)
    };
  };

  const loadSampleAnalysis = () => {
    setAiAnalysis({
      totalCalories: nutritionLog?.calories || 450,
      totalProtein: nutritionLog?.protein || 35,
      analysis: 'This meal provides a good balance of macronutrients. The protein content is excellent for muscle maintenance and satiety. The carbohydrate level provides sustained energy without causing blood sugar spikes.',
      recommendations: [
        'Consider adding more leafy greens for additional fiber and micronutrients',
        'The protein-to-calorie ratio is excellent for weight management',
        'Adding healthy fats like avocado or nuts would improve nutrient absorption',
        'This meal pairs well with a light snack 3-4 hours later'
      ]
    });
    setShowAIModal(true);
    setAiLoading(false);
  };

  if (loading) {
    return <CardGridSkeleton count={1} />;
  }

  if (!nutritionLog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Nutrition log not found</h2>
        <button
          onClick={() => navigate('/nutrition')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to nutrition tracker
        </button>
      </div>
    );
  }

  const macroPercentages = calculateMacroPercentages();

  return (
    <div>
      <button
        onClick={() => navigate('/nutrition')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Nutrition Tracker
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getMealIcon(nutritionLog.mealType)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {nutritionLog.mealType}
              </h1>
              <p className="text-gray-600">
                {new Date(nutritionLog.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSampleAnalysis}
              className="text-orange-700 bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📋</span> Sample
            </button>
            <button
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {aiLoading ? 'Loading...' : '✨'} AI Analysis
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit Log
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nutrition Facts</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600">Calories</p>
                <p className="text-3xl font-bold text-orange-700">{nutritionLog.calories || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600">Protein</p>
                <p className="text-3xl font-bold text-blue-700">{nutritionLog.protein || 0}g</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-600">Carbs</p>
                <p className="text-3xl font-bold text-green-700">{nutritionLog.carbs || 0}g</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-600">Fat</p>
                <p className="text-3xl font-bold text-yellow-700">{nutritionLog.fat || 0}g</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Macro Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 font-medium">Protein</span>
                  <span className="text-gray-600">{macroPercentages.protein}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${macroPercentages.protein}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-medium">Carbs</span>
                  <span className="text-gray-600">{macroPercentages.carbs}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${macroPercentages.carbs}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600 font-medium">Fat</span>
                  <span className="text-gray-600">{macroPercentages.fat}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${macroPercentages.fat}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {nutritionLog.notes && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{nutritionLog.notes}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Nutrition Log" size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Nutrition Analysis" size="md">
        {aiAnalysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-sm text-orange-600">Total Calories</p>
                <p className="text-xl font-bold text-orange-700">{aiAnalysis.totalCalories || nutritionLog.calories}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-600">Protein</p>
                <p className="text-xl font-bold text-blue-700">{aiAnalysis.totalProtein || nutritionLog.protein}g</p>
              </div>
            </div>

            {aiAnalysis.analysis && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Analysis</h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{aiAnalysis.analysis}</p>
              </div>
            )}

            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600">
                      <span className="text-primary-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Nutrition Log"
        message="Are you sure you want to delete this nutrition log? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default NutritionDetail;
