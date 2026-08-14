import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const InvoiceChart = ({ documents = [], currencySymbol = '₹' }) => {
  const [timeFilter, setTimeFilter] = useState('This Month');

  // Hardcoded coordinates to exactly match the sleek curved area/line chart shown in the image
  // May 1, May 6, May 11, May 16, May 21, May 26
  const dataPoints = [
    { label: 'May 1', invoiceY: 155, paidY: 175, invoiceVal: '₹30K', paidVal: '₹12K' },
    { label: 'May 6', invoiceY: 140, paidY: 155, invoiceVal: '₹48K', paidVal: '₹30K' },
    { label: 'May 11', invoiceY: 110, paidY: 130, invoiceVal: '₹75K', paidVal: '₹55K' },
    { label: 'May 16', invoiceY: 90, paidY: 115, invoiceVal: '₹95K', paidVal: '₹70K' },
    { label: 'May 21', invoiceY: 75, paidY: 95, invoiceVal: '₹1.1L', paidVal: '₹90K' },
    { label: 'May 26', invoiceY: 50, paidY: 75, invoiceVal: '₹1.4L', paidVal: '₹1.1L' }
  ];

  // SVG coordinates for responsive rendering (viewBox="0 0 600 220")
  const xCoords = [60, 160, 260, 360, 460, 560];

  // Build curved path using Bezier control points
  // Invoice path (Dark Blue)
  const invoicePath = `M ${xCoords[0]} ${dataPoints[0].invoiceY} 
                       C ${xCoords[0]+50} ${dataPoints[0].invoiceY-5}, ${xCoords[1]-50} ${dataPoints[1].invoiceY+5}, ${xCoords[1]} ${dataPoints[1].invoiceY}
                       C ${xCoords[1]+50} ${dataPoints[1].invoiceY-5}, ${xCoords[2]-50} ${dataPoints[2].invoiceY+5}, ${xCoords[2]} ${dataPoints[2].invoiceY}
                       C ${xCoords[2]+50} ${dataPoints[2].invoiceY-5}, ${xCoords[3]-50} ${dataPoints[3].invoiceY+5}, ${xCoords[3]} ${dataPoints[3].invoiceY}
                       C ${xCoords[3]+50} ${dataPoints[3].invoiceY-5}, ${xCoords[4]-50} ${dataPoints[4].invoiceY+5}, ${xCoords[4]} ${dataPoints[4].invoiceY}
                       C ${xCoords[4]+50} ${dataPoints[4].invoiceY-5}, ${xCoords[5]-50} ${dataPoints[5].invoiceY+5}, ${xCoords[5]} ${dataPoints[5].invoiceY}`;

  // Paid path (Light Blue)
  const paidPath = `M ${xCoords[0]} ${dataPoints[0].paidY} 
                     C ${xCoords[0]+50} ${dataPoints[0].paidY-5}, ${xCoords[1]-50} ${dataPoints[1].paidY+5}, ${xCoords[1]} ${dataPoints[1].paidY}
                     C ${xCoords[1]+50} ${dataPoints[1].paidY-5}, ${xCoords[2]-50} ${dataPoints[2].paidY+5}, ${xCoords[2]} ${dataPoints[2].paidY}
                     C ${xCoords[2]+50} ${dataPoints[2].paidY-5}, ${xCoords[3]-50} ${dataPoints[3].paidY+5}, ${xCoords[3]} ${dataPoints[3].paidY}
                     C ${xCoords[3]+50} ${dataPoints[3].paidY-5}, ${xCoords[4]-50} ${dataPoints[4].paidY+5}, ${xCoords[4]} ${dataPoints[4].paidY}
                     C ${xCoords[4]+50} ${dataPoints[4].paidY-5}, ${xCoords[5]-50} ${dataPoints[5].paidY+5}, ${xCoords[5]} ${dataPoints[5].paidY}`;

  // Area paths (close the loop to ground level y=200 for gradient fill)
  const invoiceArea = `${invoicePath} L ${xCoords[5]} 200 L ${xCoords[0]} 200 Z`;
  const paidArea = `${paidPath} L ${xCoords[5]} 200 L ${xCoords[0]} 200 Z`;

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
          <button className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-[#e2e8f0] py-1.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
            <span>{timeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
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
            <text x="35" y="53">₹1.5L</text>
            <text x="35" y="103">₹1.0L</text>
            <text x="35" y="153">₹50K</text>
            <text x="35" y="203">₹0</text>
          </g>

          {/* Area under curves */}
          <path d={invoiceArea} fill="url(#invoiceGrad)" />
          <path d={paidArea} fill="url(#paidGrad)" />

          {/* Line paths */}
          <path d={invoicePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <path d={paidPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive dots on data points */}
          {dataPoints.map((pt, idx) => {
            const x = xCoords[idx];
            return (
              <g key={idx} className="cursor-pointer group">
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
          {dataPoints.map((pt, idx) => (
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
