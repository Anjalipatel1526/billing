import React, { useState } from 'react';
import { useCompany, defaultCompanyState } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { LogoUploader } from '../components/company/LogoUploader';
import { TEMPLATES_CONFIG } from '../templates/TemplateWrapper';
import { validateEmail, validateGST, validatePAN } from '../utils/formatting';
import { Check, ArrowRight, ArrowLeft, Building2, Landmark, Sliders } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Onboarding = () => {
  const { saveCompanyProfile, activeCompany } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(0); // 0 = Welcome, 1 = Details, 2 = Bank, 3 = Defaults & Template
  const [formData, setFormData] = useState(defaultCompanyState);
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateBankField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company Name is required.';
    }
    if (formData.email && !validateEmail(formData.email)) {
      errs.email = 'Invalid email address.';
    }
    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      errs.gstNumber = 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).';
    }
    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      errs.panNumber = 'Invalid PAN format (e.g. ABCDE1234F).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinish = async () => {
    try {
      await saveCompanyProfile(formData);
      showToast('Company profile created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Failed to save company profile.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
        {/* Welcome Screen */}
        {step === 0 && (
          <div className="p-8 md:p-12 text-center max-w-xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Create professional business documents in seconds.
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Create invoices, vouchers and receipts using your saved business profile. Set up once, billing made effortless forever.
              </p>
            </div>

            <div className="pt-4">
              <Button size="lg" className="w-full sm:w-auto px-8" icon={ArrowRight} onClick={() => setStep(1)}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Wizard Multi-Step Form */}
        {step > 0 && (
          <div>
            {/* Header & Stepper */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Setup Business Profile</h2>
                  <p className="text-xs text-slate-500">Step {step} of 3</p>
                </div>
                {activeCompany && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Skip to Dashboard
                  </button>
                )}
              </div>

              {/* Progress Steps Bar */}
              <div className="flex items-center gap-2">
                {[
                  { id: 1, label: 'Business Details', icon: Building2 },
                  { id: 2, label: 'Bank Details', icon: Landmark },
                  { id: 3, label: 'Defaults & Template', icon: Sliders }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isDone = step > s.id;

                  return (
                    <React.Fragment key={s.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : s.id}
                        </div>
                        <span
                          className={`text-xs font-medium hidden sm:inline ${
                            isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < 2 && <div className="flex-1 h-0.5 bg-slate-200" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Step Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              {/* STEP 1: BUSINESS DETAILS */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Company Name"
                      required
                      placeholder="e.g. Acma Solutions Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      error={errors.companyName}
                    />

                    <Select
                      label="Business Type"
                      value={formData.businessType}
                      onChange={(e) => updateField('businessType', e.target.value)}
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="Freelancer">Freelancer / Independent</option>
                      <option value="NGO">NGO / Non-Profit</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>

                  <LogoUploader
                    value={formData.logo}
                    onChange={(val) => updateField('logo', val)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="GST Number (GSTIN)"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                      error={errors.gstNumber}
                    />

                    <Input
                      label="PAN Number"
                      placeholder="e.g. ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                      error={errors.panNumber}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="billing@company.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                    <Input
                      label="Website"
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                    />
                  </div>

                  <Input
                    label="Address"
                    placeholder="Street address, Suite, Floor"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      label="City"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                    <Input
                      label="State"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                    />
                    <Input
                      label="Country"
                      placeholder="India"
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                    />
                    <Input
                      label="Pincode"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <Input
                      label="CIN (Optional)"
                      placeholder="U72200MH2020PTC123456"
                      value={formData.cin}
                      onChange={(e) => updateField('cin', e.target.value)}
                    />
                    <Input
                      label="UDYAM Number (Optional)"
                      placeholder="UDYAM-MH-00-0000000"
                      value={formData.udyamNumber}
                      onChange={(e) => updateField('udyamNumber', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: BANK DETAILS */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Provide bank details to automatically display payment instructions on your invoices and documents.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Bank Name"
                      placeholder="HDFC Bank / ICICI Bank"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => updateBankField('bankName', e.target.value)}
                    />

                    <Input
                      label="Account Holder Name"
                      placeholder="Acma Solutions Pvt Ltd"
                      value={formData.bankDetails.accountHolder}
                      onChange={(e) => updateBankField('accountHolder', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Account Number"
                      placeholder="50200012345678"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => updateBankField('accountNumber', e.target.value)}
                    />

                    <Input
                      label="IFSC Code"
                      placeholder="HDFC0000123"
                      value={formData.bankDetails.ifsc}
                      onChange={(e) => updateBankField('ifsc', e.target.value.toUpperCase())}
                    />

                    <Input
                      label="Branch Name"
                      placeholder="BKC Branch, Mumbai"
                      value={formData.bankDetails.branch}
                      onChange={(e) => updateBankField('branch', e.target.value)}
                    />
                  </div>

                  <Input
                    label="UPI ID (VPA)"
                    placeholder="company@hdfcbank"
                    value={formData.bankDetails.upiId}
                    onChange={(e) => updateBankField('upiId', e.target.value)}
                  />
                </div>
              )}

              {/* STEP 3: DEFAULTS & TEMPLATE */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Invoice Prefix"
                      placeholder="INV-"
                      value={formData.invoicePrefix}
                      onChange={(e) => updateField('invoicePrefix', e.target.value)}
                    />

                    <Input
                      label="Invoice Start Counter"
                      type="number"
                      placeholder="1001"
                      value={formData.invoiceStartNumber}
                      onChange={(e) => updateField('invoiceStartNumber', parseInt(e.target.value, 10) || 1001)}
                    />

                    <Select
                      label="Currency"
                      value={formData.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                    >
                      <option value="INR ₹">INR ₹ (Indian Rupee)</option>
                      <option value="USD $">USD $ (US Dollar)</option>
                      <option value="EUR €">EUR € (Euro)</option>
                      <option value="GBP £">GBP £ (British Pound)</option>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Default Tax Rate (%)"
                      type="number"
                      placeholder="18"
                      value={formData.defaultTax}
                      onChange={(e) => updateField('defaultTax', parseFloat(e.target.value) || 0)}
                    />

                    <Input
                      label="Default Payment Terms"
                      placeholder="Payment due within 15 days"
                      value={formData.paymentTerms}
                      onChange={(e) => updateField('paymentTerms', e.target.value)}
                    />
                  </div>

                  {/* Template Cards */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-3">Choose Preferred Invoice Template</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {TEMPLATES_CONFIG.map((t) => {
                        const isSelected = formData.selectedTemplate === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => updateField('selectedTemplate', t.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-slate-900">{t.name}</span>
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {t.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">{t.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={step === 1}
                icon={ArrowLeft}
                onClick={() => setStep(prev => prev - 1)}
              >
                Back
              </Button>

              {step < 3 ? (
                <Button
                  icon={ArrowRight}
                  onClick={() => {
                    if (step === 1 && !validateStep1()) return;
                    setStep(prev => prev + 1);
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button icon={Check} onClick={handleFinish}>
                  Save & Complete Setup
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
