import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function NutritionBalances() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({
    currentIntake: '',
    goals: '',
    dietType: 'balanced',
    activityLevel: 'moderate'
  });
  const [aiResult, setAiResult] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const fetchBalances = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const response = await api.get('/nutrition-balances', { params });
      setBalances(response.data.data || response.data);
      setPagination(response.data.pagination || null);
    } catch (error) {
      showToast.error('Failed to fetch nutrition balances');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.date) errors.date = 'Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', date: new Date().toISOString().split('T')[0] });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (showEditModal && selectedBalance) {
        await api.put(`/nutrition-balances/${selectedBalance.id}`, formData);
        showToast.success('Balance record updated successfully');
        setShowEditModal(false);
      } else {
        await api.post('/nutrition-balances', formData);
        showToast.success('Balance record created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchBalances();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save balance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/nutrition-balances/${id}`);
      showToast.success('Balance record deleted');
      fetchBalances();
    } catch (error) {
      showToast.error('Failed to delete balance record');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/nutrition-balances/bulk-delete', { ids });
      showToast.success(`${ids.length} balance records deleted`);
      fetchBalances();
    } catch (error) {
      showToast.error('Failed to delete balance records');
    }
  };

  const handleEdit = (balance) => {
    setSelectedBalance(balance);
    setFormData({
      name: balance.name || '',
      date: balance.date || new Date().toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleRowClick = (balance) => {
    setSelectedBalance(balance);
    setShowDetailModal(true);
  };

  const handleAIBalance = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const intakeLines = aiInput.currentIntake.split('\n').filter(l => l.trim());
      const currentIntake = {
        meals: intakeLines.map(line => {
          const parts = line.split(':').map(p => p.trim());
          return { meal: parts[0], foods: parts[1] || '' };
        })
      };

      const response = await api.post('/ai/balance-nutrition', {
        currentIntake,
        goals: aiInput.goals,
        dietType: aiInput.dietType,
        activityLevel: aiInput.activityLevel
      });
      if (response.data.balance) {
        setAiResult(response.data.balance);
        setShowAIModal(false);
        setShowAIResultModal(true);
      } else {
        showToast.error('AI did not return a valid analysis');
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to analyze nutrition');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSampleData = () => {
    setAiInput({
      currentIntake: `Breakfast: 2 eggs, toast with butter, orange juice
Lunch: Chicken salad sandwich, chips, soda
Snack: Apple, handful of almonds
Dinner: Pasta with marinara sauce, garlic bread`,
      goals: 'Lose weight, build muscle',
      dietType: 'balanced',
      activityLevel: 'moderate'
    });
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    {
      key: 'date', label: 'Date', sortable: true, accessor: 'date',
      render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-'
    },
    {
      key: 'balanceScore', label: 'Score', sortable: true, accessor: 'balanceScore',
      render: (row) => {
        const score = row.balanceScore || 0;
        const colorClass = score >= 80
          ? 'text-green-700 bg-green-100'
          : score >= 60
            ? 'text-yellow-700 bg-yellow-100'
            : 'text-red-700 bg-red-100';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
            {score}%
          </span>
        );
      }
    },
    {
      key: 'deficiencies', label: 'Deficiencies', accessor: 'deficiencies',
      render: (row) => {
        const count = row.deficiencies?.length || 0;
        return (
          <span className={`text-sm ${count > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            {count} {count === 1 ? 'issue' : 'issues'}
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
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="e.g., Monday Balance Check"
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
        <input
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`}
        />
        {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update Record' : 'Create Record')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Nutrition Balancer</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || balances.length} balance records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            AI Analyze
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> New Record
          </button>
        </div>
      </div>

      <DataTable
        data={balances}
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
        title="Nutrition Balances"
        exportFilename="nutrition-balances"
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Balance Record" size="md">
        {formFields}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Balance Record" size="md">
        {formFields}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Balance Details" size="lg">
        {selectedBalance && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{selectedBalance.name}</h3>
              <span className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(selectedBalance.balanceScore)}`}>
                {selectedBalance.balanceScore || 0}%
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              {selectedBalance.date ? new Date(selectedBalance.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </p>

            {selectedBalance.currentIntake && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600">Calories</p>
                  <p className="font-semibold text-blue-800">{selectedBalance.currentIntake.calories || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-600">Protein</p>
                  <p className="font-semibold text-green-800">{selectedBalance.currentIntake.protein || 0}g</p>
                </div>
              </div>
            )}

            {selectedBalance.deficiencies && selectedBalance.deficiencies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Deficiencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBalance.deficiencies.map((d, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedBalance.excesses && selectedBalance.excesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Excesses</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBalance.excesses.map((e, i) => (
                    <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedBalance.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedBalance); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
              <button onClick={() => navigate(`/nutrition-balances/${selectedBalance.id}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                View Full Page
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Analyze Modal */}
      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Nutrition Analyzer" size="lg">
        <form onSubmit={handleAIBalance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Today's Meals (one per line: Meal: foods eaten)</label>
            <textarea
              value={aiInput.currentIntake}
              onChange={(e) => setAiInput({ ...aiInput, currentIntake: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              rows={6}
              placeholder={"Breakfast: 2 eggs, toast, coffee\nLunch: Chicken salad, water\nDinner: Salmon, rice, vegetables"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Goals</label>
            <input
              type="text"
              value={aiInput.goals}
              onChange={(e) => setAiInput({ ...aiInput, goals: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Lose weight, build muscle, more energy"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
              <select
                value={aiInput.dietType}
                onChange={(e) => setAiInput({ ...aiInput, dietType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="balanced">Balanced</option>
                <option value="low-carb">Low Carb</option>
                <option value="high-protein">High Protein</option>
                <option value="keto">Keto</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
              <select
                value={aiInput.activityLevel}
                onChange={(e) => setAiInput({ ...aiInput, activityLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light Activity</option>
                <option value="moderate">Moderate Activity</option>
                <option value="active">Very Active</option>
                <option value="athlete">Athlete</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button type="button" onClick={loadSampleData}
              className="px-4 py-2 text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 flex items-center gap-2 transition-colors">
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
                {aiLoading ? <><LoadingSpinner size="sm" /> Analyzing...</> : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* AI Result Modal */}
      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="Nutrition Analysis Results" size="lg">
        {aiResult && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className={`p-4 rounded-lg ${getScoreColor(aiResult.overallScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Overall Score: {aiResult.overallScore}/100</h3>
                  <p className="text-sm mt-1">{aiResult.scoreDescription}</p>
                </div>
                <div className="text-4xl">
                  {aiResult.overallScore >= 80 ? (
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  ) : aiResult.overallScore >= 60 ? (
                    <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3.75A.75.75 0 0114.25 3a2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Current vs Recommended Totals */}
            {aiResult.currentTotals && aiResult.recommendedTotals && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Your Intake</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Calories</span><span className="font-medium">{aiResult.currentTotals.calories}</span></div>
                    <div className="flex justify-between"><span>Protein</span><span className="font-medium">{aiResult.currentTotals.protein}g</span></div>
                    <div className="flex justify-between"><span>Carbs</span><span className="font-medium">{aiResult.currentTotals.carbs}g</span></div>
                    <div className="flex justify-between"><span>Fat</span><span className="font-medium">{aiResult.currentTotals.fat}g</span></div>
                    <div className="flex justify-between"><span>Fiber</span><span className="font-medium">{aiResult.currentTotals.fiber}g</span></div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-3">Recommended</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Calories</span><span className="font-medium">{aiResult.recommendedTotals.calories}</span></div>
                    <div className="flex justify-between"><span>Protein</span><span className="font-medium">{aiResult.recommendedTotals.protein}g</span></div>
                    <div className="flex justify-between"><span>Carbs</span><span className="font-medium">{aiResult.recommendedTotals.carbs}g</span></div>
                    <div className="flex justify-between"><span>Fat</span><span className="font-medium">{aiResult.recommendedTotals.fat}g</span></div>
                    <div className="flex justify-between"><span>Fiber</span><span className="font-medium">{aiResult.recommendedTotals.fiber}g</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Deficiencies */}
            {aiResult.deficiencies && aiResult.deficiencies.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Areas to Improve</h4>
                <div className="space-y-2">
                  {aiResult.deficiencies.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                      <span className="text-red-700">{d.nutrient}</span>
                      <span className="text-red-600">Need {d.gap}g more</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Suggestions */}
            {aiResult.mealSuggestions && aiResult.mealSuggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Meal Suggestions</h4>
                <div className="space-y-2">
                  {aiResult.mealSuggestions.map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded">
                      <div className="font-medium text-blue-900">{s.meal}: {s.suggestion}</div>
                      <div className="text-xs text-blue-600 mt-1">{s.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Snack Recommendations */}
            {aiResult.snackRecommendations && aiResult.snackRecommendations.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Healthy Snack Ideas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {aiResult.snackRecommendations.map((snack, i) => (
                    <div key={i} className="bg-white p-2 rounded text-sm">
                      <div className="font-medium">{snack.name}</div>
                      <div className="text-xs text-gray-500">{snack.benefits}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Tips */}
            {aiResult.weeklyTips && aiResult.weeklyTips.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Weekly Tips</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  {aiResult.weeklyTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">-</span>
                      <span>{tip}</span>
                    </li>
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

export default NutritionBalances;
