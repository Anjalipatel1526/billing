import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children, title }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
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
        <Header 
          onMenuToggle={() => {
            if (window.innerWidth < 768) {
              setMobileMenuOpen(true);
            } else {
              setDesktopSidebarOpen(true);
            }
          }} 
          isSidebarOpen={desktopSidebarOpen}
          title={title} 
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
