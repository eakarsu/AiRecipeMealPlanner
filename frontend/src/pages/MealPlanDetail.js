import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function MealPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [newMeal, setNewMeal] = useState({ dayOfWeek: 0, mealType: 'breakfast', recipeId: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveMealConfirm, setShowRemoveMealConfirm] = useState(false);
  const [mealToRemove, setMealToRemove] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [mealPlanRes, recipesRes] = await Promise.all([
        api.get(`/meal-plans/${id}`),
        api.get('/recipes')
      ]);
      setMealPlan(mealPlanRes.data);
      setRecipes(recipesRes.data);
      setFormData({
        name: mealPlanRes.data.name || '',
        startDate: mealPlanRes.data.startDate || '',
        endDate: mealPlanRes.data.endDate || '',
        targetCalories: mealPlanRes.data.targetCalories || ''
      });
    } catch (error) {
      showToast.error('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/meal-plans/${id}`, formData);
      setMealPlan({ ...mealPlan, ...response.data });
      setShowEditModal(false);
      showToast.success('Meal plan updated');
    } catch (error) {
      showToast.error('Failed to update meal plan');
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      const currentItems = mealPlan.items || [];
      const newItems = [...currentItems.map(item => ({
        recipeId: item.recipeId,
        dayOfWeek: item.dayOfWeek,
        mealType: item.mealType
      })), {
        recipeId: parseInt(newMeal.recipeId),
        dayOfWeek: parseInt(newMeal.dayOfWeek),
        mealType: newMeal.mealType
      }];

      await api.put(`/meal-plans/${id}`, { items: newItems });
      await fetchData();
      setShowAddMealModal(false);
      setNewMeal({ dayOfWeek: 0, mealType: 'breakfast', recipeId: '' });
      showToast.success('Meal added');
    } catch (error) {
      showToast.error('Failed to add meal');
    }
  };

  const confirmRemoveMeal = (itemToRemove) => {
    setMealToRemove(itemToRemove);
    setShowRemoveMealConfirm(true);
  };

  const handleRemoveMeal = async () => {
    if (!mealToRemove) return;
    try {
      const newItems = mealPlan.items
        .filter(item => !(item.dayOfWeek === mealToRemove.dayOfWeek && item.mealType === mealToRemove.mealType))
        .map(item => ({
          recipeId: item.recipeId,
          dayOfWeek: item.dayOfWeek,
          mealType: item.mealType
        }));

      await api.put(`/meal-plans/${id}`, { items: newItems });
      await fetchData();
      showToast.success('Meal removed');
      setShowRemoveMealConfirm(false);
      setMealToRemove(null);
    } catch (error) {
      showToast.error('Failed to remove meal');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/meal-plans/${id}`);
      showToast.success('Meal plan deleted');
      navigate('/meal-plans');
    } catch (error) {
      showToast.error('Failed to delete meal plan');
    }
  };

  const getMealForDay = (dayIndex, mealType) => {
    if (!mealPlan?.items) return null;
    return mealPlan.items.find(
      item => item.dayOfWeek === dayIndex && item.mealType === mealType
    );
  };

  const getDayCalories = (dayIndex) => {
    if (!mealPlan?.items) return 0;
    return mealPlan.items
      .filter(item => item.dayOfWeek === dayIndex)
      .reduce((sum, item) => sum + (item.recipe?.calories || item.calories || 0), 0);
  };

  if (loading) {
    return <CardGridSkeleton count={1} />;
  }

  if (!mealPlan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Meal plan not found</h2>
        <button
          onClick={() => navigate('/meal-plans')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to meal plans
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/meal-plans')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Meal Plans
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mealPlan.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <span>
                {mealPlan.startDate && new Date(mealPlan.startDate).toLocaleDateString()} - {mealPlan.endDate && new Date(mealPlan.endDate).toLocaleDateString()}
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Target: {mealPlan.targetCalories} cal/day
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMealModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Meal
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit Plan
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
                {mealTypes.map(type => (
                  <th key={type} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 capitalize">
                    {type}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {daysOfWeek.map((day, dayIndex) => (
                <tr key={day} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-900">{day}</td>
                  {mealTypes.map(type => {
                    const meal = getMealForDay(dayIndex, type);
                    return (
                      <td key={type} className="px-4 py-4">
                        {meal?.recipe ? (
                          <div className="group relative">
                            <div
                              onClick={() => navigate(`/recipes/${meal.recipe.id}`)}
                              className="cursor-pointer hover:text-primary-600"
                            >
                              <p className="font-medium text-sm">{meal.recipe.title}</p>
                              <p className="text-xs text-gray-500">{meal.recipe.calories} cal</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmRemoveMeal(meal); }}
                              className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : meal?.mealName ? (
                          <div className="group relative">
                            <div>
                              <p className="font-medium text-sm">{meal.mealName}</p>
                              <p className="text-xs text-gray-500">{meal.calories || 0} cal</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmRemoveMeal(meal); }}
                              className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4">
                    <span className={`font-semibold ${
                      getDayCalories(dayIndex) > mealPlan.targetCalories
                        ? 'text-red-600'
                        : getDayCalories(dayIndex) < mealPlan.targetCalories * 0.9
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {getDayCalories(dayIndex)} cal
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Total Meals</p>
          <p className="text-2xl font-bold text-gray-900">{mealPlan.items?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Avg Calories/Day</p>
          <p className="text-2xl font-bold text-gray-900">
            {mealPlan.items?.length
              ? Math.round(
                  mealPlan.items.reduce((sum, item) => sum + (item.recipe?.calories || item.calories || 0), 0) / 7
                )
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Target Calories</p>
          <p className="text-2xl font-bold text-primary-600">{mealPlan.targetCalories}</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Duration</p>
          <p className="text-2xl font-bold text-gray-900">7 days</p>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Meal Plan" size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Calories per Day</label>
            <input
              type="number"
              value={formData.targetCalories}
              onChange={(e) => setFormData({ ...formData, targetCalories: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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

      {/* Add Meal Modal */}
      <Modal isOpen={showAddMealModal} onClose={() => setShowAddMealModal(false)} title="Add Meal to Plan" size="md">
        <form onSubmit={handleAddMeal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={newMeal.dayOfWeek}
              onChange={(e) => setNewMeal({ ...newMeal, dayOfWeek: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {daysOfWeek.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
            <select
              value={newMeal.mealType}
              onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {mealTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
            <select
              required
              value={newMeal.recipeId}
              onChange={(e) => setNewMeal({ ...newMeal, recipeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a recipe</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title} ({recipe.calories} cal)
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddMealModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Meal
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Meal Plan"
        message="Are you sure you want to delete this meal plan? This action cannot be undone."
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showRemoveMealConfirm}
        onClose={() => { setShowRemoveMealConfirm(false); setMealToRemove(null); }}
        onConfirm={handleRemoveMeal}
        title="Remove Meal"
        message="Remove this meal from the plan?"
        variant="warning"
      />
    </div>
  );
}

export default MealPlanDetail;
