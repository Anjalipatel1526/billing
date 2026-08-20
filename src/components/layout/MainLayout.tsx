import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChevronRight } from 'lucide-react';

export const MainLayout = ({ children, title }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f0f7fb] flex flex-col md:flex-row font-sans relative">
      {/* Reopen Sidebar Button (Desktop only) */}
      {!desktopSidebarOpen && (
        <button
          onClick={() => setDesktopSidebarOpen(true)}
          className="hidden md:flex fixed left-0 top-6 z-40 bg-white border border-[#e2e8f0] hover:border-slate-300 shadow-md text-blue-600 hover:text-blue-700 rounded-r-xl p-2.5 transition-all cursor-pointer items-center justify-center active:scale-95 animate-in slide-in-from-left duration-200"
          title="Show Sidebar"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Desktop Sidebar */}
      {desktopSidebarOpen && (
        <Sidebar 
          className="hidden md:flex animate-in slide-in-from-left duration-200" 
          onCollapse={() => setDesktopSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white h-full z-10 flex flex-col animate-in slide-in-from-left duration-200">
            <Sidebar 
              className="flex border-r-0 h-full" 
              onCollapse={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <Header 
            onMenuToggle={() => setMobileMenuOpen(true)} 
            isSidebarOpen={false}
            title={title} 
          />
        </div>
        <main className="flex-1 p-6 md:p-8 w-full max-w-(--breakpoint-2xl) mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
