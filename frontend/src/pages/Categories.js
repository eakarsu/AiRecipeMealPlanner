import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const res = await api.get('/categories', { params });
      setCategories(res.data.data || res.data);
      setPagination(res.data.pagination || null);
    } catch (error) { showToast.error('Failed to fetch categories'); }
    finally { setLoading(false); }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => { setFormData({ name: '', description: '', icon: '' }); setFormErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (showEditModal && selectedItem) {
        await api.put(`/categories/${selectedItem.id}`, formData);
        showToast.success('Category updated');
        setShowEditModal(false);
      } else {
        await api.post('/categories', formData);
        showToast.success('Category created');
        setShowAddModal(false);
      }
      resetForm(); fetchData();
    } catch (error) { showToast.error(error.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => { try { await api.delete(`/categories/${id}`); showToast.success('Deleted'); fetchData(); } catch (e) { showToast.error('Failed'); } };
  const handleBulkDelete = async (ids) => { try { await api.post('/categories/bulk-delete', { ids }); showToast.success(`${ids.length} deleted`); fetchData(); } catch (e) { showToast.error('Failed'); } };
  const handleEdit = (item) => { setSelectedItem(item); setFormData({ name: item.name || '', description: item.description || '', icon: item.icon || '' }); setShowEditModal(true); };
  const handleRowClick = (item) => { setSelectedItem(item); setShowDetailModal(true); };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    { key: 'description', label: 'Description', accessor: 'description', render: (r) => r.description || '-' },
    { key: 'icon', label: 'Icon', accessor: 'icon', render: (r) => r.icon || '-' },
  ];

  if (loading) return <TableSkeleton rows={5} cols={3} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`} />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}</div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" rows={3} /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="sunrise, moon, etc." /></div>
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
        <div><h1 className="text-3xl font-bold text-gray-900">Categories</h1><p className="mt-1 text-gray-600">{pagination?.total || categories.length} categories</p></div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><span>+</span> Add Category</button>
      </div>
      <DataTable data={categories} columns={columns} pagination={pagination} onPageChange={setPage}
        onSearch={(v) => { setSearch(v); setPage(1); }} searchValue={search} onSort={(f, o) => { setSortBy(f); setSortOrder(o); setPage(1); }}
        sortBy={sortBy} sortOrder={sortOrder} onRowClick={handleRowClick} onEdit={handleEdit} onDelete={handleDelete} onBulkDelete={handleBulkDelete}
        title="Categories" exportFilename="categories" />
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Category" size="md">{formFields}</Modal>
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Category" size="md">{formFields}</Modal>
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Category Details" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{selectedItem.name}</h3>
            <p className="text-gray-600">{selectedItem.description || 'No description'}</p>
            {selectedItem.icon && <p className="text-sm text-gray-500">Icon: {selectedItem.icon}</p>}
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

export default Categories;
