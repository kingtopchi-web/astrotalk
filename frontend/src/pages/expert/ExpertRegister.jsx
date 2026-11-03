import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { getApiUrl } from '../../utils/apiConfig';
import { compressDocumentImage } from '../../utils/imageCompressor';
import { FileText, Upload, CheckCircle2, Trash2, AlertCircle, Loader2, MapPin } from 'lucide-react';

const ExpertRegister = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', specialty: '', mobile: '',
    categoryId: '', subCategoryId: '', manualCategory: '', manualSubCategory: ''
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Document Requirements & Upload State
  const [docRequirements, setDocRequirements] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingDocKey, setUploadingDocKey] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const fileInputRefs = useRef({});

  // Live Location & Coordinates for exact distance matching
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt', 'detecting', 'detected', 'denied'

  const detectLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocationStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords) {
            setLiveLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
            setLocationStatus('detected');
          }
        },
        (err) => {
          console.log('Location detection note:', err?.message || err);
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Prevent already logged-in EXPERTS from seeing register page
  useEffect(() => {
    if (user?.role === 'EXPERT') {
      navigate('/expert/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Pre-fill user data if logged in as a regular user
  useEffect(() => {
    if (user && user.role !== 'EXPERT') {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        mobile: prev.mobile || user.phone || user.mobile || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    // 1. Fetch categories
    fetch(getApiUrl('/public/categories'))
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {
        fetch(getApiUrl('/categories'))
          .then(r => r.json())
          .then(data => setCategories(Array.isArray(data) ? data : []))
          .catch(() => {});
      });

    // 2. Initial fetch of default document requirements
    fetchDocRequirements('default');
  }, []);

  const fetchDocRequirements = async (catId, subCatId = '') => {
    try {
      setLoadingRequirements(true);
      const query = subCatId ? `?subCategoryId=${subCatId}` : '';
      const targetId = (!catId || catId === 'MANUAL') ? 'default' : catId;
      const res = await fetch(getApiUrl(`/categories/${targetId}/document-requirements${query}`));
      const data = await res.json();
      setDocRequirements(Array.isArray(data) && data.length > 0 ? data : [
        {
          docKey: 'govt_id_proof',
          name: 'Identity Proof / Government ID (Aadhaar / PAN / Passport)',
          description: 'Valid government photo identity document to verify expert legal identity',
          isMandatory: true,
          allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxFileSizeMb: 5
        },
        {
          docKey: 'professional_cert',
          name: 'Educational / Professional Qualification Certificate',
          description: 'Degree, diploma, certificate, or work portfolio proving domain expertise',
          isMandatory: true,
          allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxFileSizeMb: 5
        }
      ]);
    } catch {
      setDocRequirements([
        {
          docKey: 'govt_id_proof',
          name: 'Identity Proof / Government ID (Aadhaar / PAN / Passport)',
          description: 'Valid government photo identity document to verify expert legal identity',
          isMandatory: true,
          allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxFileSizeMb: 5
        },
        {
          docKey: 'professional_cert',
          name: 'Educational / Professional Qualification Certificate',
          description: 'Degree, diploma, certificate, or work portfolio proving domain expertise',
          isMandatory: true,
          allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxFileSizeMb: 5
        }
      ]);
    } finally {
      setLoadingRequirements(false);
    }
  };

  const handleCategoryChange = async (catId) => {
    setFormData(f => ({ 
      ...f, 
      categoryId: catId, 
      subCategoryId: '',
      manualCategory: catId === 'MANUAL' ? f.manualCategory : '',
      manualSubCategory: catId === 'MANUAL' ? f.manualSubCategory : ''
    }));

    fetchDocRequirements(catId);

    if (catId && catId !== 'MANUAL') {
      try {
        const res = await fetch(getApiUrl(`/categories/${catId}/subcategories`));
        const data = await res.json();
        setSubCategories(Array.isArray(data) ? data : []);
      } catch { setSubCategories([]); }
    } else {
      setSubCategories([]);
    }
  };

  const handleFileSelect = async (e, reqItem) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocKey(reqItem.docKey);
    setError('');

    try {
      let fileData = '';
      const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      if (isImg) {
        // Automatically compress image <= 1MB
        const compressed = await compressDocumentImage(file);
        fileData = compressed.dataUrl;
      } else {
        const maxMb = reqItem.maxFileSizeMb || 5;
        if (file.size > maxMb * 1024 * 1024) {
          setError(`File "${file.name}" exceeds ${maxMb}MB size limit.`);
          setUploadingDocKey(null);
          return;
        }
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setUploadedDocs(prev => ({
        ...prev,
        [reqItem.docKey]: {
          requirementId: reqItem._id || null,
          docKey: reqItem.docKey,
          docName: reqItem.name,
          fileName: file.name,
          fileData,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          isMandatory: Boolean(reqItem.isMandatory)
        }
      }));
    } catch (err) {
      console.error('File read error:', err);
      setError('Failed to process file. Please try again with a valid PDF or image.');
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleRemoveDoc = (docKey) => {
    setUploadedDocs(prev => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
    if (fileInputRefs.current[docKey]) {
      fileInputRefs.current[docKey].value = '';
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
      setError('Name, email, password and mobile number are required.');
      return;
    }
    if (formData.categoryId === 'MANUAL' && (!formData.manualCategory || !formData.manualCategory.trim())) {
      setError('Please enter your custom category name.');
      return;
    }
    
    // Verify mandatory verification documents
    const mandatoryReqs = docRequirements.filter(r => r.isMandatory);
    for (const req of mandatoryReqs) {
      if (!uploadedDocs[req.docKey] || !uploadedDocs[req.docKey].fileData) {
        setError(`Mandatory document required: "${req.name}". Please upload to complete registration.`);
        return;
      }
    }

    const documentsPayload = Object.values(uploadedDocs).map(d => ({
      requirementId: d.requirementId,
      docKey: d.docKey,
      docName: d.docName,
      fileName: d.fileName,
      fileData: d.fileData,
      isMandatory: d.isMandatory
    }));

    // Auto-fill specialty if empty using manual category/subcategory
    const submissionData = {
      ...formData,
      specialty: formData.specialty.trim() || formData.manualSubCategory?.trim() || formData.manualCategory?.trim() || 'Consultant',
      documents: documentsPayload,
      latitude: liveLocation?.lat || undefined,
      longitude: liveLocation?.lng || undefined
    };

    setError('');
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/auth/expert/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (response.ok) {
        setIsSuccessModalOpen(true);
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
      <div className="flex-1 flex flex-col lg:flex-row items-stretch">
        {/* Left side - Branding/Image (Sticky & Fixed in Viewport on Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] bg-gradient-to-br from-[#f0f4fa] via-[#eaf0fa] to-[#f4f7fc] flex-col justify-between px-10 xl:px-14 py-8 relative overflow-hidden select-none shrink-0">
          {/* Subtle ambient lighting */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col h-full justify-between">
            {/* Top Branding Section */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold mb-3.5 shadow-xs">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Verified Expert Community</span>
              </div>
              <h1 className="font-heading font-extrabold text-3xl xl:text-4xl 2xl:text-[42px] mb-2 leading-tight text-slate-900 tracking-tight">
                Monetize your <span className="text-primary">expertise.</span>
              </h1>
              <p className="font-body text-xs xl:text-sm text-slate-600 max-w-md leading-relaxed mb-4">
                Join our verified professional network. Offer 1-on-1 audio, video, and chat consultations to a global clientele with transparent per-second payouts.
              </p>

              {/* Value Proposition Highlights */}
              <div className="grid grid-cols-2 gap-2.5 max-w-md">
                <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Per-Second Payouts</p>
                    <p className="text-[10px] text-slate-500 truncate">Fair earnings per second</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Flexible Hours</p>
                    <p className="text-[10px] text-slate-500 truncate">Work at your convenience</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Verified Profile</p>
                    <p className="text-[10px] text-slate-500 truncate">Build trusted authority</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Call & Chat Suite</p>
                    <p className="text-[10px] text-slate-500 truncate">Multi-channel sessions</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center/Bottom illustration anchored neatly in viewport */}
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center pt-3 pb-2">
              <div className="absolute bottom-1 w-[80%] h-6 bg-slate-400/20 rounded-[100%] blur-md pointer-events-none" />
              <img 
                src="/login-illustration.png" 
                alt="Consultant Illustration" 
                className="max-h-[290px] xl:max-h-[340px] 2xl:max-h-[380px] w-auto object-contain drop-shadow-[0_15px_25px_rgba(15,23,42,0.08)] hover:scale-[1.01] transition-transform duration-300 relative z-10" 
              />
            </div>
          </div>
        </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 sm:p-8 lg:p-10 bg-white relative min-h-full">
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

          {user && user.role !== 'EXPERT' && (
            <div className="mb-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-base">info</span>
              <span>
                You are currently signed in as <strong>{user.name}</strong>. Complete the form below to register as an Expert.
              </span>
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

            {/* Live Location / Coordinates Indicator */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={16} className={locationStatus === 'detected' ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">
                      {locationStatus === 'detected' ? 'Live Location Detected' : 'Live Location (Distance Matching)'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {locationStatus === 'detected'
                        ? `Lat: ${liveLocation.lat.toFixed(4)}, Lng: ${liveLocation.lng.toFixed(4)}`
                        : locationStatus === 'detecting'
                          ? 'Detecting GPS coordinates...'
                          : 'Auto-detecting your location for accurate distance search'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="px-2.5 py-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors shrink-0 cursor-pointer"
                >
                  {locationStatus === 'detected' ? 'Re-detect' : 'Detect'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs sm:text-sm font-semibold text-on-background">Category</label>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.categoryId === 'MANUAL') {
                      handleCategoryChange('');
                    } else {
                      handleCategoryChange('MANUAL');
                    }
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {formData.categoryId === 'MANUAL' ? '← Choose from listed categories' : '✍️ Not listed? Enter manually'}
                </button>
              </div>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background font-body text-sm appearance-none"
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                <option value="MANUAL">✍️ Other / Not Listed (Type Category Manually)</option>
              </select>
            </div>

            {/* Manual Category Input Fields */}
            {formData.categoryId === 'MANUAL' && (
              <div className="space-y-3 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-blue-900">
                    Category Name (Manual) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="manualCategory"
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 text-sm placeholder-slate-400"
                    value={formData.manualCategory}
                    onChange={handleChange}
                    required={formData.categoryId === 'MANUAL'}
                    placeholder="e.g. Astrologer, Tarot Reader, Life Coach"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-blue-900">
                    Sub-Category <span className="text-blue-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    name="manualSubCategory"
                    type="text"
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 text-sm placeholder-slate-400"
                    value={formData.manualSubCategory}
                    onChange={handleChange}
                    placeholder="e.g. Vedic Astrology, Career Growth, Yoga"
                  />
                </div>
              </div>
            )}

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

            {/* Verification Documents Upload Section */}
            <div className="pt-2 pb-1 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                      Verification Documents / प्रमाण पत्र अपलोड
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Required for compliance and expert profile verification
                    </p>
                  </div>
                </div>
                {loadingRequirements && (
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                )}
              </div>

              <div className="space-y-2.5">
                {docRequirements.map((req) => {
                  const uploaded = uploadedDocs[req.docKey];
                  const isUploading = uploadingDocKey === req.docKey;

                  return (
                    <div 
                      key={req.docKey}
                      className={`p-3 rounded-xl border transition-all ${
                        uploaded 
                          ? 'bg-emerald-50/60 border-emerald-200' 
                          : req.isMandatory 
                            ? 'bg-slate-50/70 border-slate-200 hover:border-blue-300' 
                            : 'bg-slate-50/40 border-dashed border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              {req.name}
                            </span>
                            {req.isMandatory ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                                Mandatory *
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          {req.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {req.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={el => fileInputRefs.current[req.docKey] = el}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, req)}
                      />

                      {uploaded ? (
                        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-emerald-200 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {uploaded.fileName}
                            </span>
                            {uploaded.fileSize && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({(uploaded.fileSize / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[req.docKey]?.click()}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(req.docKey)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[req.docKey]?.click()}
                          className="w-full py-2 px-3 border border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/30 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 size={14} className="animate-spin text-blue-600" />
                              <span className="text-blue-600">Compressing & Loading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={14} className="text-slate-500" />
                              <span>Select / Upload Document (PDF, Image)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                🔒 Documents are encrypted and securely stored for administrative verification only.
              </p>
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

      {/* Registration Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
              Registration Successful!
            </h3>
            <p className="text-sm font-bold text-emerald-600 mb-2">
              रजिस्ट्रेशन सफलतापूर्वक पूरा हो गया है!
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              आपकी Expert एप्लीकेशन सफलतापूर्वक दर्ज हो गई है। कृपया अब <strong>Expert Login</strong> पेज पर जाकर अपने ईमेल और पासवर्ड से लॉगिन करें।
            </p>
            <button
              type="button"
              onClick={() => {
                if (user) {
                  logout();
                }
                navigate('/expert/login');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span>Go to Expert Login / एक्सपर्ट लॉगिन करें</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertRegister;
