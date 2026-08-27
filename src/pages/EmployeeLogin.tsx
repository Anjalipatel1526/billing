import React, { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { loginAsEmployee, getCompanyEmployees, saveCompanyEmployees } from '../services/db';
import { 
  ArrowLeft, ArrowRight, Shield, Lock, Hash, KeyRound,
  FileText, Receipt, CreditCard, BookOpen, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const EmployeeLogin = () => {
  const { saveCompanyProfile } = useCompany();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [companyCode, setCompanyCode] = useState('');
  const [employeeLoginId, setEmployeeLoginId] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password reset states
  const [mustChangeScreen, setMustChangeScreen] = useState(false);
  const [tempEmployee, setTempEmployee] = useState<any>(null);
  const [tempCompany, setTempCompany] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyCode.trim()) {
      setErrorMsg('Company ID is required.');
      return;
    }
    if (!employeeLoginId.trim()) {
      setErrorMsg('Employee ID is required.');
      return;
    }
    if (!employeePassword.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const { company, employee } = await loginAsEmployee(
        companyCode.trim(),
        employeeLoginId.trim(),
        employeePassword.trim()
      );
      
      if (employee.mustChangePassword) {
        setTempCompany(company);
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
    if (newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      // 1. Fetch current employees list for the company
      const employees = await getCompanyEmployees(tempCompany.id);
      
      // 2. Update the password and flag for this employee
      const updatedEmployees = employees.map((emp: any) => {
        if (emp.id === tempEmployee.id) {
          return {
            ...emp,
            password: newPassword,
            mustChangePassword: false
          };
        }
        return emp;
      });

      // 3. Save back to database
      await saveCompanyEmployees(tempCompany.id, updatedEmployees);

      showToast('Password updated successfully. Please log in with your new password.', 'success');
      
      // Reset state back to login screen
      setMustChangeScreen(false);
      setTempEmployee(null);
      setTempCompany(null);
      setEmployeePassword(''); // Clear temporary password
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-y-auto md:overflow-hidden">
      
      {/* LEFT COLUMN: BRANDING & 3D NEON VISUALS */}
      <div className="w-full md:w-[38%] h-auto md:h-full relative overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] flex flex-col justify-between p-6 md:p-8 text-white shrink-0">
        
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
            <p className="text-[9px] text-blue-400/80 font-medium mt-0.5">Employee Portal</p>
          </div>
        </div>

        {/* Center 3D Pedestal and floating badges */}
        <div className="my-auto py-2 relative z-20 flex flex-col items-center">
          
          {/* Main Headline */}
          <div className="text-center md:text-left md:w-full max-w-sm mb-6 space-y-2">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
              Staff <span className="text-white/80">workspace portal.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400">Collaboration</span> made simple.
            </h2>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Log in with the credentials assigned by your administrator to access permitted modules and perform operations.
            </p>
          </div>

          {/* 3D Pedestal Representation */}
          <div className="relative w-56 h-40 flex items-center justify-center">
            
            {/* Glowing neon aura */}
            <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full filter blur-2xl animate-pulse-slow"></div>

            {/* Pedestal image */}
            <div className="absolute inset-0 animate-float-slow flex items-center justify-center">
              <img src="/un.png" alt="UNAI 3D" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.3)]" />
            </div>

            {/* FLOATING MICRO CARDS */}
            <div className="absolute top-2 -right-6 animate-float-medium bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                <FileText className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold leading-tight">Invoice</p>
                <p className="text-[7px] text-slate-400 font-semibold">Generate</p>
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
          <span>Secure. Encrypted. <span className="text-white font-semibold">Workspace Isolation.</span></span>
        </div>

      </div>

      {/* RIGHT COLUMN: DYNAMIC WORKSPACES & CONTROLS */}
      <div className="flex-1 h-auto md:h-full bg-[#f8fafc] flex flex-col justify-between p-4 md:p-6 relative overflow-y-auto md:overflow-hidden">
        
        {/* Center Dynamic Interface */}
        <div className="my-auto flex items-center justify-center w-full max-w-md mx-auto py-2">
          
          {/* Card Wrapper with Mockup Shadow styling */}
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden transition-all duration-300">
            
            {mustChangeScreen ? (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-6" autoComplete="off">
                <div className="text-center space-y-2 animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-100 mb-2">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Reset Password</h3>
                  <p className="text-xs text-slate-500 font-medium">Please choose a new password for your account.</p>
                </div>

                <div className="space-y-4">
                  {/* Readonly Username Info */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">Employee ID</span>
                    <span className="text-xs font-mono font-bold text-indigo-650">{tempEmployee?.loginId}</span>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-800 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-350 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-350 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="w-1/3"
                      icon={ArrowLeft}
                      onClick={() => {
                        setMustChangeScreen(false);
                        setTempEmployee(null);
                        setTempCompany(null);
                        setErrorMsg('');
                      }}
                      disabled={changePasswordLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white"
                      icon={ArrowRight}
                      disabled={changePasswordLoading}
                    >
                      {changePasswordLoading ? 'Saving...' : 'Set Password'}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 mb-2">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Employee Login</h3>
                  <p className="text-xs text-slate-500 font-medium">Enter your assigned workspace details to log in.</p>
                </div>

                <div className="space-y-4">
                  {/* Company ID */}
                  <div>
                    <label htmlFor="companyCode" className="block text-xs font-semibold text-slate-800 mb-1.5">Company ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="companyCode"
                        name="companyCode"
                        type="text"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. AB3K9X"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest border border-slate-350 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none uppercase"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label htmlFor="employeeLoginId" className="block text-xs font-semibold text-slate-800 mb-1.5">Employee ID</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employeeLoginId"
                        name="employeeLoginId"
                        type="text"
                        value={employeeLoginId}
                        onChange={(e) => setEmployeeLoginId(e.target.value)}
                        placeholder="e.g. john.doe"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-350 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="employeePassword" className="block text-xs font-semibold text-slate-800 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employeePassword"
                        name="employeePassword"
                        type={showPassword ? "text" : "password"}
                        value={employeePassword}
                        onChange={(e) => setEmployeePassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-350 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
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
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      icon={ArrowRight}
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </div>
                </div>
              </form>
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
