import React, { useState, useCallback } from 'react';
import Pagination from './Pagination';
import ConfirmDialog from './ConfirmDialog';
import { showToast } from './ToastProvider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

function DataTable({
  data = [],
  columns = [],
  pagination,
  onPageChange,
  onSearch,
  onSort,
  sortBy,
  sortOrder,
  searchValue = '',
  filterOptions = [],
  filterValue = '',
  onFilter,
  onRowClick,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  title = '',
  exportFilename = 'export',
  loading = false,
  actions,
}) {
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const toggleSelectAll = useCallback(() => {
    if (selected.length === data.length) {
      setSelected([]);
    } else {
      setSelected(data.map((item) => item.id));
    }
  }, [selected.length, data]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleSort = (field) => {
    if (onSort) {
      const newOrder = sortBy === field && sortOrder === 'ASC' ? 'DESC' : 'ASC';
      onSort(field, newOrder);
    }
  };

  const exportCSV = () => {
    const headers = columns.map((c) => c.label).join(',');
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = c.accessor ? (typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor]) : '';
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${exportFilename}.csv`);
    showToast.success('CSV exported successfully');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title || exportFilename, 14, 22);
    doc.setFontSize(10);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 30);

    const headers = columns.map((c) => c.label);
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = c.accessor ? (typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor]) : '';
        return String(val || '');
      })
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(`${exportFilename}.pdf`);
    showToast.success('PDF exported successfully');
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selected.length > 0) {
      onBulkDelete(selected);
      setSelected([]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          {onSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Filter */}
          {filterOptions.length > 0 && onFilter && (
            <select
              value={filterValue}
              onChange={(e) => onFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk actions */}
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selected.length} selected</span>
                {onBulkDelete && (
                  <button onClick={() => setShowBulkDeleteConfirm(true)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    Delete Selected
                  </button>
                )}
              </div>
            )}

            {/* Export */}
            <button onClick={exportCSV}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSV
            </button>
            <button onClick={exportPDF}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              PDF
            </button>
            {actions}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {(onBulkDelete || onBulkUpdate) && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <svg className={`w-3 h-3 ${sortOrder === 'DESC' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onBulkDelete ? 1 : 0) + (onEdit || onDelete ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selected.includes(row.id) ? 'bg-primary-50' : ''}`}
                >
                  {(onBulkDelete || onBulkUpdate) && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => handleDeleteClick(e, row)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selected.length} selected items? This action cannot be undone.`}
        confirmText={`Delete ${selected.length} Items`}
        variant="danger"
      />
    </div>
  );
}

export default DataTable;
