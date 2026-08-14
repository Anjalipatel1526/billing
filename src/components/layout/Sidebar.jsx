import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, BookOpen, Plus, SquareTerminal, ChevronLeft, Wallet } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

// Sleek minimalist car SVG logo
const CarLogoSvg = () => (
  <svg 
    className="w-5.5 h-5.5 text-white" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" fill="currentColor" />
    <circle cx="17" cy="17" r="2" fill="currentColor" />
    <path d="M7 17h10" />
  </svg>
);

export const Sidebar = ({ className = '', onCollapse }) => {
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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Ledger', path: '/ledger', icon: BookOpen },
    { label: 'Expenses', path: '/expenses', icon: Wallet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`w-[260px] bg-white border-r border-[#f1f3f9] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans z-40 ${className}`}>
      <div className="flex-1 flex flex-col pt-5">
        {/* Brand Header */}
        <div className="px-6 pb-6 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {activeCompany?.logo ? (
              <img 
                src={activeCompany.logo} 
                alt="Company Logo" 
                className="w-10 h-10 rounded-full object-contain shrink-0 bg-white border border-slate-100 p-0.5" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#ea0000] flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
                <CarLogoSvg />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-slate-900 text-[15px] tracking-tight leading-tight truncate" title={activeCompany?.companyName || 'Autobourn'}>
                {getCleanCompanyName(activeCompany?.companyName || 'Autobourn', activeCompany?.businessType)}
              </h1>
              {activeCompany?.businessType && (
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate" title={activeCompany.businessType}>
                  {activeCompany.businessType}
                </p>
              )}
            </div>
          </div>
          
          {/* Collapse Sidebar Action */}
          <button
            onClick={onCollapse}
            className="w-7 h-7 rounded-lg border border-[#e2e8f0] hover:border-slate-300 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-slate-50 transition-all shrink-0 active:scale-95 cursor-pointer"
            title="Hide Sidebar"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 mt-2 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Empty bottom area matching image */}
      <div className="pb-6 px-6">
        {/* Empty space matching image */}
      </div>
    </aside>
  );
};
