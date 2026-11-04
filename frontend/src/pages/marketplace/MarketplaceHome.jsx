import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, ShoppingBag, Sparkles, TrendingUp, ShieldCheck, Download,
  Layers, ArrowRight, Zap, Star, CheckCircle2, ChevronRight, PlusCircle
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/marketplace/ProductCard';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function MarketplaceHome() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState({
    featured: [],
    latest: [],
    popular: [],
    categories: [],
    stats: { totalProducts: 0, totalSales: 0 }
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/home'));
      if (res.data?.success) {
        setHomeData(res.data);
      }
    } catch (err) {
      console.error('Error fetching marketplace home:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace/catalog');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-linear-to-b from-blue-900 via-slate-900 to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/15 rounded-full blur-3xl" />
            <div className="absolute -top-12 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <Sparkles size={14} className="text-amber-400" />
              <span>Digital Products & Premium Resources Marketplace</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Instant Access to Verified <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-sky-300 to-indigo-300">
                Digital Assets, E-books & Tools
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed">
              Discover templates, financial blueprints, code scripts, guides, and professional assets authored by certified experts. Instant secure download upon purchase.
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
              <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 border border-slate-200 dark:border-slate-800">
                <Search size={20} className="text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spreadsheets, e-books, source code, legal drafts..."
                  className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 bg-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/marketplace/catalog"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag size={18} />
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to={auth.token ? '/marketplace/sell' : '/login?redirect=/marketplace/sell'}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <PlusCircle size={18} />
                <span>Become a Seller</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Download size={16} />
                </div>
                <span>Instant 1-Click Secure Downloads</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <span>Virus & Malware Verified Assets</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Layers size={16} />
                </div>
                <span>Multi-Format Compatibility</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Star size={16} />
                </div>
                <span>Certified Expert Creators</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. CATEGORIES SECTION ──────────────────────────────────── */}
        <section className="py-12 px-3 sm:px-5 lg:px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Browse by Category
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Explore specialized digital collections tailored to your professional needs
              </p>
            </div>
            <Link
              to="/marketplace/catalog"
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {homeData.categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/marketplace/catalog?category=${cat.slug}`}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg transition-all flex flex-col items-center text-center space-y-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <Layers size={22} />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {cat.productCount ? `${cat.productCount} assets` : 'Explore'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 3. FEATURED PRODUCTS ───────────────────────────────────── */}
        {homeData.featured.length > 0 && (
          <section className="py-10 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800 px-3 sm:px-5 lg:px-6">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Featured Digital Products
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Top curated resources hand-picked for quality & value
                    </p>
                  </div>
                </div>
                <Link
                  to="/marketplace/catalog?featured=true"
                  className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Explore Featured</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {homeData.featured.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 4. LATEST RELEASES ──────────────────────────────────────── */}
        <section className="py-12 px-3 sm:px-5 lg:px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Latest Releases
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Fresh digital assets published recently by our community
                </p>
              </div>
            </div>
            <Link
              to="/marketplace/catalog?sort=latest"
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Releases</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-72 rounded-none bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : homeData.latest.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <ShoppingBag size={40} className="mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No products published yet.</p>
              <Link
                to="/marketplace/sell"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                <PlusCircle size={15} />
                <span>Be the first to sell a product!</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {homeData.latest.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ─── 5. BECOME A SELLER CTA BANNER ──────────────────────────── */}
        <section className="py-12 px-3 sm:px-5 lg:px-6 max-w-screen-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-8 sm:p-12 shadow-xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                Earn From Your Knowledge
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Sell Your Digital Files & Blueprints on ExpertHub
              </h2>
              <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                Both Users and Experts can upload PDFs, spreadsheets, contracts, audio, and tools. Reach thousands of clients, set your own prices, and receive direct earnings.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={auth.token ? '/marketplace/sell' : '/login?redirect=/marketplace/sell'}
                  className="px-6 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle size={18} />
                  <span>Start Selling Now</span>
                </Link>
                <Link
                  to="/marketplace/seller"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 active:scale-95 text-white font-bold text-sm transition-all cursor-pointer"
                >
                  <span>Seller Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

