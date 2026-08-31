import React, { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { loginAsEmployee, getCompanyEmployees, saveCompanyEmployees } from '../services/db';
import { 
  ArrowLeft, ArrowRight, Shield, Lock, Hash, KeyRound,
  FileText, Receipt, CreditCard, BookOpen, Eye, EyeOff, AlertCircle,
  Building2, UserPlus, User
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
    <div className="min-h-screen md:h-screen md:max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-y-auto md:overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] text-white">
      
      {/* LEFT COLUMN / MOBILE HERO: BRANDING & 3D NEON VISUALS */}
      <div className="w-full md:w-[38%] h-auto md:h-full relative overflow-hidden bg-transparent md:bg-gradient-to-br md:from-[#060a22] md:via-[#091540] md:to-[#040817] flex flex-col justify-between p-4 sm:p-6 md:p-8 text-white shrink-0">
        
        {/* Decorative Wave Divider on Desktop */}
        <div className="absolute top-0 bottom-0 right-0 w-20 hidden md:block z-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="none">
            <path d="M100,0 L0,0 C40,150 80,350 80,500 C80,650 40,850 0,1000 L100,1000 Z" fill="#f8fafc" />
          </svg>
        </div>

        {/* Brand Header (Left) & Top-Right Edge Corner Icons (Right) */}
        <div className="flex items-center justify-between relative z-20 w-full mb-3 md:mb-0">
          <div className="flex items-center">
            <img src="/logo.png" alt="UNAI Logo" className="h-10 sm:h-11 w-auto object-contain" />
          </div>

          {/* Top Right Edge Corner Action Icons for Mobile (3 icons) */}
          <div className="flex items-center gap-1.5 md:hidden z-50">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              title="New Company"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 transition-all cursor-pointer border border-indigo-400/30 backdrop-blur-md active:scale-95"
            >
              <Building2 className="w-4 h-4 text-indigo-300" />
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/join')}
              title="Join Company"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-all cursor-pointer border border-emerald-400/30 backdrop-blur-md active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-emerald-300" />
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('employee-portal-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Employee Login"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 transition-all cursor-pointer border border-blue-400/30 backdrop-blur-md active:scale-95"
            >
              <User className="w-4 h-4 text-blue-300" />
            </button>
          </div>
        </div>

        {/* Center 3D Pedestal Visual & Headline */}
        <div className="my-auto py-2 md:py-4 relative z-20 flex flex-col items-center">
          
          <div className="text-center md:text-left w-full max-w-sm mb-4 md:mb-6 space-y-1.5 md:space-y-2">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
              Staff <span className="text-white/80">workspace portal.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400">Collaboration</span> made simple.
            </h2>
            <p className="text-slate-300 md:text-slate-400 text-[11px] leading-relaxed">
              Log in with the credentials assigned by your administrator to access permitted modules and perform operations.
            </p>
          </div>

          <div className="relative w-56 h-36 sm:h-40 flex items-center justify-center my-2">
            <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full filter blur-2xl animate-pulse-slow"></div>

            <div className="absolute inset-0 animate-float-slow flex items-center justify-center">
              <img src="/un.png" alt="UNAI 3D" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.3)]" />
            </div>

            {/* FLOATING MICRO CARDS / LABELS */}
            <div className="absolute top-2 -right-2 sm:-right-6 animate-float-medium bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[8px] sm:text-[9px] font-bold leading-tight">Invoice</p>
                <p className="text-[6px] sm:text-[7px] text-slate-400 font-semibold">Generate</p>
              </div>
            </div>

            <div className="absolute top-10 -left-2 sm:-left-10 animate-float-slow bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-emerald-50 flex items-center justify-center shrink-0">
                <Receipt className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[8px] sm:text-[9px] font-bold leading-tight">Receipt</p>
                <p className="text-[6px] sm:text-[7px] text-slate-400 font-semibold">Slip</p>
              </div>
            </div>

            <div className="absolute bottom-1 -left-2 sm:-left-6 animate-float-fast bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[8px] sm:text-[9px] font-bold leading-tight">Voucher</p>
                <p className="text-[6px] sm:text-[7px] text-slate-400 font-semibold">Credit</p>
              </div>
            </div>

            <div className="absolute bottom-1 -right-2 sm:-right-6 animate-float-slow bg-white/95 text-slate-800 px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1.5">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-purple-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-[8px] sm:text-[9px] font-bold leading-tight">Ledger</p>
                <p className="text-[6px] sm:text-[7px] text-slate-400 font-semibold">Book</p>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Secure Pill */}
        <div className="relative z-20 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 w-fit mx-auto md:mx-0 my-2 md:my-0">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Secure. Encrypted. <span className="text-white font-semibold">Workspace Isolation.</span></span>
        </div>

      </div>

      {/* RIGHT COLUMN: DYNAMIC WORKSPACES & CONTROLS */}
      <div className="flex-1 h-auto md:h-full bg-transparent md:bg-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 relative overflow-y-auto md:overflow-hidden">
        
        {/* Top-Right Action Links on Desktop */}
        <div className="hidden md:flex absolute top-6 right-6 z-50 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            title="New Company"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-705 text-[11px] font-extrabold shadow-sm transition-all cursor-pointer border border-indigo-200/50"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Company</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/join')}
            title="Join Company"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-705 text-[11px] font-extrabold shadow-sm transition-all cursor-pointer border border-emerald-200/50"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Join Company</span>
          </button>
        </div>

        {/* Center Dynamic Interface */}
        <div className="my-auto flex items-center justify-center w-full max-w-md mx-auto py-2">
          
          {/* Card Wrapper: Dark Neon Glass on Mobile, Crisp White Card on Desktop */}
          <div id="employee-portal-card" className="w-full bg-[#0d153a]/80 md:bg-white border border-blue-500/20 md:border-slate-200/80 rounded-2xl shadow-2xl md:shadow-lg p-5 sm:p-6 md:p-8 relative overflow-hidden backdrop-blur-xl md:backdrop-blur-none transition-all duration-300">
            
            {mustChangeScreen ? (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-6" autoComplete="off">
                <div className="text-center space-y-2 animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 md:bg-amber-50 border border-amber-400/20 md:border-amber-100 mb-2">
                    <Lock className="w-6 h-6 text-amber-400 md:text-amber-600" />
                  </div>
                  <h3 className="font-bold text-white md:text-slate-900 text-lg">Reset Password</h3>
                  <p className="text-xs text-slate-300 md:text-slate-500 font-medium">Please choose a new password for your account.</p>
                </div>

                <div className="space-y-4">
                  {/* Readonly Username Info */}
                  <div className="bg-[#070c24]/80 md:bg-slate-50 border border-blue-900/60 md:border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 md:text-slate-500">Employee ID</span>
                    <span className="text-xs font-mono font-bold text-indigo-300 md:text-indigo-650">{tempEmployee?.loginId}</span>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-200 md:text-slate-800 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#070c24]/80 md:bg-white border border-blue-900/60 md:border-slate-350 text-white md:text-slate-900 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-200 md:text-slate-800 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#070c24]/80 md:bg-white border border-blue-900/60 md:border-slate-350 text-white md:text-slate-900 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 md:hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-500/10 md:bg-rose-50 border border-rose-500/30 md:border-rose-250 text-rose-300 md:text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 md:text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="w-1/3 text-white border-white/20 md:text-slate-700 md:border-slate-200"
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
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 md:bg-indigo-650 text-white"
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
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 md:bg-indigo-50 border border-indigo-400/20 md:border-indigo-100 mb-2">
                    <KeyRound className="w-6 h-6 text-indigo-400 md:text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-white md:text-slate-900 text-lg">Employee Login</h3>
                  <p className="text-xs text-slate-300 md:text-slate-500 font-medium">Enter your assigned workspace details to log in.</p>
                </div>

                <div className="space-y-4">
                  {/* Company ID */}
                  <div>
                    <label htmlFor="companyCode" className="block text-xs font-semibold text-slate-200 md:text-slate-800 mb-1.5">Company ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="companyCode"
                        name="companyCode"
                        type="text"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. AB3K9X"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest bg-[#070c24]/80 md:bg-white border border-blue-900/60 md:border-slate-350 text-white md:text-slate-900 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none uppercase"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label htmlFor="employeeLoginId" className="block text-xs font-semibold text-slate-200 md:text-slate-800 mb-1.5">Employee ID</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employeeLoginId"
                        name="employeeLoginId"
                        type="text"
                        value={employeeLoginId}
                        onChange={(e) => setEmployeeLoginId(e.target.value)}
                        placeholder="e.g. john.doe"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#070c24]/80 md:bg-white border border-blue-900/60 md:border-slate-350 text-white md:text-slate-900 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="employeePassword" className="block text-xs font-semibold text-slate-200 md:text-slate-800 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="employeePassword"
                        name="employeePassword"
                        type={showPassword ? "text" : "password"}
                        value={employeePassword}
                        onChange={(e) => setEmployeePassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-[#070c24]/80 md:bg-white border border-blue-900/60 md:border-slate-350 text-white md:text-slate-900 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 md:hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-500/10 md:bg-rose-50 border border-rose-500/30 md:border-rose-250 text-rose-300 md:text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 md:text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="w-1/3 text-white border-white/20 md:text-slate-700 md:border-slate-200"
                      icon={ArrowLeft}
                      onClick={() => navigate('/')}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 md:bg-indigo-600 text-white"
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
        <div className="text-center text-[10px] text-slate-400 md:text-slate-400 font-medium py-3 relative z-20">
          © 2026 UNAI Billing. All rights reserved.
        </div>

      </div>

    </div>
  );
};
