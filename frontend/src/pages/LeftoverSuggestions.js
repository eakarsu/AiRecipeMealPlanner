import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function LeftoverSuggestions() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
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
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const [formData, setFormData] = useState({ name: '', leftovers: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({
    leftovers: '',
    expirationPriority: true,
    mealType: '',
    servings: 4
  });
  const [aiResult, setAiResult] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const response = await api.get('/leftover-suggestions', { params });
      setSuggestions(response.data.data || response.data);
      setPagination(response.data.pagination || null);
    } catch (error) {
      showToast.error('Failed to fetch leftover suggestions');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.name.length > 100) errors.name = 'Name must be under 100 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', leftovers: '' });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const dataToSend = {
        name: formData.name,
        leftovers: formData.leftovers.split(',').map(l => l.trim()).filter(l => l)
      };

      if (showEditModal && selectedSuggestion) {
        await api.put(`/leftover-suggestions/${selectedSuggestion.id}`, dataToSend);
        showToast.success('Suggestion updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/leftover-suggestions', dataToSend);
        showToast.success('Suggestion created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchSuggestions();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/leftover-suggestions/${id}`);
      showToast.success('Suggestion deleted');
      fetchSuggestions();
    } catch (error) {
      showToast.error('Failed to delete suggestion');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/leftover-suggestions/bulk-delete', { ids });
      showToast.success(`${ids.length} suggestions deleted`);
      fetchSuggestions();
    } catch (error) {
      showToast.error('Failed to delete suggestions');
    }
  };

  const handleEdit = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setFormData({
      name: suggestion.name || '',
      leftovers: Array.isArray(suggestion.leftovers) ? suggestion.leftovers.join(', ') : suggestion.leftovers || ''
    });
    setShowEditModal(true);
  };

  const handleRowClick = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailModal(true);
  };

  const handleAISuggest = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const leftovers = aiInput.leftovers.split('\n').map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { name: parts[0], quantity: parts[1] || '', expiresIn: parts[2] || '' };
      }).filter(item => item.name);

      const response = await api.post('/ai/suggest-leftovers', {
        leftovers,
        expirationPriority: aiInput.expirationPriority,
        mealType: aiInput.mealType,
        servings: aiInput.servings
      });
      if (response.data.suggestions) {
        setAiResult(response.data.suggestions);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return valid suggestions');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSampleData = () => {
    setAiInput({
      leftovers: `Rotisserie Chicken, half, 2 days
Cooked Rice, 2 cups, 3 days
Broccoli, 1 head, 4 days
Bell Peppers, 2, 5 days
Eggs, 6, 1 week
Cheese, 1 cup shredded, 1 week
Tortillas, 8, 5 days`,
      expirationPriority: true,
      mealType: 'dinner',
      servings: 4
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    {
      key: 'leftovers', label: 'Leftovers', accessor: 'leftovers',
      render: (row) => {
        const count = Array.isArray(row.leftovers) ? row.leftovers.length : 0;
        return (
          <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full text-xs font-medium">
            {count} item{count !== 1 ? 's' : ''}
          </span>
        );
      }
    },
    {
      key: 'suggestedRecipes', label: 'Recipes', accessor: 'suggestedRecipes',
      render: (row) => {
        const count = Array.isArray(row.suggestedRecipes) ? row.suggestedRecipes.length : 0;
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-medium">
            {count} recipe{count !== 1 ? 's' : ''}
          </span>
        );
      }
    },
    {
      key: 'status', label: 'Status', sortable: true, accessor: 'status',
      render: (row) => {
        const status = row.status || 'pending';
        const styles = status === 'completed'
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'createdAt', label: 'Created', sortable: true, accessor: 'createdAt',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
    },
  ];

  if (loading) return <CardGridSkeleton count={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="e.g., Sunday Dinner Leftovers"
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Leftovers (comma-separated)</label>
        <textarea
          value={formData.leftovers}
          onChange={(e) => setFormData({ ...formData, leftovers: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="e.g., chicken, rice, vegetables, cheese"
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Suggestion' : 'Create Suggestion')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Leftover Suggester</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || suggestions.length} suggestion records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Suggest
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> New Record
          </button>
        </div>
      </div>

      <DataTable
        data={suggestions}
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
        title="Leftover Suggestions"
        exportFilename="leftover-suggestions"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Leftover Record" size="md">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Leftover Record" size="md">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Suggestion Details" size="lg">
        {selectedSuggestion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedSuggestion.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {(selectedSuggestion.status || 'pending').charAt(0).toUpperCase() + (selectedSuggestion.status || 'pending').slice(1)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{selectedSuggestion.name}</h3>

            {/* Leftovers as orange badges */}
            {Array.isArray(selectedSuggestion.leftovers) && selectedSuggestion.leftovers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Leftover Items</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSuggestion.leftovers.map((item, i) => (
                    <span key={i} className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested recipes count */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Leftover Items</p>
                  <p className="text-lg font-semibold text-orange-700">
                    {Array.isArray(selectedSuggestion.leftovers) ? selectedSuggestion.leftovers.length : 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Suggested Recipes</p>
                  <p className="text-lg font-semibold text-purple-700">
                    {Array.isArray(selectedSuggestion.suggestedRecipes) ? selectedSuggestion.suggestedRecipes.length : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedSuggestion.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedSuggestion); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
              <button onClick={() => navigate(`/leftover-suggestions/${selectedSuggestion.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Suggest Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Leftover Recipe Suggester" size="lg">
        <form onSubmit={handleAISuggest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leftover Items (one per line: name, quantity, expires in)</label>
            <textarea
              value={aiInput.leftovers}
              onChange={(e) => setAiInput({ ...aiInput, leftovers: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              rows={6}
              placeholder={"Chicken, 1 cup, 2 days\nRice, 2 cups, 3 days\nVegetables, 1 cup, 4 days"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={aiInput.mealType}
                onChange={(e) => setAiInput({ ...aiInput, mealType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                value={aiInput.servings}
                onChange={(e) => setAiInput({ ...aiInput, servings: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                min={1}
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiInput.expirationPriority}
                onChange={(e) => setAiInput({ ...aiInput, expirationPriority: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Prioritize items expiring soon</span>
            </label>
          </div>
          <div className="flex justify-between pt-4">
            <button type="button" onClick={loadSampleData}
              className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Load Sample
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {aiLoading ? <><LoadingSpinner size="sm" /> Getting Ideas...</> : <><span>&#10024;</span> Get Suggestions</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="Recipe Suggestions from Leftovers" size="xl">
        {aiResult && (
          <div className="space-y-4">
            {/* Urgent Items */}
            {aiResult.urgentItems && aiResult.urgentItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Use These First!
                </h4>
                <div className="flex flex-wrap gap-2">
                  {aiResult.urgentItems.map((item, i) => (
                    <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Suggestions */}
            {aiResult.suggestions && aiResult.suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Recipe Ideas</h4>
                {aiResult.suggestions.map((recipe, i) => (
                  <div key={i} className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-orange-900 text-lg">{recipe.title}</h5>
                        <p className="text-sm text-orange-700 mt-1">{recipe.description}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-3 whitespace-nowrap ${
                        recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {recipe.difficulty || 'easy'}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-orange-600">
                      {recipe.prepTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Prep: {recipe.prepTime} min
                        </span>
                      )}
                      {recipe.cookTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                          </svg>
                          Cook: {recipe.cookTime} min
                        </span>
                      )}
                    </div>
                    {recipe.usesLeftovers && recipe.usesLeftovers.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-gray-500">Uses: </span>
                        {recipe.usesLeftovers.map((item, j) => (
                          <span key={j} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mr-1 font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {recipe.additionalIngredients && recipe.additionalIngredients.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-500">You'll also need: </span>
                        <span className="text-xs text-gray-600">{recipe.additionalIngredients.join(', ')}</span>
                      </div>
                    )}
                    {recipe.instructions && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Waste Reduction Tips */}
            {aiResult.wasteReductionTips && aiResult.wasteReductionTips.length > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  Waste Reduction Tips
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {aiResult.wasteReductionTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&#8226;</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Freezing Options */}
            {aiResult.freezingOptions && aiResult.freezingOptions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Can Be Frozen
                </h4>
                <p className="text-sm text-blue-700">{aiResult.freezingOptions.join(', ')}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowAIResultModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LeftoverSuggestions;
