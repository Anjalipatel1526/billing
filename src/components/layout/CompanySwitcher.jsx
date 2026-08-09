import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CompanySwitcher = () => {
  const { companies, activeCompany, switchCompany } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {activeCompany?.logo ? (
            <img src={activeCompany.logo} alt="Logo" className="w-5 h-5 rounded object-contain shrink-0 bg-white border border-slate-200/50 p-0.5" />
          ) : (
            <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {activeCompany?.companyName ? activeCompany.companyName.charAt(0).toUpperCase() : 'C'}
            </div>
          )}
          <span className="truncate text-slate-900 font-semibold">{activeCompany?.companyName || 'Select Company'}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[220px] bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-100">
          <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">Companies</div>
          <div className="max-h-48 overflow-y-auto">
            {companies.map(comp => (
              <button
                key={comp.id}
                onClick={() => {
                  switchCompany(comp.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                  comp.id === activeCompany?.id ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {comp.logo ? (
                    <img src={comp.logo} alt="Logo" className="w-4 h-4 rounded object-contain shrink-0 border border-slate-200/50" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  )}
                  <span className="truncate">{comp.companyName}</span>
                </div>
                {comp.id === activeCompany?.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/companies/new');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Company</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
