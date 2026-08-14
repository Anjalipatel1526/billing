import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useCompany } from '../contexts/CompanyContext';
import { TEMPLATES_CONFIG } from '../templates/TemplateWrapper';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, LayoutTemplate } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Templates = () => {
  const { activeCompany, updateActiveCompany } = useCompany();
  const { showToast } = useToast();

  const selectedTemplate = activeCompany?.selectedTemplate || 'Minimal';

  const handleSelectTemplate = async (templateId) => {
    try {
      await updateActiveCompany({ selectedTemplate: templateId });
      showToast(`Default template changed to "${templateId}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update template.', 'error');
    }
  };

  return (
    <MainLayout title="Templates">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-[#f1f3f9] shadow-xs">
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Invoice & Document Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            Select a design style for {activeCompany?.companyName || 'your business'}. All document data dynamically adapts to your chosen template.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEMPLATES_CONFIG.map((t) => {
            const isSelected = selectedTemplate === t.id;

            return (
              <div
                key={t.id}
                className={`bg-white rounded-3xl border p-6 transition-all space-y-4 shadow-xs relative flex flex-col justify-between ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-[#f1f3f9] hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                    </div>

                    {isSelected ? (
                      <Badge variant="primary" className="gap-1 bg-blue-50 text-blue-600 border-blue-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </Badge>
                    ) : (
                      <Badge variant="default">{t.badge}</Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                  {/* Mock Visual Mini Preview Box */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-[9px] font-mono pointer-events-none select-none">
                    <div className="flex justify-between border-b pb-1.5">
                      <div className="font-bold text-slate-800">LOGO / COMPANY</div>
                      <div className="text-right text-slate-500">{t.name.toUpperCase()} #INV-1001</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 py-1 text-slate-600">
                      <div>From: {activeCompany?.companyName || 'Acma Corp'}</div>
                      <div>To: Client Corp Ltd</div>
                    </div>
                    <div className="border border-slate-200 rounded p-1 space-y-1 bg-white">
                      <div className="flex justify-between text-slate-700">
                        <span>1. Web Design Services</span>
                        <span>₹15,000</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>2. Cloud Hosting Setup</span>
                        <span>₹5,000</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">₹23,600.00</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant={isSelected ? 'secondary' : 'outline'}
                    className="w-full"
                    disabled={isSelected}
                    onClick={() => handleSelectTemplate(t.id)}
                  >
                    {isSelected ? 'Currently Selected' : `Select ${t.name} Template`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};
