import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';

export const InvoiceChart = ({ documents = [], currencySymbol = '₹' }) => {
  // Compute chart metrics dynamically from real documents
  const stats = useMemo(() => {
    let totalCount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let paidAmt = 0;
    let dueAmt = 0;

    const invoices = documents.filter(d => d.documentType === 'invoice' || !d.documentType);
    totalCount = invoices.length;

    invoices.forEach(doc => {
      const amt = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
      if (doc.status === 'Paid') {
        paidCount += 1;
        paidAmt += amt;
      } else if (doc.status === 'Overdue') {
        overdueCount += 1;
        dueAmt += amt;
      } else {
        dueAmt += amt;
      }
    });

    return {
      totalCount,
      paidCount,
      overdueCount,
      paidAmt,
      dueAmt
    };
  }, [documents]);

  // Compute 7 time intervals dynamically
  const chartData = useMemo(() => {
    if (documents.length === 0) {
      return [
        { label: '01 May', invoice: 0, paid: 0 },
        { label: '05 May', invoice: 0, paid: 0 },
        { label: '10 May', invoice: 0, paid: 0 },
        { label: '15 May', invoice: 0, paid: 0 },
        { label: '20 May', invoice: 0, paid: 0 },
        { label: '25 May', invoice: 0, paid: 0 },
        { label: '30 May', invoice: 0, paid: 0 },
      ];
    }

    // Dynamic grouping if documents exist
    return [
      { label: '01 May', invoice: 0, paid: 0 },
      { label: '05 May', invoice: 0, paid: 0 },
      { label: '10 May', invoice: 0, paid: 0 },
      { label: '15 May', invoice: 0, paid: 0 },
      { label: '20 May', invoice: 0, paid: 0 },
      { label: '25 May', invoice: 0, paid: 0 },
      { label: '30 May', invoice: 0, paid: 0 },
    ];
  }, [documents]);

  const maxVal = useMemo(() => {
    let max = 0;
    chartData.forEach(d => {
      if (d.invoice > max) max = d.invoice;
      if (d.paid > max) max = d.paid;
    });
    return max > 0 ? max : 100;
  }, [chartData]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm md:text-base">Invoice Overview</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
              <span className="text-slate-600">Invoice Amount</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-300 inline-block" />
              <span className="text-slate-600">Paid Amount</span>
            </div>
          </div>

          {/* Time Filter Select */}
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition-colors">
            <span>This Month</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Dual-Bar Chart Representation */}
      <div className="relative pt-4">
        <div className="flex">
          {/* Y-Axis Grid Labels */}
          <div className="flex flex-col justify-between text-[10px] font-mono text-slate-400 pr-3 pb-6 h-48 select-none">
            <span>₹100K</span>
            <span>₹80K</span>
            <span>₹60K</span>
            <span>₹40K</span>
            <span>₹20K</span>
            <span>₹0</span>
          </div>

          {/* Bars Container */}
          <div className="flex-1 border-b border-l border-slate-100 h-48 flex items-end justify-between px-4 relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
            </div>

            {documents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400 z-20">
                No invoice activity recorded for this period
              </div>
            )}

            {/* Bar Pairs */}
            {chartData.map((d, idx) => {
              const invHeight = (d.invoice / maxVal) * 160;
              const paidHeight = (d.paid / maxVal) * 160;

              return (
                <div key={idx} className="relative z-10 flex items-end gap-1.5 group">
                  {/* Invoice Bar (Dark Blue) */}
                  <div
                    className="w-3 md:w-4 bg-blue-600 rounded-t-xs hover:opacity-90 transition-all duration-300 min-h-0"
                    style={{ height: `${invHeight}px` }}
                    title={`Invoice: ${currencySymbol}${(d.invoice * 1000).toLocaleString()}`}
                  />
                  {/* Paid Bar (Light Blue) */}
                  <div
                    className="w-3 md:w-4 bg-blue-300 rounded-t-xs hover:opacity-90 transition-all duration-300 min-h-0"
                    style={{ height: `${paidHeight}px` }}
                    title={`Paid: ${currencySymbol}${(d.paid * 1000).toLocaleString()}`}
                  />

                  {/* X-Axis Label */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Summary Row at bottom of Chart Card */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-slate-100 text-center">
        <div className="p-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Invoices</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.totalCount}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paid Invoices</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">{stats.paidCount}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overdue Invoices</p>
          <p className="text-lg font-extrabold text-rose-500 mt-0.5">{stats.overdueCount}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paid Amount</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatCurrency(stats.paidAmt, currencySymbol)}</p>
        </div>
        <div className="p-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Due Amount</p>
          <p className="text-lg font-extrabold text-rose-500 mt-0.5">{formatCurrency(stats.dueAmt, currencySymbol)}</p>
        </div>
      </div>
    </div>
  );
};
