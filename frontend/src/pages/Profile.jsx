import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  User as UserIcon, 
  Edit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import UserLayout from '../components/UserLayout';
import { compressAvatar, saveAvatarToDB } from '../utils/avatarStorage';

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
  const [form, setForm] = useState({ name: '', mobile: '', bio: '', location: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    try {
      const res = await axios.get('https://experthub.nextgoodtechnologies.in/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      setError('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const activeImg = form.profileImage || '';
      const payload = { ...form, profileImage: activeImg };

      const res = await axios.patch('https://experthub.nextgoodtechnologies.in/api/user/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const savedUser = res.data?.user || { ...profile, ...payload };
      const finalImg = savedUser.profileImage || activeImg;
      const mergedUser = { ...savedUser, profileImage: finalImg };

      setProfile(mergedUser);
      updateUser(mergedUser);
      if (finalImg) {
        saveAvatarToDB(finalImg);
      }
      setSuccess('Profile updated successfully!');
      setEditing(false);
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
        }
      } catch (err) {
        console.warn('Image processing error:', err);
      }
    }
  };

  const displayName = profile?.name || user?.name || 'User';
  const currentAvatar = (editing ? form.profileImage : (profile?.profileImage || user?.profileImage || localStorage.getItem('user_avatar'))) || '';
  const displayImage = currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=150`;

  return (
    <UserLayout title="My Profile" subtitle="Manage your account details and preferences.">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end mb-4">
            {!editing && (
              <button 
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-light text-background px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
              >
                <Edit2 size={15} />
                Edit Profile
              </button>
            )}
          </div>

          {error && (
             <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl mb-4 text-xs sm:text-sm flex items-start gap-2 shadow-sm">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3.5 py-2.5 rounded-xl mb-4 text-xs sm:text-sm flex items-start gap-2 shadow-sm">
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="bg-surface rounded-xl border border-border-color shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 md:p-7">
              <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
                
                {/* Left Column - Avatar */}
                <div className="flex flex-col items-center space-y-3 shrink-0">
                  <div 
                    className={`relative group ${editing ? 'cursor-pointer' : ''}`}
                    onClick={() => editing && document.getElementById('imageUpload').click()}
                  >
                    <img
                      src={displayImage}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-md border-3 border-white object-cover"
                    />
                    {editing && (
                      <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={20} className="text-background" />
                      </div>
                    )}
                      <input 
                        type="file" 
                        id="imageUpload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange} 
                        disabled={!editing}
                      />
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-blue-100">
                        <UserIcon size={14} />
                        {profile?.role === 'ADMIN' ? 'SUPER ADMIN' : profile?.role}
                      </span>
                    </div>
                  </div>

                  {/* Right Column - Form / Details */}
                  <div className="flex-1 w-full">
                    {editing ? (
                      <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-on-surface">Full Name</label>
                            <input 
                              value={form.name} 
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border-color focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-on-surface text-sm" 
                              placeholder="Your full name"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-on-surface">Mobile Number</label>
                            <input 
                              value={form.mobile} 
                              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                              className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border-color focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-on-surface text-sm" 
                              placeholder="Your mobile number"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-on-surface">Location</label>
                          <input 
                            value={form.location} 
                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border-color focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-on-surface text-sm" 
                            placeholder="e.g. New York, USA"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="block text-sm font-semibold text-on-surface">Bio</label>
                          <textarea 
                            rows={3} 
                            value={form.bio} 
                            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border-color focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-on-surface text-sm resize-none" 
                            placeholder="Tell us a little about yourself"
                          />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button 
                            type="submit" 
                            disabled={saving}
                            className="flex-1 sm:flex-none py-2.5 px-6 bg-primary text-background rounded-lg font-bold hover:bg-primary-light transition-colors disabled:opacity-70 text-sm shadow-sm"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEditing(false)}
                            className="flex-1 sm:flex-none py-2.5 px-6 rounded-lg border border-slate-300 font-bold text-on-surface hover:bg-surface-light transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                          <div>
                            <p className="text-xs font-bold text-on-surface/50 uppercase tracking-wider mb-1">Email Address</p>
                            <p className="text-sm font-semibold text-on-surface">{profile?.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface/50 uppercase tracking-wider mb-1">Mobile Number</p>
                            <p className="text-sm font-semibold text-on-surface">
                              {profile?.mobile || <span className="text-on-surface/50 italic">Not provided</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface/50 uppercase tracking-wider mb-1">Location</p>
                            <p className="text-sm font-semibold text-on-surface">
                              {profile?.location || <span className="text-on-surface/50 italic">Not provided</span>}
                            </p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border-color">
                          <p className="text-xs font-bold text-on-surface/50 uppercase tracking-wider mb-2">About Me</p>
                          <p className="text-sm text-on-surface leading-relaxed max-w-2xl">
                            {profile?.bio || <span className="text-on-surface/50 italic">No bio written yet. Click edit to add something about yourself!</span>}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </>
        )}
    </UserLayout>
  );
}

export default Profile;

