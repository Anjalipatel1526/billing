import React, { useState } from 'react';
import { useCompany, defaultCompanyState } from '../contexts/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { LogoUploader } from '../components/company/LogoUploader';

import { validateEmail, validateGST, validatePAN } from '../utils/formatting';
import { joinCompanyByCode } from '../services/db';
import { 
  Check, ArrowRight, ArrowLeft, Building2, Landmark, Sliders, 
  UserPlus, KeyRound, Copy, Lock, Hash, Shield, 
  FileText, Receipt, CreditCard, BookOpen, Eye, EyeOff 
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

// Premium brand logo component
const BrandLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brand-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <path d="M16 20v24c0 8.8 7.2 16 16 16s16-7.2 16-16V36c0-4.4 3.6-8 8-8s8 3.6 8 8v16c0 2.2 1.8 4 4 4s4-1.8 4-4V36c0-8.8-7.2-16-16-16s-16 7.2-16 16v8c0 4.4-3.6 8-8 8s-8-3.6-8-8V20c0-2.2-1.8-4-4-4s-4 1.8-4 4z" fill="url(#brand-grad)" />
  </svg>
);

export const Onboarding = () => {
  const { saveCompanyProfile, activeCompany } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const location = useLocation();

  // Mode derived from URL pathname: '/' -> choose, '/onboarding' -> new, '/join' -> join
  const getModeFromPath = (path) => {
    if (path === '/onboarding') return 'new';
    if (path === '/join') return 'join';
    return 'choose';
  };

  const mode = getModeFromPath(location.pathname);

  // ==================
  // NEW COMPANY STATE
  // ==================
  const [step, setStep] = useState(1); // 1 = Details, 2 = Bank, 3 = Defaults, 4 = Password
  const [formData, setFormData] = useState(defaultCompanyState);
  const [errors, setErrors] = useState({});
  const [companyPassword, setCompanyPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [showCompanyPassword, setShowCompanyPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showJoinPassword, setShowJoinPassword] = useState(false);

  // ==================
  // JOIN COMPANY STATE
  // ==================
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // ==================
  // FORM HELPERS
  // ==================
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateBankField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
  };

  const generateCompanyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.companyName.trim()) errs.companyName = 'Company Name is required.';
    if (formData.email && !validateEmail(formData.email)) errs.email = 'Invalid email address.';
    if (formData.gstNumber && !validateGST(formData.gstNumber)) errs.gstNumber = 'Invalid GSTIN format.';
    if (formData.panNumber && !validatePAN(formData.panNumber)) errs.panNumber = 'Invalid PAN format.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!companyPassword) {
      errs.password = 'Password is required.';
    } else if (companyPassword.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (!passwordRegex.test(companyPassword)) {
      errs.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&).';
    }
    
    if (companyPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ==================
  // HANDLERS
  // ==================
  const handleFinishNewCompany = async () => {
    if (!validateStep4()) return;

    try {
      const code = generateCompanyCode();
      const dataWithAuth = {
        ...formData,
        companyCode: code,
        companyPassword: companyPassword,
      };
      await saveCompanyProfile(dataWithAuth);
      setCreatedCode(code);
      setStep(5); // Show success with code
    } catch (err) {
      console.error(err);
      showToast('Failed to create company profile.', 'error');
    }
  };

  const handleJoinCompany = async () => {
    setJoinError('');
    if (!joinCode.trim()) { setJoinError('Company ID is required.'); return; }
    if (!joinPassword.trim()) { setJoinError('Password is required.'); return; }

    setJoinLoading(true);
    try {
      const company = await joinCompanyByCode(joinCode, joinPassword);
      await saveCompanyProfile(company);
      showToast(`Joined "${company.companyName}" successfully!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setJoinError(err.message || 'Failed to join company.');
    } finally {
      setJoinLoading(false);
    }
  };

  const copyCode = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(createdCode);
        showToast('Company ID copied to clipboard!', 'success');
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = createdCode;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Company ID copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not copy automatically. Please select and copy manually.', 'warning');
    }
  };

  const copyPasswordToClipboard = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(companyPassword);
        showToast('Password copied to clipboard!', 'success');
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = companyPassword;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Password copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not copy automatically. Please select and copy manually.', 'warning');
    }
  };

  if (mode === 'new') {
    return (
      <div className="min-h-screen bg-[#fafbfe] flex flex-col items-center justify-between p-4 md:p-8 font-sans overflow-y-auto">
        
        {step < 5 && (
          <>
            {/* Top Header */}
            <div className="w-full max-w-3xl mb-8 flex items-center justify-between border-b border-slate-200/80 pb-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
                  <img src="/favicon.png" alt="UNAI Logo" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-none">UNAI BILLING</h1>
                  <p className="text-[9px] text-indigo-600/80 font-semibold uppercase mt-0.5">Setup Workspace</p>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-bold">
                Step {step} of 4
              </div>
            </div>

            {/* Stepper */}
            <div className="w-full max-w-3xl mb-8">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
                {/* Highlighted active line */}
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
                
                {/* Steps */}
                {[
                  { num: 1, label: 'Details' },
                  { num: 2, label: 'Bank Coordinates' },
                  { num: 3, label: 'Invoice Defaults' },
                  { num: 4, label: 'Workspace Security' }
                ].map((s) => {
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <div key={s.num} className="flex flex-col items-center relative z-10">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                          isActive 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-110' 
                            : isCompleted 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : s.num}
                      </div>
                      <span 
                        className={`text-[10px] font-bold mt-2 transition-colors duration-300 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Form Card */}
            <div className="w-full max-w-3xl bg-white border border-indigo-100/80 rounded-3xl shadow-xs p-6 md:p-10 space-y-6">
              
              {/* Form Header */}
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {step === 1 && "Business Profile Details"}
                  {step === 2 && "Bank Coordinates"}
                  {step === 3 && "Invoice Defaults"}
                  {step === 4 && "Workspace Security"}
                </h2>
                <p className="text-xs text-slate-500">
                  {step === 1 && "Enter the essential details for your invoice headers and profile."}
                  {step === 2 && "Coordinate accounts so payments can be routed directly to you."}
                  {step === 3 && "Configure billing styles, prefixes, and starting invoice numbers."}
                  {step === 4 && "Setup a secure workspace password to prevent unauthorized access."}
                </p>
              </div>

              {/* Form Content */}
              <div className="space-y-5">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Company Name" required placeholder="e.g. Acma Solutions Pvt Ltd" value={formData.companyName} onChange={(e) => updateField('companyName', e.target.value)} error={errors.companyName} />
                      <Select label="Business Type" value={formData.businessType} onChange={(e) => updateField('businessType', e.target.value)}>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLP">Limited Liability Partnership (LLP)</option>
                        <option value="Freelancer">Freelancer / Independent</option>
                        <option value="NGO">NGO / Non-Profit</option>
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <LogoUploader label="Company Header Logo" value={formData.logo} onChange={(val) => updateField('logo', val)} />
                      <LogoUploader label="Document Watermark Image" value={formData.watermarkLogo} onChange={(val) => updateField('watermarkLogo', val)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="GST Number (GSTIN)" placeholder="e.g. 27AAAAA0000A1Z5" value={formData.gstNumber} onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())} error={errors.gstNumber} />
                      <Input label="PAN Number" placeholder="e.g. ABCDE1234F" value={formData.panNumber} onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())} error={errors.panNumber} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Email Address" type="email" placeholder="billing@company.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
                      <Input label="Phone Number" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                      <Input label="Website" placeholder="https://company.com" value={formData.website} onChange={(e) => updateField('website', e.target.value)} />
                    </div>
                    <Input label="Address" placeholder="Street address, Suite, Floor" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Input label="City" placeholder="Mumbai" value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
                      <Input label="State" placeholder="Maharashtra" value={formData.state} onChange={(e) => updateField('state', e.target.value)} />
                      <Input label="Country" value={formData.country} onChange={(e) => updateField('country', e.target.value)} />
                      <Input label="Pincode" placeholder="400001" value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                      Enter bank coordinates below so client payments can be routed directly to your account.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Bank Name" placeholder="HDFC Bank" value={formData.bankDetails?.bankName || ''} onChange={(e) => updateBankField('bankName', e.target.value)} />
                      <Input label="Account Holder" placeholder="Acma Solutions Pvt Ltd" value={formData.bankDetails?.accountHolder || ''} onChange={(e) => updateBankField('accountHolder', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Account Number" placeholder="50200012345678" value={formData.bankDetails?.accountNumber || ''} onChange={(e) => updateBankField('accountNumber', e.target.value)} />
                      <Input label="IFSC Code" placeholder="HDFC0001234" value={formData.bankDetails?.ifsc || ''} onChange={(e) => updateBankField('ifsc', e.target.value.toUpperCase())} />
                      <Input label="Branch" placeholder="Nariman Point, Mumbai" value={formData.bankDetails?.branch || ''} onChange={(e) => updateBankField('branch', e.target.value)} />
                    </div>
                    <Input label="UPI ID (VPA)" placeholder="company@hdfcbank" value={formData.bankDetails?.upiId || ''} onChange={(e) => updateBankField('upiId', e.target.value)} />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Invoice Prefix" value={formData.invoicePrefix} onChange={(e) => updateField('invoicePrefix', e.target.value)} />
                      <Input label="Starting Invoice #" type="number" value={formData.invoiceStartNumber} onChange={(e) => updateField('invoiceStartNumber', parseInt(e.target.value, 10) || 1001)} />
                      <Select label="Currency" value={formData.currency} onChange={(e) => updateField('currency', e.target.value)}>
                        <option value="INR ₹">INR ₹ (Indian Rupee)</option>
                        <option value="USD $">USD $ (US Dollar)</option>
                        <option value="EUR €">EUR € (Euro)</option>
                        <option value="GBP £">GBP £ (British Pound)</option>
                      </Select>
                    </div>

                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5 max-w-sm mx-auto py-2">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 mb-1">
                        <KeyRound className="w-5 h-5 text-amber-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">Secure Your Workspace</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Set a strong shared password for your team to join and collaborate in this company workspace.
                      </p>
                      
                      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-left max-w-xs mx-auto space-y-1 text-[10px] text-slate-500">
                        <p className="font-bold text-slate-600 mb-1">Password requirements:</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${companyPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${/[A-Z]/.test(companyPassword) && /[a-z]/.test(companyPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>Uppercase & lowercase letters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${/\d/.test(companyPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>At least one number</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${/[@$!%*?&]/.test(companyPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span>Special character (e.g. @$!%*?&)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">Workspace Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showCompanyPassword ? "text" : "password"}
                            value={companyPassword}
                            onChange={(e) => setCompanyPassword(e.target.value)}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              setCompanyPassword(pastedText);
                            }}
                            placeholder="Min. 8 characters"
                            className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCompanyPassword(!showCompanyPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showCompanyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              setConfirmPassword(pastedText);
                            }}
                            placeholder="Re-enter password"
                            className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-rose-600 mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="w-full max-w-3xl mt-6 flex items-center justify-between pb-8">
              {step > 1 ? (
                <Button 
                  variant="outline" 
                  icon={ArrowLeft} 
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  icon={ArrowLeft} 
                  onClick={() => navigate('/')}
                >
                  Exit Setup
                </Button>
              )}

              <span className="text-xs text-slate-400 font-bold tracking-wider">
                {step} / 4
              </span>

              {step < 4 ? (
                <Button 
                  icon={ArrowRight} 
                  onClick={() => { if (step === 1 && !validateStep1()) return; setStep(step + 1); }}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  icon={Check} 
                  onClick={handleFinishNewCompany}
                >
                  Create Workspace
                </Button>
              )}
            </div>
          </>
        )}

        {/* Step 5: Success screen centered */}
        {step === 5 && (
          <div className="my-auto w-full max-w-md bg-white border border-indigo-100 rounded-3xl shadow-xs p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-4 border-white shadow-lg text-emerald-600">
              <Check className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Workspace Ready!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your profile is created. Share the Company ID and password with your team members so they can log in.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-xs mx-auto space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Company ID</label>
                <div className="flex items-center gap-2 justify-center bg-white border border-slate-200 rounded-xl p-2">
                  <span className="text-lg font-black tracking-widest text-indigo-600 font-mono select-all pl-1">{createdCode}</span>
                  <button onClick={copyCode} className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Copy Company ID">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-200 pt-3">
                <label className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Workspace Password</label>
                <div className="flex items-center gap-2 justify-center bg-white border border-slate-200 rounded-xl p-2">
                  <span className="text-sm font-bold text-slate-800 font-mono select-all pl-1">{companyPassword}</span>
                  <button onClick={copyPasswordToClipboard} className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Copy Password">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                className="w-full" 
                icon={ArrowRight} 
                onClick={() => navigate('/dashboard')}
              >
                Enter Workspace
              </Button>
            </div>
          </div>
        )}

        {/* Footer Credit */}
        <div className="text-center text-[10px] text-slate-400 font-medium pb-4">
          © 2026 UNAI Billing. All rights reserved.
        </div>

      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-hidden">
      
      {/* ==================================================== */}
      {/* LEFT COLUMN: BRANDING & 3D NEON VISUALS */}
      {/* ==================================================== */}
      <div className="w-full md:w-[38%] h-full relative overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] flex flex-col justify-between p-6 md:p-8 text-white shrink-0">
        
        {/* Decorative Wave Divider on Desktop */}
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
            
            {/* Glowing neon aura */}
            <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full filter blur-2xl animate-pulse-slow"></div>

            {/* Authentic 3D Pedestal and Logo Image from un.png */}
            <div className="absolute inset-0 animate-float-slow flex items-center justify-center">
              <img src="/un.png" alt="UNAI 3D" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.3)]" />
            </div>

            {/* FLOATING MICRO CARDS */}
            {/* 1. Invoice Card (Top Right) */}
            <div className="absolute top-2 -right-6 animate-float-medium bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                <FileText className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold leading-tight">Invoice</p>
                <p className="text-[7px] text-slate-400 font-semibold">Generate A4</p>
              </div>
            </div>

            {/* 2. Receipt Card (Mid Left) */}
            <div className="absolute top-12 -left-10 animate-float-slow bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
                <Receipt className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold leading-tight">Receipt</p>
                <p className="text-[7px] text-slate-400 font-semibold">Slip</p>
              </div>
            </div>

            {/* 3. Voucher Card (Bottom Left) */}
            <div className="absolute bottom-2 -left-6 animate-float-fast bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold leading-tight">Voucher</p>
                <p className="text-[7px] text-slate-400 font-semibold">Credit</p>
              </div>
            </div>

            {/* 4. Ledger Card (Bottom Right) */}
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

      {/* ==================================================== */}
      {/* RIGHT COLUMN: DYNAMIC WORKSPACES & CONTROLS */}
      {/* ==================================================== */}
      <div className="flex-1 h-full bg-[#f8fafc] flex flex-col justify-between p-4 md:p-6 relative overflow-hidden">
        
        {/* Center Dynamic Interface */}
        <div className="my-auto flex items-center justify-center w-full max-w-xl mx-auto py-2">
          
          {/* Card Wrapper with Mockup Shadow styling */}
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-lg p-5 md:p-8 relative overflow-hidden transition-all duration-300">
            
            {/* ========== CHOOSE MODE ========== */}
            {mode === 'choose' && (
              <div className="space-y-5">
                
                {/* Logo & Headline */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border-2 border-white shadow-sm overflow-hidden p-2">
                    <img src="/favicon.png" alt="UNAI Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Welcome to <span className="text-indigo-600">UNAI Billing</span>
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-slate-300">
                    <div className="w-6 h-px bg-slate-200"></div>
                    <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                    <div className="w-6 h-px bg-slate-200"></div>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed max-w-sm mx-auto">
                    Get started by setting up a new company or joining an existing one to manage your billing and finance in one place.
                  </p>
                </div>

                {/* Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Create New Company Card */}
                  <div className="group relative border border-slate-200 hover:border-indigo-200 rounded-xl p-4 bg-white hover:bg-indigo-50/10 transition-all flex flex-col justify-between min-h-[160px]">
                    <div className="absolute top-0 right-3 w-5 h-6 bg-indigo-600 text-white rounded-b-sm flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-white/80"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-950 text-xs">New Company</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">
                        Register a new business profile and start creating invoices, vouchers and documents.
                      </p>
                    </div>
                    <button
                      onClick={() => { navigate('/onboarding'); setStep(1); }}
                      className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>Create New Company</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Join Company Card */}
                  <div className="group relative border border-slate-200 hover:border-emerald-200 rounded-xl p-4 bg-white hover:bg-emerald-50/10 transition-all flex flex-col justify-between min-h-[160px]">
                    <div className="absolute top-0 right-3 w-5 h-6 bg-emerald-600 text-white rounded-b-sm flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-white/80"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-950 text-xs">Join Company</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">
                        Enter a company ID and password to access an existing profile and continue.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/join')}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>Join Company</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>

                {/* Bottom Encrypted Alert */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug font-medium">
                    Your financial data is encrypted and secure with <span className="text-indigo-600 font-semibold">UNAI Billing.</span>
                  </p>
                </div>

                {activeCompany && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ========== JOIN COMPANY SCREEN ========== */}
            {mode === 'join' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 mb-2">
                    <UserPlus className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Join Existing Company</h3>
                  <p className="text-xs text-slate-500">Enter the Company ID and password shared by the company owner.</p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Company ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          setJoinCode(pastedText.trim().toUpperCase());
                        }}
                        placeholder="e.g. AB3K9X"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none uppercase"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showJoinPassword ? "text" : "password"}
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          setJoinPassword(pastedText);
                        }}
                        placeholder="Enter company password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowJoinPassword(!showJoinPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {joinError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-xl font-medium">
                      {joinError}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="w-1/3"
                      icon={ArrowLeft}
                      onClick={() => navigate('/')}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      icon={ArrowRight}
                      onClick={handleJoinCompany}
                      disabled={joinLoading}
                    >
                      {joinLoading ? 'Joining...' : 'Join Company'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-[10px] text-slate-400 font-medium mt-8 md:mt-0 relative z-20">
          © 2026 UNAI Billing. All rights reserved.
        </div>

      </div>

    </div>
  );
};
