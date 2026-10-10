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

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleCategoryChange = async (catId) => {
    setFormData(f => ({ ...f, categoryId: catId, subCategoryId: '' }));
    if (catId) {
      try {
        const res = await fetch(`http://localhost:5000/api/categories/${catId}/subcategories`);
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
      const response = await fetch('http://localhost:5000/api/auth/expert/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        login(data, data.token);
        navigate('/expert/dashboard');
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
            Join our verified professional network. Offer your services to a global audience and grow your practice.
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

          <div className="mb-6 text-center">
            <h2 className="font-heading font-bold text-3xl text-on-background">Expert Application</h2>
            <p className="font-body text-on-surface-variant mt-2 text-sm">Fill in your details to join our platform.</p>
          </div>

          <div className="flex p-1 bg-surface-muted border border-border rounded-lg mb-8">
             <button onClick={() => navigate('/register')} className="flex-1 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-background transition-colors">User</button>
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
              <label className="block text-sm font-semibold text-on-background">Full Name</label>
              <input
                name="name"
                type="text"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Dr. Jane Smith"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Email Address</label>
              <input
                name="email"
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="expert@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Mobile Number</label>
              <input
                name="mobile"
                type="tel"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm appearance-none"
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {subCategories.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-background">Sub-category</label>
                <select
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm appearance-none"
                >
                  <option value="">Select a sub-category</option>
                  {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Specialty</label>
              <input
                name="specialty"
                type="text"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.specialty}
                onChange={handleChange}
                required
                placeholder="e.g. Business Coach"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-on-background">Password</label>
              <input
                name="password"
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm placeholder-on-surface-variant/50"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Create a strong password"
              />
            </div>

            <div className="flex items-start gap-2 pt-2 pb-2">
               <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
               <label htmlFor="terms" className="text-xs text-on-surface-variant">
                 I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
               </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-body font-semibold text-base hover:bg-primary-dark transition-all disabled:opacity-70 mt-2"
            >
              {loading ? 'Submitting...' : 'Apply as Expert'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-6 font-body">


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
