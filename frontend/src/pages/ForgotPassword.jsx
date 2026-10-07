import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://astrotalk-hlg2.onrender.com/api/auth/user/forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pt-16 md:pt-20">
      <Header />
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side */}
        <div className="hidden lg:flex w-1/2 bg-[#f0f4fa] flex-col justify-center p-12 relative">
          <div className="relative z-10 text-on-background mb-10 max-w-lg mx-auto text-center">
            <h1 className="font-heading font-extrabold text-5xl mb-6 leading-tight text-primary-dark">
              Don't worry,<br/>we've got you.
            </h1>
            <p className="font-body text-lg text-on-surface/80">
              Enter your email address and we'll send you a link to reset your password safely.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
          <div className="w-full max-w-md relative z-10 py-8">
            
            <div className="flex justify-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-4xl">lock_reset</span>
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="font-heading font-bold text-3xl text-on-background mb-3">Reset Password</h2>
              <p className="font-body text-on-surface/60 text-sm">
                Enter the email associated with your account
              </p>
            </div>

            {submitted ? (
              <div className="text-center space-y-6">
                <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                  <span className="material-symbols-outlined text-green-500 text-5xl mb-4">mark_email_read</span>
                  <h3 className="font-heading font-bold text-xl text-green-800 mb-2">Check your email</h3>
                  <p className="text-green-700/80 text-sm">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                </div>
                <Link to="/login" className="inline-block w-full py-4 bg-primary-dark text-white font-semibold rounded-xl hover:bg-primary transition-colors shadow-md">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
                    {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block font-body text-sm font-semibold text-on-surface">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface/40 text-xl">mail</span>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-border/60 bg-background/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body text-on-surface"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary-dark text-white font-semibold rounded-xl hover:bg-primary transition-all shadow-md hover:shadow-lg transform active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="text-center pt-6">
                  <Link to="/login" className="font-body text-sm font-medium text-primary hover:text-primary-dark transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Login
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
