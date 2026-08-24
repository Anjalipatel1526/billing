import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { 
  getRecycleBinItems, 
  restoreFromRecycleBin, 
  deletePermanently,
  RecycleBinItem
} from '../services/db';
import { 
  Trash2, 
  RotateCcw, 
  FileText, 
  AlertCircle, 
  Search,
  RefreshCw,
  Coins
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatting';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const RecycleBin = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await getRecycleBinItems(activeCompany.id);
      setItems(data);
    } catch (e) {
      console.error('Error loading recycle bin items:', e);
      showToast('Failed to load recycle bin items', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCompany, showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleRestore = async (id: string) => {
    try {
      await restoreFromRecycleBin(id);
      showToast('Item restored successfully', 'success');
      loadItems();
    } catch (e) {
      console.error('Error restoring item:', e);
      showToast('Failed to restore item', 'error');
    }
  };

  const handleDeletePermanently = async () => {
    if (!deleteItemId) return;
    try {
      await deletePermanently(deleteItemId);
      showToast('Item permanently deleted', 'success');
      setDeleteItemId(null);
      loadItems();
    } catch (e) {
      console.error('Error deleting item permanently:', e);
      showToast('Failed to delete item', 'error');
    }
  };

  const getDaysRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const expiryDate = new Date(deletedAt.getTime());
    expiryDate.setDate(expiryDate.getDate() + 30);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const currencySymbol = activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';

  const filteredItems = items.filter(item => {
    const label = item.type === 'document' 
      ? (item.originalData?.documentNumber || item.originalData?.customerName || '')
      : (item.originalData?.particulars || item.originalData?.category || '');
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const docCount = items.filter(i => i.type === 'document').length;
  const expenseCount = items.filter(i => i.type === 'expense').length;

  return (
    <MainLayout title="Recycle Bin">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Recycle Bin</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Items deleted are kept here for up to 30 days before being permanently deleted.</p>
          </div>
          <button
            onClick={loadItems}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{items.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{docCount}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{expenseCount}</h3>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white rounded-3xl border border-[#f1f3f9] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search deleted items..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading deleted items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">No items found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Deleted documents and expenses will appear here, and are kept for up to 30 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6">Item details</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Deleted At</th>
                    <th className="py-3.5 px-4">Auto-Delete In</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredItems.map((item) => {
                    const daysRemaining = getDaysRemaining(item.deletedAt);
                    const isDoc = item.type === 'document';
                    
                    // Extract details
                    const label = isDoc 
                      ? `${item.originalData?.documentType?.toUpperCase()} #${item.originalData?.documentNumber}`
                      : item.originalData?.particulars || 'Expense';
                    const subLabel = isDoc 
                      ? `Client: ${item.originalData?.customerName || 'General'}`
                      : `Category: ${item.originalData?.category || 'Office'}`;
                    const amount = isDoc 
                      ? item.originalData?.totals?.grandTotal || item.originalData?.amount || 0
                      : item.originalData?.amount || 0;

                    const Icon = isDoc ? FileText : Coins;
                    const typeColor = isDoc ? 'bg-blue-50 text-blue-600 border-blue-50/10' : 'bg-rose-50 text-rose-600 border-rose-50/10';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDoc ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-[13px]">{label}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{subLabel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase ${typeColor}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-semibold">
                          {formatDate(item.deletedAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className={`w-3.5 h-3.5 ${daysRemaining <= 5 ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`font-bold ${daysRemaining <= 5 ? 'text-amber-600' : 'text-slate-600'}`}>
                              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(amount, currencySymbol)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-50 transition-colors cursor-pointer"
                              title="Restore Item"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteItemId(item.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-50 transition-colors cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Permanent Delete Modal */}
        <ConfirmModal
          isOpen={deleteItemId !== null}
          title="Delete Permanently"
          message="Are you sure you want to permanently delete this item? This action is irreversible."
          confirmText="Permanently Delete"
          onConfirm={handleDeletePermanently}
          onClose={() => setDeleteItemId(null)}
          confirmVariant="danger"
        />

      </div>
    </MainLayout>
  );
};
