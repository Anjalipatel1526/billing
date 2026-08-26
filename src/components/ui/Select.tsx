import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  required?: boolean;
}

export const Select = ({
  label,
  options = [],
  error,
  required = false,
  className = '',
  id,
  children,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id || (label ? `select_${label.toLowerCase().replace(/\s+/g, '_')}` : generatedId);
  const selectName = props.name || selectId;

  return (
    <div className="w-full space-y-1 font-sans">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={selectName}
          className={`w-full text-xs rounded-lg border bg-white pl-3 pr-10 py-2 appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-50 ${
            error ? 'border-rose-400' : 'border-slate-300'
          } ${className}`}
          {...props}
        >
          {children ? (
            children
          ) : (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-rose-500 mt-0.5">{error}</p>}
    </div>
  );
};
