import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  LogIn
} from 'lucide-react';

export default function RegisterPage({ onNavigateHome, onNavigateLogin, onRegistrationSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    marketingOptIn: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const phoneRegex = /^[0-9+()\-\s]{7,20}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile phone number is required.';
    } else if (!phoneRegex.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid phone number (7-20 digits, e.g. +94771234567).';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirming your password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear specific field error as user types
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
    setSuccessBanner(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          marketingOptIn: formData.marketingOptIn,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Requirement 1: Show short success notification and automatically redirect to login
        // Do NOT display customer's ID, name, email, mobile number or detailed card
        setSuccessBanner('Registration successful! Redirecting you to the login page...');
        setTimeout(() => {
          if (onRegistrationSuccess) {
            onRegistrationSuccess('Registration successful! Please sign in with your email or mobile.');
          } else if (onNavigateLogin) {
            onNavigateLogin();
          }
        }, 1200);
      } else {
        // Requirement 1: Stay on form and display error when registration fails
        if (data.validationErrors && Object.keys(data.validationErrors).length > 0) {
          setErrors(data.validationErrors);
        }
        setGeneralError(data.message || 'Registration failed. Please verify your details.');
      }
    } catch (err) {
      console.error('Registration network error:', err);
      setGeneralError('Cannot connect to the SuperMart backend server. Please verify the backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'bg-slate-200', width: 'w-0' };
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-500', width: 'w-1/4' };
    const hasNum = /\d/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const strengthScore = [hasNum, hasUpper, hasSpecial].filter(Boolean).length;

    if (strengthScore === 0) return { label: 'Weak', color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 1 || strengthScore === 2) return { label: 'Good', color: 'bg-emerald-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-emerald-600', width: 'w-full' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-slate-50 text-slate-900">
      {/* Navigation Bar */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors py-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store Home
        </button>
        <button
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          Already registered? Sign In
        </button>
      </div>

      <header className="mb-6 text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Fresh • Everyday Wholesale Prices • Express Delivery
        </div>
        <div 
          className="flex items-center justify-center gap-3 cursor-pointer"
          onClick={onNavigateHome}
          title="Back to SuperMart Home"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            SuperMart Online
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-slate-600 font-medium">
          Customer Registration Portal
        </p>
      </header>

      {/* Main Form Container */}
      <div className="w-full max-w-xl">
        <div 
          id="registration-card"
          className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-10 shadow-xl relative"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Create Customer Account</h2>
            <p className="text-slate-600 text-sm mt-1">
              Fill in your details below. Once registered, you will be redirected to sign in.
            </p>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div 
              id="registration-success-banner"
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="font-bold">{successBanner}</p>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-xs font-bold underline hover:text-emerald-950 mt-1 cursor-pointer"
                >
                  Click here if you are not redirected automatically &rarr;
                </button>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div 
              id="registration-error-alert"
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-bold">Unable to register</p>
                <p className="text-xs text-red-700 mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="first-name-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="first-name-input"
                    type="text"
                    name="firstName"
                    disabled={Boolean(successBanner)}
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Kasun"
                    className={`w-full bg-slate-50 border ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last-name-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="last-name-input"
                    type="text"
                    name="lastName"
                    disabled={Boolean(successBanner)}
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Perera"
                    className={`w-full bg-slate-50 border ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="mobile-input"
                  type="tel"
                  name="mobile"
                  disabled={Boolean(successBanner)}
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. +94771234567"
                  className={`w-full bg-slate-50 border ${errors.mobile ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.mobile}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  name="email"
                  disabled={Boolean(successBanner)}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. kasun.perera@example.com"
                  className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  disabled={Boolean(successBanner)}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
                <button
                  id="toggle-password-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${pwdStrength.color} transition-all duration-300 ${pwdStrength.width}`} />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Strength: <span className="font-bold text-slate-800">{pwdStrength.label}</span>
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password-input" className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  disabled={Boolean(successBanner)}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-emerald-600'} rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all`}
                />
                <button
                  id="toggle-confirm-password-btn"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Marketing Opt-in */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="marketing-opt-in-checkbox"
                  type="checkbox"
                  name="marketingOptIn"
                  disabled={Boolean(successBanner)}
                  checked={formData.marketingOptIn}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600/20 transition-colors"
                />
                <span className="text-xs text-slate-600 font-medium leading-relaxed">
                  Keep me updated on SuperMart discounts, seasonal grocery promotions, and personalized coupons.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading || Boolean(successBanner)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
            <span>Already have an account?</span>
            <button
              onClick={onNavigateLogin}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SuperMart Online Inc. All rights reserved. • Role Isolation Active
      </footer>
    </div>
  );
}
