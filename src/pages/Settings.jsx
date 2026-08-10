import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { Button } from '../components/ui/Button';
import { Building2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

export const Settings = () => {
  const { activeCompany } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <MainLayout title="Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h1 className="font-bold text-slate-900 text-lg">Application Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage and edit your company workspace details.</p>
        </div>

        {/* Company Quick Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </div>
    </MainLayout>
  );
};
