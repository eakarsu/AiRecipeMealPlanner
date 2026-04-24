import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function DietaryProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: '', restrictions: '', allergies: '', preferences: '',
    targetCalories: '', targetProtein: '', targetCarbs: '', targetFat: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({
    recipe: { title: '', ingredients: [], instructions: '' },
    restrictions: '',
    allergies: '',
    preferences: '',
    targetCalories: 2000
  });
  const [aiResult, setAiResult] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const response = await api.get('/dietary-profiles', { params });
      setProfiles(response.data.data || response.data);
      setPagination(response.data.pagination || null);
    } catch (error) {
      showToast.error('Failed to fetch dietary profiles');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Profile name is required';
    if (formData.name.length > 100) errors.name = 'Name must be under 100 characters';
    if (formData.targetCalories && (isNaN(formData.targetCalories) || formData.targetCalories < 0)) errors.targetCalories = 'Invalid calories';
    if (formData.targetProtein && (isNaN(formData.targetProtein) || formData.targetProtein < 0)) errors.targetProtein = 'Invalid protein';
    if (formData.targetCarbs && (isNaN(formData.targetCarbs) || formData.targetCarbs < 0)) errors.targetCarbs = 'Invalid carbs';
    if (formData.targetFat && (isNaN(formData.targetFat) || formData.targetFat < 0)) errors.targetFat = 'Invalid fat';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '', restrictions: '', allergies: '', preferences: '',
      targetCalories: '', targetProtein: '', targetCarbs: '', targetFat: ''
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const toInt = (val) => (val === '' || val === null) ? null : parseInt(val);
      const dataToSend = {
        name: formData.name,
        restrictions: formData.restrictions.split(',').map(r => r.trim()).filter(r => r),
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(a => a),
        preferences: formData.preferences,
        targetCalories: toInt(formData.targetCalories),
        targetProtein: toInt(formData.targetProtein),
        targetCarbs: toInt(formData.targetCarbs),
        targetFat: toInt(formData.targetFat)
      };

      if (showEditModal && selectedProfile) {
        await api.put(`/dietary-profiles/${selectedProfile.id}`, dataToSend);
        showToast.success('Profile updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/dietary-profiles', dataToSend);
        showToast.success('Profile created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchProfiles();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dietary-profiles/${id}`);
      showToast.success('Profile deleted');
      fetchProfiles();
    } catch (error) {
      showToast.error('Failed to delete profile');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/dietary-profiles/bulk-delete', { ids });
      showToast.success(`${ids.length} profiles deleted`);
      fetchProfiles();
    } catch (error) {
      showToast.error('Failed to delete profiles');
    }
  };

  const handleEdit = (profile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name || '',
      restrictions: Array.isArray(profile.restrictions) ? profile.restrictions.join(', ') : (profile.restrictions || ''),
      allergies: Array.isArray(profile.allergies) ? profile.allergies.join(', ') : (profile.allergies || ''),
      preferences: profile.preferences || '',
      targetCalories: profile.targetCalories || '',
      targetProtein: profile.targetProtein || '',
      targetCarbs: profile.targetCarbs || '',
      targetFat: profile.targetFat || ''
    });
    setShowEditModal(true);
  };

  const handleRowClick = (profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  const handleAIAdjust = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await api.post('/ai/adjust-dietary', {
        recipe: aiInput.recipe,
        restrictions: aiInput.restrictions.split(',').map(r => r.trim()).filter(r => r),
        allergies: aiInput.allergies.split(',').map(a => a.trim()).filter(a => a),
        preferences: aiInput.preferences,
        targetCalories: aiInput.targetCalories
      });
      if (response.data.adjustedRecipe) {
        setAiResult(response.data.adjustedRecipe);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return a valid adjusted recipe');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to adjust recipe');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSampleData = () => {
    setAiInput({
      recipe: {
        title: 'Creamy Pasta Alfredo',
        ingredients: ['pasta', 'heavy cream', 'butter', 'parmesan cheese', 'garlic'],
        instructions: 'Cook pasta, make cream sauce with butter and cheese, combine'
      },
      restrictions: 'dairy-free',
      allergies: 'lactose',
      preferences: 'vegan, healthy',
      targetCalories: 500
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    {
      key: 'targetCalories', label: 'Target Calories', sortable: true, accessor: 'targetCalories',
      render: (row) => row.targetCalories ? `${row.targetCalories} cal` : '-'
    },
    {
      key: 'restrictions', label: 'Restrictions', accessor: 'restrictions',
      render: (row) => {
        const items = Array.isArray(row.restrictions) ? row.restrictions : [];
        return items.length > 0 ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {items.length} restriction{items.length !== 1 ? 's' : ''}
          </span>
        ) : '-';
      }
    },
    {
      key: 'allergies', label: 'Allergies', accessor: 'allergies',
      render: (row) => {
        const items = Array.isArray(row.allergies) ? row.allergies : [];
        return items.length > 0 ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            {items.length} allerg{items.length !== 1 ? 'ies' : 'y'}
          </span>
        ) : '-';
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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name *</label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="e.g., Keto Diet, Vegan Plan" />
          {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions (comma-separated)</label>
          <input type="text" value={formData.restrictions} onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., dairy, gluten, meat" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma-separated)</label>
          <input type="text" value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., peanuts, shellfish" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
          <textarea value={formData.preferences} onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2}
            placeholder="Describe your dietary preferences..." />
        </div>
        {[['Target Calories', 'targetCalories'], ['Target Protein (g)', 'targetProtein'],
          ['Target Carbs (g)', 'targetCarbs'], ['Target Fat (g)', 'targetFat']].map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors[key] ? 'border-red-300' : 'border-gray-300'}`} />
            {formErrors[key] && <p className="mt-1 text-sm text-red-600">{formErrors[key]}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Profile' : 'Create Profile')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dietary Profiles</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || profiles.length} profiles available</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Adjust Recipe
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> New Profile
          </button>
        </div>
      </div>

      <DataTable
        data={profiles}
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
        title="Dietary Profiles"
        exportFilename="dietary-profiles"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Dietary Profile" size="lg">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Dietary Profile" size="lg">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Profile Details" size="lg">
        {selectedProfile && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              {selectedProfile.targetCalories && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{selectedProfile.targetCalories} cal</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{selectedProfile.name}</h3>

            {/* Macro Targets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Calories', selectedProfile.targetCalories, 'cal', 'bg-emerald-50', 'text-emerald-500', 'text-emerald-800'],
                ['Protein', selectedProfile.targetProtein, 'g', 'bg-blue-50', 'text-blue-500', 'text-blue-800'],
                ['Carbs', selectedProfile.targetCarbs, 'g', 'bg-yellow-50', 'text-yellow-500', 'text-yellow-800'],
                ['Fat', selectedProfile.targetFat, 'g', 'bg-red-50', 'text-red-500', 'text-red-800']
              ].map(([label, val, unit, bg, labelColor, valColor]) => (
                <div key={label} className={`${bg} p-3 rounded-lg text-center`}>
                  <p className={`text-xs ${labelColor}`}>{label}</p>
                  <p className={`font-semibold ${valColor}`}>{val || 0}{unit}</p>
                </div>
              ))}
            </div>

            {/* Restrictions */}
            {Array.isArray(selectedProfile.restrictions) && selectedProfile.restrictions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Restrictions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.restrictions.map((r, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {Array.isArray(selectedProfile.allergies) && selectedProfile.allergies.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.allergies.map((a, i) => (
                    <span key={i} className="text-xs bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences */}
            {selectedProfile.preferences && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Preferences</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedProfile.preferences}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedProfile.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedProfile); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit
              </button>
              <button onClick={() => navigate(`/dietary-profiles/${selectedProfile.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Adjust Recipe Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Recipe Adjuster" size="lg">
        <form onSubmit={handleAIAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
            <input type="text" value={aiInput.recipe.title}
              onChange={(e) => setAiInput({ ...aiInput, recipe: { ...aiInput.recipe, title: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Creamy Pasta Alfredo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma-separated)</label>
            <input type="text" value={aiInput.recipe.ingredients.join(', ')}
              onChange={(e) => setAiInput({ ...aiInput, recipe: { ...aiInput.recipe, ingredients: e.target.value.split(',').map(i => i.trim()) } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., pasta, cream, butter, cheese" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
            <input type="text" value={aiInput.restrictions}
              onChange={(e) => setAiInput({ ...aiInput, restrictions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., dairy-free, vegan, low-carb" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input type="text" value={aiInput.allergies}
              onChange={(e) => setAiInput({ ...aiInput, allergies: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., lactose, nuts" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Calories</label>
            <input type="number" value={aiInput.targetCalories}
              onChange={(e) => setAiInput({ ...aiInput, targetCalories: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex justify-between pt-4">
            <button type="button" onClick={loadSampleData}
              className="px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Load Sample
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button type="submit" disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
                {aiLoading ? <><LoadingSpinner size="sm" /> Adjusting...</> : <><span>&#10024;</span> Adjust Recipe</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="Adjusted Recipe" size="lg">
        {aiResult && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-emerald-900">{aiResult.adjustedTitle}</h3>
              <p className="text-emerald-700 mt-1">{aiResult.adjustedDescription}</p>
            </div>

            {aiResult.changes && aiResult.changes.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Ingredient Substitutions</h4>
                <div className="space-y-2">
                  {aiResult.changes.map((change, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 line-through">{change.original}</span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="text-green-600 font-medium">{change.replacement}</span>
                      <span className="text-gray-500 text-xs">({change.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResult.nutritionComparison && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Original</h5>
                  <div className="text-xs space-y-1">
                    <div>Calories: {aiResult.nutritionComparison.original?.calories || 'N/A'}</div>
                    <div>Protein: {aiResult.nutritionComparison.original?.protein || 'N/A'}g</div>
                    <div>Carbs: {aiResult.nutritionComparison.original?.carbs || 'N/A'}g</div>
                    <div>Fat: {aiResult.nutritionComparison.original?.fat || 'N/A'}g</div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-green-700 mb-2">Adjusted</h5>
                  <div className="text-xs space-y-1">
                    <div>Calories: {aiResult.nutritionComparison.adjusted?.calories || 'N/A'}</div>
                    <div>Protein: {aiResult.nutritionComparison.adjusted?.protein || 'N/A'}g</div>
                    <div>Carbs: {aiResult.nutritionComparison.adjusted?.carbs || 'N/A'}g</div>
                    <div>Fat: {aiResult.nutritionComparison.adjusted?.fat || 'N/A'}g</div>
                  </div>
                </div>
              </div>
            )}

            {aiResult.adjustedIngredients && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">New Ingredients</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {aiResult.adjustedIngredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiResult.adjustedInstructions && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{aiResult.adjustedInstructions}</p>
              </div>
            )}

            {aiResult.tips && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {aiResult.tips.map((tip, i) => (
                    <li key={i}>&bull; {tip}</li>
                  ))}
                </ul>
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

export default DietaryProfiles;
