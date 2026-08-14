import React, { useState, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useDocument } from '../contexts/DocumentContext';
import { formatCurrency, formatDate } from '../utils/formatting';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { calculateTotals } from '../utils/calculations';
import { ResponsiveDocumentWrapper } from '../components/ui/ResponsiveDocumentWrapper';
import { 
  BookOpen, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  ExternalLink,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Ledger = () => {
  const { activeCompany } = useCompany();
  const { documents } = useDocument();
  const { showToast } = useToast();
  
  const printRef = useRef(null);
  const pdfRef = useRef(null);
  const advancePrintRef = useRef(null);

  // Filters state
  const [selectedParty, setSelectedParty] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Modal and PDF export state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [pdfRenderDoc, setPdfRenderDoc] = useState(null);

  // Extract unique customer/party names from all documents
  const parties = useMemo(() => {
    const names = new Set();
    documents.forEach(d => {
      const companySpecific = !d.companyId || !activeCompany?.id || d.companyId === activeCompany.id;
      if (companySpecific) {
        const name = d.customer?.customerName || d.paidTo || d.receivedFrom;
        if (name && name.trim()) {
          names.add(name.trim());
        }
      }
    });
    return Array.from(names).sort();
  }, [documents, activeCompany]);

  // Compute ledger entries
  const ledgerData = useMemo(() => {
    // 1. Filter documents by company, date, and party
    const activeDocs = documents.filter(d => {
      const companySpecific = !d.companyId || !activeCompany?.id || d.companyId === activeCompany.id;
      if (!companySpecific) return false;

      // Date check
      const docDate = d.documentDate || d.createdAt?.slice(0, 10);
      if (docDate < startDate || docDate > endDate) return false;

      // Party check
      if (selectedParty !== 'all') {
        const name = d.customer?.customerName || d.paidTo || d.receivedFrom;
        if (name?.trim() !== selectedParty) return false;
      }

      return true;
    });

    // 2. Sort ascending by date to calculate running balance
    activeDocs.sort((a, b) => {
      const dateA = a.documentDate || a.createdAt;
      const dateB = b.documentDate || b.createdAt;
      return dateA.localeCompare(dateB);
    });

    // 3. Map into ledger entries and compute running balance
    let runningBalance = 0;
    const entries = activeDocs.map(d => {
      const type = d.documentType || 'invoice';
      const number = d.documentNumber;
      const party = d.customer?.customerName || d.paidTo || d.receivedFrom || 'N/A';
      
      let debit = 0;
      let credit = 0;

      if (type === 'invoice') {
        debit = d.totals?.grandTotal || parseFloat(d.amount) || 0;
      } else if (type === 'voucher') {
        // Payment voucher is an outflow (debit), receipt voucher is an inflow (credit)
        if (d.voucherType === 'Payment Voucher' || d.voucherType === 'Expense Voucher') {
          debit = parseFloat(d.amount) || 0;
        } else {
          credit = parseFloat(d.amount) || 0;
        }
      } else if (type === 'receipt') {
        credit = parseFloat(d.amount) || 0;
      }

      runningBalance += (debit - credit);

      const previewUrl = `${window.location.origin}/preview/${d.id}`;

      return {
        id: d.id,
        date: d.documentDate || d.createdAt?.slice(0, 10),
        number,
        type,
        particulars: `${type.toUpperCase()} - ${party} ${d.description ? `(${d.description})` : ''}`,
        debit,
        credit,
        balance: runningBalance,
        previewUrl
      };
    });

    // Totals calculations
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      entries,
      totalDebit,
      totalCredit,
      finalBalance: runningBalance
    };
  }, [documents, activeCompany, selectedParty, startDate, endDate]);

  const advanceAnalytics = useMemo(() => {
    const entries = ledgerData.entries;
    const invoiceVolume = entries.filter(e => e.type === 'invoice').reduce((sum, e) => sum + e.debit, 0);
    const voucherVolume = entries.filter(e => e.type === 'voucher').reduce((sum, e) => sum + e.debit + e.credit, 0);
    const receiptVolume = entries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + e.credit, 0);
    const totalVolume = invoiceVolume + voucherVolume + receiptVolume;

    const invoiceCount = entries.filter(e => e.type === 'invoice').length;
    const voucherCount = entries.filter(e => e.type === 'voucher').length;
    const receiptCount = entries.filter(e => e.type === 'receipt').length;

    const maxDebit = entries.reduce((max, e) => Math.max(max, e.debit), 0);
    const maxCredit = entries.reduce((max, e) => Math.max(max, e.credit), 0);
    const avgTransaction = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.debit + e.credit, 0) / entries.length
      : 0;

    let barData = [];
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length <= 6) {
        barData = sorted.map(e => ({
          label: formatDate(e.date).slice(0, 6),
          debit: e.debit,
          credit: e.credit
        }));
      } else {
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        const step = (endMs - startMs) / 5;
        const intervals = Array.from({ length: 5 }, (_, i) => {
          const from = startMs + i * step;
          const to = from + step;
          const dateObj = new Date(from);
          const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            from,
            to,
            label,
            debit: 0,
            credit: 0
          };
        });
        sorted.forEach(e => {
          const time = new Date(e.date).getTime();
          const interval = intervals.find(inv => time >= inv.from && time <= inv.to) || intervals[intervals.length - 1];
          interval.debit += e.debit;
          interval.credit += e.credit;
        });
        barData = intervals;
      }
    }

    return {
      invoiceVolume,
      voucherVolume,
      receiptVolume,
      totalVolume,
      invoiceCount,
      voucherCount,
      receiptCount,
      maxDebit,
      maxCredit,
      avgTransaction,
      barData
    };
  }, [ledgerData, startDate, endDate]);

  const currencySymbol = activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    if (ledgerData.entries.length === 0) {
      showToast('No ledger data available to export.', 'warning');
      return;
    }

    try {
      const headers = ['Date', 'Document Type', 'Document Number', 'Particulars', `Debit (${currencySymbol})`, `Credit (${currencySymbol})`, `Balance (${currencySymbol})`, 'Bill Preview Link'];
      
      const csvRows = [headers.join(',')];
      
      ledgerData.entries.forEach(e => {
        const row = [
          e.date,
          e.type.toUpperCase(),
          e.number,
          `"${e.particulars.replace(/"/g, '""')}"`,
          e.debit.toFixed(2),
          e.credit.toFixed(2),
          e.balance.toFixed(2),
          `"=HYPERLINK(""${e.previewUrl}"",""Preview Bill"")"`
        ];
        csvRows.push(row.join(','));
      });

      // Add totals row
      const summaryRow = [
        'TOTALS',
        '',
        '',
        '',
        ledgerData.totalDebit.toFixed(2),
        ledgerData.totalCredit.toFixed(2),
        ledgerData.finalBalance.toFixed(2),
        ''
      ];
      csvRows.push(summaryRow.join(','));

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const partyStr = selectedParty === 'all' ? 'All_Parties' : selectedParty.replace(/\s+/g, '_');
      link.setAttribute('download', `Ledger_${partyStr}_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Excel CSV exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Excel CSV.', 'error');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (ledgerData.entries.length === 0) {
      showToast('No ledger data available to export.', 'warning');
      return;
    }

    showToast('Generating Ledger PDF report...', 'info');
    setTimeout(async () => {
      try {
        if (printRef.current) {
          const partyStr = selectedParty === 'all' ? 'All_Parties' : selectedParty.replace(/\s+/g, '_');
          await downloadDocumentPDF(printRef.current, `Ledger_${partyStr}_${startDate}_to_${endDate}`, 'portrait');
          showToast('Ledger PDF downloaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to export PDF.', 'error');
      }
    }, 300);
  };

  const handleExportAdvancePDF = async () => {
    if (ledgerData.entries.length === 0) {
      showToast('No ledger data available to export.', 'warning');
      return;
    }

    showToast('Generating Advance Financial Report...', 'info');
    setTimeout(async () => {
      try {
        if (advancePrintRef.current) {
          const partyStr = selectedParty === 'all' ? 'All_Parties' : selectedParty.replace(/\s+/g, '_');
          await downloadDocumentPDF(advancePrintRef.current, `Advance_Ledger_${partyStr}_${startDate}_to_${endDate}`, 'portrait');
          showToast('Advance Report PDF downloaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to export Advance PDF.', 'error');
      }
    }, 300);
  };

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

  const watermarkImage = activeCompany?.watermarkLogo || activeCompany?.logo;

  return (
    <MainLayout title="General Ledger">
      <div className="space-y-6">
        
        {/* Page Header and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">General Ledger</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Track account statements, transaction flows, and running balances.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Download} onClick={handleExportCSV}>
              Export Excel
            </Button>
            <Button variant="outline" icon={Download} onClick={handleExportPDF}>
              Export PDF
            </Button>
            <Button icon={BookOpen} onClick={handleExportAdvancePDF}>
              Advance Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Party Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Select Party / Customer
              </label>
              <Select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
              >
                <option value="all">All Parties & Customers</option>
                {parties.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Debits Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Debits (+)</p>
              <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                {formatCurrency(ledgerData.totalDebit, currencySymbol)}
              </h3>
            </div>
          </div>

          {/* Credits Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Credits (-)</p>
              <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                {formatCurrency(ledgerData.totalCredit, currencySymbol)}
              </h3>
            </div>
          </div>

          {/* Net Balance Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#f1f3f9] shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Balance</p>
              <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                {formatCurrency(ledgerData.finalBalance, currencySymbol)}
              </h3>
            </div>
          </div>

        </div>

        {/* Ledger Grid View */}
        <div className="bg-white border border-[#f1f3f9] rounded-3xl shadow-xs overflow-hidden">
          {ledgerData.entries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No transaction entries found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting the filter date ranges or party name.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4">Doc Type / No.</th>
                    <th className="py-3 px-4 text-right">Debit (+)</th>
                    <th className="py-3 px-4 text-right">Credit (-)</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Bill Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {ledgerData.entries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{formatDate(row.date)}</td>
                      <td className="py-3 px-4 text-slate-800 font-semibold max-w-[200px] truncate">{row.particulars}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-600 font-semibold uppercase">{row.number}</span>
                        <Badge variant={row.type === 'invoice' ? 'invoice' : row.type === 'voucher' ? 'voucher' : 'receipt'} className="ml-1.5 py-0 px-1 text-[8px]">
                          {row.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">
                        {row.debit > 0 ? formatCurrency(row.debit, currencySymbol) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {row.credit > 0 ? formatCurrency(row.credit, currencySymbol) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(row.balance, currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const doc = documents.find(d => d.id === row.id);
                            if (doc) {
                              setPreviewDoc(doc);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          View Bill
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Modal for Document Preview */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Document Preview - {previewDoc.documentNumber}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button icon={Download} onClick={() => handleDownload(previewDoc)}>
                    Download PDF
                  </Button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex justify-center items-start">
                <ResponsiveDocumentWrapper isInvoice={previewDoc.documentType === 'invoice' || !previewDoc.documentType}>
                  <TemplateWrapper
                    templateName={previewDoc.template || activeCompany?.selectedTemplate}
                    company={activeCompany}
                    customer={previewDoc.customer}
                    items={previewDoc.items || []}
                    totals={previewDoc.totals || calculateTotals(previewDoc.items || [], previewDoc.discount)}
                    document={previewDoc}
                  />
                </ResponsiveDocumentWrapper>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
                <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden PDF Printable Wrapper */}
        <div style={{ position: 'absolute', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
          <div ref={printRef} className="p-8 w-[210mm] min-h-[295mm] bg-white font-sans text-xs text-slate-800 space-y-6 relative overflow-hidden">
            
            {/* BACKGROUND WATERMARK */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              {watermarkImage ? (
                <img
                  src={watermarkImage}
                  alt="Company Watermark"
                  className="w-96 h-96 object-contain opacity-[0.08] grayscale contrast-200"
                />
              ) : (
                <span className="text-6xl font-black text-slate-900/5 tracking-widest uppercase rotate-[-30deg]">
                  {activeCompany?.companyName || 'UNAI BILLING'}
                </span>
              )}
            </div>

            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {activeCompany?.logo ? (
                  <img src={activeCompany.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                    {activeCompany?.companyName ? activeCompany.companyName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{activeCompany?.companyName || 'General Ledger'}</h1>
                  <p className="text-[9px] text-slate-500">{activeCompany?.address}</p>
                  <p className="text-[9px] text-slate-500">Phone: {activeCompany?.phone} | Email: {activeCompany?.email}</p>
                  {activeCompany?.gstNumber && <p className="text-[9px] text-slate-500 font-mono">GSTIN: {activeCompany.gstNumber}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-base font-black text-blue-600 uppercase tracking-wider">Statement of Account</h2>
                <p className="text-[9px] text-slate-500 font-bold mt-0.5">Report Type: Standard Statement</p>
                <p className="text-[9px] text-slate-500 font-bold">Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
                <p className="text-[8px] text-slate-400">Statement for: {selectedParty === 'all' ? 'All Customers & Vendors' : selectedParty}</p>
              </div>
            </div>

            {/* Account Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Debits</p>
                <p className="text-xs font-black text-blue-600 mt-0.5">{formatCurrency(ledgerData.totalDebit, currencySymbol)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Credits</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">{formatCurrency(ledgerData.totalCredit, currencySymbol)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Closing Balance</p>
                <p className="text-xs font-black text-slate-900 mt-0.5">{formatCurrency(ledgerData.finalBalance, currencySymbol)}</p>
              </div>
            </div>

            {/* Print Table */}
            <table className="w-full text-left border-collapse text-[10px] relative z-10">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[8px]">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Particulars</th>
                  <th className="py-2 px-3">Doc #</th>
                  <th className="py-2 px-3 text-right">Debit (+)</th>
                  <th className="py-2 px-3 text-right">Credit (-)</th>
                  <th className="py-2 px-3 text-right">Balance</th>
                  <th className="py-2 px-3 text-center">Bill Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {ledgerData.entries.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-slate-500">{formatDate(row.date)}</td>
                    <td className="py-2 px-3 text-slate-800 max-w-[180px] truncate">{row.particulars}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 uppercase">{row.number}</td>
                    <td className="py-2 px-3 text-right text-blue-600 font-semibold">{row.debit > 0 ? formatCurrency(row.debit, currencySymbol) : '-'}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{row.credit > 0 ? formatCurrency(row.credit, currencySymbol) : '-'}</td>
                    <td className="py-2 px-3 text-right text-slate-900 font-black">{formatCurrency(row.balance, currencySymbol)}</td>
                    <td className="py-2 px-3 text-center">
                      <a 
                        href={row.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-bold text-blue-600 underline"
                      >
                        Preview Bill
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="pt-12 flex justify-between relative z-10">
              <div>
                <p className="text-[8px] text-slate-400">Report generated dynamically on: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right border-t border-slate-300 pt-2 pr-6">
                <p className="font-extrabold text-slate-900">{activeCompany?.companyName}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Authorized Signatory</p>
              </div>
            </div>

          </div>
        </div>

        {/* Hidden Advance PDF Printable Wrapper */}
        <div style={{ position: 'absolute', left: '-20000px', top: 0, opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -99999 }}>
          <div ref={advancePrintRef} id="printable-document" className="w-[210mm] bg-white font-sans text-slate-800">
            
            {/* PAGE 1: EXECUTIVE ANALYTICAL SUMMARY */}
            <div className="p-8 min-h-[295mm] flex flex-col justify-between relative overflow-hidden" style={{ pageBreakAfter: 'always' }}>
              {/* BACKGROUND WATERMARK */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                {watermarkImage ? (
                  <img
                    src={watermarkImage}
                    alt="Company Watermark"
                    className="w-96 h-96 object-contain opacity-[0.08] grayscale contrast-200"
                  />
                ) : (
                  <span className="text-6xl font-black text-slate-900/5 tracking-widest uppercase rotate-[-30deg]">
                    {activeCompany?.companyName || 'UNAI BILLING'}
                  </span>
                )}
              </div>
              <div className="space-y-6 relative z-10">
                
                {/* Bank Statement Style Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    {activeCompany?.logo ? (
                      <img src={activeCompany.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border p-1" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                        {activeCompany?.companyName ? activeCompany.companyName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <div>
                      <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{activeCompany?.companyName || 'General Ledger'}</h1>
                      <p className="text-[9px] text-slate-500">{activeCompany?.address}</p>
                      <p className="text-[9px] text-slate-500">Phone: {activeCompany?.phone} | Email: {activeCompany?.email}</p>
                      {activeCompany?.gstNumber && <p className="text-[9px] text-slate-500 font-mono">GSTIN: {activeCompany.gstNumber}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base font-black text-blue-600 uppercase tracking-wider">Statement of Account</h2>
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5">Report Type: Advanced Analytical Report</p>
                    <p className="text-[9px] text-slate-500">Date Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Account Details & Summary Table */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Account Information</h3>
                    <div className="space-y-1 text-[9px] text-slate-600 font-medium">
                      <p><span className="text-slate-400">Statement For:</span> <span className="font-bold text-slate-800">{selectedParty === 'all' ? 'All Customers & Vendors' : selectedParty}</span></p>
                      <p><span className="text-slate-400">Statement Period:</span> <span className="font-bold text-slate-800">{formatDate(startDate)} to {formatDate(endDate)}</span></p>
                      <p><span className="text-slate-400">Currency:</span> <span className="font-bold text-slate-800">{activeCompany?.currency || 'INR (₹)'}</span></p>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Account Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold text-slate-600">
                      <div>
                        <p className="text-slate-400">Opening Balance</p>
                        <p className="text-slate-800 font-bold">{formatCurrency(0, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Deposits (-)</p>
                        <p className="text-emerald-600 font-bold">{formatCurrency(ledgerData.totalCredit, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total Withdrawals (+)</p>
                        <p className="text-blue-600 font-bold">{formatCurrency(ledgerData.totalDebit, currencySymbol)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Closing Balance</p>
                        <p className="text-slate-900 font-bold">{formatCurrency(ledgerData.finalBalance, currencySymbol)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytical Charts Row */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Pie / Donut Chart */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Transaction Composition</h4>
                      <p className="text-[8px] text-slate-400">Distribution of total volume by transaction category.</p>
                    </div>
                    <div className="flex items-center justify-around gap-2 my-1">
                      <svg width="100" height="100" viewBox="0 0 120 120" className="overflow-visible">
                        <circle cx="60" cy="60" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                        {advanceAnalytics.totalVolume > 0 ? (
                          <>
                            {/* Invoice slice */}
                            {advanceAnalytics.invoiceVolume > 0 && (
                              <circle 
                                cx="60" 
                                cy="60" 
                                r="40" 
                                fill="transparent" 
                                stroke="#2563eb" 
                                strokeWidth="12" 
                                strokeDasharray={`${(advanceAnalytics.totalVolume > 0 ? (advanceAnalytics.invoiceVolume / advanceAnalytics.totalVolume) * 251.3 : 0).toFixed(1)} 251.3`} 
                                strokeDashoffset="0" 
                                transform="rotate(-90 60 60)" 
                              />
                            )}
                            {/* Voucher slice */}
                            {advanceAnalytics.voucherVolume > 0 && (
                              <circle 
                                cx="60" 
                                cy="60" 
                                r="40" 
                                fill="transparent" 
                                stroke="#f59e0b" 
                                strokeWidth="12" 
                                strokeDasharray={`${(advanceAnalytics.totalVolume > 0 ? (advanceAnalytics.voucherVolume / advanceAnalytics.totalVolume) * 251.3 : 0).toFixed(1)} 251.3`} 
                                strokeDashoffset={-(advanceAnalytics.totalVolume > 0 ? (advanceAnalytics.invoiceVolume / advanceAnalytics.totalVolume) * 251.3 : 0)} 
                                transform="rotate(-90 60 60)" 
                              />
                            )}
                            {/* Receipt slice */}
                            {advanceAnalytics.receiptVolume > 0 && (
                              <circle 
                                cx="60" 
                                cy="60" 
                                r="40" 
                                fill="transparent" 
                                stroke="#10b981" 
                                strokeWidth="12" 
                                strokeDasharray={`${(advanceAnalytics.totalVolume > 0 ? (advanceAnalytics.receiptVolume / advanceAnalytics.totalVolume) * 251.3 : 0).toFixed(1)} 251.3`} 
                                strokeDashoffset={-(advanceAnalytics.totalVolume > 0 ? ((advanceAnalytics.invoiceVolume + advanceAnalytics.voucherVolume) / advanceAnalytics.totalVolume) * 251.3 : 0)} 
                                transform="rotate(-90 60 60)" 
                              />
                            )}
                          </>
                        ) : (
                          <circle cx="60" cy="60" r="40" fill="transparent" stroke="#cbd5e1" strokeWidth="12" />
                        )}
                        <g transform="translate(60,65)" textAnchor="middle">
                          <text fontSize="7" fontWeight="bold" fill="#94a3b8" y="-12">TOTAL VOL</text>
                          <text fontSize="8" fontWeight="black" fill="#1e293b" y="-2">
                            {advanceAnalytics.totalVolume > 100000 
                              ? `${currencySymbol}${(advanceAnalytics.totalVolume/100000).toFixed(1)}L` 
                              : `${currencySymbol}${(advanceAnalytics.totalVolume/1000).toFixed(0)}K`}
                          </text>
                        </g>
                      </svg>
                      
                      <div className="space-y-1.5 text-[8px] font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded bg-blue-600 inline-block" />
                          <span>Invoices: {advanceAnalytics.invoiceCount} ({advanceAnalytics.totalVolume > 0 ? ((advanceAnalytics.invoiceVolume / advanceAnalytics.totalVolume) * 100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded bg-amber-500 inline-block" />
                          <span>Vouchers: {advanceAnalytics.voucherCount} ({advanceAnalytics.totalVolume > 0 ? ((advanceAnalytics.voucherVolume / advanceAnalytics.totalVolume) * 100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
                          <span>Receipts: {advanceAnalytics.receiptCount} ({advanceAnalytics.totalVolume > 0 ? ((advanceAnalytics.receiptVolume / advanceAnalytics.totalVolume) * 100).toFixed(0) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart (Outflow vs Inflow) */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-3">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Debit vs Credit Flow</h4>
                      <p className="text-[8px] text-slate-400">Periodic distribution of debits (blue) and credits (green).</p>
                    </div>
                    
                    <div className="w-full flex justify-center mt-1">
                      <svg width="220" height="95" viewBox="0 0 240 120" className="overflow-visible">
                        <g stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2">
                          <line x1="25" y1="20" x2="235" y2="20" />
                          <line x1="25" y1="60" x2="235" y2="60" />
                          <line x1="25" y1="100" x2="235" y2="100" />
                        </g>

                        <g fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="end">
                          <text x="20" y="23">HIGH</text>
                          <text x="20" y="63">MID</text>
                          <text x="20" y="103">0</text>
                        </g>

                        <line x1="25" y1="100" x2="235" y2="100" stroke="#cbd5e1" strokeWidth="1" />

                        {advanceAnalytics.barData.map((d, idx) => {
                          const spacing = 200 / (advanceAnalytics.barData.length || 1);
                          const xCenter = 25 + idx * spacing + spacing / 2;
                          
                          const maxVal = Math.max(...advanceAnalytics.barData.map(item => Math.max(item.debit, item.credit)), 1000);
                          const hDebit = (d.debit / maxVal) * 75;
                          const hCredit = (d.credit / maxVal) * 75;

                          return (
                            <g key={idx}>
                              {hDebit > 0 && (
                                <rect x={xCenter - 7} y={100 - hDebit} width="6" height={hDebit} fill="#2563eb" rx="1.5" />
                              )}
                              {hCredit > 0 && (
                                <rect x={xCenter + 1} y={100 - hCredit} width="6" height={hCredit} fill="#10b981" rx="1.5" />
                              )}
                              <text x={xCenter} y="114" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">
                                {d.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Entry Analysis Report Details */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Entry Analysis & Metrics Report</h4>
                  <div className="grid grid-cols-3 gap-4 text-[9px] font-medium text-slate-600">
                    <div className="space-y-1 border-r border-slate-100 pr-2">
                      <p className="text-slate-400 font-bold uppercase text-[7px] tracking-wide">Average Ticket Size</p>
                      <p className="text-slate-800 font-black text-xs">{formatCurrency(advanceAnalytics.avgTransaction, currencySymbol)}</p>
                      <p className="text-[8px] text-slate-400">Mean value of all ledger posts combined.</p>
                    </div>
                    <div className="space-y-1 border-r border-slate-100 pr-2">
                      <p className="text-slate-400 font-bold uppercase text-[7px] tracking-wide">Max Outflow (Debit)</p>
                      <p className="text-blue-600 font-black text-xs">{formatCurrency(advanceAnalytics.maxDebit, currencySymbol)}</p>
                      <p className="text-[8px] text-slate-400">Highest individual debit entry recorded.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase text-[7px] tracking-wide">Max Inflow (Credit)</p>
                      <p className="text-emerald-600 font-black text-xs">{formatCurrency(advanceAnalytics.maxCredit, currencySymbol)}</p>
                      <p className="text-[8px] text-slate-400">Highest individual credit collection recorded.</p>
                    </div>
                  </div>
                </div>

                {/* Financial Health Assessment */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-1.5 text-[9px] text-slate-600 font-medium">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Executive Auditor Summary</h4>
                  <p>
                    This general ledger statement reports a total of <span className="font-bold text-slate-800">{ledgerData.entries.length} transactions</span> for the selected period from <span className="font-bold text-slate-800">{formatDate(startDate)}</span> to <span className="font-bold text-slate-800">{formatDate(endDate)}</span>. 
                    The account closed with a net balance of <span className="font-bold text-slate-800">{formatCurrency(ledgerData.finalBalance, currencySymbol)}</span>. 
                    {ledgerData.finalBalance > 0 ? (
                      <span> Inward billing outperforms outward collections, suggesting positive receivables accumulation.</span>
                    ) : ledgerData.finalBalance < 0 ? (
                      <span> Outflow collection beats inward billing, indicating collections exceeded billing entries during this period.</span>
                    ) : (
                      <span> Balance is perfectly squared.</span>
                    )}
                  </p>
                </div>

              </div>

              {/* Signatures at bottom of page 1 */}
              <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider">Report Authorization</p>
                  <p className="text-[8px] text-slate-400 mt-1">Report Generated Automatically | Non-Repudiable</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[10px] text-slate-900">{activeCompany?.companyName}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">Authorised Signature</p>
                </div>
              </div>
            </div>

            {/* PAGE 2: DETAILED TRANSACTION statement LOG */}
            <div className="p-8 min-h-[295mm] flex flex-col justify-between relative overflow-hidden">
              {/* BACKGROUND WATERMARK */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                {watermarkImage ? (
                  <img
                    src={watermarkImage}
                    alt="Company Watermark"
                    className="w-96 h-96 object-contain opacity-[0.08] grayscale contrast-200"
                  />
                ) : (
                  <span className="text-6xl font-black text-slate-900/5 tracking-widest uppercase rotate-[-30deg]">
                    {activeCompany?.companyName || 'UNAI BILLING'}
                  </span>
                )}
              </div>
              <div className="space-y-6 relative z-10">
                
                {/* Mini Header */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Statement Transaction Log (Cont.)</h2>
                    <p className="text-[8px] text-slate-400">Statement period: {formatDate(startDate)} to {formatDate(endDate)} | Account: {selectedParty === 'all' ? 'All Parties' : selectedParty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-bold">Page 2 of 2</p>
                  </div>
                </div>

                {/* Ledger entries table */}
                <table className="w-full text-left border-collapse text-[9px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[7px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction Particulars</th>
                      <th className="py-2.5 px-3">Doc Ref</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-center">Bill Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {ledgerData.entries.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500">{formatDate(row.date)}</td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-[180px] truncate">{row.particulars}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-slate-600 font-bold uppercase text-[8px]">{row.number}</span>
                          <span className="ml-1 text-[7px] text-slate-400 capitalize">({row.type})</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-blue-600 font-bold">
                          {row.debit > 0 ? formatCurrency(row.debit, currencySymbol) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                          {row.credit > 0 ? formatCurrency(row.credit, currencySymbol) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 font-black">
                          {formatCurrency(row.balance, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <a 
                            href={row.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[8px] font-bold text-blue-600 underline"
                          >
                            Preview Bill
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

              {/* Page 2 signatures */}
              <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider">End of Statement of Account</p>
                  <p className="text-[8px] text-slate-400 mt-1">Thank you for your business.</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[10px] text-slate-900">{activeCompany?.companyName}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">Authorised Signature</p>
                </div>
              </div>
            </div>

          </div>
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
