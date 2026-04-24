import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterValue, setFilterValue] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', instructions: '', prepTime: '', cookTime: '',
    servings: '', calories: '', protein: '', carbs: '', fat: '', cuisine: '', categoryId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [aiPrompt, setAiPrompt] = useState({ ingredients: '', preferences: '', cuisine: '' });
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [aiGeneratedRecipe, setAiGeneratedRecipe] = useState(null);

  const fetchRecipes = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      if (filterValue) params.filter = filterValue;
      const [recipesRes, categoriesRes] = await Promise.all([
        api.get('/recipes', { params }),
        api.get('/categories')
      ]);
      setRecipes(recipesRes.data.data || recipesRes.data);
      setPagination(recipesRes.data.pagination || null);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []);
    } catch (error) {
      showToast.error('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, filterValue]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (formData.title.length > 100) errors.title = 'Title must be under 100 characters';
    if (formData.calories && (isNaN(formData.calories) || formData.calories < 0)) errors.calories = 'Invalid calories';
    if (formData.servings && (isNaN(formData.servings) || formData.servings < 1)) errors.servings = 'Invalid servings';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', instructions: '', prepTime: '', cookTime: '', servings: '', calories: '', protein: '', carbs: '', fat: '', cuisine: '', categoryId: '' });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const toInt = (val) => (val === '' || val === null) ? null : parseInt(val);
      const toFloat = (val) => (val === '' || val === null) ? null : parseFloat(val);
      const dataToSend = {
        title: formData.title, description: formData.description, instructions: formData.instructions,
        cuisine: formData.cuisine, prepTime: toInt(formData.prepTime), cookTime: toInt(formData.cookTime),
        servings: toInt(formData.servings), calories: toInt(formData.calories), protein: toFloat(formData.protein),
        carbs: toFloat(formData.carbs), fat: toFloat(formData.fat), categoryId: toInt(formData.categoryId)
      };

      if (showEditModal && selectedRecipe) {
        await api.put(`/recipes/${selectedRecipe.id}`, dataToSend);
        showToast.success('Recipe updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/recipes', dataToSend);
        showToast.success('Recipe created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchRecipes();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/recipes/${id}`);
      showToast.success('Recipe deleted');
      fetchRecipes();
    } catch (error) {
      showToast.error('Failed to delete recipe');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/recipes/bulk-delete', { ids });
      showToast.success(`${ids.length} recipes deleted`);
      fetchRecipes();
    } catch (error) {
      showToast.error('Failed to delete recipes');
    }
  };

  const handleEdit = (recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      title: recipe.title || '', description: recipe.description || '', instructions: recipe.instructions || '',
      prepTime: recipe.prepTime || '', cookTime: recipe.cookTime || '', servings: recipe.servings || '',
      calories: recipe.calories || '', protein: recipe.protein || '', carbs: recipe.carbs || '',
      fat: recipe.fat || '', cuisine: recipe.cuisine || '', categoryId: recipe.categoryId || ''
    });
    setShowEditModal(true);
  };

  const handleRowClick = (recipe) => {
    setSelectedRecipe(recipe);
    setShowDetailModal(true);
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await api.post('/ai/generate-recipe', {
        ingredients: aiPrompt.ingredients.split(',').map(i => i.trim()).filter(i => i),
        preferences: aiPrompt.preferences, cuisine: aiPrompt.cuisine
      });
      if (response.data.recipe) {
        const recipe = response.data.recipe;
        if (Array.isArray(recipe.instructions)) recipe.instructions = recipe.instructions.join('\n');
        setAiGeneratedRecipe(recipe);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return a valid recipe');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to generate recipe');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAIRecipe = async () => {
    if (!aiGeneratedRecipe) return;
    setSubmitting(true);
    try {
      await api.post('/recipes', {
        title: aiGeneratedRecipe.title || '', description: aiGeneratedRecipe.description || '',
        instructions: aiGeneratedRecipe.instructions || '', cuisine: aiGeneratedRecipe.cuisine || '',
        prepTime: aiGeneratedRecipe.prepTime || null, cookTime: aiGeneratedRecipe.cookTime || null,
        servings: aiGeneratedRecipe.servings || null, calories: aiGeneratedRecipe.calories || null,
        protein: aiGeneratedRecipe.protein || null, carbs: aiGeneratedRecipe.carbs || null,
        fat: aiGeneratedRecipe.fat || null, categoryId: null
      });
      showToast.success('AI recipe saved!');
      setShowAIResultModal(false);
      setAiGeneratedRecipe(null);
      fetchRecipes();
    } catch (error) {
      showToast.error('Failed to save recipe');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', sortable: true, accessor: 'title' },
    { key: 'cuisine', label: 'Cuisine', sortable: true, accessor: 'cuisine', render: (row) => row.cuisine || '-' },
    { key: 'category', label: 'Category', accessor: (row) => row.category?.name || '-' },
    { key: 'calories', label: 'Calories', sortable: true, accessor: 'calories', render: (row) => row.calories ? `${row.calories} cal` : '-' },
    { key: 'prepTime', label: 'Prep', sortable: true, accessor: 'prepTime', render: (row) => row.prepTime ? `${row.prepTime}m` : '-' },
    { key: 'servings', label: 'Servings', sortable: true, accessor: 'servings', render: (row) => row.servings || '-' },
  ];

  const filterOptions = categories.map(c => ({ value: c.id, label: c.name }));

  if (loading) return <CardGridSkeleton count={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.title ? 'border-red-300' : 'border-gray-300'}`} />
          {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={4} />
        </div>
        {[['Prep Time (min)', 'prepTime', 'number'], ['Cook Time (min)', 'cookTime', 'number'], ['Servings', 'servings', 'number'],
          ['Calories', 'calories', 'number'], ['Protein (g)', 'protein', 'number'], ['Carbs (g)', 'carbs', 'number'],
          ['Fat (g)', 'fat', 'number'], ['Cuisine', 'cuisine', 'text']].map(([label, key, type]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type={type} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors[key] ? 'border-red-300' : 'border-gray-300'}`} />
            {formErrors[key] && <p className="mt-1 text-sm text-red-600">{formErrors[key]}</p>}
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Recipe' : 'Create Recipe')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || recipes.length} recipes available</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Generate
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> Add Recipe
          </button>
        </div>
      </div>

      <DataTable
        data={recipes}
        columns={columns}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={(val) => { setSearch(val); setPage(1); }}
        searchValue={search}
        onSort={(field, order) => { setSortBy(field); setSortOrder(order); setPage(1); }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterOptions={filterOptions}
        filterValue={filterValue}
        onFilter={(val) => { setFilterValue(val); setPage(1); }}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        title="Recipes"
        exportFilename="recipes"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add New Recipe" size="lg">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Recipe" size="lg">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Recipe Details" size="lg">
        {selectedRecipe && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {selectedRecipe.category && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{selectedRecipe.category.name}</span>}
              {selectedRecipe.cuisine && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{selectedRecipe.cuisine}</span>}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{selectedRecipe.title}</h3>
            <p className="text-gray-600">{selectedRecipe.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Prep', selectedRecipe.prepTime, 'min'], ['Cook', selectedRecipe.cookTime, 'min'], ['Servings', selectedRecipe.servings, ''], ['Calories', selectedRecipe.calories, 'cal']].map(([label, val, unit]) => (
                <div key={label} className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold">{val || 0} {unit}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center"><p className="text-xs text-blue-600">Protein</p><p className="font-semibold text-blue-800">{selectedRecipe.protein || 0}g</p></div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center"><p className="text-xs text-yellow-600">Carbs</p><p className="font-semibold text-yellow-800">{selectedRecipe.carbs || 0}g</p></div>
              <div className="bg-red-50 p-3 rounded-lg text-center"><p className="text-xs text-red-600">Fat</p><p className="font-semibold text-red-800">{selectedRecipe.fat || 0}g</p></div>
            </div>
            {selectedRecipe.instructions && (
              <div><h4 className="font-semibold text-gray-900 mb-2">Instructions</h4><p className="text-sm text-gray-700 whitespace-pre-line">{selectedRecipe.instructions}</p></div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedRecipe.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedRecipe); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit
              </button>
              <button onClick={() => navigate(`/recipes/${selectedRecipe.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Generate Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Recipe Generator" size="md">
        <form onSubmit={handleAIGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma-separated)</label>
            <input type="text" value={aiPrompt.ingredients} onChange={(e) => setAiPrompt({ ...aiPrompt, ingredients: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="chicken, garlic, lemon" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
            <input type="text" value={aiPrompt.preferences} onChange={(e) => setAiPrompt({ ...aiPrompt, preferences: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="healthy, quick" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
            <input type="text" value={aiPrompt.cuisine} onChange={(e) => setAiPrompt({ ...aiPrompt, cuisine: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Italian, Asian" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAIModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={aiLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {aiLoading ? <><LoadingSpinner size="sm" /> Generating...</> : <><span>&#10024;</span> Generate</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="AI Generated Recipe" size="lg">
        {aiGeneratedRecipe && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900">{aiGeneratedRecipe.title}</h3>
              <p className="text-purple-700 mt-1">{aiGeneratedRecipe.description}</p>
            </div>
            {aiGeneratedRecipe.instructions && (
              <div><h4 className="font-semibold mb-2">Instructions</h4><p className="text-sm text-gray-700 whitespace-pre-line">{aiGeneratedRecipe.instructions}</p></div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowAIResultModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveAIRecipe} disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save Recipe'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Recipes;
