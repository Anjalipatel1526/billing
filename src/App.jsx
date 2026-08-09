import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { ToastProvider } from './components/ui/Toast';

import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { CreateDocument } from './pages/CreateDocument';
import { Companies } from './pages/Companies';
import { CompanyEdit } from './pages/CompanyEdit';
import { Settings } from './pages/Settings';

// Route Guard to redirect first-time users to Onboarding
const AppRoutes = () => {
  const { activeCompany, loading } = useCompany();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading UNAI Billing...</span>
        </div>
      </div>
    );
  }

  const hasCompany = !!activeCompany;

  return (
    <Routes>
      <Route
        path="/"
        element={hasCompany ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />}
      />

      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/dashboard"
        element={hasCompany ? <Dashboard /> : <Navigate to="/onboarding" replace />}
      />

      <Route
        path="/documents"
        element={hasCompany ? <Documents /> : <Navigate to="/onboarding" replace />}
      />
      <Route
        path="/documents/new"
        element={hasCompany ? <CreateDocument /> : <Navigate to="/onboarding" replace />}
      />
      <Route
        path="/documents/:id"
        element={hasCompany ? <CreateDocument /> : <Navigate to="/onboarding" replace />}
      />

      <Route
        path="/companies"
        element={hasCompany ? <Companies /> : <Navigate to="/onboarding" replace />}
      />
      <Route
        path="/companies/new"
        element={<CompanyEdit />}
      />
      <Route
        path="/companies/:id"
        element={hasCompany ? <CompanyEdit /> : <Navigate to="/onboarding" replace />}
      />

      <Route
        path="/settings"
        element={hasCompany ? <Settings /> : <Navigate to="/onboarding" replace />}
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
