import React, { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { loginAsEmployee, getCompanyEmployees, saveCompanyEmployees } from '../services/db';
import { 
  Shield, Lock, User, Eye, EyeOff, AlertCircle, 
  ArrowRight, Building2, LogOut, KeyRound, Users, UserPlus,
  FileText, Receipt, CreditCard, BookOpen
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { validatePassword } from '../utils/formatting';

export const WorkspaceLogin = () => {
  const { activeCompany, switchCompany, saveCompanyProfile, setAuthenticatedState } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loginTab, setLoginTab] = useState<'admin' | 'employee'>('employee');
  
  // Admin credentials
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  // Employee credentials
  const [employeeLoginId, setEmployeeLoginId] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password reset states for employee force reset
  const [mustChangeScreen, setMustChangeScreen] = useState(false);
  const [tempEmployee, setTempEmployee] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!adminPassword.trim()) {
      setErrorMsg('Workspace password is required.');
      return;
    }

    if (!activeCompany) return;

    if (adminPassword === activeCompany.companyPassword) {
      setAuthenticatedState(true);
      localStorage.removeItem('activeEmployee'); // admin is active
      showToast('Admin authentication successful!', 'success');
      navigate('/dashboard');
    } else {
      setErrorMsg('Incorrect workspace password. Please try again.');
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!employeeLoginId.trim()) {
      setErrorMsg('Employee ID is required.');
      return;
    }
    if (!employeePassword.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    if (!activeCompany) return;

    setLoading(true);
    try {
      const { company, employee } = await loginAsEmployee(
        activeCompany.companyCode,
        employeeLoginId.trim(),
        employeePassword.trim()
      );
      
      if (employee.mustChangePassword) {
        setTempEmployee(employee);
        setMustChangeScreen(true);
        setNewPassword('');
        setConfirmPassword('');
        showToast('Temporary password detected. Please set a new password.', 'info');
        return;
      }
      
      // Save company profile in context
      await saveCompanyProfile(company);
      // Set active employee session
      localStorage.setItem('activeEmployee', JSON.stringify(employee));
      // Authenticate current session
      setAuthenticatedState(true);
      
      showToast(`Welcome back, ${employee.name}!`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim()) {
      setErrorMsg('New password is required.');
      return;
    }
    if (!validatePassword(newPassword.trim())) {
      setErrorMsg('Password must be at least 8 characters, containing uppercase, lowercase, and a symbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!activeCompany) return;

    setChangePasswordLoading(true);
    try {
      const employees = await getCompanyEmployees(activeCompany.id);
      const updatedList = employees.map(e => {
        if (e.id === tempEmployee.id || e.loginId === tempEmployee.loginId) {
          return {
            ...e,
            password: newPassword,
            mustChangePassword: false
          };
        }
        return e;
      });
      await saveCompanyEmployees(activeCompany.id, updatedList);
      showToast('Password updated successfully. Please login with your new password.', 'success');
      setMustChangeScreen(false);
      setEmployeePassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSwitchWorkspace = async () => {
    try {
      localStorage.removeItem('activeEmployee');
      setAuthenticatedState(false);
      await switchCompany(null);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-y-auto md:overflow-hidden">
      
      {/* LEFT COLUMN: BRANDING & 3D NEON VISUALS */}
      <div className="w-full md:w-[38%] h-auto md:h-full relative overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] flex flex-col justify-between p-6 md:p-8 text-white shrink-0">
        
        {/* Wave Divider */}
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

        {/* Center 3D visual */}
        <div className="my-auto py-2 relative z-20 flex flex-col items-center">
          <div className="text-center md:text-left md:w-full max-w-sm mb-6 space-y-2">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
              Billing <span className="text-white/80">made simple.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400">Business</span> made stronger.
            </h2>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Create invoices, vouchers, receipts and ledgers with ease. Manage your finance, your way.
            </p>
          </div>

          <div className="relative w-56 h-40 flex items-center justify-center">
            <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full filter blur-2xl animate-pulse-slow"></div>
            <div className="absolute inset-0 animate-float-slow flex items-center justify-center">
              <img src="/un.png" alt="UNAI 3D" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.3)]" />
            </div>

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

        <div className="relative z-20 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 w-fit mx-auto md:mx-0">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Secure. Reliable. <span className="text-white font-semibold">Trusted by Businesses.</span></span>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="flex-1 h-auto md:h-full bg-[#f8fafc] flex flex-col justify-between p-4 md:p-6 relative overflow-y-auto md:overflow-hidden">
        
        {/* Top-Right Action Links */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-705 text-[11px] font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 border border-indigo-200/50"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Company</span>
          </button>
          
          <button
            onClick={() => navigate('/join')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-705 text-[11px] font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 border border-emerald-200/50"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Join Company</span>
          </button>
        </div>

        <div className="my-auto flex items-center justify-center w-full max-w-md mx-auto py-2">
          
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden">
            
            {mustChangeScreen ? (
              // Mandatory Password Reset Form
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 mb-2">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Change Temporary Password</h3>
                  <p className="text-xs text-slate-500 font-medium">To secure your account, you must change your temporary password.</p>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 text-rose-600 px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-left animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-2.5"
                    disabled={changePasswordLoading}
                  >
                    {changePasswordLoading ? 'Updating...' : 'Update Password & Login'}
                  </Button>
                </form>
              </div>
            ) : (
              // Unified Login Forms
              <div className="space-y-6">
                
                {/* Employee Form */}
                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Employee ID</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={employeeLoginId}
                        onChange={(e) => { setEmployeeLoginId(e.target.value); setErrorMsg(''); }}
                        placeholder="e.g. company001"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showEmployeePassword ? "text" : "password"}
                        value={employeePassword}
                        onChange={(e) => { setEmployeePassword(e.target.value); setErrorMsg(''); }}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
                      >
                        {showEmployeePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 text-rose-600 px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-left animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-2.5"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Authenticate'}
                  </Button>
                </form>

              </div>
            )}

          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium relative z-20">
          © 2026 UNAI Billing. All rights reserved.
        </div>
      </div>

    </div>
  );
};
