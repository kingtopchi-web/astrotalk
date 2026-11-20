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
  Minus,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Percent,
  TrendingUp
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';
import { compressAvatarImage } from '../../utils/imageCompressor';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';

function ExpertProfileEdit() {
  const { platformCommissionRate = 20 } = usePlatformSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const initialDataRef = useRef(null);

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
    instantCallEnabled: true,
    latitude: '',
    longitude: '',
    city: '',
    state: ''
  });

  // Quick tags state
  const [tags, setTags] = useState(['PitchDecks', 'CapTables', 'SeedRounds']);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  const detectMyLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectingLocation(false);
          if (pos && pos.coords) {
            setForm(prev => ({
              ...prev,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }));
          }
        },
        () => setDetectingLocation(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }
  };

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

        const initialForm = {
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
          instantCallEnabled: p.instantCallEnabled ?? true,
          latitude: p.latitude ?? '',
          longitude: p.longitude ?? '',
          city: p.location?.city || p.city || '',
          state: p.location?.state || p.state || ''
        };

        let initialTags = ['PitchDecks', 'CapTables', 'SeedRounds'];
        if (p.specialization) {
          const parsedTags = p.specialization
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(Boolean);
          if (parsedTags.length > 0) {
            initialTags = parsedTags;
          }
        }

        setForm(initialForm);
        setTags(initialTags);
        const snap = JSON.stringify({ form: initialForm, tags: initialTags });
        initialDataRef.current = snap;
        setSavedSnapshot(snap);

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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressAvatarImage(file);
        if (compressed && compressed.dataUrl) {
          setForm(f => ({ ...f, profileImage: compressed.dataUrl }));
        }
      } catch (err) {
        console.error('Image compression failed:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm(f => ({ ...f, profileImage: reader.result }));
        };
        reader.readAsDataURL(file);
      }
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

  // Check if form or tags differ from original loaded state
  const hasUnsavedChanges = useMemo(() => {
    const baseline = savedSnapshot || initialDataRef.current;
    if (!baseline) return false;
    try {
      const current = JSON.stringify({ form, tags });
      return current !== baseline;
    } catch (e) {
      return false;
    }
  }, [form, tags, savedSnapshot]);

  const handleResetChanges = () => {
    const baseline = savedSnapshot || initialDataRef.current;
    if (!baseline) return;
    try {
      const parsed = JSON.parse(baseline);
      setForm(parsed.form);
      setTags(parsed.tags);
      setError('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const chatRate = Number(form.rates.chat);
    const audioRate = Number(form.rates.audio);
    const videoRate = Number(form.rates.video);

    if (isNaN(chatRate) || chatRate < 5) {
      setError('Chat consultation minimum rate is ₹5/min. You cannot set a rate lower than ₹5.');
      setSaving(false);
      return;
    }
    if (isNaN(audioRate) || audioRate < 10) {
      setError('Audio call consultation minimum rate is ₹10/min. You cannot set a rate lower than ₹10.');
      setSaving(false);
      return;
    }
    if (isNaN(videoRate) || videoRate < 20) {
      setError('Video call consultation minimum rate is ₹20/min. You cannot set a rate lower than ₹20.');
      setSaving(false);
      return;
    }

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
          chat: chatRate,
          audio: audioRate,
          video: videoRate
        }
      };

      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.subCategoryId) payload.subCategoryId = form.subCategoryId;
      if (form.latitude !== '' && form.latitude !== null && form.latitude !== undefined) {
        payload.latitude = Number(form.latitude);
      }
      if (form.longitude !== '' && form.longitude !== null && form.longitude !== undefined) {
        payload.longitude = Number(form.longitude);
      }
      if (form.city) payload.city = form.city;
      if (form.state) payload.state = form.state;

      await axios.patch(getApiUrl('/expert/profile'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedSnap = JSON.stringify({ form, tags });
      initialDataRef.current = updatedSnap;
      setSavedSnapshot(updatedSnap);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3500);
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

        {/* Fixed Global Floating Responsive Toast Alerts */}
        {error && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-rose-950/95 text-rose-100 border border-rose-500/40 px-4 sm:px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 backdrop-blur-md ring-1 ring-rose-500/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <AlertCircle size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white">Error Saving Profile</h4>
                  <p className="text-[11px] sm:text-xs text-rose-200/90 truncate mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="p-1.5 hover:bg-rose-800/40 text-rose-300 hover:text-white rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-emerald-950/95 text-emerald-100 border border-emerald-500/40 px-4 sm:px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 backdrop-blur-md ring-1 ring-emerald-500/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white">Profile Updated Successfully!</h4>
                  <p className="text-[11px] sm:text-xs text-emerald-200/90 truncate mt-0.5">{success}</p>
                </div>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="p-1.5 hover:bg-emerald-800/40 text-emerald-300 hover:text-white rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
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

              {/* CARD 2: CONSULTATION RATES (Clean Stepper without Rupee Collision) */}
              <div className="bg-[#0e1628] rounded-xl border border-slate-800/90 p-4 sm:p-5 shadow-xl space-y-3.5 text-slate-200">
                
                {/* Header Row */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                      <IndianRupee size={12} />
                    </div>
                    <span className="font-extrabold text-[11px] uppercase tracking-wide text-amber-500 whitespace-nowrap truncate">
                      CONSULTATION RATES
                    </span>
                  </div>
                  <div className="bg-[#052822] border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-semibold text-[10px] whitespace-nowrap">₹/min billing</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  Set competitive per-minute fees for instant & scheduled sessions.
                </p>

                {/* 3 Rate Cards Grid */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  
                  {/* Card 1: CHAT */}
                  <div className="bg-[#121c33] border border-slate-800/90 rounded-lg p-2.5 flex flex-col items-center justify-between transition-all hover:border-slate-700">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-200 tracking-wider mb-2">
                      <MessageCircle size={11} className="text-cyan-400 shrink-0" />
                      <span className="uppercase font-extrabold whitespace-nowrap">CHAT</span>
                    </div>

                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-md p-1 flex items-center justify-between w-full">
                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...f.rates, chat: Math.max(5, (Number(f.rates.chat) || 5) - 1) } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Decrease rate"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      
                      <input 
                        type="number"
                        min="5"
                        value={form.rates.chat}
                        onChange={(e) => setForm({ ...form, rates: { ...form.rates, chat: e.target.value } })}
                        className="w-8 text-center text-xs sm:text-sm font-black text-white bg-transparent outline-none p-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...form.rates, chat: (Number(f.rates.chat) || 5) + 1 } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Increase rate"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400/90 font-medium mt-1.5 whitespace-nowrap">Min ₹5/min</span>
                  </div>

                  {/* Card 2: VOICE CALL */}
                  <div className="bg-[#121c33] border border-slate-800/90 rounded-lg p-2.5 flex flex-col items-center justify-between transition-all hover:border-slate-700">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-200 tracking-wider mb-2">
                      <Phone size={11} className="text-emerald-400 shrink-0" />
                      <span className="uppercase font-extrabold whitespace-nowrap text-[10px]">VOICE CALL</span>
                    </div>

                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-md p-1 flex items-center justify-between w-full">
                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...form.rates, audio: Math.max(10, (Number(f.rates.audio) || 10) - 1) } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Decrease rate"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      
                      <input 
                        type="number"
                        min="10"
                        value={form.rates.audio}
                        onChange={(e) => setForm({ ...form, rates: { ...form.rates, audio: e.target.value } })}
                        className="w-8 text-center text-xs sm:text-sm font-black text-white bg-transparent outline-none p-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...form.rates, audio: (Number(f.rates.audio) || 10) + 1 } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Increase rate"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400/90 font-medium mt-1.5 whitespace-nowrap">Min ₹10/min</span>
                  </div>

                  {/* Card 3: VIDEO (with POPULAR badge & amber glow border) */}
                  <div className="bg-[#141f38] border border-amber-500/50 rounded-lg p-2.5 flex flex-col items-center justify-between relative shadow-[0_0_15px_rgba(245,158,11,0.06)]">
                    {/* POPULAR BADGE */}
                    <span className="absolute -top-2 right-1.5 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                      POPULAR
                    </span>

                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-400 tracking-wider mb-2">
                      <Video size={11} className="text-amber-400 shrink-0" />
                      <span className="uppercase font-extrabold whitespace-nowrap">VIDEO</span>
                    </div>

                    <div className="bg-[#0b1222] border border-slate-800/80 rounded-md p-1 flex items-center justify-between w-full">
                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...form.rates, video: Math.max(20, (Number(f.rates.video) || 20) - 1) } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Decrease rate"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      
                      <input 
                        type="number"
                        min="20"
                        value={form.rates.video}
                        onChange={(e) => setForm({ ...form, rates: { ...form.rates, video: e.target.value } })}
                        className="w-8 text-center text-xs sm:text-sm font-black text-amber-300 bg-transparent outline-none p-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, rates: { ...form.rates, video: (Number(f.rates.video) || 20) + 1 } }))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer select-none shrink-0"
                        title="Increase rate"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    <span className="text-[10px] text-amber-400/90 font-medium mt-1.5 whitespace-nowrap">Min ₹20/min</span>
                  </div>

                </div>

                {/* Toggle Row (Enable Instant Call-ins & Payout Rate) */}
                <div className="bg-[#0b1222]/90 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, instantCallEnabled: !f.instantCallEnabled }))}
                        className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer p-0.5 shrink-0 ${
                          form.instantCallEnabled ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                            form.instantCallEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        Instant Call-ins
                      </span>
                    </div>

                    {/* Payout Rate Badge */}
                    <div className="bg-[#052822] border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <TrendingUp size={11} className="text-emerald-400" />
                      <span className="text-[10px] font-bold whitespace-nowrap">92% Payout</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 pl-11 leading-tight">
                    Receive on-demand client calls when online
                  </p>
                </div>

                {/* Reset to Defaults Option */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      rates: { chat: 5, audio: 10, video: 20 },
                      instantCallEnabled: true
                    }))}
                    className="text-[11px] font-medium text-slate-400 hover:text-amber-400 transition-colors cursor-pointer hover:underline"
                  >
                    Reset to Defaults
                  </button>
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
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
                      <input
                        type="email"
                        value={form.email}
                        readOnly
                        title="Registered account email"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Primary Base / Timezone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Primary Base / Timezone
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
                      <input
                        type="text"
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        placeholder="Bengaluru, India (IST)"
                        className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Live Coordinates / Geolocation */}
                  <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className={form.latitude && form.longitude ? 'text-emerald-500 shrink-0' : 'text-slate-400 shrink-0'} />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Geographical Coordinates (For User Distance Matching)
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {form.latitude && form.longitude
                              ? `Latitude: ${Number(form.latitude).toFixed(4)}, Longitude: ${Number(form.longitude).toFixed(4)}`
                              : 'No GPS location saved yet. Click detect to set your current location.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={detectMyLocation}
                        disabled={detectingLocation}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer"
                      >
                        {detectingLocation ? 'Detecting...' : (form.latitude ? 'Update GPS Location' : 'Auto-Detect Location')}
                      </button>
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
                        {categories.map(c => {
                          const hasCustomRate = c.commissionRate !== null && c.commissionRate !== undefined && !isNaN(c.commissionRate);
                          const feeLabel = hasCustomRate ? `${c.commissionRate}% fee` : `${platformCommissionRate}% platform fee`;
                          return (
                            <option key={c._id} value={c._id}>
                              {c.name} ({feeLabel})
                            </option>
                          );
                        })}
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

                {/* Category Dynamic Commission Preview Card */}
                {form.categoryId && (() => {
                  const selectedCat = categories.find(c => c._id === form.categoryId);
                  const hasCustomRate = selectedCat && selectedCat.commissionRate !== null && selectedCat.commissionRate !== undefined && !isNaN(selectedCat.commissionRate);
                  const rate = hasCustomRate ? Number(selectedCat.commissionRate) : platformCommissionRate;
                  const expertShare = Math.max(0, 100 - rate);

                  return (
                    <div className={`p-3 rounded-xl border text-xs transition-all animate-in fade-in duration-200 ${hasCustomRate
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5 ${hasCustomRate ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                            }`}>
                            %
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs">
                                {selectedCat?.name} Commission: {rate}%
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${hasCustomRate ? 'bg-emerald-200/80 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                {hasCustomRate ? 'Category Dynamic Rate' : 'Default Platform Rate'}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                              {hasCustomRate ? (
                                <>Admin has set a custom <strong>{rate}%</strong> commission rate for <strong>{selectedCat?.name}</strong>. You retain <strong>{expertShare}%</strong> of consultation earnings.</>
                              ) : (
                                <>This category uses the global default platform fee of <strong>{rate}%</strong>. You retain <strong>{expertShare}%</strong> of consultation earnings.</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-xs block">{rate}% Fee</span>
                          <span className="text-[10px] text-emerald-700 font-bold">{expertShare}% Payout</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
          <div className="flex items-center justify-end gap-3 pt-6 pb-20 sm:pb-12 border-t border-slate-200/80 mt-6">
            <button
              type="button"
              onClick={hasUnsavedChanges ? handleResetChanges : () => navigate('/expert/dashboard')}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {hasUnsavedChanges ? 'Discard Changes' : 'Back to Dashboard'}
            </button>

            <button
              type="submit"
              disabled={saving || !hasUnsavedChanges}
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check size={16} />
              <span>{saving ? 'Saving Profile...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

        {/* ================= FLOATING STICKY ACTION BAR (VISIBLE ON SCROLL) ================= */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-3 inset-x-3 sm:bottom-6 sm:inset-x-auto sm:right-6 md:right-8 z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl p-2.5 sm:p-3 sm:px-4 flex items-center justify-between gap-3 sm:gap-5 ring-1 ring-amber-500/30 max-w-lg mx-auto sm:mx-0">
              <div className="flex items-center gap-2.5 pl-1 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <div className="truncate">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">Unsaved Changes</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">बदलाव सेव करना न भूलें</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChanges}
                  disabled={saving}
                  className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-900/40 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ExpertProfileEdit;
