import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('https://astrotalk-hlg2.onrender.com/api/auth/user/login', { email, password });
      login(res.data, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            Better Advice<br/>Better Decisions
          </h1>
          <p className="font-body text-lg text-slate-600 max-w-sm">
            Access to verified experts, whenever you need them.
          </p>
        </div>
        
        {/* Placeholder for illustration */}
        <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-4">
          <img src="/login-illustration.png" alt="Illustration" className="w-[95%] h-auto object-contain" />
        </div>
      </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
          <div className="w-full max-w-md relative z-10 py-8">
          
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

          <div className="mb-8 text-center">
            <h2 className="font-heading font-bold text-3xl text-on-background">Welcome Back!</h2>
            <p className="font-body text-on-surface-variant mt-2 text-sm">Login to your account to continue</p>
          </div>

          {error && (
             <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm flex items-start gap-2">
               <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
               <span>{error}</span>
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="@enter your email"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <Link to="/forgot-password" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors">Forgot Password?</Link>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-body font-semibold text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-6 font-body">


            <p className="text-on-surface-variant text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">Register</Link>
            </p>
            
            <div className="pt-2">
               <Link to="/expert/login" className="text-xs text-on-surface-variant hover:text-primary transition-colors underline">
                 Login as an Expert instead
               </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Login;
