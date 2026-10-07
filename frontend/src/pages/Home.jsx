import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/user/experts');
        setExperts(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch experts', err);
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'astrology', label: 'Astrology', icon: '🔮' },
    { id: 'career', label: 'Career', icon: '🎯' },
    { id: 'wellness', label: 'Wellness', icon: '🌿' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0">
      <Header />
      
      <main className="flex-1 w-full pt-16 md:pt-20">
        
        {/* HERO SECTION */}
        <section className="bg-white py-12 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            
            {/* Left Content */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl text-on-background leading-[1.15]">
                Get Expert Advice <br/>
                For a Better Tomorrow
              </h1>
              
              <p className="font-body text-base md:text-lg text-on-surface-variant max-w-lg mx-auto md:mx-0">
                Connect with verified experts across multiple fields. Ask, consult, and get the right guidance.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto md:mx-0 mt-8 flex items-center bg-white border border-border rounded-full shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-on-surface-variant ml-3 text-[20px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search for experts (e.g. Doctor, Lawyer, Coach...)" 
                  className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm text-on-background"
                />
                <button className="px-6 py-2.5 bg-primary text-white rounded-full font-body font-semibold text-sm hover:bg-primary-dark transition-colors">
                  Search
                </button>
              </div>

              {/* Category Icons under Search */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-6 mt-4">
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-accent text-[24px]">favorite</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Health & Fitness</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-primary text-[24px]">balance</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Legal</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-secondary text-[24px]">school</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Education</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-warning text-[24px]">work</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Career</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-success text-[24px]">account_balance</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Finance</span>
                 </button>
                 <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                     <span className="material-symbols-outlined text-on-background text-[24px]">computer</span>
                   </div>
                   <span className="text-[11px] font-semibold text-on-surface">Technology</span>
                 </button>
              </div>
            </div>
            
            {/* Right Image area */}
            <div className="flex-1 relative w-full max-w-md md:max-w-none flex justify-center">
               <div className="relative w-full aspect-[5/4] max-w-[480px] rounded-3xl overflow-visible flex items-center justify-center">
                 {/* Fake doctor image replacement - Using an online placeholder stock for exact vibe */}
                 <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" alt="Expert" className="w-full h-full object-cover object-center rounded-3xl shadow-xl" />
                 
                 {/* Floating tags */}
                 <div className="absolute top-10 -left-6 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-border flex items-center gap-2 animate-bounce" style={{animationDuration: '3s'}}>
                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-background">100+</div>
                      <div className="text-[10px] text-on-surface-variant">Verified Experts</div>
                    </div>
                 </div>

                 <div className="absolute bottom-20 -right-6 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-border flex items-center gap-2">
                    <div className="flex -space-x-2">
                       <div className="w-6 h-6 rounded-full bg-accent border-2 border-white"></div>
                       <div className="w-6 h-6 rounded-full bg-warning border-2 border-white"></div>
                       <div className="w-6 h-6 rounded-full bg-success border-2 border-white"></div>
                    </div>
                    <div className="text-[11px] font-semibold text-on-surface-variant">Active Now</div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 bg-white">
          
          {/* POPULAR EXPERTS SECTION */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-heading font-bold text-2xl text-on-background">Popular Experts</h2>
              <button onClick={() => navigate('/experts')} className="text-primary font-semibold text-sm hover:underline">View All</button>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1,2,3,4].map(n => (
                   <div key={n} className="bg-white rounded-2xl p-6 border border-border h-64 animate-pulse flex flex-col items-center">
                     <div className="w-20 h-20 bg-border rounded-full mb-4"></div>
                     <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
                     <div className="h-3 bg-border rounded w-1/2 mb-4"></div>
                     <div className="h-8 bg-border rounded-lg w-full mt-auto"></div>
                   </div>
                 ))}
              </div>
            ) : experts.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center text-on-surface-variant">
                No experts available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {experts.slice(0, 4).map((expert) => (
                  <div key={expert._id} onClick={() => navigate(`/expert/${expert._id}`)} className="bg-white rounded-2xl border border-border/80 shadow-sm hover:shadow-card transition-all cursor-pointer overflow-hidden flex flex-col items-center p-6 text-center">
                    <img 
                      className="w-20 h-20 rounded-full object-cover mb-4 border border-border" 
                      alt={expert.name} 
                      src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.name}&background=eff6ff&color=2563eb`} 
                    />
                    <h3 className="font-heading font-bold text-lg text-on-background mb-1">
                      {expert.name}
                    </h3>
                    <p className="font-body text-xs text-on-surface-variant mb-3">
                      {expert.category?.name || expert.specialty}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs mb-5">
                      <span className="material-symbols-outlined text-[14px] text-warning" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                      <span className="font-bold text-on-background">{expert.rating || '4.8'}</span>
                      <span className="text-on-surface-variant">({expert.reviewsCount || Math.floor(Math.random() * 200 + 50)} reviews)</span>
                    </div>
                    
                    <button className="mt-auto w-full py-2 bg-white text-primary border border-primary/20 hover:bg-primary-light rounded-lg font-bold text-sm transition-colors">
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* HOW IT WORKS */}
          <section className="bg-surface-muted rounded-3xl p-8 md:p-12 text-center border border-border">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-background mb-10">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary-dark flex items-center justify-center text-3xl font-heading font-bold">1</div>
                  <h3 className="font-heading font-bold text-xl">Find Your Expert</h3>
                  <p className="font-body text-on-surface-variant">Browse through our verified experts across various categories and read reviews.</p>
               </div>
               <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-secondary-dark flex items-center justify-center text-3xl font-heading font-bold">2</div>
                  <h3 className="font-heading font-bold text-xl">Recharge Wallet</h3>
                  <p className="font-body text-on-surface-variant">Add funds to your secure wallet for seamless and instant consultations.</p>
               </div>
               <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-success/20 text-success flex items-center justify-center text-3xl font-heading font-bold">3</div>
                  <h3 className="font-heading font-bold text-xl">Start Session</h3>
                  <p className="font-body text-on-surface-variant">Connect instantly via chat, voice call, or video call directly on the platform.</p>
               </div>
            </div>
          </section>

        </div>
      </main>
      
      {/* Footer */}
      <div className="hidden md:block mt-12">
        <Footer />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default Home;
