import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ExpertProfileEdit() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', mobile: '', specialty: '', qualification: '',
    specialization: '', experience: '', bio: '',
    categoryId: '', subCategoryId: '',
    rates: { chat: 0, audio: 0, video: 0 }
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, catRes] = await Promise.all([
          axios.get('https://astrotalk-hlg2.onrender.com/api/expert/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://astrotalk-hlg2.onrender.com/api/categories')
        ]);
        const p = profileRes.data;
        setForm({
          name: p.name || '',
          mobile: p.mobile || '',
          specialty: p.specialty || '',
          qualification: p.qualification || '',
          specialization: p.specialization || '',
          experience: p.experience || '',
          bio: p.bio || '',
          categoryId: p.categoryId?._id || p.categoryId || '',
          subCategoryId: p.subCategoryId?._id || p.subCategoryId || '',
          rates: { chat: p.rates?.chat || 0, audio: p.rates?.audio || 0, video: p.rates?.video || 0 }
        });
        setCategories(catRes.data);

        if (p.categoryId) {
          const catId = p.categoryId?._id || p.categoryId;
          const subRes = await axios.get(`https://astrotalk-hlg2.onrender.com/api/categories/${catId}/subcategories`);
          setSubCategories(subRes.data);
        }
      } catch (err) {
        if (err.response?.status === 401) navigate('/expert/login');
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, token]);

  const handleCategoryChange = async (catId) => {
    setForm(f => ({ ...f, categoryId: catId, subCategoryId: '' }));
    if (catId) {
      try {
        const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/categories/${catId}/subcategories`);
        setSubCategories(res.data);
      } catch (e) { setSubCategories([]); }
    } else {
      setSubCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.categoryId) delete payload.categoryId;
      if (!payload.subCategoryId) delete payload.subCategoryId;
      
      await axios.patch('https://astrotalk-hlg2.onrender.com/api/expert/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/expert/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-10 px-4 py-4 flex items-center shadow-sm">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-heading font-bold text-xl text-on-surface">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Account */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="font-heading font-bold text-lg text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface">Full Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface">Mobile Number</label>
                <input 
                  value={form.mobile} 
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="font-heading font-bold text-lg text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span>
              Category & Specialty
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Category</label>
                  <select 
                    value={form.categoryId} 
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body appearance-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Sub-category</label>
                  <select 
                    value={form.subCategoryId} 
                    onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value }))}
                    disabled={!form.categoryId}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body appearance-none disabled:opacity-50"
                  >
                    <option value="">Select a sub-category</option>
                    {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface">Specialty / Title</label>
                <input 
                  value={form.specialty} 
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  placeholder="e.g. Vedic Astrologer with 10+ years experience"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                />
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="font-heading font-bold text-lg text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">work</span>
              Professional Information
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Qualification</label>
                  <input 
                    value={form.qualification} 
                    onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                    placeholder="e.g. M.B.B.S, Ph.D"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Specialization</label>
                  <input 
                    value={form.specialization} 
                    onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-semibold text-on-surface">Years of Experience</label>
                  <input 
                    value={form.experience} 
                    onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                    placeholder="e.g. 5 years"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface">About / Bio</label>
                <textarea 
                  rows={4} 
                  value={form.bio} 
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Describe your background, expertise, and approach..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="font-heading font-bold text-lg text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Consultation Rates (₹/min)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {['chat', 'audio', 'video'].map(type => (
                <div key={type} className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface capitalize">{type} Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.rates[type]}
                      onChange={e => setForm(f => ({ ...f, rates: { ...f.rates, [type]: Number(e.target.value) } }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-background font-body font-bold" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="flex-1 py-4 px-4 rounded-xl border border-border font-heading font-bold text-on-surface hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex-[2] bg-primary text-white font-heading font-bold py-4 px-4 rounded-xl hover:bg-primary-dark hover:shadow-lg transition-all disabled:opacity-70 disabled:hover:shadow-none"
            >
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ExpertProfileEdit;

