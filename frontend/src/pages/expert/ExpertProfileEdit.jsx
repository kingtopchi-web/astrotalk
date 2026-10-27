import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, 
  Pencil, 
  IndianRupee, 
  MessageCircle, 
  Phone, 
  Video, 
  Check, 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  Plus, 
  X, 
  AlertCircle,
  CheckCircle2,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';

function ExpertProfileEdit() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expertId, setExpertId] = useState('');

  // Main profile form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    timezone: 'Bengaluru, India (IST)',
    specialty: '',
    qualification: '',
    specialization: '',
    experience: '',
    bio: '',
    categoryId: '',
    subCategoryId: '',
    profileImage: '',
    rates: { chat: 20, audio: 30, video: 45 },
    instantCallEnabled: true
  });

  // Quick tags state
  const [tags, setTags] = useState(['PitchDecks', 'CapTables', 'SeedRounds']);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, catRes] = await Promise.all([
          axios.get(getApiUrl('/expert/profile'), { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(getApiUrl('/categories'))
        ]);
        
        const p = profileRes.data;
        setExpertId(p._id || '');
        
        setForm({
          name: p.name || '',
          email: p.email || '',
          mobile: p.mobile || '',
          timezone: p.timezone || 'Bengaluru, India (IST)',
          specialty: p.specialty || '',
          qualification: p.qualification || '',
          specialization: p.specialization || '',
          experience: p.experience || '',
          bio: p.bio || '',
          categoryId: p.categoryId?._id || p.categoryId || '',
          subCategoryId: p.subCategoryId?._id || p.subCategoryId || '',
          profileImage: p.profileImage || '',
          rates: { 
            chat: p.rates?.chat ?? 20, 
            audio: p.rates?.audio ?? 30, 
            video: p.rates?.video ?? 45 
          },
          instantCallEnabled: p.instantCallEnabled ?? true
        });

        if (p.specialization) {
          const parsedTags = p.specialization
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(Boolean);
          if (parsedTags.length > 0) {
            setTags(parsedTags);
          }
        }

        setCategories(catRes.data || []);

        if (p.categoryId) {
          const catId = p.categoryId?._id || p.categoryId;
          try {
            const subRes = await axios.get(getApiUrl(`/categories/${catId}/subcategories`));
            setSubCategories(subRes.data || []);
          } catch (e) {
            setSubCategories([]);
          }
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
        const res = await axios.get(getApiUrl(`/categories/${catId}/subcategories`));
        setSubCategories(res.data || []);
      } catch (e) { 
        setSubCategories([]); 
      }
    } else {
      setSubCategories([]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setForm(f => ({ ...f, profileImage: '' }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Calculate dynamic Profile Quality percentage
  const profileQuality = useMemo(() => {
    let score = 0;
    if (form.name) score += 15;
    if (form.profileImage) score += 15;
    if (form.mobile) score += 10;
    if (form.specialty) score += 15;
    if (form.categoryId) score += 15;
    if (form.qualification) score += 10;
    if (form.specialization || tags.length > 0) score += 10;
    if (form.bio && form.bio.length > 30) score += 15;
    return Math.min(100, Math.max(25, score));
  }, [form, tags]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        specialty: form.specialty,
        qualification: form.qualification,
        specialization: form.specialization || tags.join(', '),
        experience: form.experience,
        bio: form.bio,
        profileImage: form.profileImage,
        rates: {
          chat: Number(form.rates.chat) || 0,
          audio: Number(form.rates.audio) || 0,
          video: Number(form.rates.video) || 0
        }
      };

      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.subCategoryId) payload.subCategoryId = form.subCategoryId;

      await axios.patch(getApiUrl('/expert/profile'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg">
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X size={15} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main 2-Column Grid matching reference screenshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ================= LEFT COLUMN: Profile Photo & Rates (4 of 12 cols) ================= */}
            <div className="lg:col-span-4 space-y-6">

              {/* CARD 1: PROFILE PHOTO */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider">
                    <Camera size={14} />
                    <span>PROFILE PHOTO</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    JPG/PNG • Max 5MB
                  </span>
                </div>

                {/* Photo Preview Container */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-50 border-2 border-amber-200/80 shadow-xs flex items-center justify-center">
                      {form.profileImage ? (
                        <img 
                          src={form.profileImage} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <User size={44} className="text-amber-500/50 mb-1" />
                          <span className="text-[11px] text-slate-400">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Pencil Edit Icon Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      title="Upload new image"
                    >
                      <Pencil size={14} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* Profile Name & Specialty Pill */}
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 text-center mt-3.5 tracking-tight">
                    {form.name || 'Your Full Name'}
                  </h3>

                  <div className="mt-1">
                    <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200/90 text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full text-center">
                      {form.specialty || 'Specialty / Headline'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 text-center mt-2.5 max-w-[240px] leading-relaxed">
                    Upload a professional, front-facing headshot to build trust & increase client bookings.
                  </p>

                  {/* Change / Remove Buttons */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      Change Image
                    </button>
                    {form.profileImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* CARD 2: CONSULTATION RATES */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider">
                    <IndianRupee size={14} />
                    <span>CONSULTATION RATES</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    ₹/minute billing
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Set competitive per-minute fees for your instant and scheduled sessions.
                </p>

                {/* 3 Rate Inputs Grid */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  
                  {/* Chat Rate */}
                  <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 text-center flex flex-col justify-between">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 mb-1.5">
                      <MessageCircle size={12} className="text-blue-600" />
                      <span>Chat</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input 
                        type="number"
                        min="0"
                        value={form.rates.chat}
                        onChange={(e) => setForm({
                          ...form,
                          rates: { ...form.rates, chat: e.target.value }
                        })}
                        className="w-12 text-sm font-bold text-slate-900 text-center outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">per min</span>
                  </div>

                  {/* Audio Rate */}
                  <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 text-center flex flex-col justify-between">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 mb-1.5">
                      <Phone size={12} className="text-emerald-600" />
                      <span>Audio</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input 
                        type="number"
                        min="0"
                        value={form.rates.audio}
                        onChange={(e) => setForm({
                          ...form,
                          rates: { ...form.rates, audio: e.target.value }
                        })}
                        className="w-12 text-sm font-bold text-slate-900 text-center outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">per min</span>
                  </div>

                  {/* Video Rate */}
                  <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-2.5 text-center flex flex-col justify-between">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 mb-1.5">
                      <Video size={12} className="text-amber-600" />
                      <span>Video</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input 
                        type="number"
                        min="0"
                        value={form.rates.video}
                        onChange={(e) => setForm({
                          ...form,
                          rates: { ...form.rates, video: e.target.value }
                        })}
                        className="w-12 text-sm font-bold text-slate-900 text-center outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">per min</span>
                  </div>

                </div>

                {/* Footer Options */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input 
                      type="checkbox"
                      checked={form.instantCallEnabled}
                      onChange={(e) => setForm({ ...form, instantCallEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                    />
                    <span>Enable Instant Call-ins</span>
                  </label>
                  <span className="text-slate-500 font-medium">92% Payout</span>
                </div>

              </div>

              {/* CARD 3: Profile Quality Box */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Profile Quality: {profileQuality}%
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All essential verification badges active
                    </p>
                  </div>
                </div>

                {expertId && (
                  <button
                    type="button"
                    onClick={() => window.open(`/experts/${expertId}`, '_blank')}
                    className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <span>View Public</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

            </div>

            {/* ================= RIGHT COLUMN: Account Info, Categories, Credentials (8 of 12 cols) ================= */}
            <div className="lg:col-span-8 space-y-6">

              {/* CARD 1: Account Information */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <User size={15} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Account Information
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Verified Identity</span>
                  </span>
                </div>

                {/* 2-Column Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Sneha Kapoor"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        required
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="9876500006"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={form.email}
                        readOnly
                        title="Registered account email"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Primary Base / Timezone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Primary Base / Timezone
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        placeholder="Bengaluru, India (IST)"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* CARD 2: Category & Specialty */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Layers size={15} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Category & Specialty
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Search Placement
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category *
                    </label>
                    <div className="relative">
                      <select 
                        required
                        value={form.categoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full appearance-none px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 cursor-pointer pr-9"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Sub-Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Sub-category *
                    </label>
                    <div className="relative">
                      <select 
                        value={form.subCategoryId}
                        onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })}
                        disabled={subCategories.length === 0}
                        className="w-full appearance-none px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 cursor-pointer pr-9 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{subCategories.length === 0 ? 'No subcategories available' : 'Select Subcategory'}</option>
                        {subCategories.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                </div>

                {/* Specialty / Headline Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Specialty / Headline Title *
                  </label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                      placeholder="e.g. Venture Capital & Pitch Deck Strategy"
                      className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Quick Tags Strip */}
                <div className="pt-1">
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="font-bold text-slate-500 mr-1">Quick Tags:</span>
                    {tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-amber-50/80 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold group"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-amber-600 hover:text-red-500 p-0.5 rounded cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}

                    {showAddTag ? (
                      <div className="inline-flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2 py-0.5">
                        <span className="text-xs text-slate-400">#</span>
                        <input 
                          type="text"
                          autoFocus
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTag(e);
                            if (e.key === 'Escape') setShowAddTag(false);
                          }}
                          placeholder="Tag"
                          className="w-20 text-xs text-slate-800 outline-none"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddTag} 
                          className="text-emerald-600 font-bold hover:text-emerald-700"
                        >
                          <Check size={12} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowAddTag(false)} 
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTag(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Tag</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* CARD 3: Professional Credentials */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <GraduationCap size={15} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Professional Credentials
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Experience & Bio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1">
                  
                  {/* Highest Qualification & Past Experience */}
                  <div className="sm:col-span-9">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Highest Qualification & Past Experience
                    </label>
                    <div className="relative">
                      <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={form.qualification}
                        onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                        placeholder="e.g. MBA (Finance), Ex-Venture Associate"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Years of Exp. */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Years of Exp.
                    </label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        placeholder="7"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 text-center"
                      />
                    </div>
                  </div>

                </div>

                {/* Core Specialization Areas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Core Specialization Areas
                  </label>
                  <input 
                    type="text" 
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="e.g. Fundraising, Financial Modeling & Pitch Decks"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800"
                  />
                </div>

                {/* Professional Bio / About You */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Professional Bio / About You
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {form.bio ? form.bio.length : 0}/500 chars
                    </span>
                  </div>
                  <textarea 
                    rows={4}
                    maxLength={500}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Describe your background, expertise, and how you help clients achieve their goals..."
                    className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 leading-relaxed"
                  />
                </div>

              </div>

            </div>

          </div>

          {/* ================= BOTTOM ACTION BAR ================= */}
          <div className="flex items-center justify-end gap-3 pt-6 pb-12 border-t border-slate-200/80 mt-6">
            <button
              type="button"
              onClick={() => navigate('/expert/dashboard')}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Cancel Changes
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check size={16} />
              <span>{saving ? 'Saving Profile...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ExpertProfileEdit;
