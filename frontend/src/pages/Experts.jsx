import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, List } from 'lucide-react';
import UserLayout from '../components/UserLayout';

function ExpertDiscovery() {
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Admin-like toolbar state
  const [showSearch, setShowSearch] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://astrotalk-hlg2.onrender.com/api/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      axios.get(`https://astrotalk-hlg2.onrender.com/api/categories/${selectedCategory}/subcategories`)
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
      const token = localStorage.getItem('token');
      const params = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubCategory) params.subCategoryId = selectedSubCategory;
      if (search.trim()) params.search = search.trim();

      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/user/experts', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setExperts(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Unable to load experts. Please try again.');
      }
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
      <div className="bg-white border border-slate-100 rounded-xl p-4 md:p-6 mb-6 shadow-sm">
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
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 w-48"
                    />
                    <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  </form>
                )}
                
                {showFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedCategory}
                      onChange={e => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); setPage(1); }}
                      className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    {selectedCategory && (
                      <select
                        value={selectedSubCategory}
                        onChange={e => { setSelectedSubCategory(e.target.value); setPage(1); }}
                        className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white"
                      >
                        <option value="">All Sub-categories</option>
                        {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Toggle View">
                  {viewMode === 'grid' ? <List size={16} /> : <Columns size={16} />}
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showFilters ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Filter">
                  <Filter size={16} />
                </button>
                <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Download CSV">
                  <Download size={16} />
                </button>
                <button onClick={() => setShowSearch(!showSearch)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showSearch ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Search">
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
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse border border-slate-100">
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200"></div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded-xl mt-3"></div>
                </div>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No experts found</h3>
              <p className="text-slate-500 text-sm">No experts matching your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">{total} expert(s) found</p>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-4"}>
                {experts.map((expert) => (
                  <div
                    key={expert._id}
                    onClick={() => navigate(`/expert/${expert._id}`)}
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${viewMode === 'list' ? 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4' : ''}`}
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
                        <h3 className="font-bold text-slate-800 text-sm truncate">{expert.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{expert.categoryId?.name || expert.specialty}</p>
                        {expert.subCategoryId && (
                          <span className="inline-block text-[10px] bg-orange-50 text-orange-600 font-medium px-2 py-0.5 rounded-full mt-1">
                            {expert.subCategoryId.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className={viewMode === 'list' ? 'flex-1 hidden sm:block px-4' : ''}>
                      {expert.experience && (
                        <p className="text-xs text-slate-500 mb-2">📅 {expert.experience} exp</p>
                      )}
                      {expert.specialization && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{expert.specialization}</p>
                      )}
                    </div>

                    {/* Rate & Button */}
                    <div className={viewMode === 'list' ? 'w-full sm:w-auto shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3' : 'flex flex-col'}>
                      <div className={viewMode === 'grid' ? 'flex flex-col mt-3 border-t border-slate-100 pt-3 gap-2' : 'flex flex-col gap-2'}>
                        {viewMode === 'grid' && (
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              {expert.rating > 0 && (
                                <span className="text-xs font-medium text-amber-600">⭐ {expert.rating}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-800">
                                ₹{expert.rates?.chat || expert.pricePerMinute || 0}
                              </span>
                              <span className="text-xs text-slate-400">/min</span>
                            </div>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/expert/${expert._id}`); }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Profile
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/book/${expert._id}?type=audio`); }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Audio
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/book/${expert._id}?type=video`); }}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all flex-1"
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
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-100 transition">
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-500">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-slate-100 transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
      </div>
    </UserLayout>
  );
}

export default ExpertDiscovery;
