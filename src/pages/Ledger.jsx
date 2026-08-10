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
import { 
  BookOpen, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
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

      return {
        id: d.id,
        date: d.documentDate || d.createdAt?.slice(0, 10),
        number,
        type,
        particulars: `${type.toUpperCase()} - ${party} ${d.description ? `(${d.description})` : ''}`,
        debit,
        credit,
        balance: runningBalance
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

  const currencySymbol = activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    if (ledgerData.entries.length === 0) {
      showToast('No ledger data available to export.', 'warning');
      return;
    }

    try {
      const headers = ['Date', 'Document Type', 'Document Number', 'Particulars', `Debit (${currencySymbol})`, `Credit (${currencySymbol})`, `Balance (${currencySymbol})`];
      
      const csvRows = [headers.join(',')];
      
      ledgerData.entries.forEach(e => {
        const row = [
          e.date,
          e.type.toUpperCase(),
          e.number,
          `"${e.particulars.replace(/"/g, '""')}"`,
          e.debit.toFixed(2),
          e.credit.toFixed(2),
          e.balance.toFixed(2)
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
        ledgerData.finalBalance.toFixed(2)
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

  return (
    <MainLayout title="General Ledger">
      <div className="space-y-6">
        
        {/* Page Header and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="font-bold text-slate-900 text-lg">General Ledger</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track account statements, transaction flows, and running balances.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Download} onClick={handleExportCSV}>
              Export Excel
            </Button>
            <Button icon={Download} onClick={handleExportPDF}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
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
                <div className={`transform origin-top transition-all my-4 ${
                  (previewDoc.documentType === 'invoice' || !previewDoc.documentType) ? 'scale-[0.85] sm:scale-100' : 'scale-[0.70] sm:scale-90'
                }`}>
                  <TemplateWrapper
                    templateName={previewDoc.template || activeCompany?.selectedTemplate}
                    company={activeCompany}
                    customer={previewDoc.customer}
                    items={previewDoc.items || []}
                    totals={previewDoc.totals || calculateTotals(previewDoc.items || [], previewDoc.discount)}
                    document={previewDoc}
                  />
                </div>
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
          <div ref={printRef} className="p-8 w-[210mm] min-h-[297mm] bg-white font-sans text-xs text-slate-800 space-y-6">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">{activeCompany?.companyName || 'General Ledger'}</h1>
                <p className="text-[10px] text-slate-500 mt-1">{activeCompany?.address} | {activeCompany?.phone}</p>
                <p className="text-[10px] text-slate-500">{activeCompany?.email} | {activeCompany?.gstNumber ? `GSTIN: ${activeCompany.gstNumber}` : ''}</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-black text-indigo-600 uppercase">Statement of Account</h2>
                <p className="text-[10px] text-slate-600 font-bold mt-1">Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
                <p className="text-[9px] text-slate-400">Statement for: {selectedParty === 'all' ? 'All Customers & Vendors' : selectedParty}</p>
              </div>
            </div>

            {/* Account Metrics Overview */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
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
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[8px]">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Particulars</th>
                  <th className="py-2 px-3">Doc #</th>
                  <th className="py-2 px-3 text-right">Debit (+)</th>
                  <th className="py-2 px-3 text-right">Credit (-)</th>
                  <th className="py-2 px-3 text-right">Balance</th>
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
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="pt-12 flex justify-between">
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
