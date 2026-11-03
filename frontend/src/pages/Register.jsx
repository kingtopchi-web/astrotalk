import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, User, Phone, KeyRound, ArrowRight, RotateCw, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { getApiUrl } from '../utils/apiConfig';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('DETAILS'); // 'DETAILS' | 'OTP'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Prevent logged in users from seeing register page via back/forward browser buttons
  useEffect(() => {
    if (user) {
      navigate(user.role === 'EXPERT' ? '/expert/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email for Registration
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/send-otp'), {
        email: email.trim(),
        purpose: 'register'
      });

      setSuccessMsg(res.data?.message || 'Verification code sent to your email!');
      setStep('OTP');
      setResendCooldown(45);
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyRegistered) {
        setError('An account with this email already exists. Please login instead.');
      } else {
        setError(data?.message || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Create Account (No Password Needed!)
  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit verification code received on your email');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/verify-otp-register'), {
        name: name.trim(),
        email: email.trim(),
        otp: otp.trim(),
        mobile: mobile.trim() || undefined
      });

      login(res.data, res.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
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
                Join thousands getting verified consultations. Quick 1-minute OTP registration without passwords.
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

        {/* Right side - Form */}
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

          <div className="mb-3 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-on-background">
              {step === 'DETAILS' ? 'Create Your Account' : 'Verify Your Email'}
            </h2>
            <p className="font-body text-on-surface-variant mt-1 text-sm">
              {step === 'DETAILS' 
                ? 'Join our community with simple Email OTP registration' 
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* User / Expert Switcher */}
          <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl mb-4">
             <button className="flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-white shadow-xs text-slate-900 cursor-default">User</button>
             <button onClick={() => navigate('/expert/register')} className="flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Expert</button>
          </div>

          {/* Social Auth Buttons (Google & Facebook) */}
          <div className="mb-4">
            <SocialAuthButtons redirectTarget="/dashboard" onError={(msg) => setError(msg)} />
          </div>

          {/* Error and Success Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl mb-4 text-sm flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('login') && (
                  <div className="mt-1">
                    <Link to="/login" className="text-primary font-bold hover:underline text-xs">
                      Click here to Login &rarr;
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

          {/* STEP 1: Enter Details (NO PASSWORD FIELD) */}
          {step === 'DETAILS' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">Full Name *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 font-body text-sm placeholder-slate-400 shadow-2xs"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">Email Address (Gmail) *</label>
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
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 font-body text-sm placeholder-slate-400 shadow-2xs"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                 <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
                 <label htmlFor="terms" className="text-xs text-slate-600">
                   I agree to the <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                 </label>
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
            <form onSubmit={handleVerifyRegister} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="block font-bold text-slate-800">{name}</span>
                  <span className="text-slate-500 font-medium truncate max-w-[200px] block">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('DETAILS'); setOtp(''); setError(''); }}
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
                    <span>Verifying & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Create Account</span>
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
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Register;
