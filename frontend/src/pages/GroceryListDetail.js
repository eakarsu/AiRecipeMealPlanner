import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { showToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

function GroceryListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchGroceryList();
  }, [id]);

  const fetchGroceryList = async () => {
    try {
      const response = await api.get(`/grocery-lists/${id}`);
      setGroceryList(response.data);
      setFormData({ name: response.data.name });
    } catch (error) {
      showToast.error('Failed to load grocery list');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/grocery-lists/${id}`, { name: formData.name });
      setGroceryList({ ...groceryList, name: response.data.name });
      setShowEditModal(false);
      showToast.success('Grocery list updated');
    } catch (error) {
      showToast.error('Failed to update grocery list');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const currentItems = groceryList.items || [];
      const newItems = [...currentItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        checked: item.checked,
        ingredientId: item.ingredientId
      })), {
        name: newItem.name,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit,
        checked: false
      }];

      await api.put(`/grocery-lists/${id}`, { items: newItems });
      await fetchGroceryList();
      setShowAddItemModal(false);
      setNewItem({ name: '', quantity: '', unit: '' });
    } catch (error) {
      showToast.error('Failed to add item');
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      await api.patch(`/grocery-lists/${id}/items/${itemId}/toggle`);
      setGroceryList({
        ...groceryList,
        items: groceryList.items.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      });
    } catch (error) {
      showToast.error('Failed to toggle item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const newItems = groceryList.items
        .filter(item => item.id !== itemId)
        .map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          checked: item.checked,
          ingredientId: item.ingredientId
        }));

      await api.put(`/grocery-lists/${id}`, { items: newItems });
      await fetchGroceryList();
    } catch (error) {
      showToast.error('Failed to remove item');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/grocery-lists/${id}`);
      showToast.success('Grocery list deleted');
      navigate('/grocery-lists');
    } catch (error) {
      showToast.error('Failed to delete grocery list');
    }
  };

  const getCheckedCount = () => {
    return groceryList?.items?.filter(item => item.checked).length || 0;
  };

  if (loading) {
    return <CardGridSkeleton count={1} />;
  }

  if (!groceryList) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Grocery list not found</h2>
        <button
          onClick={() => navigate('/grocery-lists')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to grocery lists
        </button>
      </div>
    );
  }

  const groupedItems = groceryList.items?.reduce((groups, item) => {
    const category = item.ingredient?.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {}) || {};

  return (
    <div>
      <button
        onClick={() => navigate('/grocery-lists')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Grocery Lists
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{groceryList.name}</h1>
            {groceryList.mealPlan && (
              <p className="text-gray-600 mt-1">
                Linked to: {groceryList.mealPlan.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Item
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit List
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {getCheckedCount()} of {groceryList.items?.length || 0} items checked
            </span>
            <span className="text-sm font-medium text-primary-600">
              {groceryList.items?.length
                ? Math.round((getCheckedCount() / groceryList.items.length) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{
                width: groceryList.items?.length
                  ? `${(getCheckedCount() / groceryList.items.length) * 100}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                    item.checked ? 'bg-green-50' : ''
                  }`}
                >
                  <div
                    onClick={() => handleToggleItem(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      item.checked
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {item.checked && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                  </div>
                  {(item.quantity || item.unit) && (
                    <span className={`text-sm ${item.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.quantity} {item.unit}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!groceryList.items || groceryList.items.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <span className="text-4xl mb-4 block">🛒</span>
            <h3 className="text-lg font-semibold text-gray-900">No items in this list</h3>
            <p className="text-gray-600 mt-1">Click "Add Item" to get started</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Grocery List" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={showAddItemModal} onClose={() => setShowAddItemModal(false)} title="Add Item" size="sm">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Milk"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select</option>
                <option value="pieces">pieces</option>
                <option value="lbs">lbs</option>
                <option value="oz">oz</option>
                <option value="cups">cups</option>
                <option value="bottles">bottles</option>
                <option value="bags">bags</option>
                <option value="cans">cans</option>
                <option value="boxes">boxes</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddItemModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Grocery List"
        message="Are you sure you want to delete this grocery list? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
}

export default GroceryListDetail;
