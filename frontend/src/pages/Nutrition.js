import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';

function Nutrition() {
  const navigate = useNavigate();
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterValue, setFilterValue] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAILogModal, setShowAILogModal] = useState(false);
  const [showAILogResultModal, setShowAILogResultModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast', calories: '', protein: '', carbs: '', fat: '', notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [aiLogPrompt, setAiLogPrompt] = useState({ foodDescription: '', mealType: 'lunch', date: new Date().toISOString().split('T')[0] });
  const [aiLogLoading, setAiLogLoading] = useState(false);
  const [aiLogResult, setAiLogResult] = useState(null);

  const fetchNutritionLogs = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      if (filterValue) params.mealType = filterValue;
      const response = await api.get('/nutrition', { params });
      setNutritionLogs(response.data.data || response.data);
      setPagination(response.data.pagination || null);
    } catch (error) {
      showToast.error('Failed to fetch nutrition logs');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, filterValue]);

  useEffect(() => { fetchNutritionLogs(); }, [fetchNutritionLogs]);

  const validateForm = () => {
    const errors = {};
    if (!formData.date) errors.date = 'Date is required';
    if (formData.calories && (isNaN(formData.calories) || formData.calories < 0)) errors.calories = 'Invalid calories';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], mealType: 'breakfast', calories: '', protein: '', carbs: '', fat: '', notes: '' });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const toFloat = (val) => (val === '' || val === null) ? null : parseFloat(val);
      const dataToSend = {
        date: formData.date, mealType: formData.mealType, notes: formData.notes,
        calories: toFloat(formData.calories), protein: toFloat(formData.protein),
        carbs: toFloat(formData.carbs), fat: toFloat(formData.fat)
      };
      if (showEditModal && selectedLog) {
        await api.put(`/nutrition/${selectedLog.id}`, dataToSend);
        showToast.success('Nutrition log updated');
        setShowEditModal(false);
      } else {
        await api.post('/nutrition', dataToSend);
        showToast.success('Nutrition log created');
        setShowAddModal(false);
      }
      resetForm();
      fetchNutritionLogs();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save nutrition log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/nutrition/${id}`);
      showToast.success('Nutrition log deleted');
      fetchNutritionLogs();
    } catch (error) {
      showToast.error('Failed to delete nutrition log');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/nutrition/bulk-delete', { ids });
      showToast.success(`${ids.length} nutrition logs deleted`);
      fetchNutritionLogs();
    } catch (error) {
      showToast.error('Failed to delete nutrition logs');
    }
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setFormData({
      date: log.date || '', mealType: log.mealType || 'breakfast',
      calories: log.calories || '', protein: log.protein || '',
      carbs: log.carbs || '', fat: log.fat || '', notes: log.notes || ''
    });
    setShowEditModal(true);
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getMealIcon = (mealType) => {
    const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
    return icons[mealType] || '🍽️';
  };

  const handleAIAnalysis = async (date) => {
    setSelectedDate(date);
    setAiLoading(true);
    setShowAIModal(true);
    try {
      const dayLogs = nutritionLogs.filter(log => log.date === date);
      const response = await api.post('/ai/analyze-nutrition', {
        foods: dayLogs.map(log => ({ meal: log.mealType, calories: log.calories, protein: log.protein, carbs: log.carbs, fat: log.fat, notes: log.notes })),
        goals: 'balanced nutrition'
      });
      setAiAnalysis(response.data.analysis);
    } catch (error) {
      showToast.error('Failed to get AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAILogMeal = async (e) => {
    e.preventDefault();
    if (!aiLogPrompt.foodDescription) return;
    setAiLogLoading(true);
    try {
      const response = await api.post('/ai/analyze-nutrition', {
        foods: [{ description: aiLogPrompt.foodDescription, meal: aiLogPrompt.mealType }],
        goals: 'calculate nutrition values'
      });
      if (response.data.analysis) {
        setAiLogResult({ ...response.data.analysis, mealType: aiLogPrompt.mealType, foodDescription: aiLogPrompt.foodDescription });
        setShowAILogModal(false);
        setShowAILogResultModal(true);
      }
    } catch (error) {
      showToast.error('Failed to analyze food');
    } finally {
      setAiLogLoading(false);
    }
  };

  const handleSaveAILog = async () => {
    if (!aiLogResult) return;
    setSubmitting(true);
    try {
      await api.post('/nutrition', {
        date: aiLogPrompt.date, mealType: aiLogResult.mealType,
        calories: aiLogResult.totalCalories || 0, protein: aiLogResult.totalProtein || 0,
        carbs: aiLogResult.totalCarbs || 0, fat: aiLogResult.totalFat || 0,
        notes: aiLogResult.foodDescription
      });
      showToast.success('AI nutrition log saved!');
      setShowAILogResultModal(false);
      setAiLogResult(null);
      fetchNutritionLogs();
    } catch (error) {
      showToast.error('Failed to save nutrition log');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'date', label: 'Date', sortable: true, accessor: 'date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'mealType', label: 'Meal', sortable: true, accessor: 'mealType', render: (row) => <span>{getMealIcon(row.mealType)} <span className="capitalize">{row.mealType}</span></span> },
    { key: 'calories', label: 'Calories', sortable: true, accessor: 'calories', render: (row) => row.calories ? `${row.calories} cal` : '-' },
    { key: 'protein', label: 'Protein', accessor: 'protein', render: (row) => row.protein ? `${row.protein}g` : '-' },
    { key: 'carbs', label: 'Carbs', accessor: 'carbs', render: (row) => row.carbs ? `${row.carbs}g` : '-' },
    { key: 'fat', label: 'Fat', accessor: 'fat', render: (row) => row.fat ? `${row.fat}g` : '-' },
  ];

  const filterOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  if (loading) return <CardGridSkeleton count={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`} />
          {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
          <select value={formData.mealType} onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
        {[['Calories', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fat (g)', 'fat']].map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors[key] ? 'border-red-300' : 'border-gray-300'}`} placeholder="0" />
            {formErrors[key] && <p className="mt-1 text-sm text-red-600">{formErrors[key]}</p>}
          </div>
        ))}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={2} placeholder="What did you eat?" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Log' : 'Log Meal')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutrition Tracker</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || nutritionLogs.length} entries logged</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setAiLogPrompt({ foodDescription: '', mealType: 'lunch', date: new Date().toISOString().split('T')[0] }); setShowAILogModal(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Log Meal
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> Log Meal
          </button>
        </div>
      </div>

      <DataTable
        data={nutritionLogs}
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
        title="Nutrition Logs"
        exportFilename="nutrition-logs"
      />

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Log Meal" size="md">{formFields}</Modal>
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Nutrition Log" size="md">{formFields}</Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Nutrition Log Details" size="md">
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMealIcon(selectedLog.mealType)}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900 capitalize">{selectedLog.mealType}</h3>
                <p className="text-gray-500 text-sm">{new Date(selectedLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Calories', selectedLog.calories, 'cal', 'bg-orange-50 text-orange-700'], ['Protein', selectedLog.protein, 'g', 'bg-blue-50 text-blue-700'], ['Carbs', selectedLog.carbs, 'g', 'bg-green-50 text-green-700'], ['Fat', selectedLog.fat, 'g', 'bg-yellow-50 text-yellow-700']].map(([label, val, unit, color]) => (
                <div key={label} className={`${color} p-3 rounded-lg text-center`}>
                  <p className="text-xs opacity-75">{label}</p>
                  <p className="font-semibold">{val || 0}{unit}</p>
                </div>
              ))}
            </div>
            {selectedLog.notes && <div><h4 className="font-semibold text-gray-900 mb-1">Notes</h4><p className="text-sm text-gray-700">{selectedLog.notes}</p></div>}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedLog.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedLog); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit
              </button>
              <button onClick={() => navigate(`/nutrition/${selectedLog.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">View Full Page</button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Log Meal Modal */}
      <Modal isOpen={showAILogModal} onClose={() => setShowAILogModal(false)} title="AI Log Meal" size="md">
        <form onSubmit={handleAILogMeal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={aiLogPrompt.date} onChange={(e) => setAiLogPrompt({ ...aiLogPrompt, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select value={aiLogPrompt.mealType} onChange={(e) => setAiLogPrompt({ ...aiLogPrompt, mealType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What did you eat?</label>
            <textarea required value={aiLogPrompt.foodDescription} onChange={(e) => setAiLogPrompt({ ...aiLogPrompt, foodDescription: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} placeholder="e.g., Grilled chicken breast with rice and broccoli" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAILogModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={aiLogLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {aiLogLoading ? <><LoadingSpinner size="sm" /> Analyzing...</> : <><span>&#10024;</span> Analyze Food</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Log Result Modal */}
      <Modal isOpen={showAILogResultModal} onClose={() => setShowAILogResultModal(false)} title="AI Nutrition Analysis" size="md">
        {aiLogResult && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-900 font-medium">{aiLogResult.foodDescription}</p>
              <p className="text-sm text-purple-700 capitalize mt-1">{aiLogResult.mealType}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-3 rounded-lg text-center"><p className="text-xs text-orange-600">Calories</p><p className="text-xl font-bold text-orange-700">{aiLogResult.totalCalories || 0}</p></div>
              <div className="bg-blue-50 p-3 rounded-lg text-center"><p className="text-xs text-blue-600">Protein</p><p className="text-xl font-bold text-blue-700">{aiLogResult.totalProtein || 0}g</p></div>
              <div className="bg-green-50 p-3 rounded-lg text-center"><p className="text-xs text-green-600">Carbs</p><p className="text-xl font-bold text-green-700">{aiLogResult.totalCarbs || 0}g</p></div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center"><p className="text-xs text-yellow-600">Fat</p><p className="text-xl font-bold text-yellow-700">{aiLogResult.totalFat || 0}g</p></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowAILogResultModal(false); setAiLogResult(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveAILog} disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : 'Log Meal'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Analysis Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Daily Nutrition Analysis" size="md">
        {aiLoading ? (
          <div className="py-8 text-center"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-600">Analyzing your nutrition...</p></div>
        ) : aiAnalysis ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Analysis for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center"><p className="text-sm text-orange-600">Total Calories</p><p className="text-xl font-bold text-orange-700">{aiAnalysis.totalCalories || 0}</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-sm text-blue-600">Protein</p><p className="text-xl font-bold text-blue-700">{aiAnalysis.totalProtein || 0}g</p></div>
            </div>
            {aiAnalysis.analysis && <div><h3 className="font-semibold text-gray-900 mb-2">Analysis</h3><p className="text-gray-600 bg-gray-50 rounded-lg p-3">{aiAnalysis.analysis}</p></div>}
            {aiAnalysis.recommendations?.length > 0 && (
              <div><h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <ul className="space-y-2">{aiAnalysis.recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-gray-600"><span className="text-primary-600">&#8226;</span>{rec}</li>)}</ul>
              </div>
            )}
          </div>
        ) : <div className="text-center py-4"><p className="text-gray-500">No analysis available</p></div>}
      </Modal>
    </div>
  );
}

export default Nutrition;
