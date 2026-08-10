import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, PanelLeftClose, BookOpen } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

export const Sidebar = ({ className = '', onCollapse }) => {
  const { activeCompany } = useCompany();
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Ledger', path: '/ledger', icon: BookOpen },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans z-40 ${className}`}>
      <div className="overflow-y-auto flex-1">
        {/* Brand Header - Active Company Info */}
        <div className="p-4 border-b border-slate-100/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {activeCompany?.logo ? (
              <img src={activeCompany.logo} alt="Company Logo" className="w-8 h-8 rounded-xl object-contain shrink-0 bg-white border border-slate-200 p-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {activeCompany?.companyName ? activeCompany.companyName.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none truncate">
                {activeCompany?.companyName || 'UNAI Billing'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                {activeCompany?.businessType || 'Enterprise Billing Suite'}
              </p>
            </div>
          </div>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>



        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding info */}
      <div className="p-4 border-t border-slate-100/80 text-center">
        <p className="text-[10px] text-slate-400 font-medium">UNAI Billing • Enterprise Suite</p>
      </div>
    </aside>
  );
};
