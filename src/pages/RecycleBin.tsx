import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { ResponsiveDocumentWrapper } from '../components/ui/ResponsiveDocumentWrapper';
import { calculateTotals } from '../utils/calculations';
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
  Coins,
  Eye,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatting';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const RecycleBin = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<RecycleBinItem | null>(null);

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

  return (
    <MainLayout title="Recycle Bin">
      <div className="space-y-6">
        
        {/* Recycle Bin Items Table Container */}
        <div className="bg-white rounded-3xl border border-[#f1f3f9] shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading deleted items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">No items found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Deleted documents and expenses will appear here, and are kept for up to 30 days.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
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
                const typeColor = isDoc ? 'bg-blue-50 text-blue-600 border-blue-100/30' : 'bg-rose-50 text-rose-600 border-rose-100/30';

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedPreviewItem(item)}
                    className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs hover:border-slate-300/80 transition-all cursor-pointer hover:bg-slate-50"
                  >
                    <div>
                      {/* Badge and Amount */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${typeColor}`}>
                          {item.type}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrency(amount, currencySymbol)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex items-start gap-3 mt-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDoc ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 text-xs truncate" title={label}>{label}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{subLabel}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[10px]">
                      <div className="text-slate-400 font-semibold">
                        <span className="block text-[9px] uppercase tracking-wide font-bold text-slate-400/80">Deleted At</span>
                        <span className="text-slate-600 font-bold">{formatDate(item.deletedAt)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] uppercase tracking-wide font-bold text-slate-400/80">Expires In</span>
                        <span className={`font-bold ${daysRemaining <= 5 ? 'text-rose-500' : 'text-slate-655'}`}>
                          {daysRemaining} days
                        </span>
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItemId(item.id);
                      }}
                      className="mt-3.5 w-full py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-650 text-[10px] font-extrabold rounded-xl border border-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                );
              })}
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

        {/* Selected Bill / Document Preview Modal */}
        {selectedPreviewItem && selectedPreviewItem.type === 'document' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Document Preview - {selectedPreviewItem.originalData.documentNumber}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPreviewItem(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex justify-center items-start">
                <ResponsiveDocumentWrapper isInvoice={selectedPreviewItem.originalData.documentType === 'invoice' || !selectedPreviewItem.originalData.documentType}>
                  <TemplateWrapper
                    templateName={selectedPreviewItem.originalData.template || activeCompany?.selectedTemplate}
                    company={activeCompany}
                    customer={selectedPreviewItem.originalData.customer}
                    items={selectedPreviewItem.originalData.items || []}
                    totals={selectedPreviewItem.originalData.totals || calculateTotals(selectedPreviewItem.originalData.items || [], selectedPreviewItem.originalData.discount)}
                    document={selectedPreviewItem.originalData}
                  />
                </ResponsiveDocumentWrapper>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedPreviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Expense / Bill Receipt Preview Modal */}
        {selectedPreviewItem && selectedPreviewItem.type === 'expense' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* Paper cutout effect */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500"></div>
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-rose-500" />
                  <span>Expense Receipt</span>
                </h3>
                <button
                  onClick={() => setSelectedPreviewItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-6 flex-1 overflow-y-auto space-y-5 font-sans">
                {/* Visual bill slip */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 relative">
                  {/* Decorative receipt notches */}
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-slate-200/50 rounded-full"></div>
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-slate-200/50 rounded-full"></div>

                  <div className="text-center pb-4 border-b border-slate-200/50 border-dashed">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Paid</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {formatCurrency(selectedPreviewItem.originalData.amount, currencySymbol)}
                    </p>
                  </div>

                  <div className="pt-4 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Particulars</span>
                      <span className="font-bold text-slate-800">{selectedPreviewItem.originalData.particulars}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Category</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedPreviewItem.originalData.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Date</span>
                      <span className="font-bold text-slate-800">{formatDate(selectedPreviewItem.originalData.date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Reference No</span>
                      <span className="font-bold text-slate-800">{selectedPreviewItem.originalData.referenceNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">Payment Mode</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedPreviewItem.originalData.paymentMethod || 'Cash'}</span>
                    </div>
                  </div>
                </div>

                {selectedPreviewItem.originalData.notes && (
                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Description</p>
                    <p className="text-xs font-semibold text-slate-655 leading-relaxed">
                      {selectedPreviewItem.originalData.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPreviewItem(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
