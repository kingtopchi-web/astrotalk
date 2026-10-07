import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const ExpertLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://astrotalk-hlg2.onrender.com/api/auth/expert/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data, data.token);
        navigate('/expert/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pt-16 md:pt-20">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding/Image */}
        <div className="hidden lg:flex w-1/2 bg-[#f0f4fa] flex-col justify-center p-12 relative">
        <div className="relative z-10 text-on-background mb-10 max-w-lg mx-auto">
          <h1 className="font-heading font-extrabold text-5xl mb-6 leading-tight text-primary-dark">
            Monetize your expertise.
          </h1>
          <p className="font-body text-lg text-slate-600 max-w-sm">
            Join the elite network of advisors. Manage consultations, track earnings, and grow your client base globally.
          </p>
        </div>
        
        {/* Placeholder for illustration */}
        <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-4">
          <img src="/login-illustration.png" alt="Illustration" className="w-[95%] h-auto object-contain" />
        </div>
      </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 bg-white relative overflow-y-auto">
          <div className="w-full max-w-md relative z-10 py-8 mx-auto my-auto">
          
          <div className="flex justify-center mb-10">
            <Link to="/" className="flex items-center gap-2 group">
               <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                 <span className="material-symbols-outlined font-light text-[20px]">hub</span>
               </div>
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
    </div>
  );
};

export default ExpertLogin;
