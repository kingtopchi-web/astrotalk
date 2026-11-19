import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserCheck, X, ArrowRight, Ban, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { getApiUrl } from '../../utils/apiConfig';

const ExpertLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Administrative disciplinary suspension state
  const [showAdminSuspendedModal, setShowAdminSuspendedModal] = useState(false);
  const [adminSuspensionData, setAdminSuspensionData] = useState(null);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Prevent logged in expert from seeing expert login page via back/forward browser buttons
  useEffect(() => {
    if (user && user.role === 'EXPERT') {
      navigate('/expert/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('कृपया आगे बढ़ने से पहले नियम व शर्तों (Rules & Regulations) को स्वीकार करें।');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/expert/login'), { email, password });
      login(res.data, res.data.token);
      navigate('/expert/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.isSuspendedByAdmin) {
        setAdminSuspensionData(data);
        setShowAdminSuspendedModal(true);
      } else if (
        err.response?.status === 403 &&
        (data?.isDeactivated || data?.status === 'SUSPENDED' || (data?.message && data.message.toLowerCase().includes('deactivated')))
      ) {
        setConfirmActivate(false);
        setShowReactivateModal(true);
      } else {
        setError(data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirmActivate) {
      setError('कृपया आगे बढ़ने के लिए "Activate Account" चेकबॉक्स को टिक करें।');
      return;
    }
    setReactivating(true);
    setError('');
    try {
      let res;
      try {
        res = await axios.post(getApiUrl('/auth/expert/login'), { email, password, reactivate: true });
      } catch (loginErr) {
        res = await axios.post(getApiUrl('/auth/expert/reactivate'), { email, password });
      }

      if (res && res.data) {
        setShowReactivateModal(false);
        login(res.data, res.data.token);
        navigate('/expert/dashboard', { replace: true });
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
          {/* Subtle ambient lighting */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col">
            <div className="mb-4">
              <h1 className="font-heading font-extrabold text-4xl xl:text-5xl mb-3 leading-tight text-primary-dark">
                Monetize your expertise.
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Join the elite network of advisors. Manage consultations, track earnings, and grow your client base globally.
              </p>
            </div>
            
            {/* High resolution transparent illustration */}
            <div className="relative w-full flex items-center justify-center pt-2">
              {/* Floor shadow effect to ground the illustration */}
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
          
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <Link 
              to="/" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-bold text-on-surface hover:text-primary transition-all shadow-sm"
              title="Back to Home"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Home</span>
            </Link>
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
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Hub</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600 mt-1.5 leading-none">
                  Expert Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="mb-3 sm:mb-4 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-on-background">Expert Portal</h2>
            <p className="font-body text-on-surface-variant mt-1 text-sm">Sign in to manage your consultations.</p>
          </div>

          <div className="flex p-1 bg-surface-muted border border-border rounded-lg mb-4 sm:mb-5">
             <button onClick={() => navigate('/login')} className="flex-1 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-background transition-colors">User</button>
             <button className="flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm border border-border/50 text-on-background">Expert</button>
          </div>

          {error && (
             <div className="bg-error/10 border border-error/20 text-error px-3.5 py-2 rounded-lg mb-4 text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
               <span>{error}</span>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Email Address</label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-semibold text-on-background">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline transition-colors">Forgot password?</Link>
              </div>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            
            <div className="flex items-start gap-2.5 pt-1 text-left">
              <input
                type="checkbox"
                id="expert-login-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                required
              />
              <label htmlFor="expert-login-terms" className="text-xs text-slate-600 select-none cursor-pointer leading-tight">
                मैं प्लेटफार्म के <Link to="/terms-of-service" target="_blank" className="text-primary font-semibold hover:underline">नियम एवं शर्तों (Rules & Regulations)</Link> तथा <Link to="/privacy-policy" target="_blank" className="text-primary font-semibold hover:underline">प्राइवेसी पॉलिसी</Link> से सहमत हूँ और अपनी सहमति व शर्तों पर लॉगिन कर रहा/रही हूँ।
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || !acceptTerms}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-body font-semibold text-sm sm:text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In as Expert'}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 text-center space-y-3 font-body">
            <p className="text-on-surface-variant text-sm">
              Don't have an expert account?{' '}
              <Link to="/expert/register" className="text-primary font-bold hover:underline">Apply here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>

      {/* Expert Account Reactivation Modal Prompt */}
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
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-200/80 shadow-sm">
                <UserCheck size={28} className="stroke-[2.5]" />
              </div>

              <h3 className="font-heading font-bold text-2xl text-slate-900 mb-1.5">
                Activate Expert Account / अकाउंट सक्रिय करें
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                आपका एक्सपर्ट अकाउंट वर्तमान में निष्क्रिय (Deactivated) है। लॉगिन करके अंदर जाने के लिए कृपया नीचे दिए गए चेकबॉक्स को टिक करें।
              </p>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expert Account</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{email}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full shrink-0">
                  Deactivated
                </span>
              </div>

              {/* Mandatory Checkbox to Activate Account */}
              <label className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 cursor-pointer select-none mb-5 text-left transition-colors hover:bg-amber-50">
                <input
                  type="checkbox"
                  checked={confirmActivate}
                  onChange={(e) => setConfirmActivate(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer accent-amber-600 shrink-0"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  Activate Account / मेरा एक्सपर्ट अकाउंट पुनः सक्रिय (Activate) करें और मुझे लॉगिन करने दें
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowReactivateModal(false)}
                  disabled={reactivating}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm transition-all cursor-pointer"
                >
                  Cancel / रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={!confirmActivate || reactivating}
                  className="flex-1 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
                >
                  {reactivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate & Login</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disciplinary Administrative Suspension Notice Modal */}
      {showAdminSuspendedModal && adminSuspensionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 bg-rose-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-rose-950 leading-tight">
                    Account Temporarily Suspended
                  </h3>
                  <span className="text-xs text-rose-700 font-semibold">
                    Disciplinary Action by Platform Administration
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminSuspendedModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account</span>
                  <span className="font-semibold text-slate-800">{email}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  Suspended
                </span>
              </div>

              {/* Expiry / Duration */}
              {adminSuspensionData.formattedUntil ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-900">
                  <Clock size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold block">Suspension Expiry Date:</span>
                    <span className="text-xs font-extrabold text-amber-950">
                      {adminSuspensionData.formattedUntil}
                    </span>
                    <p className="text-[11px] text-amber-800/80 mt-0.5">
                      Your consultation privileges will be automatically restored after this time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  ⚠️ This account has been suspended indefinitely until cleared by Administration.
                </div>
              )}

              {/* Violation Reason */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Reason for Suspension
                </span>
                <div className="p-3 rounded-xl bg-slate-100 font-bold text-slate-900 text-xs sm:text-sm">
                  {adminSuspensionData.suspensionReason || 'Violation of Expert Code of Conduct'}
                </div>
              </div>

              {/* Official Notice ("kya kiya hai usne") */}
              {adminSuspensionData.suspensionNotice && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Official Notice / Explanation from Administration
                  </span>
                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 text-slate-800 whitespace-pre-wrap leading-relaxed text-xs font-sans">
                    {adminSuspensionData.suspensionNotice}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Self-reactivation is disabled for administrative disciplinary penalties. If you feel this action was taken in error or wish to submit an appeal, please contact platform support.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdminSuspendedModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Understood / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertLogin;
