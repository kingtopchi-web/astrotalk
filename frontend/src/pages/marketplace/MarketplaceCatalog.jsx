import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, X, SlidersHorizontal, ShoppingBag,
  ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, FileText
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/marketplace/ProductCard';
import { getApiUrl } from '../../utils/apiConfig';

const FILE_FORMATS = ['pdf', 'zip', 'docx', 'xlsx', 'mp3', 'mp4', 'csv', 'txt'];

export default function MarketplaceCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Local filter states from URL search params
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'latest';
  const selectedFormat = searchParams.get('fileType') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileFilterOpen]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(getApiUrl('/marketplace/categories'));
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(searchParams);
      if (!query.has('page')) query.set('page', '1');
      if (!query.has('limit')) query.set('limit', '12');

      const res = await axios.get(`${getApiUrl('/marketplace/products')}?${query.toString()}`);
      if (res.data?.success) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedFormat || minPrice || maxPrice);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6">
          <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link to="/" className="hover:underline">Home</Link>
                <span>/</span>
                <Link to="/marketplace" className="hover:underline">Marketplace</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-semibold">Catalog</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Digital Products Catalog
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Showing {pagination.total} downloadable products
              </p>
            </div>

            {/* Sort & Mobile Filter Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <SlidersHorizontal size={14} />
                <span>Filters {hasActiveFilters && '•'}</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <ArrowUpDown size={14} className="text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Sort:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="bg-transparent outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Best Selling</option>
                  <option value="rating">Top Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Main Layout */}
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-8 flex items-start gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Filter size={16} />
                <span>Filters</span>
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search filter */}
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. template, pdf..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-600">
                  <Search size={14} />
                </button>
              </div>
            </form>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categories</label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {cat.productCount != null && (
                      <span className="text-[10px] text-slate-400 font-normal">({cat.productCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* File Formats */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">File Type</label>
              <div className="flex flex-wrap gap-1.5">
                {FILE_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => updateParam('fileType', selectedFormat === fmt ? '' : fmt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all ${
                      selectedFormat === fmt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid Section */}
          <div className="flex-1 space-y-6">
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Active filters:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Search: "{search}"
                    <button onClick={() => updateParam('search', '')}><X size={12} /></button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Category: {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                    <button onClick={() => updateParam('category', '')}><X size={12} /></button>
                  </span>
                )}
                {selectedFormat && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Format: {selectedFormat.toUpperCase()}
                    <button onClick={() => updateParam('fileType', '')}><X size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-80 rounded-none bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
                <ShoppingBag size={48} className="mx-auto text-slate-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No digital products match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting or clearing your filters, or check back soon as new digital assets are added.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => updateParam('page', String(pagination.page - 1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-3">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateParam('page', String(pagination.page + 1))}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Slide-out Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />
            <aside className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full p-5 overflow-y-auto space-y-6 shadow-2xl z-10 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <Filter size={16} className="text-blue-600" />
                    <span>Filter Products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMobileFilterOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Mobile Search */}
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setMobileFilterOpen(false);
                  }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Search Keywords</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="e.g. template, pdf..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-600">
                      <Search size={14} />
                    </button>
                  </div>
                </form>

                {/* Mobile Categories */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categories</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        updateParam('category', '');
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        !selectedCategory
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          updateParam('category', cat.slug);
                          setMobileFilterOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                          selectedCategory === cat.slug
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {cat.productCount != null && (
                          <span className="text-[10px] text-slate-400 font-normal">({cat.productCount})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile File Formats */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">File Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {FILE_FORMATS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          updateParam('fileType', selectedFormat === fmt ? '' : fmt);
                          setMobileFilterOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
                          selectedFormat === fmt
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply / Close button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
                >
                  Apply & Close Filters
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

