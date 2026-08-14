import React from 'react';
import { Menu } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export const Header = ({ onMenuToggle, isSidebarOpen, title }) => {
  const { activeCompany } = useCompany();

  const getCleanCompanyName = (name, businessType) => {
    if (!name) return '';
    if (businessType) {
      const typeEscaped = businessType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regexType = new RegExp(`\\s+${typeEscaped}$`, 'i');
      if (regexType.test(name)) {
        return name.replace(regexType, '').trim();
      }
    }
    const suffixRegex = /\s+(Pvt\.?\s*Ltd\.?|Ltd\.?|Private\s+Limited|LLP|Inc\.?|Corp\.?)$/i;
    return name.replace(suffixRegex, '').trim() || name;
  };

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
          ) : activeCompany.companyName?.toLowerCase().includes('autobourn') ? (
            <div className="w-6 h-6 rounded-full bg-[#ea0000] flex items-center justify-center shrink-0 shadow-xs">
              <svg 
                className="w-3.5 h-3.5 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" fill="currentColor" />
                <circle cx="17" cy="17" r="2" fill="currentColor" />
                <path d="M7 17h10" />
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
              {activeCompany.companyName?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
          <span className="text-xs font-bold text-slate-800 tracking-tight" title={activeCompany.companyName}>
            {getCleanCompanyName(activeCompany.companyName, activeCompany.businessType)}
          </span>
        </div>
      )}
    </header>
  );
};
