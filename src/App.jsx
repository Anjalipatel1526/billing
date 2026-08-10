import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ToastProvider } from './components/ui/Toast';

import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { CreateDocument } from './pages/CreateDocument';
import { CompanyEdit } from './pages/CompanyEdit';
import { Settings } from './pages/Settings';
import { Ledger } from './pages/Ledger';
import { PublicPreview } from './pages/PublicPreview';

import { 
  Shield, FileText, Receipt, CreditCard, BookOpen 
} from 'lucide-react';

// Route Guard to redirect first-time users to Onboarding
const AppRoutes = () => {
  const { activeCompany, loading } = useCompany();

  if (loading) {
    return (
      <div className="h-screen max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-hidden">
        
        {/* LEFT COLUMN: BRANDING & 3D NEON VISUALS */}
        <div className="w-full md:w-[38%] h-full relative overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] flex flex-col justify-between p-6 md:p-8 text-white shrink-0">
          {/* Decorative Wave Divider */}
          <div className="absolute top-0 bottom-0 right-0 w-20 hidden md:block z-10 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="none">
              <path d="M100,0 L0,0 C40,150 80,350 80,500 C80,650 40,850 0,1000 L100,1000 Z" fill="#f8fafc" />
            </svg>
          </div>

          {/* Brand Header */}
          <div className="flex items-center gap-2 relative z-20">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 overflow-hidden">
              <img src="/favicon.png" alt="UNAI Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-tight leading-none">UNAI Billing</h1>
              <p className="text-[9px] text-blue-400/80 font-medium mt-0.5">Enterprise Billing Suite</p>
            </div>
          </div>

          {/* Center 3D Pedestal and floating badges */}
          <div className="my-auto py-2 relative z-20 flex flex-col items-center">
            
            {/* Main Headline */}
            <div className="text-center md:text-left md:w-full max-w-sm mb-6 space-y-2">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
                Billing <span className="text-white/80">made simple.</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Business</span> made stronger.
              </h2>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Create invoices, vouchers, receipts and ledgers with ease. Manage your finance, your way.
              </p>
            </div>

            {/* 3D Pedestal Representation */}
            <div className="relative w-56 h-40 flex items-center justify-center">
              <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full filter blur-2xl animate-pulse-slow"></div>

              {/* Authentic 3D Pedestal and Logo Image from un.png */}
              <div className="absolute inset-0 animate-float-slow flex items-center justify-center">
                <img src="/un.png" alt="UNAI 3D" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.3)]" />
              </div>

              {/* Floating Cards */}
              <div className="absolute top-2 -right-6 animate-float-medium bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold leading-tight">Invoice</p>
                  <p className="text-[7px] text-slate-400 font-semibold">Generate A4</p>
                </div>
              </div>

              <div className="absolute top-12 -left-10 animate-float-slow bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
                  <Receipt className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold leading-tight">Receipt</p>
                  <p className="text-[7px] text-slate-400 font-semibold">Slip</p>
                </div>
              </div>

              <div className="absolute bottom-2 -left-6 animate-float-fast bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-50 flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold leading-tight">Voucher</p>
                  <p className="text-[7px] text-slate-400 font-semibold">Credit</p>
                </div>
              </div>

              <div className="absolute bottom-2 -right-6 animate-float-slow bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-purple-50 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold leading-tight">Ledger</p>
                  <p className="text-[7px] text-slate-400 font-semibold">Book</p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Secure Pill */}
          <div className="relative z-20 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 w-fit mx-auto md:mx-0">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure. Reliable. <span className="text-white font-semibold">Trusted by Businesses.</span></span>
          </div>

        </div>

        {/* RIGHT COLUMN: DYNAMIC WORKSPACES & CONTROLS */}
        <div className="flex-1 h-full bg-[#f8fafc] flex flex-col justify-between p-4 md:p-6 relative overflow-hidden">


          {/* Center Dynamic Loader Card */}
          <div className="my-auto flex items-center justify-center w-full max-w-xl mx-auto py-2">
            <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px] space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Pulsing ring */}
                <div className="absolute w-20 h-20 bg-indigo-100/50 rounded-full animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center">
                  <img src="/favicon.png" alt="Loading" className="w-8 h-8 object-contain animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Initializing Workspace</h4>
                <p className="text-slate-400 text-[10px] font-medium">Please wait while we load your secure session...</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium mt-8 md:mt-0 relative z-20">
            © 2026 UNAI Billing. All rights reserved.
          </div>
        </div>

      </div>
    );
  }

  const hasCompany = !!activeCompany;

  return (
    <Routes>
      <Route
        path="/"
        element={hasCompany ? <Navigate to="/dashboard" replace /> : <Onboarding />}
      />

      <Route
        path="/join"
        element={hasCompany ? <Navigate to="/dashboard" replace /> : <Onboarding />}
      />

      <Route
        path="/onboarding"
        element={hasCompany ? <Navigate to="/dashboard" replace /> : <Onboarding />}
      />

      <Route
        path="/dashboard"
        element={hasCompany ? <Dashboard /> : <Navigate to="/" replace />}
      />

      <Route
        path="/documents"
        element={hasCompany ? <Documents /> : <Navigate to="/" replace />}
      />
      <Route
        path="/documents/new"
        element={hasCompany ? <CreateDocument /> : <Navigate to="/" replace />}
      />
      <Route
        path="/documents/:id"
        element={hasCompany ? <CreateDocument /> : <Navigate to="/" replace />}
      />

      <Route
        path="/companies/:id"
        element={hasCompany ? <CompanyEdit /> : <Navigate to="/" replace />}
      />

      <Route
        path="/ledger"
        element={hasCompany ? <Ledger /> : <Navigate to="/" replace />}
      />

      <Route
        path="/settings"
        element={hasCompany ? <Settings /> : <Navigate to="/" replace />}
      />

      <Route
        path="/preview/:id"
        element={<PublicPreview />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <Router>
      <ToastProvider>
        <CompanyProvider>
          <DocumentProvider>
            <AppRoutes />
          </DocumentProvider>
        </CompanyProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
