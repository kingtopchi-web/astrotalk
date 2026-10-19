import React, { useState } from 'react';
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
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/auth/expert/login'), { email, password });
      login(res.data, res.data.token);
      navigate('/expert/dashboard');
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
        navigate('/expert/dashboard');
      }
    } catch (err) {
      setShowReactivateModal(false);
      setError(err.response?.data?.message || 'Failed to reactivate account. Please try again.');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pt-16 md:pt-20">
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
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 bg-white relative overflow-y-auto">
          <div className="w-full max-w-md relative z-10 py-8 mx-auto my-auto">
          
          <div className="flex items-center justify-between mb-8">
            <Link 
              to="/" 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-bold text-on-surface hover:text-primary transition-all shadow-sm"
              title="Back to Home"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Home</span>
            </Link>
            <Link to="/" className="flex items-center gap-2.5 group">
               <img 
                 src="/logo.png" 
                 alt="ExpertHub Logo" 
                 className="w-9 h-9 object-contain rounded-lg shrink-0 transform group-hover:scale-105 transition-transform" 
               />
               <span className="font-heading font-extrabold text-2xl tracking-tight text-on-background">
                 ExpertHub
               </span>
            </Link>
          </div>

          <div className="mb-6 text-center">
            <h2 className="font-heading font-bold text-3xl text-on-background">Expert Portal</h2>
            <p className="font-body text-on-surface-variant mt-2 text-sm">Sign in to manage your consultations.</p>
          </div>

          <div className="flex p-1 bg-surface-muted border border-border rounded-lg mb-8">
             <button onClick={() => navigate('/login')} className="flex-1 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-background transition-colors">User</button>
             <button className="flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm border border-border/50 text-on-background">Expert</button>
          </div>

          {error && (
             <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
               <span>{error}</span>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-on-background">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline transition-colors">Forgot password?</Link>
              </div>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-body font-semibold text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-4"
            >
              {loading ? 'Signing in...' : 'Sign In as Expert'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-6 font-body">


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
