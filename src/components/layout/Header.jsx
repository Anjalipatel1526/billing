import React from 'react';
import { Menu } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export const Header = ({ onMenuToggle, isSidebarOpen, title }) => {
  const { activeCompany } = useCompany();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className={`${isSidebarOpen ? 'md:hidden' : 'flex'} text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors`}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">{title || 'Dashboard'}</h2>
      </div>

      {/* Show active company logo and name on the right side if the sidebar is closed */}
      {!isSidebarOpen && activeCompany && (
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-xl pl-2 pr-3 py-1.5 animate-in fade-in slide-in-from-right duration-200">
          {activeCompany.logo ? (
            <img src={activeCompany.logo} alt="Logo" className="w-6 h-6 rounded-lg object-contain shrink-0 bg-white border border-slate-200 p-0.5" />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
              {activeCompany.companyName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-bold text-slate-800 tracking-tight">{activeCompany.companyName}</span>
        </div>
      )}
    </header>
  );
};
