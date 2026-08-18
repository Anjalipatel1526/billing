import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export const InvoiceChart = ({ documents = [], currencySymbol = '₹' }) => {
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState(currentYearVal);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = monthNamesShort[selectedMonth];

  // SVG coordinates for responsive rendering (viewBox="0 0 600 230")
  const xCoords = [60, 160, 260, 360, 460, 560];
  const intervals = [1, 6, 11, 16, 21, 26];

  // Compute stat card values dynamically
  const dataPoints = useMemo(() => {
    // Filter documents for the selected month and year (invoices only)
    const invoiceDocs = documents.filter(doc => {
      if (doc.documentType !== 'invoice' && doc.documentType !== undefined) return false;
      const dDate = new Date(doc.documentDate || doc.createdAt);
      return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    return intervals.map(d => {
      let invoiceVal = 0;
      let paidVal = 0;

      invoiceDocs.forEach(doc => {
        const dDate = new Date(doc.documentDate || doc.createdAt);
        const day = dDate.getDate();
        if (day <= d) {
          const amt = doc.totals?.grandTotal || parseFloat(doc.amount) || 0;
          invoiceVal += amt;
          if (doc.status === 'Paid') {
            paidVal += amt;
          }
        }
      });

      return {
        label: `${monthLabel} ${d}`,
        invoiceVal,
        paidVal
      };
    });
  }, [documents, selectedMonth, selectedYear, monthLabel]);

  const maxVal = useMemo(() => {
    const highestVal = Math.max(...dataPoints.map(pt => pt.invoiceVal), 0);
    return highestVal > 0 ? highestVal : 150000; // default/fallback to 150k
  }, [dataPoints]);

  const getY = (val) => 200 - (val / maxVal) * 150;

  const pointsWithY = useMemo(() => {
    return dataPoints.map(pt => ({
      ...pt,
      invoiceY: getY(pt.invoiceVal),
      paidY: getY(pt.paidVal)
    }));
  }, [dataPoints, maxVal]);

  // Build curved path using Bezier control points
  const invoicePath = useMemo(() => {
    if (pointsWithY.length === 0) return '';
    let path = `M ${xCoords[0]} ${pointsWithY[0].invoiceY}`;
    for (let i = 1; i < pointsWithY.length; i++) {
      const prevX = xCoords[i - 1];
      const prevY = pointsWithY[i - 1].invoiceY;
      const currX = xCoords[i];
      const currY = pointsWithY[i].invoiceY;
      path += ` C ${prevX + 50} ${prevY}, ${currX - 50} ${currY}, ${currX} ${currY}`;
    }
    return path;
  }, [pointsWithY]);

  const paidPath = useMemo(() => {
    if (pointsWithY.length === 0) return '';
    let path = `M ${xCoords[0]} ${pointsWithY[0].paidY}`;
    for (let i = 1; i < pointsWithY.length; i++) {
      const prevX = xCoords[i - 1];
      const prevY = pointsWithY[i - 1].paidY;
      const currX = xCoords[i];
      const currY = pointsWithY[i].paidY;
      path += ` C ${prevX + 50} ${prevY}, ${currX - 50} ${currY}, ${currX} ${currY}`;
    }
    return path;
  }, [pointsWithY]);

  // Area paths (close the loop to ground level y=200 for gradient fill)
  const invoiceArea = `${invoicePath} L ${xCoords[5]} 200 L ${xCoords[0]} 200 Z`;
  const paidArea = `${paidPath} L ${xCoords[5]} 200 L ${xCoords[0]} 200 Z`;

  const formatAxisLabel = (value) => {
    if (value === 0) return `${currencySymbol}0`;
    if (value >= 100000) return `${currencySymbol}${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
    return `${currencySymbol}${value}`;
  };

  const formatTooltipValue = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencySymbol === '₹' ? 'INR' : 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Invoice Overview</h3>
        </div>

        <div className="flex items-center gap-6">
          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-500">Invoice Amount</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
              <span className="text-slate-500">Paid Amount</span>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              id="selectedMonth"
              name="selectedMonth"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="appearance-none text-[11px] font-bold text-slate-600 bg-white border border-[#e2e8f0] py-1.5 pl-3 pr-8 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer outline-none"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m} {selectedYear}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* SVG Line / Area Chart */}
      <div className="relative w-full pt-4">
        <svg 
          viewBox="0 0 600 230" 
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradients for area fills */}
            <linearGradient id="invoiceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          <g stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3">
            <line x1="45" y1="50" x2="580" y2="50" />
            <line x1="45" y1="100" x2="580" y2="100" />
            <line x1="45" y1="150" x2="580" y2="150" />
            <line x1="45" y1="200" x2="580" y2="200" />
          </g>

          {/* Y-Axis Labels */}
          <g fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="end" fontFamily="sans-serif">
            <text x="35" y="53">{formatAxisLabel(maxVal)}</text>
            <text x="35" y="103">{formatAxisLabel(maxVal * 2 / 3)}</text>
            <text x="35" y="153">{formatAxisLabel(maxVal / 3)}</text>
            <text x="35" y="203">{formatAxisLabel(0)}</text>
          </g>

          {/* Area under curves */}
          <path d={invoiceArea} fill="url(#invoiceGrad)" />
          <path d={paidArea} fill="url(#paidGrad)" />

          {/* Line paths */}
          <path d={invoicePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <path d={paidPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive dots on data points */}
          {pointsWithY.map((pt, idx) => {
            const x = xCoords[idx];
            return (
              <g key={idx} className="cursor-pointer group">
                <title>
                  {pt.label}: Invoiced {formatTooltipValue(pt.invoiceVal)} | Paid {formatTooltipValue(pt.paidVal)}
                </title>
                {/* Invisible hover helper for bigger mouse target */}
                <circle cx={x} cy={pt.invoiceY} r="8" fill="transparent" />
                <circle cx={x} cy={pt.paidY} r="8" fill="transparent" />
                
                {/* Invoice Dots */}
                <circle 
                  cx={x} 
                  cy={pt.invoiceY} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#10b981" 
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-125"
                />
                
                {/* Paid Dots */}
                <circle 
                  cx={x} 
                  cy={pt.paidY} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#ef4444" 
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-125"
                />
              </g>
            );
          })}

          {/* X-Axis labels */}
          {pointsWithY.map((pt, idx) => (
            <text 
              key={idx}
              x={xCoords[idx]} 
              y="222" 
              fill="#94a3b8" 
              fontSize="10" 
              fontWeight="bold" 
              textAnchor="middle" 
              fontFamily="sans-serif"
            >
              {pt.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
