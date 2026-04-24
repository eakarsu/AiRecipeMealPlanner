import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function GroceryLists() {
  const navigate = useNavigate();
  const [groceryLists, setGroceryLists] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
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
  const [selectedList, setSelectedList] = useState(null);

  const [formData, setFormData] = useState({ name: '', items: [] });
  const [formErrors, setFormErrors] = useState({});
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '' });
  const [selectedMealPlan, setSelectedMealPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      const [listsRes, plansRes] = await Promise.all([
        api.get('/grocery-lists', { params }),
        api.get('/meal-plans')
      ]);
      setGroceryLists(listsRes.data.data || listsRes.data);
      setPagination(listsRes.data.pagination || null);
      setMealPlans(Array.isArray(plansRes.data) ? plansRes.data : plansRes.data.data || []);
    } catch (error) {
      showToast.error('Failed to fetch grocery lists');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', items: [] });
    setFormErrors({});
    setNewItem({ name: '', quantity: '', unit: '' });
  };

  const handleAddItem = () => {
    if (newItem.name) {
      setFormData({ ...formData, items: [...formData.items, { ...newItem, checked: false }] });
      setNewItem({ name: '', quantity: '', unit: '' });
    }
  };

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (showEditModal && selectedList) {
        await api.put(`/grocery-lists/${selectedList.id}`, formData);
        showToast.success('Grocery list updated');
        setShowEditModal(false);
      } else {
        await api.post('/grocery-lists', formData);
        showToast.success('Grocery list created');
        setShowAddModal(false);
      }
      resetForm();
      fetchData();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to save grocery list');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/grocery-lists/${id}`);
      showToast.success('Grocery list deleted');
      fetchData();
    } catch (error) {
      showToast.error('Failed to delete grocery list');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await api.post('/grocery-lists/bulk-delete', { ids });
      showToast.success(`${ids.length} grocery lists deleted`);
      fetchData();
    } catch (error) {
      showToast.error('Failed to delete grocery lists');
    }
  };

  const handleEdit = (list) => {
    setSelectedList(list);
    setFormData({ name: list.name || '', items: list.items || [] });
    setShowEditModal(true);
  };

  const handleRowClick = (list) => {
    setSelectedList(list);
    setShowDetailModal(true);
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!selectedMealPlan) return;
    setAiLoading(true);
    try {
      const mealPlan = mealPlans.find(mp => mp.id === parseInt(selectedMealPlan));
      const response = await api.post('/ai/generate-grocery-list', {
        mealPlan: {
          name: mealPlan.name,
          items: mealPlan.items?.map(item => ({
            recipe: item.recipe?.title || item.mealName,
            day: item.dayOfWeek,
            meal: item.mealType
          }))
        },
        servings: 4
      });
      if (response.data.groceryList) {
        const aiList = response.data.groceryList;
        aiList.mealPlanName = mealPlan.name;
        setAiGeneratedList(aiList);
        setShowAIModal(false);
        setShowAIResultModal(true);
      }
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to generate grocery list');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAIList = async () => {
    if (!aiGeneratedList) return;
    setSubmitting(true);
    try {
      await api.post('/grocery-lists', {
        name: aiGeneratedList.name || `Grocery List for ${aiGeneratedList.mealPlanName}`,
        items: aiGeneratedList.items?.map(item => ({
          name: item.name, quantity: item.quantity, unit: item.unit, checked: false
        })) || []
      });
      showToast.success('AI grocery list saved!');
      setShowAIResultModal(false);
      setAiGeneratedList(null);
      fetchData();
    } catch (error) {
      showToast.error('Failed to save grocery list');
    } finally {
      setSubmitting(false);
    }
  };

  const getCheckedCount = (list) => list.items?.filter(item => item.checked).length || 0;

  const columns = [
    { key: 'name', label: 'Name', sortable: true, accessor: 'name' },
    { key: 'items', label: 'Items', accessor: (row) => `${getCheckedCount(row)}/${row.items?.length || 0}` },
    { key: 'mealPlan', label: 'Meal Plan', accessor: (row) => row.mealPlan?.name || '-' },
    { key: 'created_at', label: 'Created', sortable: true, accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  if (loading) return <CardGridSkeleton count={6} />;

  const formFields = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="Weekly Groceries" />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Add Items</label>
        <div className="flex gap-2">
          <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Item name" />
          <input type="text" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Qty" />
          <input type="text" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Unit" />
          <button type="button" onClick={handleAddItem}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Add</button>
        </div>
      </div>
      {formData.items.length > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {formData.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm">{item.name} {item.quantity && `(${item.quantity} ${item.unit})`}</span>
              <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">x</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : (showEditModal ? 'Update List' : 'Create List')}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grocery Lists</h1>
          <p className="mt-1 text-gray-600">{pagination?.total || groceryLists.length} lists</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAIModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>&#10024;</span> AI Generate
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <span>+</span> New List
          </button>
        </div>
      </div>

      <DataTable
        data={groceryLists}
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
        title="Grocery Lists"
        exportFilename="grocery-lists"
      />

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Create Grocery List" size="md">
        {formFields}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Grocery List" size="md">
        {formFields}
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Grocery List Details" size="lg">
        {selectedList && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{selectedList.name}</h3>
            {selectedList.mealPlan && <p className="text-gray-600 text-sm">Linked to: {selectedList.mealPlan.name}</p>}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{getCheckedCount(selectedList)}/{selectedList.items?.length || 0} items checked</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: selectedList.items?.length ? `${(getCheckedCount(selectedList) / selectedList.items.length) * 100}%` : '0%' }}></div>
              </div>
            </div>
            {selectedList.items?.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                {selectedList.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.name}</span>
                    <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowDetailModal(false); handleDelete(selectedList.id); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); handleEdit(selectedList); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                Edit
              </button>
              <button onClick={() => navigate(`/grocery-lists/${selectedList.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">View Full Page</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAIModal} onClose={() => setShowAIModal(false)} title="AI Grocery List Generator" size="md">
        <form onSubmit={handleAIGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Meal Plan</label>
            <select required value={selectedMealPlan} onChange={(e) => setSelectedMealPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              <option value="">Choose a meal plan</option>
              {mealPlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} ({plan.items?.length || 0} meals)</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-500">AI will analyze your meal plan and generate a complete grocery list.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAIModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={aiLoading || !selectedMealPlan}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {aiLoading ? <><LoadingSpinner size="sm" /> Generating...</> : <><span>&#10024;</span> Generate List</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAIResultModal} onClose={() => setShowAIResultModal(false)} title="AI Generated Grocery List" size="lg">
        {aiGeneratedList && (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">{aiGeneratedList.name || 'AI Grocery List'}</h3>
              <p className="text-sm text-purple-700">{aiGeneratedList.items?.length || 0} items</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aiGeneratedList.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-600">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => { setShowAIResultModal(false); setAiGeneratedList(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveAIList} disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {submitting ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save Grocery List'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GroceryLists;
