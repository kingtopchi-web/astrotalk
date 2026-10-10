import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Search, Star, ShieldCheck, ChevronRight, Video, Phone, MessageCircle } from 'lucide-react';

function Home() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [experts, setExperts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroImgIndex, setCurrentHeroImgIndex] = useState(0);
  const navigate = useNavigate();

  const heroImages = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImgIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        let url = 'http://localhost:5000/api/public/experts';
        if (activeCategory !== 'all') {
          url += `?categoryId=${activeCategory}`;
        }
        const res = await axios.get(url);
        if (res.data && res.data.data) {
          setExperts(res.data.data);
        } else {
          setExperts([]);
        }
      } catch (err) {
        console.error('Failed to fetch experts', err);
        setExperts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [activeCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/public/categories');
        if (res.data) setDbCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0 overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-16 md:pt-20">

        {/* HERO SECTION - Carousel Concept */}
        <section className="relative overflow-hidden bg-background text-on-background pt-10 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-7xl mx-auto z-10">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-muted rounded-[2rem] p-8 md:p-12 border border-border">
              {/* Left Content */}
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  1,240 EXPERTS ONLINE NOW
                </div>

                <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-on-background">
                  India's most accurate <br />
                  <span className="text-primary">
                    expert platform
                  </span>
                </h1>

                <div className="space-y-2 text-sm text-on-surface-variant font-medium pt-2">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-5 h-5 rounded-full bg-primary text-background flex items-center justify-center text-xs"><span className="material-symbols-outlined text-[14px]">check</span></div>
                    <span>Get Free initial consultation</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-5 h-5 rounded-full bg-primary text-background flex items-center justify-center text-xs"><span className="material-symbols-outlined text-[14px]">check</span></div>
                    <span>Average reply under 12 seconds</span>
                  </div>
                </div>

                <div className="pt-6">
                  <button className="px-8 py-3.5 bg-primary text-background rounded-full font-heading font-bold text-base hover:bg-primary-light transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 group">
                    Start Free Chat <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>

                {/* Statistics */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-10">
                  <div className="text-left">
                    <p className="text-2xl font-bold text-on-background">5Cr+</p>
                    <p className="text-xs text-on-surface-variant">Users guided</p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-on-background">50,000+</p>
                    <p className="text-xs text-on-surface-variant">Verified experts</p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-on-background">13+</p>
                    <p className="text-xs text-on-surface-variant">Languages</p>
                  </div>
                </div>
              </div>

              {/* Right Image area */}
              <div className="flex-1 relative w-full flex justify-center mt-8 md:mt-0">
                <div className="relative w-full max-w-[420px] h-[280px] flex items-center justify-center">
                  {heroImages.map((img, idx) => {
                    let positionClass = '';

                    if (idx === currentHeroImgIndex) {
                      positionClass = 'w-48 h-64 z-20 translate-x-0 border-4 border-primary shadow-2xl opacity-100 scale-100';
                    } else if (idx === (currentHeroImgIndex + 1) % heroImages.length) {
                      positionClass = 'w-32 h-48 z-10 translate-x-28 border-2 border-border shadow-xl opacity-70 scale-95';
                    } else {
                      positionClass = 'w-32 h-48 z-10 -translate-x-28 border-2 border-border shadow-xl opacity-70 scale-95';
                    }

                    return (
                      <div key={idx} className={`absolute rounded-[4rem] overflow-hidden transition-all duration-700 ease-in-out ${positionClass}`}>
                        <img src={img} alt={`Expert ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTION BLOCKS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div onClick={() => navigate('/experts?mode=chat')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Chat with Expert</h3>
                <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Instant text consultation</p>
              </div>
            </div>

            <div onClick={() => navigate('/experts?mode=audio')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Call Expert</h3>
                <p className="text-xs text-on-surface-variant mt-1 hidden md:block">One-on-one voice call</p>
              </div>
            </div>

            <div onClick={() => navigate('/blog')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Daily Articles</h3>
                <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Your personalized reading</p>
              </div>
            </div>

            <div onClick={() => navigate('/free-services')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Get Free Report</h3>
                <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Detailed issue analysis</p>
              </div>
            </div>

          </div>
        </section>

        {/* OUR SERVICES */}
        <section className="bg-background py-12 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-sm font-bold text-secondary-dark uppercase tracking-widest mb-2">Our Services</div>
            <h2 className="font-heading font-extrabold text-4xl text-on-background mb-8 flex gap-2">
              Our <span className="text-secondary-dark">Services</span>
            </h2>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">

              <div onClick={() => navigate('/free-services')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
                <h3 className="font-bold text-on-background">Free Audit</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">Detailed project audit in 60 sec</p>
                <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>

              <div onClick={() => navigate('/blog')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                </div>
                <h3 className="font-bold text-on-background">Daily Tips</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">For all 12 industries</p>
                <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>

              <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <h3 className="font-bold text-on-background">Career Reading</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">3-card, job, career, finance</p>
                <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>

              <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                </div>
                <h3 className="font-bold text-on-background">Book a Mentor</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">Live session, verified guides</p>
                <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>

              <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                </div>
                <h3 className="font-bold text-on-background">Legal Consult</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">For startup, business, tax</p>
                <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CATEGORY EXPLORATION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
          <div className="bg-surface-card rounded-3xl shadow-soft border border-border p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-bold text-xl md:text-2xl text-on-background">Explore Categories</h2>
              <button className="text-primary font-semibold text-sm hover:text-primary-dark flex items-center gap-1 transition-colors">
                View All <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              <button 
                  onClick={() => setActiveCategory('all')}
                  className={`flex flex-col items-center min-w-[100px] shrink-0 gap-3 p-4 rounded-2xl border transition-all group snap-start ${activeCategory === 'all' ? 'bg-primary-light/30 border-primary' : 'bg-surface-muted hover:bg-primary-light/50 border-transparent hover:border-primary/20'}`}
                >
                  <div className={`w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center transition-all ${activeCategory === 'all' ? 'bg-primary text-on-background scale-110' : 'text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-on-background'}`}>
                    <span className="material-symbols-outlined text-[28px]">grid_view</span>
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight ${activeCategory === 'all' ? 'text-primary' : 'text-on-surface group-hover:text-primary-dark'}`}>All</span>
              </button>
              {dbCategories.map((cat) => (
                <button 
                  key={cat._id} 
                  onClick={() => setActiveCategory(cat._id)}
                  className={`flex flex-col items-center min-w-[100px] shrink-0 gap-3 p-4 rounded-2xl border transition-all group snap-start ${activeCategory === cat._id ? 'bg-primary-light/30 border-primary' : 'bg-surface-muted hover:bg-primary-light/50 border-transparent hover:border-primary/20'}`}
                >
                  <div className={`w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center transition-all ${activeCategory === cat._id ? 'bg-primary text-on-background scale-110' : 'text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-on-background'}`}>
                    <span className="material-symbols-outlined text-[28px]">{cat.icon || 'category'}</span>
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight ${activeCategory === cat._id ? 'text-primary' : 'text-on-surface group-hover:text-primary-dark'}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR EXPERTS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-background">Recommended Experts</h2>
              <p className="text-sm text-on-surface-variant mt-1">Top-rated professionals ready to help you.</p>
            </div>
            <button onClick={() => navigate('/experts')} className="hidden md:flex px-5 py-2 bg-primary/20 text-primary rounded-full font-semibold text-sm hover:bg-primary hover:text-background transition-colors">
              See All Experts
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-surface-muted rounded-3xl p-6 border border-border shadow-sm animate-pulse">
                  <div className="w-24 h-24 bg-surface-card rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-surface-card rounded w-2/3 mx-auto mb-2"></div>
                  <div className="h-3 bg-surface-card rounded w-1/2 mx-auto mb-6"></div>
                  <div className="h-10 bg-surface-card rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <div className="bg-surface-muted border border-border shadow-sm rounded-3xl p-12 text-center text-on-surface-variant flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
              <p>No experts available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {experts.slice(0, 4).map((expert) => (
                <div key={expert._id} onClick={() => navigate(`/expert/${expert._id}`)} className="bg-surface-muted rounded-3xl border border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col overflow-hidden relative">

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10 border border-border">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-[10px] font-bold text-on-background uppercase tracking-wider">Online</span>
                  </div>

                  <div className="p-6 flex flex-col items-center text-center relative">
                    <div className="relative">
                      <img
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md relative z-10"
                        alt={expert.name}
                        src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.name}&background=FFD700&color=000&font-size=0.33&bold=true`}
                      />
                      {expert.isVerified && (
                        <div className="absolute bottom-1 right-1 bg-background rounded-full p-0.5 z-20 shadow-sm text-primary">
                          <ShieldCheck size={18} className="fill-primary text-background" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-lg text-on-background mt-4 group-hover:text-primary transition-colors">
                      {expert.name}
                    </h3>

                    <p className="font-body text-xs font-medium text-primary mt-1 mb-1">
                      {expert.category?.name || expert.specialty || 'Professional Consultant'}
                    </p>

                    {expert.experience && (
                      <p className="text-[11px] text-on-surface-variant mb-3">{expert.experience} Years Exp.</p>
                    )}

                    <div className="flex items-center justify-center gap-3 text-xs mb-6 w-full">
                      <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded-md">
                        <Star size={12} className="fill-warning text-warning" />
                        <span className="font-bold">{expert.rating || '4.9'}</span>
                      </div>
                      <div className="text-on-background font-medium">
                        ₹{Number(expert.hourlyRate || expert.pricing?.video || 50).toFixed(2)}/min
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto w-full grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center gap-1.5 py-2.5 bg-background border border-border text-on-background hover:border-primary hover:text-primary rounded-xl font-bold text-xs transition-colors">
                        <MessageCircle size={14} /> Chat
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-2.5 bg-success/20 text-success hover:bg-success hover:text-background rounded-xl font-bold text-xs transition-colors">
                        <Phone size={14} /> Call
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <button onClick={() => navigate('/experts')} className="px-6 py-2.5 bg-background border border-border text-on-background rounded-full font-semibold text-sm transition-colors w-full">
              View All Experts
            </button>
          </div>
        </section>

        {/* HOW IT WORKS - Premium Cards */}
        <section className="bg-surface-muted py-20 border-y border-border mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-on-background mb-4">Simple, Fast, and Secure</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mb-16 font-medium">Get the answers you need in three simple steps. Our platform ensures complete privacy and seamless connections.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-primary transition-all duration-300 mb-6 shadow-lg">
                  <Search size={32} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">1. Choose an Expert</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Browse verified profiles, read user reviews, and find the perfect match for your specific needs.</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-secondary transition-all duration-300 mb-6 shadow-lg">
                  <ShieldCheck size={32} className="text-secondary" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">2. Recharge Securely</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Add balance to your wallet instantly using our encrypted and safe payment gateway.</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-accent transition-all duration-300 mb-6 shadow-lg">
                  <Video size={32} className="text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">3. Connect Live</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Start your consultation immediately via high-quality video, audio, or instant chat.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <div className="hidden md:block">
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
