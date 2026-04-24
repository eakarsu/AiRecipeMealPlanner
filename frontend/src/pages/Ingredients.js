import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';

function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [filterValue, setFilterValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', caloriesPer100g: '', protein: '', carbs: '', fat: '', category: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      if (filterValue) params.category = filterValue;
      const res = await api.get('/ingredients', { params });
      setIngredients(res.data.data || res.data);
      setPagination(res.data.pagination || null);
    } catch (error) { showToast.error('Failed to fetch ingredients'); }
    finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder, filterValue]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.caloriesPer100g && isNaN(formData.caloriesPer100g)) errors.caloriesPer100g = 'Must be a number';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => { setFormData({ name: '', caloriesPer100g: '', protein: '', carbs: '', fat: '', category: '' }); setFormErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const toFloat = (v) => v === '' ? null : parseFloat(v);
      const data = { name: formData.name, caloriesPer100g: toFloat(formData.caloriesPer100g), protein: toFloat(formData.protein), carbs: toFloat(formData.carbs), fat: toFloat(formData.fat), category: formData.category };
      if (showEditModal && selectedItem) {
        await api.put(`/ingredients/${selectedItem.id}`, data);
        showToast.success('Ingredient updated');
        setShowEditModal(false);
      } else {
        await api.post('/ingredients', data);
        showToast.success('Ingredient created');
        setShowAddModal(false);
      }
      resetForm(); fetchData();
    } catch (error) { showToast.error(error.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => { try { await api.delete(`/ingredients/${id}`); showToast.success('Deleted'); fetchData(); } catch (e) { showToast.error('Failed'); } };
  const handleBulkDelete = async (ids) => { try { await api.post('/ingredients/bulk-delete', { ids }); showToast.success(`${ids.length} deleted`); fetchData(); } catch (e) { showToast.error('Failed'); } };
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({ name: item.name || '', caloriesPer100g: item.caloriesPer100g || '', protein: item.protein || '', carbs: item.carbs || '', fat: item.fat || '', category: item.category || '' });
    setShowEditModal(true);
  };
  const handleRowClick = (item) => { setSelectedItem(item); setShowDetailModal(true); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    { key: 'category', label: 'Category', sortable: true, accessor: 'category', render: (r) => r.category || '-' },
    { key: 'caloriesPer100g', label: 'Cal/100g', sortable: true, accessor: 'caloriesPer100g', render: (r) => r.caloriesPer100g || '-' },
    { key: 'protein', label: 'Protein', sortable: true, accessor: 'protein', render: (r) => r.protein ? `${r.protein}g` : '-' },
    { key: 'carbs', label: 'Carbs', sortable: true, accessor: 'carbs', render: (r) => r.carbs ? `${r.carbs}g` : '-' },
    { key: 'fat', label: 'Fat', sortable: true, accessor: 'fat', render: (r) => r.fat ? `${r.fat}g` : '-' },
  ];

  const filterOptions = [...new Set(ingredients.map(i => i.category).filter(Boolean))].map(c => ({ value: c, label: c }));

  if (loading) return <TableSkeleton rows={5} cols={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`} />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}</div>
      <div className="grid grid-cols-2 gap-4">
        {[['Cal/100g', 'caloriesPer100g'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fat (g)', 'fat']].map(([label, key]) => (
          <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="number" step="0.1" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
        ))}
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Meat, Vegetables, Grains..." /></div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update' : 'Create')}</button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Ingredients</h1><p className="mt-1 text-gray-600">{pagination?.total || ingredients.length} ingredients</p></div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><span>+</span> Add Ingredient</button>
      </div>
      <DataTable data={ingredients} columns={columns} pagination={pagination} onPageChange={setPage}
        onSearch={(v) => { setSearch(v); setPage(1); }} searchValue={search} onSort={(f, o) => { setSortBy(f); setSortOrder(o); setPage(1); }}
        sortBy={sortBy} sortOrder={sortOrder} filterOptions={filterOptions} filterValue={filterValue} onFilter={(v) => { setFilterValue(v); setPage(1); }}
        onRowClick={handleRowClick} onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete}
        title="Ingredients" exportFilename="ingredients" />
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Ingredient" size="md">{formFields}</Modal>
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Ingredient" size="md">{formFields}</Modal>
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Ingredient Details" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{selectedItem.name}</h3>
            {selectedItem.category && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{selectedItem.category}</span>}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-orange-50 p-3 rounded-lg text-center"><p className="text-xs text-orange-600">Cal/100g</p><p className="font-semibold text-orange-800">{selectedItem.caloriesPer100g || 0}</p></div>
              <div className="bg-blue-50 p-3 rounded-lg text-center"><p className="text-xs text-blue-600">Protein</p><p className="font-semibold text-blue-800">{selectedItem.protein || 0}g</p></div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center"><p className="text-xs text-yellow-600">Carbs</p><p className="font-semibold text-yellow-800">{selectedItem.carbs || 0}g</p></div>
              <div className="bg-red-50 p-3 rounded-lg text-center"><p className="text-xs text-red-600">Fat</p><p className="font-semibold text-red-800">{selectedItem.fat || 0}g</p></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedItem.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedItem); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Ingredients;
