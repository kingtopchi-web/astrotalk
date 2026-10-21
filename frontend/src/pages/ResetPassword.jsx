import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Header from '../components/Header';
import { getApiUrl } from '../utils/apiConfig';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState('USER');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(getApiUrl(`/auth/resetpassword/${token}`), {
        password
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        if (res.data.role) {
          setRole(res.data.role);
        }
      } else {
        setError(res.data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired password reset link. Please request a new one.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pt-16 md:pt-20 font-sans">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding/Illustration */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f0f4fa] via-[#eaf0fa] to-[#f4f7fc] flex-col justify-center px-12 xl:px-16 py-8 relative overflow-hidden">
          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading font-extrabold text-4xl xl:text-5xl mb-3 leading-tight text-slate-900">
                Secure Your<br />Account
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Choose a strong new password to keep your consultations and profile safe.
              </p>
            </div>
            
            <div className="relative w-full flex items-center justify-center pt-4">
              <div className="w-64 h-64 rounded-3xl bg-white/70 backdrop-blur-md shadow-xl border border-white/60 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                  <KeyRound size={40} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Bank-Grade Security</h4>
                <p className="text-xs text-slate-500 mt-1">
                  All passwords are cryptographically hashed using salted bcrypt algorithms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
          <div className="w-full max-w-md relative z-10 py-6">

            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-3.5 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 group-hover:shadow-lg group-hover:border-amber-400/50 transition-all duration-300">
                  <div className="w-full h-full overflow-hidden rounded-xl flex items-center justify-center bg-slate-50/50">
                    <img 
                      src="/logo.png" 
                      alt="ExpertHub Logo" 
                      className="w-full h-full object-cover object-[center_16%] scale-[1.55]" 
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-none">
                    Expert<span className="text-amber-500">Hub</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                    Real Experts • Real Guidance
                  </span>
                </div>
              </Link>
            </div>

            {/* Header / Titles */}
            <div className="mb-6 text-center">
              <h2 className="font-heading font-bold text-3xl text-slate-900">
                {success ? 'Password Reset!' : 'Set New Password'}
              </h2>
              <p className="font-body text-slate-500 mt-2 text-sm">
                {success 
                  ? 'Your password has been updated securely.' 
                  : 'Enter your new credentials below to regain access.'}
              </p>
            </div>

            {/* Success Card */}
            {success ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-5 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-emerald-900">Password Changed Successfully</h3>
                  <p className="text-sm text-emerald-700/80 mt-1">
                    You can now use your new password to sign in to your {role === 'EXPERT' ? 'Expert' : 'User'} account.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={() => navigate(role === 'EXPERT' ? '/expert/login' : '/login')}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    Go to {role === 'EXPERT' ? 'Expert Login' : 'Login'}
                  </button>
                  <Link
                    to="/"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              /* Reset Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>{error}</p>
                      {error.includes('expired') && (
                        <Link to="/forgot-password" className="text-xs font-bold text-red-800 underline mt-1 inline-block">
                          Request a new link
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>

                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
