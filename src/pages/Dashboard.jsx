import React, { useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatting';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { InvoiceChart } from '../components/dashboard/InvoiceChart';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Download, 
  Trash2, 
  Eye, 
  ChevronRight,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Dashboard = () => {
  const { activeCompany } = useCompany();
  const { documents, removeDoc, duplicateDoc } = useDocument();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [pdfRenderDoc, setPdfRenderDoc] = React.useState(null);
  const pdfRef = React.useRef(null);

  const currencySymbol = useMemo(() => {
    return activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
  }, [activeCompany]);

  // Time based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  }, []);

  // Calculate real metrics
  const metrics = useMemo(() => {
    const totalDocs = documents.length;
    let totalInvoiced = 0;
    let thisMonthTotal = 0;
    let pendingTotal = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    documents.forEach(doc => {
      const grandTotal = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
      totalInvoiced += grandTotal;

      const dDate = new Date(doc.documentDate || doc.createdAt);
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) {
        thisMonthTotal += grandTotal;
      }

      if (doc.status === 'Pending' || doc.status === 'Draft') {
        pendingTotal += grandTotal;
      }
    });

    return {
      totalDocs,
      totalInvoiced,
      thisMonthTotal,
      pendingTotal
    };
  }, [documents]);

  const recentDocs = useMemo(() => {
    return documents.slice(0, 5);
  }, [documents]);

  const handleDownload = async (doc) => {
    setPdfRenderDoc(doc);
    showToast('Preparing PDF download...', 'info');
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
        showToast('Failed to generate PDF.', 'error');
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
    if (window.confirm('Are you sure you want to delete this document?')) {
      await removeDoc(id);
      showToast('Document deleted.', 'info');
    }
  };

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6 font-sans">
        {/* Welcome Section Header */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{greeting}, {activeCompany?.companyName || 'Business Owner'}</span>
              <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Create and manage your business invoices, vouchers, and receipts easily.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/documents/new?type=invoice')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Invoice</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

        {/* Quick Action Cards (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Create Invoice */}
          <div
            onClick={() => navigate('/documents/new?type=invoice')}
            className="bg-white border border-slate-200/80 hover:border-blue-300 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Invoice</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Issue GST invoices to customers with itemized tax breakdowns.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </div>

          {/* Create Voucher */}
          <div
            onClick={() => navigate('/documents/new?type=voucher')}
            className="bg-white border border-slate-200/80 hover:border-purple-300 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Voucher</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Record payment, receipt, or expense vouchers for accounts.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </div>

          {/* Create Receipt */}
          <div
            onClick={() => navigate('/documents/new?type=receipt')}
            className="bg-white border border-slate-200/80 hover:border-emerald-300 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Receipt</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Generate payment confirmation receipts with words conversion.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </div>
        </div>

        {/* Dashboard Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-500">Total Documents</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{metrics.totalDocs}</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <span>+0%</span> <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-500">Total Invoiced</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(metrics.totalInvoiced, currencySymbol)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <span>+0%</span> <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-500">This Month</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(metrics.thisMonthTotal, currencySymbol)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <span>+0%</span> <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-500">Pending Amount</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(metrics.pendingTotal, currencySymbol)}
              </p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <span>+0%</span> <span className="text-slate-400 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle Section: Chart & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Dual Bar Chart */}
          <div className="lg:col-span-2">
            <InvoiceChart documents={documents} currencySymbol={currencySymbol} />
          </div>

          {/* Right 1 Col: Recent Documents List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Recent Documents</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                View All
              </button>
            </div>

            {recentDocs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent documents found
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDocs.map((doc) => {
                  const isInvoice = doc.documentType === 'invoice';
                  const isVoucher = doc.documentType === 'voucher';
                  const partyName = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'N/A';
                  const amount = doc.totals?.grandTotal || doc.amount || 0;
                  const isPaid = doc.status === 'Paid';

                  return (
                    <div key={doc.id} className="py-3.5 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isInvoice ? 'bg-blue-50 text-blue-600' : isVoucher ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {isInvoice ? <FileText className="w-4 h-4" /> : isVoucher ? <CreditCard className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {isInvoice ? `Invoice ${doc.documentNumber}` : isVoucher ? `Voucher ${doc.documentNumber}` : `Receipt ${doc.documentNumber}`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{partyName}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs text-slate-900">{formatCurrency(amount, currencySymbol)}</p>
                        <div className="mt-1 flex justify-end">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPaid ? 'bg-emerald-100/80 text-emerald-700' : 'bg-rose-100/80 text-rose-700'
                          }`}>
                            {doc.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Recent Invoices Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Recent Invoices</h3>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              View All Invoices
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No invoices created yet. Click "Create Invoice" above to issue your first invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6">Invoice Number</th>
                    <th className="py-3.5 px-6">Company</th>
                    <th className="py-3.5 px-6">Invoice Date</th>
                    <th className="py-3.5 px-6">Due Date</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Total Amount</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDocs.map((doc) => {
                    const partyName = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'Client';
                    const amount = doc.totals?.grandTotal || doc.amount || 0;
                    const isPaid = doc.status === 'Paid';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors font-medium">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {doc.documentNumber}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{partyName}</td>
                        <td className="py-4 px-6 text-slate-500">{formatDate(doc.documentDate)}</td>
                        <td className="py-4 px-6 text-slate-500">{formatDate(doc.dueDate || doc.documentDate)}</td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            isPaid ? 'bg-emerald-100/80 text-emerald-700' : 'bg-rose-100/80 text-rose-700'
                          }`}>
                            {doc.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                          {formatCurrency(amount, currencySymbol)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            <button
                              onClick={() => navigate(`/documents/${doc.id}`)}
                              className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit / View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <MoreVertical className="w-4 h-4" />
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
          <div style={{ position: 'absolute', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
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
