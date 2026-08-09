import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Building2, Plus, Edit3, Trash2, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Companies = () => {
  const { companies, activeCompany, switchCompany, removeCompany } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSwitch = async (id) => {
    await switchCompany(id);
    showToast('Switched active company context.', 'success');
  };

  const handleDelete = async (id, name) => {
    if (companies.length <= 1) {
      showToast('Cannot delete the only remaining company profile.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}"? Documents under this company will remain in storage.`)) {
      await removeCompany(id);
      showToast('Company profile deleted.', 'info');
    }
  };

  return (
    <MainLayout title="Companies">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="font-bold text-slate-900 text-lg">Business Profiles</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage multiple companies and switch billing profiles instantly.</p>
          </div>

          <Button icon={Plus} onClick={() => navigate('/companies/new')}>
            Add New Company
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((comp) => {
            const isActive = comp.id === activeCompany?.id;

            return (
              <div
                key={comp.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 shadow-xs relative ${
                  isActive ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {comp.logo ? (
                        <img src={comp.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain border p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                          {comp.companyName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{comp.companyName}</h3>
                        <p className="text-xs text-slate-500">{comp.businessType}</p>
                      </div>
                    </div>

                    {isActive ? (
                      <Badge variant="primary" className="gap-1">
                        <CheckCircle className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handleSwitch(comp.id)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Switch
                      </button>
                    )}
                  </div>

                  {/* Company Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {comp.gstNumber && <p className="font-mono text-[11px]">GSTIN: {comp.gstNumber}</p>}
                    {comp.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{comp.email}</span>
                      </div>
                    )}
                    {comp.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{comp.phone}</span>
                      </div>
                    )}
                    {comp.address && (
                      <div className="flex items-start gap-1.5 text-slate-500 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{[comp.address, comp.city, comp.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">Template: {comp.selectedTemplate || 'Minimal'}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/companies/${comp.id}`)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {companies.length > 1 && (
                      <button
                        onClick={() => handleDelete(comp.id, comp.companyName)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};
