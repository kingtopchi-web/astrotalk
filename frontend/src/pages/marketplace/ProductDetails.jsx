import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart, Zap, Star, ShieldCheck, Download, Check,
  FileText, Clock, Eye, AlertCircle, Share2, Sparkles, User, ChevronRight
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/marketplace/ProductCard';
import { getApiUrl } from '../../utils/apiConfig';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetails() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { auth } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'features' | 'terms' | 'reviews'
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slugOrId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/marketplace/products/${slugOrId}`));
      if (res.data?.success) {
        setProduct(res.data.product);
        setRelated(res.data.relatedProducts || []);
        fetchReviews(res.data.product._id);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const res = await axios.get(getApiUrl(`/marketplace/reviews/${productId}`));
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (e) {}
  };

  const handleAddToCart = async () => {
    if (!auth.token) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setAddingToCart(true);
    const result = await addToCart(product._id);
    setAddingToCart(false);

    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } else {
      setFeedbackMsg(result.message);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!auth.token) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const result = await addToCart(product._id);
    if (result.success || result.message?.includes('already in your cart')) {
      navigate('/marketplace/cart');
    } else {
      setFeedbackMsg(result.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!auth.token) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!userComment.trim()) return;

    try {
      setSubmittingReview(true);
      setReviewError(null);
      const res = await axios.post(
        getApiUrl('/marketplace/reviews'),
        {
          productId: product._id,
          rating: userRating,
          comment: userComment.trim()
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      if (res.data?.success) {
        setReviewSuccess(true);
        setUserComment('');
        fetchReviews(product._id);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 pt-[72px] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 pt-[72px] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={48} className="text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Digital Product Not Found</h2>
          <p className="text-xs text-slate-500">This product may have been unpublished or removed.</p>
          <Link to="/marketplace/catalog" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Browse All Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPrice = (product.discountedPrice != null && product.discountedPrice > 0)
    ? product.discountedPrice
    : product.price;
  const hasDiscount = product.discountedPrice != null && product.discountedPrice > 0 && product.discountedPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;
  const ext = product.digitalFile?.fileExtension?.toUpperCase() || 'FILE';
  const fileSizeMb = (product.digitalFile?.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        {/* Breadcrumb Navigation */}
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/marketplace" className="hover:underline">Marketplace</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link to={`/marketplace/catalog?category=${product.category.slug}`} className="hover:underline">
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-slate-900 dark:text-white font-semibold truncate">{product.title}</span>
          </div>
        </div>

        {/* Product Hero & Buy Box */}
        <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Media & Cover Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                <img
                  src={product.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-md">
                    {ext} FORMAT
                  </span>
                  {hasDiscount && (
                    <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white shadow-md">
                      SAVE {discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Preview thumbnails if any */}
              {product.previewImages?.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.previewImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="w-20 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500"
                    />
                  ))}
                </div>
              )}

              {/* Digital File Safety Trust Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-300">
                <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">100% Secure Instant Digital Delivery</p>
                  <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                    Download access is cryptographically tied to your verified account. The file is delivered as a <strong>.{ext.toLowerCase()}</strong> ({fileSizeMb} MB) archive upon successful payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Info & Purchase Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                {/* Seller & Rating Bar */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {product.sellerName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Created by</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-white">
                        <span>{product.sellerName}</span>
                        {product.sellerModel === 'Expert' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 font-bold">
                            <ShieldCheck size={11} />
                            <span>Expert</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2.5 py-1 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Star size={14} fill="currentColor" />
                    <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}</span>
                    <span className="text-slate-400 font-normal">({product.totalReviews} reviews)</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {product.title}
                </h1>

                {/* Sales counter */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Download size={13} /> {product.salesCount} purchases</span>
                  <span className="flex items-center gap-1"><Eye size={13} /> {product.viewsCount} views</span>
                  <span className="flex items-center gap-1"><FileText size={13} /> {ext} ({fileSizeMb} MB)</span>
                </div>
              </div>

              {/* Price & Purchase Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
                {feedbackMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                    {feedbackMsg}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    ₹{Number(currentPrice).toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-slate-400 line-through font-semibold">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Zap size={18} />
                    <span>Buy Now & Instant Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      added
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                    <span>{added ? 'Added to Cart' : 'Add to Cart'}</span>
                  </button>
                </div>

                {/* Value bullets */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Instant file access in <strong>My Purchases</strong> immediately</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Lifetime re-download access from your account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>Verified author copyright declaration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabbed Content: Overview / Features / Terms / Reviews */}
        <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-8 border-t border-slate-200 dark:border-slate-800">
          {/* Tabs header */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
            {[
              { id: 'overview', label: 'Description' },
              { id: 'features', label: `Features (${product.features?.length || 0})` },
              { id: 'terms', label: 'License & Terms' },
              { id: 'reviews', label: `Reviews (${reviews.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="max-w-4xl space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Tab 2: Features */}
          {activeTab === 'features' && (
            <div className="max-w-4xl space-y-3">
              {product.features?.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                      <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No specific features listed for this asset.</p>
              )}
            </div>
          )}

          {/* Tab 3: Terms */}
          {activeTab === 'terms' && (
            <div className="max-w-4xl p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <h4 className="font-bold text-slate-900 dark:text-white">License & Conditions</h4>
              <p className="leading-relaxed whitespace-pre-line">
                {product.terms || 'Standard personal and commercial license. Redistribution or resale of the original source files is strictly prohibited.'}
              </p>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="max-w-4xl space-y-8">
              {/* Write Review Form */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Leave a Verified Review</h3>
                <p className="text-xs text-slate-500">Only verified buyers who completed a purchase of this product can submit a review.</p>

                {reviewSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    Thank you! Your review has been submitted and published.
                  </div>
                )}
                {reviewError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star size={22} fill={star <= userRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">{userRating} / 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Review</label>
                    <textarea
                      rows={3}
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Share your experience with this digital product..."
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No reviews yet for this product. Be the first to review!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{rev.userName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} fill={s <= rev.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-12 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              More from this Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-900 dark:text-white">
                ₹{Number(currentPrice).toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-[10px] line-through text-slate-400">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                addedToCart ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <ShoppingCart size={14} />
              <span>{addedToCart ? 'In Cart' : 'Add'}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white shadow-md hover:bg-blue-700"
            >
              Buy Now
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

