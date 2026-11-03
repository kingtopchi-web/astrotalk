import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { UserCheck, X, ArrowRight, Mail, KeyRound, Edit2, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { getApiUrl } from '../utils/apiConfig';

function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = new URLSearchParams(location.search).get('redirect') || location.state?.from || (user?.role === 'EXPERT' ? '/expert/dashboard' : '/dashboard');

  // Prevent logged in client users from seeing login page via back/forward browser buttons
  useEffect(() => {
    if (user && user.role === 'USER') {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email (Gmail)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/send-otp'), {
        email: email.trim(),
        purpose: 'login'
      });

      setSuccessMsg(res.data?.message || 'Verification code sent to your email!');
      setStep('OTP');
      setResendCooldown(45); // 45 seconds countdown before resend
    } catch (err) {
      const data = err.response?.data;
      if (data?.notRegistered) {
        setError('No account found with this email. Please register first.');
      } else {
        setError(data?.message || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit code received on your email');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/verify-otp-login'), {
        email: email.trim(),
        otp: otp.trim()
      });

      login(res.data, res.data.token);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (
        err.response?.status === 403 &&
        (data?.isDeactivated || data?.status === 'SUSPENDED' || (data?.message && data.message.toLowerCase().includes('deactivated')))
      ) {
        setShowReactivateModal(true);
      } else {
        setError(data?.message || 'Invalid or expired code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    setError('');
    try {
      const res = await axios.post(getApiUrl('/auth/verify-otp-login'), {
        email: email.trim(),
        otp: otp.trim()
      });

      if (res && res.data) {
        setShowReactivateModal(false);
        login(res.data, res.data.token);
        navigate(redirectTarget, { replace: true });
      }
    } catch (err) {
      setShowReactivateModal(false);
      setError(err.response?.data?.message || 'Failed to reactivate account. Please try again.');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pt-16 md:pt-20">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding/Image */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f0f4fa] via-[#eaf0fa] to-[#f4f7fc] flex-col justify-center px-12 xl:px-16 py-8 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col">
            <div className="mb-4">
              <h1 className="font-heading font-extrabold text-4xl xl:text-5xl mb-3 leading-tight text-primary-dark">
                Better Advice<br/>Better Decisions
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Access to verified experts, whenever you need them. Fast, password-less & secure sign in.
              </p>
            </div>
            
            <div className="relative w-full flex items-center justify-center pt-2">
              <div className="absolute bottom-1 w-[85%] h-7 bg-slate-400/25 rounded-[100%] blur-md pointer-events-none" />
              <img 
                src="/login-illustration.png" 
                alt="Consultant Illustration" 
                className="w-full h-auto max-h-[500px] xl:max-h-[530px] object-contain drop-shadow-[0_15px_25px_rgba(15,23,42,0.08)] hover:scale-[1.02] transition-transform duration-300 relative z-10" 
              />
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-white relative overflow-y-auto">
          <div className="w-full max-w-[420px] relative z-10 py-4 sm:py-6 mx-auto my-auto">
          
          <div className="flex justify-center mb-5 sm:mb-6">
            <Link to="/" className="flex items-center gap-3.5 group select-none">
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="ExpertHub Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-2xl sm:text-[26px] tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-none flex items-center gap-1">
                  <span>Expert</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Hub</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mt-1.5 leading-none">
                  Real Guidance
                </span>
              </div>
            </Link>
          </div>

          <div className="mb-4 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-on-background">
              {step === 'EMAIL' ? 'Welcome Back' : 'Enter Verification Code'}
            </h2>
            <p className="font-body text-on-surface-variant mt-1 text-sm">
              {step === 'EMAIL' 
                ? 'Sign in securely with Gmail OTP or Social Accounts' 
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Social Auth Buttons (Google & Facebook) */}
          <div className="mb-4">
            <SocialAuthButtons redirectTarget={redirectTarget} onError={(msg) => setError(msg)} />
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl mb-4 text-sm flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('register') && (
                  <div className="mt-1">
                    <Link to="/register" className="text-primary font-bold hover:underline text-xs">
                      Click here to Register &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl mb-4 text-sm flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">Email Address (Gmail)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 font-body text-sm placeholder-slate-400 shadow-2xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-body font-bold text-sm sm:text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-2 shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium truncate max-w-[220px]">{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep('EMAIL'); setOtp(''); setError(''); }}
                  className="text-primary hover:text-primary-dark font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} />
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="text"
                    maxLength="6"
                    inputMode="numeric"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 font-heading text-lg tracking-[6px] font-bold placeholder-slate-300 shadow-2xs"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="••••••"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length < 4}
                className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-body font-bold text-sm sm:text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-2 shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Resend code in <strong className="text-slate-600">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-xs font-bold text-primary hover:text-primary-dark hover:underline cursor-pointer"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-5 text-center space-y-3 font-body">
            <p className="text-slate-600 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">Register</Link>
            </p>
            
            <div>
               <Link to="/expert/login" className="text-xs text-slate-500 hover:text-primary transition-colors underline">
                 Login as an Expert instead
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Account Reactivation Modal Prompt */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setShowReactivateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 border border-amber-200/80 shadow-sm">
                <UserCheck size={28} className="stroke-[2.5]" />
              </div>

              <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">
                Reactivate Your Account?
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                Your account is currently deactivated. Would you like to reactivate it?
              </p>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-6 flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Account</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{email}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full shrink-0">
                  Deactivated
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowReactivateModal(false)}
                  disabled={reactivating}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="flex-1 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {reactivating ? 'Reactivating...' : 'Yes, Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
