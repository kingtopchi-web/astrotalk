import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';

function Experts() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/experts');
        setExperts(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch experts', err);
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  const categories = ['All', 'Astrology', 'Tarot', 'Numerology', 'Vastu', 'Healing'];

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (expert.specialty && expert.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || 
                            (expert.specialty && expert.specialty.toLowerCase().includes(activeCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-on-background mb-4 text-center">
            Find Your <span className="text-primary">Expert</span>
          </h1>
          <p className="font-body text-on-surface-variant text-center max-w-2xl mx-auto">
            Connect with top-rated professionals for guidance and consultation in various fields.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Search experts by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-body"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x justify-start md:justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`snap-center shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                  activeCategory === category 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-surface border border-border text-on-surface-variant hover:bg-surface-hover'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Experts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-panel p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-surface"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface rounded w-3/4"></div>
                    <div className="h-3 bg-surface rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-10 bg-surface rounded-xl w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredExperts.length === 0 ? (
          <div className="glass-panel p-12 text-center max-w-md mx-auto mt-12">
            <span className="material-symbols-outlined text-[64px] text-border mb-4">search_off</span>
            <h3 className="font-heading font-bold text-xl text-on-surface mb-2">No Experts Found</h3>
            <p className="text-on-surface-variant font-body">We couldn't find any experts matching your search criteria. Try adjusting your filters.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExperts.map((expert) => (
              <div 
                key={expert._id} 
                onClick={() => navigate(`/expert/${expert._id}`)} 
                className="glass-panel group hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <img 
                        src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=8B5CF6&color=fff&size=150`} 
                        alt={expert.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-surface shadow-md group-hover:scale-105 transition-transform" 
                      />
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${expert.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}>
                         <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
                      </div>
                    </div>
                    {expert.isVerified && (
                       <span className="material-symbols-outlined text-primary text-[20px]" title="Verified Expert">verified</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg text-on-surface truncate group-hover:text-primary transition-colors">{expert.name}</h3>
                    <p className="text-sm font-semibold text-primary truncate mb-3">{expert.specialty || 'Expert'}</p>
                    
                    <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs font-bold w-max mb-3">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      {expert.rating || '4.8'}
                      <span className="text-secondary/70 font-semibold ml-0.5">({expert.reviewsCount || '120'})</span>
                    </div>

                    {expert.languages && expert.languages.length > 0 && (
                      <p className="text-xs text-on-surface-variant line-clamp-1 flex items-center gap-1 mb-4">
                        <span className="material-symbols-outlined text-[14px]">translate</span>
                        {expert.languages.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-surface/50 border-t border-border p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Starting at</span>
                     <span className="font-extrabold text-on-surface">₹{expert.pricePerMinute || 0}<span className="text-xs font-normal text-on-surface-variant">/min</span></span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  );
}

export default Experts;
