import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Building2, Settings, Plus } from 'lucide-react';
import { CompanySwitcher } from './CompanySwitcher';

export const Sidebar = ({ className = '' }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Companies', path: '/companies', icon: Building2 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans z-40 ${className}`}>
      <div className="overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <img src="/favicon.png" alt="UNAI Billing" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">UNAI Billing</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enterprise Billing Suite</p>
          </div>
        </div>

        {/* Company Switcher */}
        <div className="p-3">
          <CompanySwitcher />
        </div>

        {/* Quick Action Button */}
        <div className="px-3 pb-3">
          <NavLink
            to="/documents/new"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Document</span>
          </NavLink>
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
