import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function CookingTimers() {
  const navigate = useNavigate();
  const [timers, setTimers] = useState([]);
  const [recipes, setRecipes] = useState([]);
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
  const [selectedTimer, setSelectedTimer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    recipeId: '',
    totalTime: 30
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({
    recipeTitle: '',
    recipeInstructions: '',
    servings: 4,
    skillLevel: 'intermediate'
  });
  const [aiResult, setAiResult] = useState(null);

  // Helpers
  const formatTime = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const getStepTypeColor = (type) => {
    switch (type) {
      case 'prep': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-orange-100 text-orange-700';
      case 'cooking': return 'bg-red-100 text-red-700';
      case 'rest': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Fetch data
  const fetchTimers = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const [timersRes, recipesRes] = await Promise.all([
        api.get('/cooking-timers', { params }),
        api.get('/recipes')
      ]);
      setTimers(timersRes.data.data || timersRes.data);
      setPagination(timersRes.data.pagination || null);
      setRecipes(Array.isArray(recipesRes.data) ? recipesRes.data : recipesRes.data.data || []);
    } catch (error) {
      showToast.error('Failed to fetch cooking timers');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchTimers(); }, [fetchTimers]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Timer name is required';
    if (formData.name.length > 100) errors.name = 'Name must be under 100 characters';
    if (!formData.totalTime || formData.totalTime < 1) errors.totalTime = 'Total time must be at least 1 minute';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', recipeId: '', totalTime: 30 });
    setFormErrors({});
  };

  // CRUD handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const dataToSend = {
        name: formData.name,
        recipeId: formData.recipeId || null,
        totalTime: parseInt(formData.totalTime)
      };

      if (showEditModal && selectedTimer) {
        await api.put(`/cooking-timers/${selectedTimer.id}`, dataToSend);
        showToast.success('Timer updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/cooking-timers', dataToSend);
        showToast.success('Timer created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchTimers();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save timer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cooking-timers/${id}`);
      showToast.success('Timer deleted');
      fetchTimers();
    } catch (error) {
      showToast.error('Failed to delete timer');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/cooking-timers/bulk-delete', { ids });
      showToast.success(`${ids.length} timers deleted`);
      fetchTimers();
    } catch (error) {
      showToast.error('Failed to delete timers');
    }
  };

  const handleEdit = (timer) => {
    setSelectedTimer(timer);
    setFormData({
      name: timer.name || '',
      recipeId: timer.recipeId || '',
      totalTime: timer.totalTime || 30
    });
    setShowEditModal(true);
  };

  const handleRowClick = (timer) => {
    setSelectedTimer(timer);
    setShowDetailModal(true);
  };

  // AI handlers
  const handleAITimer = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const recipe = {
        title: aiInput.recipeTitle,
        instructions: aiInput.recipeInstructions,
        servings: aiInput.servings
      };
      const response = await api.post('/ai/create-cooking-timer', {
        recipe,
        servings: aiInput.servings,
        skillLevel: aiInput.skillLevel
      });
      if (response.data.timer) {
        setAiResult(response.data.timer);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return a valid timer');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to create AI timer');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSampleData = () => {
    setAiInput({
      recipeTitle: 'Grilled Steak with Vegetables',
      recipeInstructions: `1. Season the steak with salt and pepper
2. Let it come to room temperature (20 min)
3. Heat grill to high
4. Grill steak 4-5 minutes per side for medium-rare
5. Let rest 5 minutes
6. Meanwhile, grill vegetables
7. Serve together`,
      servings: 2,
      skillLevel: 'intermediate'
    });
  };

  // DataTable columns
  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    {
      key: 'totalTime', label: 'Total Time', sortable: true, accessor: 'totalTime',
      render: (row) => (
        <span className="font-medium text-red-600">{formatTime(row.totalTime)}</span>
      )
    },
    {
      key: 'steps', label: 'Steps', accessor: 'steps',
      render: (row) => {
        const count = row.steps?.length || 0;
        return (
          <span className="text-sm text-gray-700">
            {count > 0 ? `${count} step${count !== 1 ? 's' : ''}` : '-'}
          </span>
        );
      }
    },
    {
      key: 'status', label: 'Status', sortable: true, accessor: 'status',
      render: (row) => {
        const statusStyles = {
          completed: 'bg-green-100 text-green-700',
          in_progress: 'bg-blue-100 text-blue-700',
          pending: 'bg-gray-100 text-gray-700'
        };
        const statusLabels = {
          completed: 'Completed',
          in_progress: 'In Progress',
          pending: 'Pending'
        };
        const status = row.status || 'pending';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
            {statusLabels[status] || status}
          </span>
        );
      }
    },
    {
      key: 'recipe', label: 'Recipe', accessor: (row) => row.recipe?.title || '-',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.recipe?.title || '-'}</span>
      )
    }
  ];

  // Form fields shared between Add and Edit modals
  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timer Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="e.g., Perfect Steak Timer"
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Recipe (optional)</label>
        <select
          value={formData.recipeId}
          onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">No recipe linked</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Time (minutes) *</label>
        <input
          type="number"
          min="1"
          value={formData.totalTime}
          onChange={(e) => setFormData({ ...formData, totalTime: parseInt(e.target.value) || '' })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${formErrors.totalTime ? 'border-red-300' : 'border-gray-300'}`}
        />
        {formErrors.totalTime && <p className="mt-1 text-sm text-red-600">{formErrors.totalTime}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Timer' : 'Create Timer')}
        </button>
      </div>
    </form>
  );

  if (loading) return <CardGridSkeleton count={6} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cooking Timers</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || timers.length} cooking timers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>&#10024;</span> AI Create Timer
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>+</span> New Timer
          </button>
        </div>
      </div>

      <DataTable
        data={timers}
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
        title="Cooking Timers"
        exportFilename="cooking-timers"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Cooking Timer" size="md">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Cooking Timer" size="md">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Timer Details" size="lg">
        {selectedTimer && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const status = selectedTimer.status || 'pending';
                const statusStyles = {
                  completed: 'bg-green-100 text-green-700',
                  in_progress: 'bg-blue-100 text-blue-700',
                  pending: 'bg-gray-100 text-gray-700'
                };
                const statusLabels = {
                  completed: 'Completed',
                  in_progress: 'In Progress',
                  pending: 'Pending'
                };
                return (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[status] || statusStyles.pending}`}>
                    {statusLabels[status] || status}
                  </span>
                );
              })()}
              {selectedTimer.recipe && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {selectedTimer.recipe.title}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900">{selectedTimer.name}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-xs text-red-500 mb-1">Total Time</p>
                <p className="text-2xl font-bold text-red-600">{formatTime(selectedTimer.totalTime)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-xs text-blue-500 mb-1">Steps</p>
                <p className="text-2xl font-bold text-blue-600">{selectedTimer.steps?.length || 0}</p>
              </div>
            </div>

            {selectedTimer.steps && selectedTimer.steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Steps Preview</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTimer.steps.slice(0, 5).map((step, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {step.stepNumber || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">{step.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getStepTypeColor(step.type)}`}>
                        {step.type}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{step.duration} min</span>
                    </div>
                  ))}
                  {selectedTimer.steps.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-1">
                      + {selectedTimer.steps.length - 5} more steps
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => { setShowDetailModal(false); handleDelete(selectedTimer.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button
                onClick={() => { setShowDetailModal(false); handleEdit(selectedTimer); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => { setShowDetailModal(false); navigate(`/cooking-timers/${selectedTimer.id}`); }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Create Timer Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Cooking Timer Generator" size="lg">
        <form onSubmit={handleAITimer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
            <input
              type="text"
              value={aiInput.recipeTitle}
              onChange={(e) => setAiInput({ ...aiInput, recipeTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Grilled Steak with Vegetables"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Instructions</label>
            <textarea
              value={aiInput.recipeInstructions}
              onChange={(e) => setAiInput({ ...aiInput, recipeInstructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={6}
              placeholder="Paste or type the recipe instructions here..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input
                type="number"
                min="1"
                value={aiInput.servings}
                onChange={(e) => setAiInput({ ...aiInput, servings: parseInt(e.target.value) || '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Skill Level</label>
              <select
                value={aiInput.skillLevel}
                onChange={(e) => setAiInput({ ...aiInput, skillLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              Load Sample
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {aiLoading ? <><LoadingSpinner size="sm" /> Creating...</> : <><span>&#10024;</span> Create Timer</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="AI Generated Cooking Timer" size="xl">
        {aiResult && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-red-900">{aiResult.recipeName}</h3>
                  <p className="text-red-700 mt-1">{aiResult.servings} servings</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{formatTime(aiResult.totalTime)}</div>
                  <div className="text-xs text-red-500">Total Time</div>
                </div>
              </div>
            </div>

            {/* Steps */}
            {aiResult.steps && aiResult.steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cooking Steps ({aiResult.steps.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {aiResult.steps.map((step, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-gray-900">{step.title}</h5>
                            <span className={`text-xs px-2 py-0.5 rounded ${getStepTypeColor(step.type)}`}>
                              {step.type}
                            </span>
                            <span className="text-xs text-gray-500">{step.duration} min</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          {step.tips && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                              </svg>
                              {step.tips}
                            </p>
                          )}
                          {step.canMultitask && step.multitaskSuggestion && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                              </svg>
                              {step.multitaskSuggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {aiResult.timeline && aiResult.timeline.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Timeline</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResult.timeline.map((t, i) => (
                    <div key={i} className="bg-white px-3 py-1.5 rounded-lg text-sm shadow-sm">
                      <span className="font-mono text-blue-600 font-medium">{t.time}</span>
                      <span className="text-gray-600 ml-2">{t.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Needed */}
            {aiResult.equipmentNeeded && aiResult.equipmentNeeded.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Equipment Needed</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResult.equipmentNeeded.map((eq, i) => (
                    <span key={i} className="bg-white px-3 py-1.5 rounded-lg text-sm text-gray-700 shadow-sm">
                      {typeof eq === 'string' ? eq : `${eq.item}${eq.size ? ` (${eq.size})` : ''}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timing Tips */}
            {aiResult.timingTips && aiResult.timingTips.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Timing Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {aiResult.timingTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">&#8226;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Serving Temperature */}
            {aiResult.servingTemperature && (
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <span className="text-sm font-medium text-green-700">{aiResult.servingTemperature}</span>
                {aiResult.restingTime && (
                  <span className="text-sm text-green-600 ml-2">| Resting: {aiResult.restingTime}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowAIResultModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setShowAIResultModal(false); fetchTimers(); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CookingTimers;
