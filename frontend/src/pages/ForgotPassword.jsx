import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import Header from '../components/Header';
import { getApiUrl } from '../utils/apiConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedRole, setDetectedRole] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(getApiUrl('/auth/forgotpassword'), { email });

      if (res.data && res.data.success) {
        setSubmitted(true);
        if (res.data.role) setDetectedRole(res.data.role);
      } else {
        setError(res.data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pt-16 md:pt-20 font-sans">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f0f4fa] via-[#eaf0fa] to-[#f4f7fc] flex-col justify-center px-12 xl:px-16 py-8 relative overflow-hidden">
          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col text-left">
            <div className="mb-6">
              <h1 className="font-heading font-extrabold text-4xl xl:text-5xl mb-3 leading-tight text-slate-900">
                Don't worry,<br/>we've got you.
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Enter your registered email address and we'll send you a secure link to reset your account password.
              </p>
            </div>

            <div className="relative w-full flex items-center justify-center pt-4">
              <div className="w-64 h-64 rounded-3xl bg-white/70 backdrop-blur-md shadow-xl border border-white/60 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-sm">
                  <KeyRound size={40} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Universal Account Recovery</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Works for both registered Users & Verified Expert Consultant accounts.
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

            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-3xl text-slate-900 mb-2">Reset Password</h2>
              <p className="font-body text-slate-500 text-sm">
                Enter your email address (User or Expert)
              </p>
            </div>

            {submitted ? (
              <div className="text-center space-y-6 animate-in fade-in duration-300">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-bold text-xl text-emerald-900">Check your email</h3>
                  <p className="text-emerald-700/80 text-sm">
                    We've sent password reset instructions for your {detectedRole === 'EXPERT' ? 'Expert' : 'User'} account to <strong>{email}</strong>.
                  </p>
                  <p className="text-xs text-emerald-600 pt-2">
                    The reset link is valid for 15 minutes.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Link 
                    to="/login" 
                    className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm text-center"
                  >
                    Back to User Login
                  </Link>
                  <Link 
                    to="/expert/login" 
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm text-center"
                  >
                    Back to Expert Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm placeholder-slate-400"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg mt-3 disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-4">
                  <Link to="/login" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                    <ArrowLeft size={13} /> User Login
                  </Link>
                  <Link to="/expert/login" className="hover:text-amber-600 transition-colors">
                    Expert Login &rarr;
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
