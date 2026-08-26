import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onMenuToggle, isSidebarOpen, title, onProfileClick }) => {
  const { activeCompany } = useCompany();
  const navigate = useNavigate();

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
        {title !== 'Dashboard' && title && (
          <button
            onClick={() => navigate('/dashboard')}
            className="flex text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <h2 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">{title || 'Dashboard'}</h2>
      </div>

      {!isSidebarOpen && activeCompany && (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-200">
          {(() => {
            const employeeJson = localStorage.getItem('activeEmployee');
            if (employeeJson) {
              try {
                const emp = JSON.parse(employeeJson);
                return (
                  <button
                    onClick={onProfileClick}
                    className="flex items-center gap-0 sm:gap-2 p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full cursor-pointer transition-all active:scale-95 sm:pr-2.5 group"
                    title="View Profile"
                  >
                    {emp.photo ? (
                      <img 
                        src={emp.photo} 
                        alt={emp.name} 
                        className="w-7 h-7 rounded-full object-cover border border-white shadow-xs" 
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${
                        emp.isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {emp.name.charAt(0)}
                      </div>
                    )}
                    <span className="hidden sm:inline text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors max-w-[100px] truncate">{emp.name}</span>
                  </button>
                );
              } catch (e) {
                return null;
              }
            }
            return null;
          })()}
          
          {localStorage.getItem('activeEmployee') && <div className="h-6 w-px bg-slate-200" />}

          {activeCompany.logo ? (
            <img src={activeCompany.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain shrink-0 bg-white shadow-sm border border-slate-100 p-0.5" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {activeCompany.companyName?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
