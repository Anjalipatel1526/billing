import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { Button } from '../components/ui/Button';
import { Building2, Copy, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

export const Settings = () => {
  const { activeCompany, switchCompany, setAuthenticatedState } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const employeeJson = localStorage.getItem('activeEmployee');
  const activeEmployee = employeeJson ? (() => { try { return JSON.parse(employeeJson); } catch { return null; } })() : null;

  const handleLeaveWorkspace = async () => {
    try {
      localStorage.removeItem('activeEmployee');
      setAuthenticatedState(false);
      await switchCompany(null);
      navigate('/');
    } catch (err) {
      console.error('Leave workspace error:', err);
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="hidden md:block bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Application Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Manage and edit your company workspace details.</p>
        </div>

        {/* Company Quick Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{activeCompany?.companyName || 'Business Profile'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{activeCompany?.businessType} • GST: {activeCompany?.gstNumber || 'N/A'}</p>
              {activeCompany?.companyCode && (
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                  <span>Company Code:</span>
                  <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100/50 rounded-lg pl-2 pr-1 py-0.5">
                    <span className="font-mono font-bold text-indigo-600 tracking-wider">{activeCompany.companyCode}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeCompany.companyCode);
                        showToast('Company Code copied to clipboard!', 'success');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                      title="Copy Company Code"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/companies/${activeCompany?.id}`)}>
            Edit Company Profile
          </Button>
        </div>

        {/* Danger Zone: Leave Workspace / Logout */}
        <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{activeEmployee ? 'Logout' : 'Leave Workspace'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeEmployee
                  ? 'Sign out of your employee session and return to the login screen.'
                  : 'Leave this workspace and return to the home screen. You can rejoin later using the company code.'}
              </p>
            </div>
            <button
              onClick={handleLeaveWorkspace}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 border border-red-200/60 shrink-0"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>{activeEmployee ? 'Logout' : 'Leave Workspace'}</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
