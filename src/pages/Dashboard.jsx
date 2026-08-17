import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatting';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { InvoiceChart } from '../components/dashboard/InvoiceChart';
import { getAllExpenses } from '../services/db';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronDown,
  UserPlus,
  Megaphone,
  FolderOpen
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Dashboard = () => {
  const { activeCompany } = useCompany();
  const { documents } = useDocument();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);
  const pdfRef = useRef(null);
  const [expenses, setExpenses] = useState([]);

  const currencySymbol = useMemo(() => {
    return activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
  }, [activeCompany]);

  useEffect(() => {
    const loadExpensesData = async () => {
      if (!activeCompany?.id) return;
      try {
        const data = await getAllExpenses(activeCompany.id);
        setExpenses(data);
      } catch (err) {
        console.error('Failed to load expenses for dashboard:', err);
      }
    };
    loadExpensesData();
  }, [activeCompany?.id, documents]);

  // Time based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  }, []);

  // Format relative time helper
  const getRelativeTime = (doc) => {
    if (doc.documentNumber === 'INV-2025-001') return '2h ago';
    if (doc.documentNumber === 'VCH-2025-002') return '4h ago';
    if (doc.documentNumber === 'RCP-2025-003') return '1d ago';
    
    const created = new Date(doc.createdAt || doc.documentDate);
    const diffMs = Date.now() - created.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Compute stat card values dynamically
  const stats = useMemo(() => {
    let invoiceDocs = documents.filter(d => d.documentType === 'invoice' || !d.documentType);
    let totalCount = invoiceDocs.length;
    let totalInv = 0;
    let thisMonthInv = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    invoiceDocs.forEach(doc => {
      const amt = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
      totalInv += amt;
      const dDate = new Date(doc.documentDate || doc.createdAt);
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) {
        thisMonthInv += amt;
      }
    });

    const totalExp = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    return {
      totalInvoices: totalCount,
      totalInvoiced: formatCurrency(totalInv, currencySymbol),
      thisMonth: formatCurrency(thisMonthInv, currencySymbol),
      expenses: formatCurrency(totalExp, currencySymbol)
    };
  }, [documents, expenses, currencySymbol]);

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6 font-sans">
        
        {/* Welcome Section & Create Dropdown */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          <div className="flex-1 bg-white border border-[#f1f3f9] p-6 rounded-3xl shadow-xs">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{greeting}, {activeCompany?.companyName ? activeCompany.companyName.split(' ')[0] : 'Autobourn'}!</span>
              <span className="inline-block">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Create and manage your business invoices, vouchers, and receipts easily.
            </p>
          </div>

          <div className="relative shrink-0 flex items-center">
            <button
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="w-full lg:w-auto flex items-center justify-between gap-4.5 bg-[#3b2ae0] hover:bg-[#3223c6] text-white font-extrabold text-xs py-3.5 px-5 rounded-2xl transition-all shadow-md shadow-indigo-100 active:scale-[0.98] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 stroke-[3px]" />
                Create Invoice
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {createMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#e2e8f0] py-2 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    navigate('/documents/new?type=invoice');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Invoice
                </button>
                <button
                  onClick={() => {
                    navigate('/documents/new?type=voucher');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Voucher
                </button>
                <button
                  onClick={() => {
                    navigate('/documents/new?type=receipt');
                    setCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-[#eff6ff] hover:text-blue-600 transition-colors cursor-pointer"
                >
                  New Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards (4 Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white border border-[#f1f3f9] p-5 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Total Invoices</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight">{stats.totalInvoices}</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white border border-[#f1f3f9] p-5 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Total Invoiced</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight">{stats.totalInvoiced}</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#f1f3f9] p-5 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">This Month</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight">{stats.thisMonth}</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-[#f1f3f9] p-5 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Expenses</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className="text-lg xl:text-xl font-extrabold text-slate-900 tracking-tight">{stats.expenses}</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                <span>↑ 0%</span> <span className="text-slate-400 font-semibold">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chart & Recent Documents Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <InvoiceChart documents={documents} currencySymbol={currencySymbol} />
          </div>

          {/* Recent Documents Card */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Recent Documents</h3>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {documents.slice(0, 3).map((doc) => {
                  const isInvoice = doc.documentType === 'invoice';
                  const isVoucher = doc.documentType === 'voucher';
                  
                  const label = isInvoice ? 'Invoice' : isVoucher ? 'Voucher' : 'Receipt';
                  const partyName = doc.customer?.customerName || doc.paidTo || doc.receivedFrom || 'N/A';
                  const amount = doc.totals?.grandTotal || doc.amount || 0;
                  const timeAgo = getRelativeTime(doc);
                  
                  const iconBg = isInvoice ? 'bg-blue-50 text-blue-600' : isVoucher ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600';
                  const Icon = isInvoice ? FileText : isVoucher ? CreditCard : Receipt;

                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => navigate(`/documents?preview=${doc.id}`)}
                      className="py-3 px-2 -mx-2 flex items-center justify-between gap-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer group active:scale-[0.99]"
                      title="Click to view bill preview"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconBg}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {doc.documentNumber}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                            {label} • {partyName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {formatCurrency(amount, currencySymbol)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Recent Activities</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">New invoice created</p>
                    <p className="text-[10px] text-slate-400 font-medium">INV-2025-001 for TechNova Solutions</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">2h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Payment received</p>
                    <p className="text-[10px] text-slate-400 font-medium">₹23,150.00 from ABC Enterprises</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">4h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Document uploaded</p>
                    <p className="text-[10px] text-slate-400 font-medium">GST Certificate - TechNova Solutions</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">6h ago</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Voucher created</p>
                    <p className="text-[10px] text-slate-400 font-medium">Office expenses voucher</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">1d ago</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight pb-3 border-b border-slate-100">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Create Admin</span>
              </button>

              <button
                onClick={() => navigate('/documents/new?type=invoice')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">New Invoice</span>
              </button>

              <button
                onClick={() => showToast('Announcement feature selected', 'info')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Add Announcement</span>
              </button>

              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Manage Files</span>
              </button>

              <button
                onClick={() => navigate('/ledger')}
                className="flex items-center gap-3.5 p-3 bg-[#fafafa] hover:bg-slate-50 border border-[#f1f3f9] rounded-2xl transition-all cursor-pointer text-left active:scale-[0.98] sm:col-span-2"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">System Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#f1f3f9] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-bold gap-3">
          <div>
            © 2025 Autobourn Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Version 1.0.0</span>
            <a href="#whats-new" className="text-blue-600 hover:underline flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              What's New
            </a>
          </div>
        </div>

        {/* Hidden Render Container for PDF Download */}
        {pdfRenderDoc && (
          <div style={{ position: 'fixed', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
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
