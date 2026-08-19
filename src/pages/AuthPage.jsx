import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, FileText, Receipt, CreditCard, BookOpen,
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2
} from 'lucide-react';

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, fullName);
        setSuccess('Account created! Please check your email to confirm, then log in.');
        setMode('login');
      } else {
        await signIn(email, password);
        // Auth state change will redirect automatically
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col md:flex-row bg-[#080d27] font-sans overflow-hidden">
      
      {/* LEFT COLUMN: BRANDING */}
      <div className="w-full md:w-[38%] h-full relative overflow-hidden bg-gradient-to-br from-[#060a22] via-[#091540] to-[#040817] flex flex-col justify-between p-6 md:p-8 text-white shrink-0">
        {/* Decorative Wave Divider */}
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

        {/* Center 3D Pedestal */}
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

      {/* RIGHT COLUMN: AUTH FORM */}
      <div className="flex-1 h-full bg-[#f8fafc] flex flex-col justify-between p-4 md:p-6 relative overflow-auto">
        <div className="my-auto flex items-center justify-center w-full max-w-md mx-auto py-4">
          <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h3>
              <p className="text-slate-400 text-[11px] font-medium">
                {mode === 'login'
                  ? 'Sign in to access your billing workspace'
                  : 'Get started with UNAI Billing for free'}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold px-3 py-2 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-3 py-2 rounded-xl">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="auth-fullname"
                      name="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#3b2ae0] hover:bg-[#3223c6] disabled:bg-slate-300 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center text-[11px] text-slate-500 font-medium">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                    className="text-[#3b2ae0] font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className="text-[#3b2ae0] font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium mt-4 md:mt-0 relative z-20">
          © 2026 UNAI Billing. All rights reserved.
        </div>
      </div>
    </div>
  );
};
