import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft,
  Camera,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Phone,
  MapPin,
  Mail,
  Edit3,
  MoreVertical,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import UserLayout from '../components/UserLayout';
import { compressAvatar, saveAvatarToDB } from '../utils/avatarStorage';
import { getApiUrl } from '../utils/apiConfig';

function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  
  // Dynamic stats
  const [activitiesCount, setActivitiesCount] = useState(12);
  const [connectionsCount, setConnectionsCount] = useState(84);
  const [savedCount, setSavedCount] = useState(4);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ 
    name: '', 
    mobile: '', 
    bio: '', 
    location: '', 
    profileImage: '' 
  });

  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.get(getApiUrl('/user/profile'), { headers });
      const cachedAvatar = localStorage.getItem('user_avatar') || user?.profileImage || '';
      const resolvedAvatar = res.data.profileImage || cachedAvatar || '';

      const updatedProfile = { ...res.data, profileImage: resolvedAvatar };
      setProfile(updatedProfile);
      setForm({
        name: res.data.name || '',
        mobile: res.data.mobile || '',
        bio: res.data.bio || '',
        location: res.data.location || '',
        profileImage: resolvedAvatar
      });
      
      if (resolvedAvatar) {
        updateUser({ ...res.data, profileImage: resolvedAvatar });
        localStorage.setItem('user_avatar', resolvedAvatar);
      }

      // Fetch bookings to dynamically calculate activities & connections
      try {
        const bookingsRes = await axios.get(getApiUrl('/bookings/my-bookings'), { headers });
        if (Array.isArray(bookingsRes.data) && bookingsRes.data.length > 0) {
          setActivitiesCount(bookingsRes.data.length);
          const uniqueExperts = new Set(bookingsRes.data.map(b => b.expertId?._id || b.expertId)).size;
          setConnectionsCount(uniqueExperts || 1);
        }
      } catch (bErr) {
        // Fallback gracefully
      }

      // Fetch saved experts count
      try {
        const savedRes = await axios.get(getApiUrl('/user/saved-experts'), { headers });
        if (Array.isArray(savedRes.data)) {
          setSavedCount(savedRes.data.length);
        } else if (res.data.savedExperts?.length) {
          setSavedCount(res.data.savedExperts.length);
        }
      } catch (sErr) {
        if (res.data.savedExperts?.length) {
          setSavedCount(res.data.savedExperts.length);
        }
      }

    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      setError('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchProfile(); 
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const activeImg = form.profileImage || '';
      const payload = { ...form, profileImage: activeImg };

      const res = await axios.patch(getApiUrl('/user/profile'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const savedUser = res.data?.user || { ...profile, ...payload };
      const finalImg = savedUser.profileImage || activeImg;
      const mergedUser = { ...savedUser, profileImage: finalImg };

      setProfile(mergedUser);
      updateUser(mergedUser);
      if (finalImg) {
        saveAvatarToDB(finalImg);
        localStorage.setItem('user_avatar', finalImg);
      }
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressAvatar(file, 200, 0.75);
        if (compressedDataUrl) {
          setForm(prev => ({ ...prev, profileImage: compressedDataUrl }));
          saveAvatarToDB(compressedDataUrl);
          updateUser({ profileImage: compressedDataUrl });
          localStorage.setItem('user_avatar', compressedDataUrl);
          
          // If not currently in editing modal, save directly to backend
          if (!editing) {
            try {
              await axios.patch(getApiUrl('/user/profile'), { profileImage: compressedDataUrl }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setProfile(prev => ({ ...prev, profileImage: compressedDataUrl }));
              setSuccess('Profile photo updated!');
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Failed to sync avatar update to server', err);
            }
          }
        }
      } catch (err) {
        console.warn('Image processing error:', err);
      }
    }
  };

  const handleCopyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${displayName}'s Profile`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const displayName = profile?.name || user?.name || 'Shiwank Singh';
  const handleName = profile?.email 
    ? `@${profile.email.split('@')[0]}` 
    : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  const currentAvatar = (editing ? form.profileImage : (profile?.profileImage || user?.profileImage || localStorage.getItem('user_avatar'))) || '';
  const displayImage = currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F5B52E&color=fff&size=150`;

  return (
    <UserLayout title="" subtitle="">
      <div className="flex flex-col gap-4 sm:gap-5 w-full pb-12 font-sans">

        {/* Top Header Bar matching screenshot */}
        <div className="flex items-center justify-between pb-1">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2.5 text-slate-900 hover:text-amber-800 font-bold text-base sm:text-lg transition-colors cursor-pointer group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareProfile}
              className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              title="Share profile"
            >
              <MoreVertical size={18} />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-2xs">
              <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Hidden file input for photo upload */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*" 
          className="hidden" 
          onChange={handleImageChange} 
        />

        {/* Floating Share / Copy feedback */}
        {shareToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Check size={15} className="text-emerald-400" />
            <span>Profile link copied to clipboard!</span>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-start gap-2 shadow-xs">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-start gap-2 shadow-xs">
            <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Hero Profile Card */}
        <div className="bg-gradient-to-b from-[#FBF5EE] via-[#F8EFE4] to-[#F3E7D6] rounded-3xl border border-[#EDE1D0] p-6 sm:p-8 text-center relative shadow-xs">
          
          {/* Avatar Container */}
          <div className="relative inline-block mx-auto mb-3">
            <img
              src={displayImage}
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-sm border-4 border-white object-cover"
            />
            {/* Camera Upload Badge */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Photo"
              className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Camera size={14} />
            </button>
            {/* Online Status Green Dot */}
            <span 
              title="Active Now"
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
            />
          </div>

          {/* Name & Verified Check */}
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {displayName}
            </h1>
            <CheckCircle2 size={18} className="text-sky-500 fill-sky-50" />
          </div>

          {/* Handle */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-3">
            {handleName}
          </p>

          {/* Role Pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#FDE8D7] text-[#9A490B] font-bold text-[11px] px-3.5 py-1 rounded-full border border-[#FAD6BE] mb-5">
            <UserIcon size={12} />
            <span>{profile?.role === 'ADMIN' ? 'SUPER ADMIN' : profile?.role || 'USER'}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-center gap-3 w-full max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => {
                setForm({
                  name: profile?.name || '',
                  mobile: profile?.mobile || '',
                  bio: profile?.bio || '',
                  location: profile?.location || '',
                  profileImage: profile?.profileImage || currentAvatar
                });
                setEditing(true);
              }}
              className="flex-1 bg-[#804204] hover:bg-[#6b3703] text-white font-bold py-2.5 px-4 sm:px-6 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={handleShareProfile}
              className="flex-1 bg-[#E8E1D5] hover:bg-[#dfd7ca] text-slate-800 font-bold py-2.5 px-4 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98"
            >
              <Share2 size={15} />
              <span>Share Profile</span>
            </button>
          </div>

        </div>

        {/* 2. Stats Strip (3 Rounded Cards) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Activities */}
          <div className="bg-white rounded-2xl border border-slate-200/90 py-3.5 px-2 text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {activitiesCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
              Activities
            </div>
          </div>

          {/* Card 2: Connections */}
          <div className="bg-white rounded-2xl border border-slate-200/90 py-3.5 px-2 text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {connectionsCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
              Connections
            </div>
          </div>

          {/* Card 3: Saved */}
          <div className="bg-white rounded-2xl border border-slate-200/90 py-3.5 px-2 text-center shadow-xs">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {savedCount}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
              Saved
            </div>
          </div>
        </div>

        {/* 3. Account Details Section */}
        <div className="bg-[#FAF4EB]/70 rounded-2xl border border-[#EDE1D0] p-4 sm:p-6 shadow-xs space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-[#9A490B]">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Account Details
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-3 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          {/* Detail Rows */}
          <div className="space-y-2.5">
            {/* Email Address */}
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    EMAIL ADDRESS
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 break-all">
                    {profile?.email || 'user@example.com'}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCopyEmail}
                title="Copy Email"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copiedEmail ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Mobile Number */}
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    MOBILE NUMBER
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {profile?.mobile || '+91 8755444354'}
                  </span>
                </div>
              </div>
              <div className="text-slate-400 p-1.5">
                <Phone size={16} />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    LOCATION
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {profile?.location || 'UP, India'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600 hidden sm:block">
                {profile?.location?.includes(',') 
                  ? profile.location.split(',')[0].trim() 
                  : (profile?.location || 'Uttar Pradesh')}
              </span>
            </div>
          </div>
        </div>

        {/* 4. About Me Section */}
        <div className="bg-[#FAF4EB]/70 rounded-2xl border border-[#EDE1D0] p-4 sm:p-6 shadow-xs space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base text-[#9A490B] font-bold">❝</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                About Me
              </h2>
            </div>
            <button 
              type="button"
              onClick={() => {
                setForm({
                  name: profile?.name || '',
                  mobile: profile?.mobile || '',
                  bio: profile?.bio || '',
                  location: profile?.location || '',
                  profileImage: profile?.profileImage || currentAvatar
                });
                setEditing(true);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-amber-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>

          {/* Bio Quote Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-100/90 shadow-2xs flex items-start gap-2.5 min-h-[60px]">
            <span className="text-amber-500 text-xl font-serif leading-none mt-0.5 select-none font-bold">“</span>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {profile?.bio || 'hgity'}
            </p>
          </div>
        </div>

      </div>

      {/* 5. Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 max-w-lg w-full p-6 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={18} className="text-[#804204]" />
                Edit Profile
              </h3>
              <button 
                onClick={() => setEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              
              {/* Photo Change row */}
              <div className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <img 
                  src={form.profileImage || displayImage} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-800 transition-all cursor-pointer shadow-2xs"
                  >
                    Change Photo
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG (automatically optimized)</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input 
                  type="text"
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                <input 
                  type="text"
                  value={form.mobile} 
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                  placeholder="e.g. +91 8755444354"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Location</label>
                <input 
                  type="text"
                  value={form.location} 
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. UP, India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* About Me */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">About Me</label>
                <textarea 
                  rows={3}
                  value={form.bio} 
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write a few lines about yourself..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#804204] hover:bg-[#6b3703] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </UserLayout>
  );
}

export default Profile;
