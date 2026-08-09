import React, { useState, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatting';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { 
  FileText, 
  Search, 
  PlusCircle, 
  Copy, 
  Download, 
  Trash2, 
  Edit3, 
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Documents = () => {
  const { activeCompany } = useCompany();
  const { documents, removeDoc, duplicateDoc } = useDocument();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [typeFilter, setTypeFilter] = useState('all'); // all | invoice | voucher | receipt
  const [statusFilter, setStatusFilter] = useState('all'); // all | Paid | Pending | Overdue | Draft
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | highest | lowest

  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const pdfRef = useRef(null);

  const filteredDocs = useMemo(() => {
    let result = [...documents];

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(d => d.documentType === typeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => {
        const docNum = (d.documentNumber || '').toLowerCase();
        const partyName = (d.customer?.customerName || d.paidTo || d.receivedFrom || '').toLowerCase();
        const statusStr = (d.status || '').toLowerCase();
        return docNum.includes(q) || partyName.includes(q) || statusStr.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      const amtA = a.totals?.grandTotal || parseFloat(a.amount) || 0;
      const amtB = b.totals?.grandTotal || parseFloat(b.amount) || 0;
      const dateA = new Date(a.documentDate || a.createdAt).getTime();
      const dateB = new Date(b.documentDate || b.createdAt).getTime();

      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'highest') return amtB - amtA;
      if (sortBy === 'lowest') return amtA - amtB;
      return 0;
    });

    return result;
  }, [documents, typeFilter, statusFilter, searchQuery, sortBy]);

  const handleDownload = async (doc) => {
    setPdfRenderDoc(doc);
    showToast('Generating PDF document...', 'info');
    setTimeout(async () => {
      try {
        if (pdfRef.current) {
          const prefix = doc.documentNumber || 'Doc';
          const name = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'Client';
          const orientation = doc.documentType === 'invoice' || !doc.documentType ? 'portrait' : 'landscape';
          await downloadDocumentPDF(pdfRef.current, `${prefix}-${name.replace(/\s+/g, '_')}`, orientation);
          showToast('PDF downloaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to download PDF.', 'error');
      } finally {
        setPdfRenderDoc(null);
      }
    }, 300);
  };

  const handleDuplicate = async (id) => {
    try {
      const dup = await duplicateDoc(id);
      if (dup) {
        showToast(`Duplicated as ${dup.documentNumber}`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to duplicate document.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document permanently?')) {
      await removeDoc(id);
      showToast('Document deleted.', 'info');
    }
  };

  return (
    <MainLayout title="Documents">
      <div className="space-y-6">
        {/* Header & New Document Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Document History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage, filter, duplicate, and export all invoices, vouchers, and receipts.</p>
          </div>

          <Button icon={PlusCircle} onClick={() => navigate('/documents/new')}>
            Create Document
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              icon={Search}
              placeholder="Search doc #, customer, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types (Invoices, Vouchers, Receipts)</option>
              <option value="invoice">Invoices Only</option>
              <option value="voucher">Vouchers Only</option>
              <option value="receipt">Receipts Only</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </Select>

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest">Sort: Highest Amount</option>
              <option value="lowest">Sort: Lowest Amount</option>
            </Select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No documents found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {documents.length === 0
                  ? 'Create your first invoice, voucher or receipt to build your document history.'
                  : 'No documents match your selected filters. Try clearing your search.'}
              </p>
              {documents.length === 0 && (
                <Button icon={PlusCircle} onClick={() => navigate('/documents/new')}>
                  Create First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Doc #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer / Party</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const partyName = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'N/A';
                    const amount = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
                    const isInvoice = doc.documentType === 'invoice';
                    const isVoucher = doc.documentType === 'voucher';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {doc.documentNumber}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={isInvoice ? 'invoice' : isVoucher ? 'voucher' : 'receipt'}>
                            {doc.documentType ? doc.documentType.toUpperCase() : 'INVOICE'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{partyName}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(doc.documentDate)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(amount, activeCompany?.currency?.split(' ')[1] || '₹')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={doc.status === 'Paid' ? 'success' : doc.status === 'Draft' ? 'default' : 'warning'}>
                            {doc.status || 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/documents/${doc.id}`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit Document"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(doc.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                              title="Duplicate Document"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Hidden Render Container for PDF Download */}
        {pdfRenderDoc && (
          <div className="fixed -left-[9999px] top-0">
            <div ref={pdfRef}>
              <TemplateWrapper
                templateName={pdfRenderDoc.template || activeCompany?.selectedTemplate}
                company={activeCompany}
                customer={pdfRenderDoc.customer}
                items={pdfRenderDoc.items || []}
                totals={pdfRenderDoc.totals || calculateTotals(pdfRenderDoc.items || [], pdfRenderDoc.discount)}
                document={pdfRenderDoc}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
