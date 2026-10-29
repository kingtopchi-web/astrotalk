import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

const ExpertRegister = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', specialty: '', mobile: '',
    categoryId: '', subCategoryId: ''
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Prevent logged in users from seeing register page via back/forward browser buttons
  useEffect(() => {
    if (user) {
      navigate(user.role === 'EXPERT' ? '/expert/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetch('https://experthub.nextgoodtechnologies.in/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleCategoryChange = async (catId) => {
    setFormData(f => ({ ...f, categoryId: catId, subCategoryId: '' }));
    if (catId) {
      try {
        const res = await fetch(`https://experthub.nextgoodtechnologies.in/api/categories/${catId}/subcategories`);
        const data = await res.json();
        setSubCategories(Array.isArray(data) ? data : []);
      } catch { setSubCategories([]); }
    } else {
      setSubCategories([]);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('https://experthub.nextgoodtechnologies.in/api/auth/expert/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        login(data, data.token);
        navigate('/expert/dashboard', { replace: true });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
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
                Monetize your expertise.
              </h1>
              <p className="font-body text-base xl:text-lg text-slate-600 max-w-md leading-relaxed">
                Join our verified professional network. Offer your services to a global audience and grow your practice.
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-white relative">
        <div className="w-full max-w-[440px] relative z-10 py-4 sm:py-6">
          
          <div className="flex justify-center mb-4 sm:mb-5">
            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="w-13 h-13 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="ExpertHub Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-on-background leading-none">
                  Expert<span className="text-amber-500">Hub</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1 leading-none">
                  Expert Registration
                </span>
              </div>
            </Link>
          </div>

          <div className="mb-3 sm:mb-4 text-center">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-on-background">Expert Application</h2>
            <p className="font-body text-on-surface-variant mt-1 text-sm">Fill in your details to join our platform.</p>
          </div>

          <div className="flex p-1 bg-surface-muted border border-border rounded-lg mb-4 sm:mb-5">
             <button onClick={() => navigate('/register')} className="flex-1 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-background transition-colors">User</button>
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
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Full Name</label>
              <input
                name="name"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Dr. Jane Smith"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Email Address</label>
              <input
                name="email"
                type="email"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="expert@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Mobile Number</label>
              <input
                name="mobile"
                type="tel"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm appearance-none"
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {subCategories.length > 0 && (
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-on-background">Sub-category</label>
                <select
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm appearance-none"
                >
                  <option value="">Select a sub-category</option>
                  {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Specialty</label>
              <input
                name="specialty"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.specialty}
                onChange={handleChange}
                required
                placeholder="e.g. Business Coach"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs sm:text-sm font-semibold text-on-background">Password</label>
              <input
                name="password"
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Create a strong password"
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
              {loading ? 'Submitting...' : 'Apply as Expert'}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 text-center space-y-3 font-body">
            <p className="text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link to="/expert/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ExpertRegister;
