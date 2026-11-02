import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Star, ShieldCheck, Sparkles, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { fetchFreeChatConfig, getApiUrl } from '../utils/apiConfig';

function FreeServices() {
  const { user } = useAuth();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [freeChatStatus, setFreeChatStatus] = useState(null);
  const [startingChatId, setStartingChatId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFreeChatStatus();
    fetchVerifiedExperts();
  }, [user]);

  const fetchFreeChatStatus = async () => {
    try {
      const status = await fetchFreeChatConfig();
      if (status) {
        setFreeChatStatus(status);
      }
    } catch (err) {
      console.error('Failed to fetch free chat status:', err);
    }
  };

  const fetchVerifiedExperts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/public/experts'), {
        params: { limit: 20 }
      });
      setExperts(res.data.data || []);
    } catch (err) {
      setError('Unable to load available experts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const usedExpertIds = freeChatStatus?.usedExpertIds || [];
  const hasUsedToday = Boolean(freeChatStatus?.hasUsedToday);
  const durationMinutes = freeChatStatus?.freeChatDurationMinutes || 5;
  const isFreeChatEnabled = freeChatStatus ? freeChatStatus.enableFreeChat !== false : true;
  const allExpertsClaimed = experts.length > 0 && experts.every(e => usedExpertIds.includes(e._id));

  const handleStartFreeChat = async (expertId) => {
    if (!user) {
      navigate('/login?redirect=/free-services');
      return;
    }
    if (user.role !== 'USER') {
      alert('Only client accounts can start a free consultation.');
      return;
    }
    if (isFreeChatEnabled === false) {
      alert('Free chat consultation is currently disabled by administrator.');
      return;
    }
    if (usedExpertIds.includes(expertId)) {
      alert('You have already used your 1-time free consultation with this expert. You can select another expert or start a paid session.');
      return;
    }
    if (hasUsedToday) {
      alert('Daily limit reached: You can take 1 free consultation per day. Please come back tomorrow to chat with another expert for free.');
      return;
    }

    try {
      setStartingChatId(expertId);
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('/bookings/start-free-chat'), {
        expertId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state so UI reflects usage immediately
      setFreeChatStatus(prev => ({
        ...(prev || {}),
        usedExpertIds: [...(prev?.usedExpertIds || []), expertId],
        hasUsedToday: true,
        hasUsedFreeChat: true
      }));

      navigate('/messages');
    } catch (err) {
      console.error('Error starting free chat:', err);
      alert(err.response?.data?.message || 'Failed to start free chat session');
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <UserLayout title="Free Services" subtitle="Welcome benefit: Experience a free consultation with every listed expert (1 session daily).">
      <div className="py-6 space-y-6">
        {/* Banner Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-orange-500/10 border border-amber-200 dark:border-amber-900/40 p-6 sm:p-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              <Sparkles size={14} />
              <span>1 Free Chat Daily · Once Per Expert</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-on-surface">
              Chat Free with Every Listed Expert ({durationMinutes} {durationMinutes === 1 ? 'Minute' : 'Minutes'} Each)
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Every user receives a free {durationMinutes}-minute chat consultation once with each listed expert! You can take <strong>1 free consultation per day</strong>. ₹0 charged to your wallet, and 100% free!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={15} /> 1 session per expert (lifetime)
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Clock size={15} /> 1 session per day (resets daily)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <ShieldCheck size={15} /> Zero wallet deduction
              </span>
            </div>

            {/* Eligibility Status */}
            <div className="pt-3">
              {!user ? (
                <div className="flex items-center gap-3 bg-surface/80 dark:bg-black/20 p-3 rounded-2xl border border-border w-fit">
                  <span className="text-xs text-on-surface-variant">Sign in to check your free session eligibility:</span>
                  <button
                    onClick={() => navigate('/login?redirect=/free-services')}
                    className="px-4 py-1.5 bg-primary text-background rounded-xl text-xs font-bold hover:bg-primary-light transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : !isFreeChatEnabled ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3.5 py-2 rounded-2xl border border-amber-200 w-fit">
                  <AlertCircle size={15} />
                  <span>Free chat consultations are temporarily disabled by platform admin.</span>
                </div>
              ) : allExpertsClaimed ? (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 rounded-2xl border border-indigo-200 dark:border-indigo-800 w-fit">
                  <CheckCircle size={15} className="text-indigo-600" />
                  <span>You have enjoyed a free consultation with all currently listed experts! Explore regular sessions.</span>
                </div>
              ) : hasUsedToday ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 rounded-2xl border border-amber-200 dark:border-amber-800 w-fit">
                  <Clock size={15} className="text-amber-600" />
                  <span>Daily limit reached (1/day). You have taken your free chat for today. Come back tomorrow to chat with another expert for free!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 w-fit animate-pulse">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>You are eligible today! Choose any expert below who has not been claimed yet to start your {durationMinutes}-minute free session.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Experts Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-on-surface">Available Experts for Free Consultation</h3>
            <button
              onClick={() => navigate('/experts')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Browse All Experts &gt;
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl p-4 animate-pulse border border-border">
                  <div className="w-14 h-14 rounded-2xl bg-surface-variant mb-3"></div>
                  <div className="h-4 bg-surface-variant rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-surface-variant rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-2xl border border-border">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No Experts Available Currently</h3>
              <p className="text-on-surface/60 text-sm">Please check back in a few minutes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {experts.map(expert => {
                const isClaimedWithExpert = usedExpertIds.includes(expert._id);
                const isAvailableToday = !isClaimedWithExpert && !hasUsedToday && isFreeChatEnabled;

                return (
                  <div
                    key={expert._id}
                    className="bg-surface rounded-2xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F7C83C&color=fff`}
                          alt={expert.name}
                          className="w-14 h-14 rounded-2xl object-cover shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-on-surface text-sm truncate">{expert.name}</h4>
                            {isClaimedWithExpert ? (
                              <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                CLAIMED
                              </span>
                            ) : hasUsedToday ? (
                              <span className="inline-block text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                TOMORROW
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{expert.specialty || expert.categoryId?.name || 'Consultant'}</p>
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-1">
                            <Star size={12} className="fill-amber-500" />
                            <span>{expert.rating ? expert.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-on-surface/40 font-normal">({expert.totalConsultations || expert.reviewsCount || 10}+)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <button
                        onClick={() => navigate(`/expert/${expert._id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-xl transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        disabled={startingChatId === expert._id || !isAvailableToday}
                        onClick={() => handleStartFreeChat(expert._id)}
                        title={
                          isClaimedWithExpert
                            ? 'You have already used your 1-time free consultation with this expert.'
                            : hasUsedToday
                            ? 'Daily limit reached. You can take 1 free consultation per day. Available tomorrow!'
                            : `Start ${durationMinutes}-minute free chat`
                        }
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          isAvailableToday
                            ? 'bg-primary text-background hover:bg-primary-light cursor-pointer'
                            : 'bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <MessageCircle size={13} />
                        <span>
                          {startingChatId === expert._id 
                            ? 'Starting...' 
                            : isClaimedWithExpert 
                            ? 'Free Used' 
                            : hasUsedToday 
                            ? 'Available Tomorrow' 
                            : `Chat Free (${durationMinutes}m)`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default FreeServices;
