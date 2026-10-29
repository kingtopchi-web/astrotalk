import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserCheck, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { getApiUrl } from '../../utils/apiConfig';

const ExpertLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Prevent logged in users from seeing login page via back/forward browser buttons
  useEffect(() => {
    if (user) {
      navigate(user.role === 'EXPERT' ? '/expert/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/expert/login'), { email, password });
      login(res.data, res.data.token);
      navigate('/expert/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (
        err.response?.status === 403 &&
        (data?.isDeactivated || data?.status === 'SUSPENDED' || (data?.message && data.message.toLowerCase().includes('deactivated')))
      ) {
        setShowReactivateModal(true);
      } else {
        setError(data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    setError('');
    try {
      let res;
      try {
        res = await axios.post(getApiUrl('/auth/expert/reactivate'), { email, password });
      } catch (endpointErr) {
        res = await axios.post(getApiUrl('/auth/expert/login'), { email, password, reactivate: true });
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

            <button 
              type="submit" 
              disabled={loading}
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
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 border border-amber-200/80 shadow-sm">
                <UserCheck size={28} className="stroke-[2.5]" />
              </div>

              <h3 className="font-heading font-bold text-2xl text-slate-900 mb-2">
                Reactivate Expert Account?
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                Your account is currently deactivated. Would you like to reactivate it?
              </p>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-6 flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Expert Account</p>
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
                  {reactivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Reactivating...</span>
                    </>
                  ) : (
                    <>
                      <span>Yes, Reactivate</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertLogin;
