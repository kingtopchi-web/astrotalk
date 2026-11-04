import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Check, ShieldCheck, Download, FileText, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const currentPrice = (product.discountedPrice != null && product.discountedPrice > 0)
    ? product.discountedPrice
    : product.price;

  const hasDiscount = product.discountedPrice != null && product.discountedPrice > 0 && product.discountedPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  const ext = product.digitalFile?.fileExtension?.toUpperCase() || 'FILE';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.token) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setAdding(true);
    const result = await addToCart(product._id);
    setAdding(false);

    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } else {
      setToastMessage(result.message);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-rose-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Image Thumbnail Container */}
      <Link to={`/marketplace/products/${product.slug || product._id}`} className="relative block aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={product.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10 shadow-xs">
            {ext}
          </span>
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Category Pill */}
        {product.category?.name && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">
              {product.category.name}
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Seller Line */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate max-w-[70%]">
              <span className="font-medium truncate">{product.sellerName}</span>
              {product.sellerModel === 'Expert' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  <ShieldCheck size={11} />
                  <span>Expert</span>
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
              <Star size={13} fill="currentColor" />
              <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}</span>
              {product.totalReviews > 0 && (
                <span className="text-[10px] text-slate-400 font-normal">({product.totalReviews})</span>
              )}
            </div>
          </div>

          {/* Title */}
          <Link
            to={`/marketplace/products/${product.slug || product._id}`}
            className="block font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1 transition-colors"
          >
            {product.title}
          </Link>

          {/* Short Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Bottom Price & Action Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          {/* Price display */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              ₹{Number(currentPrice).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through font-semibold">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs'
            }`}
            title="Add to shopping cart"
          >
            {added ? (
              <>
                <Check size={14} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>{adding ? '...' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

