import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  UploadCloud,
  FileCheck,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  FileText,
  ShieldAlert,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  Sparkles,
  Info,
  Lock,
  ShieldCheck,
  GripVertical,
  Trash2,
  Bold,
  Italic,
  List,
  Link2,
  Code,
  Wallet,
  Eye,
  Check,
  Save,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';

export default function AddProduct() {
  const { id } = useParams(); // If present, edit mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [subCategory, setSubCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [features, setFeatures] = useState([
    'High performance optimized source files',
    'Comprehensive documentation and quickstart instructions',
    'Commercial licensing with perpetual usage rights'
  ]);
  const [terms, setTerms] = useState(
    '1. This digital product is licensed for commercial or personal use according to selected license scope.\n2. Redistribution, resale, or sublicensing as a standalone asset is strictly prohibited.\n3. Due to the digital nature of downloadable assets, refunds are handled on an exception basis.'
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['nextjs', 'typescript', 'boilerplate']);

  // Pay What You Want toggle
  const [payWhatYouWant, setPayWhatYouWant] = useState(false);

  // License Scope
  const [licenseScope, setLicenseScope] = useState('Commercial'); // Personal | Commercial | Extended

  // File uploads
  const [coverImage, setCoverImage] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [digitalFile, setDigitalFile] = useState(null); // { originalName, fileSize, fileData }
  const [previewImages, setPreviewImages] = useState([]);

  // Copyright legal affirmations
  const [confirmedOwnership, setConfirmedOwnership] = useState(false);
  const [confirmedRights, setConfirmedRights] = useState(false);
  const [confirmedNoViolation, setConfirmedNoViolation] = useState(false);

  const textareaRef = useRef(null);

  // Popular tag suggestions
  const popularSuggestions = ['react', 'nodejs', 'tailwind', 'ui-kit', 'ebook', 'figma'];

  // Fetch categories & existing product if in edit mode
  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchExistingProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(getApiUrl('/marketplace/categories'));
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchExistingProduct = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl(`/marketplace/products/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && res.data.product) {
        const p = res.data.product;
        setTitle(p.title || '');
        setDescription(p.description || '');
        setCategoryId(p.category?._id || p.category || '');
        setPrice(p.price != null ? p.price.toString() : '');
        setDiscountedPrice(p.discountedPrice != null ? p.discountedPrice.toString() : '');
        setFeatures(p.features && p.features.length > 0 ? p.features : ['']);
        setTerms(p.terms || '');
        setTags(p.tags || []);
        setCoverImage(p.coverImage || '');
        setCoverPreview(p.coverImage || '');
        setPreviewImages(p.previewImages || []);
        setConfirmedOwnership(true);
        setConfirmedRights(true);
        setConfirmedNoViolation(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product details');
    } finally {
      setFetching(false);
    }
  };

  // Handle Cover Image file
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setCoverImage(b64);
      setCoverPreview(b64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Digital Product File
  const handleDigitalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 55 * 1024 * 1024; // 55MB client limit
    if (file.size > maxBytes) {
      setError('Digital file exceeds platform limit of 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDigitalFile({
        originalName: file.name,
        fileSize: file.size,
        fileData: event.target.result
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Features list helpers
  const addFeatureField = () => setFeatures([...features, '']);
  const updateFeature = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };
  const removeFeature = (index) => {
    if (features.length <= 1) {
      setFeatures(['']);
      return;
    }
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Tags helpers
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagValue(tagInput);
    }
  };

  const addTagValue = (val) => {
    const trimmed = val.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 6) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Markdown toolbar helper
  const insertFormatting = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = description.substring(start, end);
    const before = description.substring(0, start);
    const after = description.substring(end);
    const textToInsert = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
    setDescription(before + textToInsert + after);
  };

  // Form calculations
  const numericOriginal = Number(price) || 0;
  const numericSelling = Number(discountedPrice) > 0 ? Number(discountedPrice) : numericOriginal;
  const hasDiscount = numericSelling > 0 && numericOriginal > numericSelling;
  const discountPercent = hasDiscount
    ? Math.round(((numericOriginal - numericSelling) / numericOriginal) * 100)
    : 0;

  // 10% commission calculation
  const platformFeeRate = 0.10;
  const creatorEarnings = numericSelling > 0
    ? (numericSelling * (1 - platformFeeRate)).toFixed(2)
    : '0.00';

  // Digital file display info
  const fileNameDisplay = digitalFile?.originalName || '';
  const fileExtensionDisplay = (fileNameDisplay ? fileNameDisplay.split('.').pop() : 'ZIP').toUpperCase();
  const fileSizeDisplay = digitalFile?.fileSize
    ? (digitalFile.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
    : '50 MB Max';

  // Publishing Readiness checklist (5 criteria)
  const isTitleCategoryReady = Boolean(title.trim().length >= 5 && categoryId);
  const isCoverReady = Boolean(coverImage);
  const isFileReady = Boolean(digitalFile || isEdit);
  const isPricingReady = Boolean(numericSelling > 0 && (!discountedPrice || Number(discountedPrice) < Number(price)));
  const isAffirmationsReady = Boolean(confirmedOwnership && confirmedRights && confirmedNoViolation);

  const readyCriteriaCount = [
    isTitleCategoryReady,
    isCoverReady,
    isFileReady,
    isPricingReady,
    isAffirmationsReady
  ].filter(Boolean).length;

  const readinessPercent = Math.round((readyCriteriaCount / 5) * 100);

  // Form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!title.trim()) return setError('Product title is required (minimum 5 characters)');
    if (!description.trim()) return setError('Product description is required');
    if (!categoryId) return setError('Please select a product category');
    if (!price || Number(price) <= 0) return setError('Please enter a valid original price');
    if (discountedPrice && Number(discountedPrice) >= Number(price)) {
      return setError('Selling price must be strictly lower than regular original price to offer a discount');
    }
    if (!coverImage) return setError('Product cover image (16:9) is required');
    if (!isEdit && !digitalFile) {
      return setError('Digital product downloadable file upload is required');
    }
    if (!confirmedOwnership || !confirmedRights || !confirmedNoViolation) {
      return setError('You must verify and check all 3 mandatory legal affirmations before publishing');
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        features: features.filter((f) => f && f.trim().length > 0),
        terms: terms.trim(),
        coverImage,
        previewImages,
        tags,
        copyrightConfirmed: true
      };

      if (digitalFile) {
        payload.digitalFile = digitalFile;
      }

      let res;
      if (isEdit) {
        res = await axios.put(getApiUrl(`/marketplace/seller/products/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post(getApiUrl('/marketplace/seller/products'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data?.success) {
        setSuccess(res.data.message || 'Product published successfully!');
        setTimeout(() => {
          navigate('/marketplace/seller');
        }, 1500);
      }
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!title.trim()) {
      setError('Please provide at least a Product Title to save as draft');
      return;
    }
    handleSubmit();
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading product configuration...
        </div>
      </div>
    );
  }

  const selectedCategoryObj = categories.find((c) => c._id === categoryId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-6 sm:py-8 font-sans">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 space-y-6">

        {/* Back navigation & Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Digital Asset Studio
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                v2.4 Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Digital Product' : 'Publish New Digital Product'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Configure product metadata, commercial licensing parameters, and secure encrypted distribution assets.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/marketplace/seller"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft size={14} />
              <span>Seller Hub</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-700 font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
              <X size={15} />
            </button>
          </div>
        )}

        {/* 2-Column Responsive Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: Form Steps (8 Cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-5">

            {/* STEP 1: Product Information */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Product Information</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Step 1 of 4</span>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${title.length > 90 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {title.length} / 90 chars
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={110}
                  placeholder="e.g. Production Ready Node & Next.js SaaS Architecture Kit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                />
                <p className="text-[11px] text-slate-400 leading-normal">
                  A concise, high-intent title with technology stacks increases marketplace click-through by 34%.
                </p>
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Primary Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Sub-Category / Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack Boilerplates, UI Kits"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                  />
                </div>
              </div>

              {/* Discovery Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  Discovery Tags <span className="text-[11px] font-normal text-slate-400">(Max 6 tags)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/70 rounded-lg border border-slate-200 min-h-[42px]">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-blue-500 hover:text-blue-800 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {tags.length < 6 && (
                    <input
                      type="text"
                      placeholder={tags.length === 0 ? "Type tag & press enter..." : "Add tag..."}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex-1 min-w-[130px] bg-transparent text-xs sm:text-sm outline-none px-1 font-medium text-slate-700"
                    />
                  )}
                </div>

                {/* Popular suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-extrabold uppercase tracking-wider text-slate-400">Popular Suggestions:</span>
                  {popularSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => addTagValue(sug)}
                      disabled={tags.includes(sug) || tags.length >= 6}
                      className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-40 disabled:hover:text-blue-600 cursor-pointer"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description with Markdown Toolbar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Full Product Overview & Specifications <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">MARKDOWN SUPPORTED</span>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-t-xl border border-b-0 border-slate-200 text-slate-600">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n- ')}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="Bullet list"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('[', '](https://)')}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="Link"
                  >
                    <Link2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('`', '`')}
                    className="p-1.5 hover:bg-white rounded-lg transition"
                    title="Inline Code"
                  >
                    <Code size={14} />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={5}
                  placeholder="Provide comprehensive details about this digital product, architecture, included files, instructions, requirements, and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-b-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium leading-relaxed"
                />
              </div>

              {/* Key Inclusions & Features */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Key Inclusions & Features</label>
                  <button
                    type="button"
                    onClick={addFeatureField}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Bullet Point</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 bg-slate-50/70 rounded-xl border border-slate-200 focus-within:border-blue-500 transition"
                    >
                      <GripVertical size={14} className="text-slate-400 shrink-0" />
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <input
                        type="text"
                        placeholder="Feature or deliverable item..."
                        value={feat}
                        onChange={(e) => updateFeature(idx, e.target.value)}
                        className="flex-1 bg-transparent text-xs sm:text-sm outline-none font-medium text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-slate-400 hover:text-rose-500 transition p-1"
                        title="Remove bullet point"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: Pricing & Economics */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Pricing & Economics</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Step 2 of 4</span>
              </div>

              {/* Price & Selling Price inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Original Price (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="999"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Standard price shown as crossed-out benchmark if discount is set.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Selling Price (₹ INR) <span className="text-slate-400 font-normal">(Optional Discount)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="499"
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Actual purchase amount charged to the buyer at checkout.
                  </p>
                </div>
              </div>

              {/* Creator Earnings Breakdown Pill */}
              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Net Estimated Creator Earnings</h4>
                    <p className="text-[11px] text-slate-500">
                      After 10% marketplace host commission & payment gateway handling
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 sm:text-right shrink-0">
                  <span className="text-xs font-bold text-slate-500">You Earn:</span>
                  <span className="text-base font-black text-blue-700">₹{creatorEarnings}</span>
                  <span className="text-[10px] font-bold text-slate-400">/ SALE</span>
                </div>
              </div>

              {/* Pay What You Want Toggle */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">Enable "Pay What You Want"</span>
                  <p className="text-[11px] text-slate-500">
                    Allows generous buyers to contribute any amount above ₹{numericSelling > 0 ? numericSelling : 'base'} base price.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPayWhatYouWant(!payWhatYouWant)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    payWhatYouWant ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* STEP 3: Media & Digital Package */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Media & Digital Package</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Step 3 of 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cover Banner Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Marketplace Cover Banner (16:9) <span className="text-rose-500">*</span>
                  </label>

                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition group text-center min-h-[170px] relative overflow-hidden">
                    {coverPreview ? (
                      <div className="relative w-full h-full aspect-16/10 rounded-md overflow-hidden">
                        <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                          Click to Change Image
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition">
                          <ImageIcon size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Drag & drop thumbnail or <span className="text-blue-600 underline">Browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Recommended 1920×1080px (PNG, JPG, WEBP) Max file size 5MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Digital Downloadable File Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Secure Downloadable File Package <span className="text-rose-500">*</span>
                  </label>

                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-lg cursor-pointer bg-blue-50/20 hover:bg-blue-50/40 transition group text-center min-h-[170px]">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition">
                        <Lock size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Drop digital payload or <span className="text-blue-600 underline">Browse Archive</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ZIP, PDF, MP4, FIG, RAR (Max 50MB)
                        </p>
                      </div>

                      {fileNameDisplay && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-blue-200 text-xs font-bold text-blue-700 shadow-xs max-w-full truncate">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{fileNameDisplay}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({fileSizeDisplay})</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      onChange={handleDigitalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* AES-256 Encryption Footer Note */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                <UploadCloud size={16} className="text-blue-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Files are hashed, encrypted with AES-256, and delivered via time-limited one-time streaming tokens post-checkout.
                </span>
              </div>
            </div>

            {/* STEP 4: License Scope & Mandatory Legal Affirmations */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h2 className="text-base font-bold text-slate-900">License Scope & Affirmations</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Step 4 of 4</span>
              </div>

              {/* License Scope Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Personal', title: 'Personal', desc: 'Single non-commercial project or personal learning usage.' },
                  { id: 'Commercial', title: 'Commercial', desc: 'Unlimited client or personal commercial applications without resale.' },
                  { id: 'Extended', title: 'Extended', desc: 'Includes right to redistribute inside derivative commercial end-products.' }
                ].map((lic) => {
                  const isSelected = licenseScope === lic.id;
                  return (
                    <div
                      key={lic.id}
                      onClick={() => setLicenseScope(lic.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{lic.title}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{lic.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* SELLER MANDATORY LEGAL AFFIRMATIONS */}
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/80 space-y-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-900">
                    <span>⚖</span>
                    <span>Seller Mandatory Legal Affirmations</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    You must verify all 3 affirmations before your digital asset can enter the marketplace indexing catalog:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1 text-xs">
                  {/* Affirmation 1 */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedOwnership}
                      onChange={(e) => setConfirmedOwnership(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Original Intellectual Property:</strong> I hereby certify that I am the sole owner of this product or have explicit licensed rights to commercialize and distribute all enclosed assets, source codes, and media.
                    </span>
                  </label>

                  {/* Affirmation 2 */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedRights}
                      onChange={(e) => setConfirmedRights(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Safe & Compliant Delivery:</strong> The asset files are completely free from malicious scripts, trackers, trojans, or unauthorized third-party proprietary trade secrets.
                    </span>
                  </label>

                  {/* Affirmation 3 */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmedNoViolation}
                      onChange={(e) => setConfirmedNoViolation(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 font-bold">Customer Fulfillment Commitment:</strong> I agree to provide baseline technical bug fixes or version updates for at least 6 months following initial release.
                    </span>
                  </label>
                </div>
              </div>
            </div>

          </form>

          {/* RIGHT COLUMN: Sticky Live Preview & Readiness (4 Cols) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">

            {/* Live Card Preview */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Eye size={15} className="text-blue-600" />
                  <span>Live Card Preview</span>
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Buyer View
                </span>
              </div>

              {/* Exact Sharp Product Card Preview */}
              <div className="bg-white rounded-none border border-slate-200 shadow-md overflow-hidden flex flex-col transition">
                {/* Thumbnail */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Preview thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <ImageIcon size={32} className="opacity-50" />
                      <span className="text-[10px] font-medium">Cover Banner Preview</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-900/80 backdrop-blur-md text-white">
                      {fileExtensionDisplay} • {fileSizeDisplay}
                    </span>
                    {hasDiscount && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200/50">
                      {selectedCategoryObj?.name || 'Category'}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 truncate max-w-[70%]">
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {(user?.name || 'S').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-semibold truncate">{user?.name || 'Seller'}</span>
                      {user?.role === 'expert' && (
                        <ShieldCheck size={12} className="text-blue-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-amber-500 font-bold text-[10px]">★ 5.0 (New)</span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-snug">
                    {title || 'Production Ready Digital Asset Kit'}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {description || 'Product specifications and deliverable files will display here for potential buyers.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{numericSelling > 0 ? Number(numericSelling).toLocaleString('en-IN') : '499'}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{Number(numericOriginal).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-xs cursor-default"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Publishing Readiness Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Publishing Readiness
                </h3>
                <span className="text-xs font-black text-blue-700">
                  {readyCriteriaCount} of 5 Ready
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className={`flex items-center gap-2 ${isTitleCategoryReady ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={15} className={isTitleCategoryReady ? 'text-emerald-500' : 'text-slate-300'} />
                  <span>Informative Title & Category</span>
                </div>

                <div className={`flex items-center gap-2 ${isCoverReady ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={15} className={isCoverReady ? 'text-emerald-500' : 'text-slate-300'} />
                  <span>Cover Image Attached (16:9)</span>
                </div>

                <div className={`flex items-center gap-2 ${isFileReady ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={15} className={isFileReady ? 'text-emerald-500' : 'text-slate-300'} />
                  <span>Downloadable File Validated</span>
                </div>

                <div className={`flex items-center gap-2 ${isPricingReady ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={15} className={isPricingReady ? 'text-emerald-500' : 'text-slate-300'} />
                  <span>Pricing & Payout Model Verified</span>
                </div>

                <div className={`flex items-center gap-2 ${isAffirmationsReady ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={15} className={isAffirmationsReady ? 'text-emerald-500' : 'text-slate-300'} />
                  <span>Mandatory Affirmations Signed</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{isEdit ? 'Save Changes' : 'Publish / Submit for Review'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>Save as Draft</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/marketplace/seller')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Discard Changes & Exit
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
