import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/line-charts-4';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

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

  const formatAxisLabel = (value) => {
    if (value === 0) return `${currencySymbol}0`;
    if (value >= 100000) return `${currencySymbol}${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
    return `${currencySymbol}${value}`;
  };

  const chartConfig = {
    invoiceVal: {
      label: 'Invoice Amount',
      color: '#ef4444', // Rose 500
    },
    paidVal: {
      label: 'Paid Amount',
      color: '#10b981', // Emerald 500
    },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-md shadow-black/5 min-w-[150px]">
          <div className="text-[11px] font-bold text-slate-400 tracking-wide mb-2.5">{label}</div>
          <div className="space-y-2">
            {payload.map((entry, index) => {
              const labelStr = entry.dataKey === 'invoiceVal' ? 'Invoiced' : 'Paid';
              const valueStr = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currencySymbol === '₹' ? 'INR' : 'USD',
                maximumFractionDigits: 0
              }).format(entry.value);

              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 border-2 rounded-full bg-white" style={{ borderColor: entry.color }}></div>
                    <span className="text-slate-500 font-medium">{labelStr}:</span>
                  </div>
                  <span className="font-extrabold text-slate-800">{valueStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#f1f3f9] rounded-3xl p-6 shadow-xs">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Invoice Overview</h3>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
              <span className="text-slate-500">Invoice Amount</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
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

      {/* Recharts / ChartContainer Integration */}
      <div className="relative w-full pt-2">
        <ChartContainer
          config={chartConfig}
          className="h-[210px] w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
        >
          <LineChart
            data={dataPoints}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="4 8"
              stroke="#e2e8f0"
              strokeOpacity={0.8}
              horizontal={true}
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
              tickMargin={12}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
              tickFormatter={formatAxisLabel}
              domain={[0, maxVal]}
              tickMargin={8}
            />

            <ChartTooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
            />

            {/* Invoice Line */}
            <Line
              dataKey="invoiceVal"
              type="monotone"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, stroke: '#ef4444', fill: '#fff' }}
              activeDot={{ r: 6 }}
            />

            {/* Paid Line */}
            <Line
              dataKey="paidVal"
              type="monotone"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, stroke: '#10b981', fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};
