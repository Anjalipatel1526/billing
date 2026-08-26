import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../components/ui/Toast';
import { getCompanyPayroll } from '../services/db';
import { formatCurrency } from '../utils/formatting';
import { Button } from '../components/ui/Button';
import { downloadDocumentPDF } from '../services/pdfGenerator';
import { PayslipTemplate } from '../templates/PayslipTemplate';
import { Banknote, Download, BadgeCheck, Printer } from 'lucide-react';

export const Payslips = () => {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();

  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfRenderSlip, setPdfRenderSlip] = useState<{ employee: any; record: any } | null>(null);
  const [previewSlip, setPreviewSlip] = useState<any | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Get active employee from localStorage
  const activeEmployee = useMemo(() => {
    const employeeJson = localStorage.getItem('activeEmployee');
    if (!employeeJson) return null;
    try {
      return JSON.parse(employeeJson);
    } catch (e) {
      return null;
    }
  }, []);

  // Fetch payroll records
  useEffect(() => {
    if (activeCompany?.id) {
      setLoading(true);
      getCompanyPayroll(activeCompany.id)
        .then(records => {
          setPayrollRecords(records);
        })
        .catch(err => {
          console.error('Failed to load payroll records:', err);
          showToast('Failed to load payslips', 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [activeCompany?.id, showToast]);

  const employeePayrollList = useMemo(() => {
    if (!activeEmployee) return [];
    return payrollRecords.filter(r => r.employeeId === activeEmployee.id && r.status === 'Paid');
  }, [payrollRecords, activeEmployee]);

  const currencySymbol = useMemo(() => {
    return activeCompany?.currency ? activeCompany.currency.split(' ')[1] || '₹' : '₹';
  }, [activeCompany]);

  const handleDownloadPayslip = (record: any) => {
    if (!activeEmployee) return;
    setPdfRenderSlip({ employee: activeEmployee, record });
    showToast('Generating Payslip PDF...', 'info');
    setTimeout(async () => {
      try {
        if (pdfRef.current) {
          const filename = `Payslip_${activeEmployee.name.replace(/\s+/g, '_')}_${record.month}`;
          await downloadDocumentPDF(pdfRef.current, filename, 'portrait');
          showToast('Payslip downloaded successfully!', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to download payslip.', 'error');
      } finally {
        setPdfRenderSlip(null);
      }
    }, 300);
  };

  return (
    <MainLayout title="Pay Slips">
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#f1f3f9] shadow-xs overflow-hidden p-6">
          <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center border border-indigo-100/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-[15px] tracking-tight leading-tight">My Payslips</h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">View and download your monthly salary statements</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading payslips...</p>
            </div>
          ) : employeePayrollList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-4">
                <Banknote className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">No Payslips Available</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Your monthly salary payments will appear here once released by the administrator.</p>
            </div>
          ) : (
            <div className="mt-6 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              {employeePayrollList.map(record => {
                const formattedMonthLabel = (() => {
                  if (!record.month) return '';
                  const [year, month] = record.month.split('-');
                  const date = new Date(Number(year), Number(month) - 1, 1);
                  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                })();
                return (
                  <div key={record.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-all text-xs gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{formattedMonthLabel}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold">
                          <BadgeCheck className="w-3 h-3 text-emerald-500" />
                          Paid
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                        Paid via {record.paymentMethod} on {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A'}
                        {record.notes && ` • "${record.notes}"`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 font-medium">Net Amount</p>
                        <p className="font-extrabold text-slate-800 text-sm">
                          {formatCurrency(Number(record.salary || 0), currencySymbol)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewSlip(record)}
                        className="p-2.5 bg-indigo-50 border border-indigo-100/70 hover:bg-indigo-650 hover:text-white text-indigo-650 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs"
                        title="Preview Payslip"
                      >
                        <Download className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payslip Preview Modal */}
      {previewSlip && activeEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-indigo-650" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Payslip Preview - {activeEmployee.name} ({previewSlip.month})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPreviewSlip(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold border border-slate-250/70 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Close Preview
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex justify-center items-start">
              <div className="bg-white p-4 shadow-lg rounded border border-slate-200/60 w-full max-w-[210mm]">
                <PayslipTemplate
                  company={activeCompany}
                  employee={activeEmployee}
                  record={previewSlip}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-2">
              <Button 
                variant="outline" 
                icon={Printer} 
                onClick={() => {
                  handleDownloadPayslip(previewSlip);
                }}
                className="cursor-pointer"
              >
                Print / PDF Dialog
              </Button>
              <Button 
                icon={Download} 
                onClick={() => {
                  handleDownloadPayslip(previewSlip);
                }}
                className="cursor-pointer bg-indigo-650 hover:bg-indigo-700 text-white"
              >
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Payslip Printable Wrapper */}
      {pdfRenderSlip && (
        <div className="hidden">
          <div ref={pdfRef}>
            <PayslipTemplate
              company={activeCompany}
              employee={pdfRenderSlip.employee}
              record={pdfRenderSlip.record}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};
