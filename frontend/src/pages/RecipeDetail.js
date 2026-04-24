import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipeRes, categoriesRes] = await Promise.all([
          api.get(`/recipes/${id}`),
          api.get('/categories')
        ]);
        setRecipe(recipeRes.data);
        setCategories(categoriesRes.data);
        setFormData({
          title: recipeRes.data.title || '',
          description: recipeRes.data.description || '',
          instructions: recipeRes.data.instructions || '',
          prepTime: recipeRes.data.prepTime || '',
          cookTime: recipeRes.data.cookTime || '',
          servings: recipeRes.data.servings || '',
          calories: recipeRes.data.calories || '',
          protein: recipeRes.data.protein || '',
          carbs: recipeRes.data.carbs || '',
          fat: recipeRes.data.fat || '',
          cuisine: recipeRes.data.cuisine || '',
          categoryId: recipeRes.data.categoryId || '',
          imageUrl: recipeRes.data.imageUrl || ''
        });
      } catch (error) {
        showToast.error('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/recipes/${id}`, formData);
      setRecipe(response.data);
      setShowEditModal(false);
      showToast.success('Recipe updated successfully');
    } catch (error) {
      showToast.error('Failed to update recipe');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/recipes/${id}`);
      showToast.success('Recipe deleted');
      navigate('/recipes');
    } catch (error) {
      showToast.error('Failed to delete recipe');
    }
  };

  if (loading) {
    return <CardGridSkeleton count={1} />;
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Recipe not found</h2>
        <button
          onClick={() => navigate('/recipes')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to recipes
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/recipes')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Recipes
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {recipe.category && (
                  <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                    {recipe.category.name}
                  </span>
                )}
                {recipe.cuisine && (
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {recipe.cuisine}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              <p className="mt-2 text-gray-600">{recipe.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Recipe
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 py-4 border-y border-gray-200">
            <div className="text-center">
              <span className="text-2xl">⏱</span>
              <p className="text-sm text-gray-500 mt-1">Prep Time</p>
              <p className="font-semibold">{recipe.prepTime || '-'} min</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">🍳</span>
              <p className="text-sm text-gray-500 mt-1">Cook Time</p>
              <p className="font-semibold">{recipe.cookTime || '-'} min</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">👥</span>
              <p className="text-sm text-gray-500 mt-1">Servings</p>
              <p className="font-semibold">{recipe.servings || '-'}</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">🔥</span>
              <p className="text-sm text-gray-500 mt-1">Calories</p>
              <p className="font-semibold">{recipe.calories || '-'}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600">Protein</p>
              <p className="text-2xl font-bold text-blue-700">{recipe.protein || 0}g</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-sm text-orange-600">Carbs</p>
              <p className="text-2xl font-bold text-orange-700">{recipe.carbs || 0}g</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-600">Fat</p>
              <p className="text-2xl font-bold text-yellow-700">{recipe.fat || 0}g</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-sm text-green-600">Calories</p>
              <p className="text-2xl font-bold text-green-700">{recipe.calories || 0}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="prose max-w-none">
              {recipe.instructions ? (
                <div className="space-y-3">
                  {recipe.instructions.split('\n').map((step, index) => (
                    <p key={index} className="text-gray-700">{step}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No instructions available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Recipe" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (min)</label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        message="Are you sure you want to delete this recipe? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default RecipeDetail;
