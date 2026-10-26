import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('https://experthub.nextgoodtechnologies.in/api/auth/user/register', { name, email, password, mobile });
      login(res.data, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          {/* Subtle ambient lighting */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col">
            <div className="mb-4">
              <h1 className="font-heading font-extrabold text-4xl xl:text-5xl mb-3 leading-tight text-primary-dark">
                Better Advice<br/>Better Decisions
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Access to verified experts, whenever you need them.
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
          
          <div className="flex justify-center mb-4 sm:mb-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 group-hover:shadow-md group-hover:border-amber-400/50 transition-all duration-300">
                <div className="w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-slate-50/50">
                  <img 
                    src="/logo.png" 
                    alt="ExpertHub Logo" 
                    className="w-full h-full object-cover object-[center_16%] scale-[1.55]" 
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-none">
                  Expert<span className="text-amber-500">Hub</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Real Experts • Real Guidance
                </span>
              </div>
            </Link>
          </div>

          <div className="mb-3 sm:mb-4 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-on-background">Create Your Account</h2>
            <p className="font-body text-on-surface-variant mt-1 text-sm">Join our community of experts and seekers</p>
          </div>

          <div className="flex p-1 bg-surface-muted border border-border rounded-lg mb-4 sm:mb-5">
             <button className="flex-1 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm border border-border/50 text-on-background">User</button>
             <button onClick={() => navigate('/expert/register')} className="flex-1 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-background transition-colors">Expert</button>
          </div>

          {error && (
             <div className="bg-error/10 border border-error/20 text-error px-3.5 py-2 rounded-lg mb-4 text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
               <span>{error}</span>
             </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Full Name</label>
              <input
                type="text"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Email Address</label>
              <input
                type="email"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Password</label>
              <input
                type="password"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                placeholder="Create a password"
              />
            </div>

            <div className="flex items-start gap-2 pt-1 pb-1">
               <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
               <label htmlFor="terms" className="text-xs text-on-surface-variant">
                 I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
               </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-body font-semibold text-sm sm:text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-1"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 text-center space-y-3 font-body">
            <p className="text-on-surface-variant text-sm">
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
