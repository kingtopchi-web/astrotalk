import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, List, Video, Phone, X, MessageSquare } from 'lucide-react';
import UserLayout from '../components/UserLayout';

function ExpertDiscovery() {
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queryParams = new URLSearchParams(useLocation().search);
  const modeParam = queryParams.get('mode');
  const catParam = queryParams.get('categoryId');
  const [search, setSearch] = useState('');
  const [consultationMode, setConsultationMode] = useState(modeParam || '');
  const [selectedCategory, setSelectedCategory] = useState(catParam || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Admin-like toolbar state
  const [showSearch, setShowSearch] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callMinutes, setCallMinutes] = useState(15);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);

  const navigate = useNavigate();

  const openCallModal = (expert, type) => {
    setSelectedExpert(expert);
    setCallType(type);
    setCallMinutes(15);
    setShowCallModal(true);
  };



  const calculateCallPrice = () => {
    if (!selectedExpert) return 0;
    let rate = 50;
    if (callType === 'video') rate = selectedExpert.rates?.video || selectedExpert.pricePerMinute || 50;
    if (callType === 'audio') rate = selectedExpert.rates?.audio || selectedExpert.pricePerMinute || 30;
    if (callType === 'chat') rate = selectedExpert.rates?.chat || selectedExpert.pricePerMinute || 20;
    return rate * callMinutes;
  };

  const handleCallPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      if(!token) {
        alert("Please login first");
        navigate('/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      
      const orderRes = await axios.post(
        'http://localhost:5000/api/wallet/create-call-order',
        { expertId: selectedExpert._id, minutes: callMinutes, type: callType },
        { headers }
      );
      
      const orderData = orderRes.data;
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ExpertHub',
        description: `Payment for ${callMinutes} mins ${callType} call`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              'http://localhost:5000/api/wallet/verify-call-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                expertId: selectedExpert._id,
                amount: orderData.amount / 100,
                type: callType,
                minutes: callMinutes
              },
              { headers }
            );
            
            if (verifyRes.data.success) {
              alert('Payment successful!');
              setShowCallModal(false);
              if (callType === 'chat') {
                axios.post(
                  'http://localhost:5000/api/messages/conversations',
                  { expertId: selectedExpert._id },
                  { headers }
                ).then(() => {
                  navigate('/messages');
                }).catch(err => {
                  console.error(err);
                  navigate('/messages');
                });
              } else {
                navigate(`/live/${verifyRes.data.consultationId}?type=${callType}`);
              }
            }
          } catch (err) {
            console.error(err);
            alert('Payment verification failed.');
          }
        },
        theme: { color: '#2563eb' }
      };
      
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded');
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => alert('Payment Failed'));
      rzp.open();
      
    } catch (err) {
      console.error(err);
      alert('Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    axios.get('http://localhost:5000/api/public/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      axios.get(`http://localhost:5000/api/public/categories/${selectedCategory}/subcategories`)
        .then(res => setSubCategories(res.data))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubCategory) params.subCategoryId = selectedSubCategory;
      if (search.trim()) params.search = search.trim();

      const res = await axios.get('http://localhost:5000/api/public/experts', {
        params
      });
      setExperts(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError('Unable to load experts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExperts(); }, [page, selectedCategory, selectedSubCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExperts();
  };

  const exportToCSV = () => {
    if (!experts.length) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Category,Specialty,Experience,Rate\n" +
      experts.map(e => `"${e.name || ''}","${e.categoryId?.name || ''}","${e.specialty || e.specialization || ''}","${e.experience || ''}","${e.rates?.chat || e.pricePerMinute || 0}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <UserLayout title="Find an Expert" subtitle="Browse verified professionals ready to help you.">
      <div className="bg-surface border border-border-color rounded-xl p-4 md:p-6 mb-6 shadow-sm">
        {/* Dynamic Toolbar */}
            <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {showSearch && (
                  <form onSubmit={handleSearch} className="relative">
                    <input 
                      type="text" 
                      placeholder="Search name, specialty..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 w-48"
                    />
                    <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-on-surface/50" />
                  </form>
                )}
                
                {showFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedCategory}
                      onChange={e => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); setPage(1); }}
                      className="py-1.5 px-3 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-surface"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    {selectedCategory && (
                      <select
                        value={selectedSubCategory}
                        onChange={e => { setSelectedSubCategory(e.target.value); setPage(1); }}
                        className="py-1.5 px-3 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-surface"
                      >
                        <option value="">All Sub-categories</option>
                        {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="w-9 h-9 flex items-center justify-center bg-surface border border-border-color rounded-lg text-on-surface/80 hover:bg-surface-light transition" title="Toggle View">
                  {viewMode === 'grid' ? <List size={16} /> : <Columns size={16} />}
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`w-9 h-9 flex items-center justify-center border border-border-color rounded-lg transition ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-on-surface/80 hover:bg-surface-light'}`} title="Filter">
                  <Filter size={16} />
                </button>
                <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-surface border border-border-color rounded-lg text-on-surface/80 hover:bg-surface-light transition" title="Download CSV">
                  <Download size={16} />
                </button>
                <button onClick={() => setShowSearch(!showSearch)} className={`w-9 h-9 flex items-center justify-center border border-border-color rounded-lg transition ${showSearch ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-on-surface/80 hover:bg-surface-light'}`} title="Search">
                  <SearchIcon size={16} />
                </button>
              </div>
            </div>
      </div>

      {/* Expert Grid */}
      <div>
        {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl shadow-sm p-4 animate-pulse border border-border-color">
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-surface-light"></div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-surface-light rounded w-3/4"></div>
                      <div className="h-3 bg-surface-light rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-surface-light rounded w-full mb-2"></div>
                  <div className="h-8 bg-surface-light rounded-xl mt-3"></div>
                </div>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No experts found</h3>
              <p className="text-on-surface/60 text-sm">No experts matching your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface/60 mb-4">{total} expert(s) found</p>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-4"}>
                {experts.map((expert) => (
                  <div
                    key={expert._id}
                    onClick={() => navigate(`/expert/${expert._id}`)}
                    className={`bg-surface rounded-2xl shadow-sm border border-border-color p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${viewMode === 'list' ? 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4' : ''}`}
                  >
                    {/* Avatar + Status */}
                    <div className={`flex items-start gap-3 ${viewMode === 'grid' ? 'mb-3' : 'min-w-[200px]'}`}>
                      <div className="relative shrink-0">
                        <img
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F97316&color=fff`}
                          alt={expert.name}
                          className="w-14 h-14 rounded-2xl object-cover"
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${expert.onlineStatus === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-on-surface text-sm truncate">{expert.name}</h3>
                        <p className="text-xs text-on-surface/60 truncate">{expert.categoryId?.name || expert.specialty}</p>
                        {expert.subCategoryId && (
                          <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full mt-1">
                            {expert.subCategoryId.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className={viewMode === 'list' ? 'flex-1 hidden sm:block px-4' : ''}>
                      {expert.experience && (
                        <p className="text-xs text-on-surface/60 mb-2">📅 {expert.experience} exp</p>
                      )}
                      {expert.specialization && (
                        <p className="text-xs text-on-surface/80 mb-2 line-clamp-2">{expert.specialization}</p>
                      )}
                    </div>

                    {/* Rate & Button */}
                    <div className={viewMode === 'list' ? 'w-full sm:w-auto shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3' : 'flex flex-col'}>
                      <div className={viewMode === 'grid' ? 'flex flex-col mt-3 border-t border-border-color pt-3 gap-2' : 'flex flex-col gap-2'}>
                        {viewMode === 'grid' && (
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              {expert.rating > 0 && (
                                <span className="text-xs font-medium text-amber-600">⭐ {expert.rating}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-on-surface">
                                ₹{Number(expert.rates?.chat || expert.pricePerMinute || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-on-surface/50">/min</span>
                            </div>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'chat'); }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Chat
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'audio'); }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Audio
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'video'); }}
                            className="bg-primary hover:bg-primary-light text-background text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all flex-1"
                          >
                            Video
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-surface-light transition">
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-on-surface/60">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-surface-light transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
      </div>

      {/* Call Modal */}
      {showCallModal && selectedExpert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border-color flex items-center justify-between">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                {callType === 'video' ? <Video size={20} className="text-primary"/> : callType === 'audio' ? <Phone size={20} className="text-emerald-500"/> : <MessageSquare size={20} className="text-blue-500" />}
                Instant {callType === 'video' ? 'Video' : callType === 'audio' ? 'Audio' : 'Chat'} Session with {selectedExpert.name}
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-on-surface/50 hover:text-on-surface/80">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-on-surface mb-2">How many minutes do you want to talk?</label>
                <div className="flex items-center justify-between border border-border-color rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setCallMinutes(Math.max(5, callMinutes - 5))}
                    className="px-4 py-3 bg-surface-light hover:bg-surface-light text-on-surface/80 font-bold border-r border-border-color"
                  >-</button>
                  <div className="flex-1 text-center font-extrabold text-xl">{callMinutes} mins</div>
                  <button 
                    onClick={() => setCallMinutes(callMinutes + 5)}
                    className="px-4 py-3 bg-surface-light hover:bg-surface-light text-on-surface/80 font-bold border-l border-border-color"
                  >+</button>
                </div>
                <p className="text-xs text-on-surface/60 mt-2 text-center">Expert Rate: ₹{Number(calculateCallPrice() / callMinutes).toFixed(2)} / min</p>
              </div>
              
              <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between mb-6 border border-primary/20">
                <span className="font-bold text-on-surface">Total Amount</span>
                <span className="text-2xl font-extrabold text-primary">₹{Number(calculateCallPrice()).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={handleCallPayment}
                disabled={processingPayment}
                className="w-full bg-primary text-background font-bold py-3.5 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 shadow-sm"
              >
                {processingPayment ? 'Processing...' : `Pay ₹${calculateCallPrice()} & Start ${callType === 'chat' ? 'Chat' : 'Call'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

export default ExpertDiscovery;
