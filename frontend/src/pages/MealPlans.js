import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';

function MealPlans() {
  const navigate = useNavigate();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', targetCalories: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const res = await api.get('/meal-plans', { params });
      setMealPlans(res.data.data || res.data);
      setPagination(res.data.pagination || null);
    } catch (error) { showToast.error('Failed to fetch meal plans'); }
    finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => { setFormData({ name: '', startDate: '', endDate: '', targetCalories: '' }); setFormErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const data = { ...formData, targetCalories: formData.targetCalories ? parseInt(formData.targetCalories) : null };
      if (showEditModal && selectedItem) {
        await api.put(`/meal-plans/${selectedItem.id}`, data);
        showToast.success('Meal plan updated');
        setShowEditModal(false);
      } else {
        await api.post('/meal-plans', data);
        showToast.success('Meal plan created');
        setShowAddModal(false);
      }
      resetForm(); fetchData();
    } catch (error) { showToast.error(error.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/meal-plans/${id}`); showToast.success('Meal plan deleted'); fetchData(); }
    catch (error) { showToast.error('Failed to delete'); }
  };

  const handleBulkDelete = async (ids) => {
    try { await api.post('/meal-plans/bulk-delete', { ids }); showToast.success(`${ids.length} meal plans deleted`); fetchData(); }
    catch (error) { showToast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({ name: item.name || '', startDate: item.startDate || '', endDate: item.endDate || '', targetCalories: item.targetCalories || '' });
    setShowEditModal(true);
  };

  const handleRowClick = (item) => { setSelectedItem(item); setShowDetailModal(true); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    { key: 'startDate', label: 'Start Date', sortable: true, accessor: 'startDate' },
    { key: 'endDate', label: 'End Date', accessor: 'endDate', render: (row) => row.endDate || '-' },
    { key: 'targetCalories', label: 'Target Cal', sortable: true, accessor: 'targetCalories', render: (row) => row.targetCalories || '-' },
    { key: 'items', label: 'Items', accessor: (row) => row.items?.length || 0 },
  ];

  if (loading) return <TableSkeleton rows={5} cols={5} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`} />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.startDate ? 'border-red-300' : 'border-gray-300'}`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Calories</label>
        <input type="number" value={formData.targetCalories} onChange={(e) => setFormData({ ...formData, targetCalories: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Meal Plans</h1><p className="mt-1 text-gray-600">{pagination?.total || mealPlans.length} plans</p></div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <span>+</span> Add Plan
        </button>
      </div>
      <DataTable data={mealPlans} columns={columns} pagination={pagination} onPageChange={setPage}
        onSearch={(val) => { setSearch(val); setPage(1); }} searchValue={search}
        onSort={(f, o) => { setSortBy(f); setSortOrder(o); setPage(1); }} sortBy={sortBy} sortOrder={sortOrder}
        onRowClick={handleRowClick} onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete}
        title="Meal Plans" exportFilename="meal-plans" />
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Meal Plan" size="md">{formFields}</Modal>
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Meal Plan" size="md">{formFields}</Modal>
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Meal Plan Details" size="lg">
        {selectedItem && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{selectedItem.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xs text-gray-500">Start</p><p className="font-semibold">{selectedItem.startDate}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xs text-gray-500">End</p><p className="font-semibold">{selectedItem.endDate || '-'}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-xs text-gray-500">Target Cal</p><p className="font-semibold">{selectedItem.targetCalories || '-'}</p></div>
            </div>
            <p className="text-sm text-gray-600">{selectedItem.items?.length || 0} meal items</p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedItem.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedItem); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
              <button onClick={() => navigate(`/meal-plans/${selectedItem.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">View Full Page</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MealPlans;
