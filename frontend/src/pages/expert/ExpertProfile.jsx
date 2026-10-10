import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';

function ExpertProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/experts/${id}`);
        setExpert(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch expert', err);
        setLoading(false);
      }
    };
    fetchExpert();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-error/10 border border-error/20 text-error px-6 py-4 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <span className="font-semibold">Expert not found</span>
          </div>
        </div>
      </div>
    );
  }

  const rates = expert.rates || { chat: expert.pricePerMinute || 0, audio: 0, video: 0 };
  const specialtyName = expert.specialty || (expert.categoryId?.name) || 'Expert';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Navigation & Breadcrumbs */}
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface text-on-surface-variant hover:text-on-surface transition-colors border border-border"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <Link to="/experts" className="hover:text-primary transition-colors">Experts</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface truncate max-w-[150px] sm:max-w-none">{expert.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Header Card */}
            <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <img 
                    alt={expert.name} 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg border-4 border-surface" 
                    src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=8B5CF6&color=fff&size=200`} 
                  />
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-surface flex items-center justify-center ${expert.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-white opacity-80"></div>
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <h1 className="font-heading font-extrabold text-3xl text-on-background">{expert.name}</h1>
                    {expert.isVerified && (
                      <span className="material-symbols-outlined text-primary text-[24px]" title="Verified Expert">verified</span>
                    )}
                  </div>
                  
                  <p className="font-body text-lg text-primary font-bold mb-3">{specialtyName}</p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <div className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-bold">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      {expert.rating || '4.8'}
                      <span className="text-secondary/70 font-semibold ml-1">({expert.reviewsCount || '120'} reviews)</span>
                    </div>
                    {expert.experience && (
                      <div className="inline-flex items-center gap-1.5 bg-surface text-on-surface-variant px-3 py-1.5 rounded-full text-sm font-semibold border border-border">
                        <span className="material-symbols-outlined text-[16px]">work_history</span>
                        {expert.experience} Years Exp.
                      </div>
                    )}
                    {expert.languages && expert.languages.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 bg-surface text-on-surface-variant px-3 py-1.5 rounded-full text-sm font-semibold border border-border">
                        <span className="material-symbols-outlined text-[16px]">translate</span>
                        {expert.languages.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="glass-panel p-6 sm:p-8">
              <h2 className="font-heading font-bold text-xl text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_book</span>
                About Me
              </h2>
              <p className="font-body text-on-surface-variant leading-relaxed">
                {expert.bio || "This expert hasn't provided a biography yet."}
              </p>
              
              {(expert.qualification || expert.specialization) && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                  {expert.qualification && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Qualification</p>
                        <p className="text-sm font-bold text-on-surface">{expert.qualification}</p>
                      </div>
                    </div>
                  )}
                  {expert.specialization && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">military_tech</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Specialization</p>
                        <p className="text-sm font-bold text-on-surface">{expert.specialization}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Reviews Summary (Placeholder for Future Phase) */}
            <div className="glass-panel p-6 sm:p-8 opacity-70">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading font-bold text-xl text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">reviews</span>
                  Client Reviews
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider bg-surface px-2 py-1 rounded border border-border">Coming Soon</span>
              </div>
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[48px] text-border mb-3">forum</span>
                <p className="text-on-surface-variant font-medium">Detailed reviews and ratings will be available in Phase 5.</p>
              </div>
            </div>

          </div>

          {/* Right Column: Booking & Actions */}
          <div className="space-y-6">
            
            {/* Booking Card */}
            <div className="glass-panel p-1 border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="bg-surface rounded-[calc(0.75rem-1px)] p-6 relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider text-green-600">Available Now</span>
                </div>
                
                <h3 className="font-heading font-bold text-lg text-on-surface mb-4">Start Consultation</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate(`/book/${expert._id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-on-surface block">Chat</span>
                        <span className="text-xs text-on-surface-variant block">Text consultation</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-primary block">₹{Number(rates.chat).toFixed(2)}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase font-semibold">/ min</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/book/${expert._id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-on-surface block">Audio Call</span>
                        <span className="text-xs text-on-surface-variant block">Voice consultation</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-primary block">₹{Number(rates.audio).toFixed(2)}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase font-semibold">/ min</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate(`/book/${expert._id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all group shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold block">Video Call</span>
                        <span className="text-xs opacity-90 block">Face-to-face</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold block">₹{Number(rates.video).toFixed(2)}</span>
                      <span className="text-[10px] opacity-90 uppercase font-semibold">/ min</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Support Actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-surface text-on-surface font-bold hover:bg-surface-hover transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                Save
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-surface text-on-surface font-bold hover:bg-surface-hover transition-colors">
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share
              </button>
            </div>
            
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <footer className="md:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border p-3 z-40 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-xs text-on-surface-variant font-semibold">Starting from</div>
          <div className="font-heading font-extrabold text-lg text-primary">
            ₹{Number(Math.min(...Object.values(rates).filter(v => v > 0) || [0])).toFixed(2)} <span className="text-xs font-normal text-on-surface-variant">/ min</span>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/book/${expert._id}`)}
          className="bg-primary hover:bg-primary-dark text-white font-heading font-bold text-sm py-3 px-6 rounded-xl transition-colors shadow-md"
        >
          Book Now
        </button>
      </footer>
      
      <BottomNav />
    </div>
  );
}

export default ExpertProfile;
