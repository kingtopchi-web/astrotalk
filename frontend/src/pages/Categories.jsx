import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { Search, ArrowRight, Grid, ArrowLeft, Users } from 'lucide-react';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const categoryFallbackImages = {
    astrologer: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=600&q=80',
    finance: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
    career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80',
    doctors: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    wellness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    tech: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
  };

  const getCatImage = (cat) => {
    if (cat?.image) return cat.image;
    const s = (cat?.slug || '').toLowerCase();
    const n = (cat?.name || '').toLowerCase();
    if (categoryFallbackImages[s]) return categoryFallbackImages[s];
    for (const [k, url] of Object.entries(categoryFallbackImages)) {
      if (s.includes(k) || n.includes(k)) return url;
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
  };

  useEffect(() => {
    axios.get('https://astrotalk-hlg2.onrender.com/api/public/categories')
      .then(res => {
        setCategories(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setLoading(false);
      });
  }, []);

  const filteredCategories = categories.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0 overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-border">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold tracking-wider mb-3">
                <Grid size={14} /> EXPLORE ALL CATEGORIES
              </div>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-background">
                All Consultation <span className="text-primary">Categories</span>
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-2xl">
                Choose a professional field to find top-rated verified experts ready to help you instantly.
              </p>
            </div>

            {/* Live Search Bar */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-xl text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-muted rounded-2xl h-48 border border-border p-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-card mb-4"></div>
                  <div className="h-4 bg-surface-card rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-surface-card rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-surface-muted border border-border rounded-3xl p-12 text-center text-on-surface-variant flex flex-col items-center max-w-lg mx-auto">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
              <h3 className="font-heading font-bold text-lg text-on-background mb-1">No categories found</h3>
              <p className="text-sm">We couldn't find any category matching "{searchTerm}". Try a different keyword.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-background transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <Link
                  key={category._id}
                  to={`/experts?categoryId=${category._id}`}
                  className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary shadow-sm mb-4 transition-all">
                    <img 
                      src={getCatImage(category)} 
                      alt={category.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <h3 className="font-heading font-bold text-lg text-on-background mb-1.5 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-5">
                    {category.description || 'Verified professionals available for instant consultation.'}
                  </p>

                  <div className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Browse Experts</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

export default Categories;
