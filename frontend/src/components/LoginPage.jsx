import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  UserPlus,
  ShieldCheck
} from 'lucide-react';

export default function LoginPage({ onNavigateHome, onNavigateRegister, onLoginSuccess, noticeMessage }) {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or mobile number is required.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Ensures HttpOnly JSESSIONID session cookie is set
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Successful login: authenticated session established via HttpOnly cookie
        onLoginSuccess(data.data);
      } else {
        // Generic error on invalid credentials or specific status error
        setGeneralError(data.message || 'Invalid email/mobile number or password.');
      }
    } catch (err) {
      console.error('Login network error:', err);
      setGeneralError('Cannot connect to the SuperMart backend server. Please verify the backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-slate-50 text-slate-900">
      {/* Navigation Bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors py-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store Home
        </button>
        <button
          onClick={onNavigateRegister}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Account
        </button>
      </div>

      <header className="mb-6 text-center max-w-md">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          SuperMart Online • Customer Sign In
        </div>
        <div 
          className="flex items-center justify-center gap-3 cursor-pointer"
          onClick={onNavigateHome}
          title="Back to SuperMart Home"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            SuperMart Online
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-slate-600 font-medium">
          Sign in to your account to shop, access your cart, and place orders.
        </p>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-md">
        <div 
          id="login-card"
          className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-9 shadow-xl relative"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Customer Sign In</h2>
            <p className="text-slate-600 text-sm mt-1">
              Enter your registered email address or mobile phone number.
            </p>
          </div>

          {/* Notice Banner (e.g. redirected from registration or cart guard) */}
          {noticeMessage && (
            <div 
              id="login-notice-banner"
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <p className="font-semibold text-xs leading-relaxed">{noticeMessage}</p>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div 
              id="login-error-alert"
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-bold">Sign In Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Identifier: Email OR Mobile */}
            <div>
              <label htmlFor="login-identifier-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Email Address or Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-identifier-input"
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="e.g. kasun@example.com or +94771234567"
                  className={`w-full bg-slate-50 border ${errors.identifier ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
                <button
                  id="toggle-login-password-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to SuperMart</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Sign-in Pills for Evaluation */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick 1-Click Fill for Evaluation:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ identifier: 'admin@supermart.com', password: 'Admin@1234' })}
                  className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-[11px]">Super Admin</span>
                  <span className="text-[10px] text-purple-600 font-mono">admin@supermart.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ identifier: 'manager@supermart.com', password: 'Manager@1234' })}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold block text-[11px]">Warehouse Manager</span>
                  <span className="text-[10px] text-emerald-600 font-mono">manager@supermart.com</span>
                </button>
              </div>
            </div>
          </form>

          {/* Security & Register Prompt */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600 space-y-2">
            <div>
              <span>New to SuperMart Online? </span>
              <button
                id="go-to-register-link"
                onClick={onNavigateRegister}
                className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Register as Customer
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by BCrypt & Secure HttpOnly Sessions</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SuperMart Online Inc. All rights reserved. • Role Isolation Active
      </footer>
    </div>
  );
}
