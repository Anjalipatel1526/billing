import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    invoice: 'bg-blue-50 text-blue-700 border-blue-200',
    voucher: 'bg-purple-50 text-purple-700 border-purple-200',
    receipt: 'bg-teal-50 text-teal-700 border-teal-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};
