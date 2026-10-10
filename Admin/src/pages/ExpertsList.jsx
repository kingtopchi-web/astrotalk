import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, Edit2, Trash2, CheckCircle, XCircle, X, Plus } from 'lucide-react';

const STATUS_COLORS = {
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const ACCOUNT_STATUS_COLORS = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

const ExpertsList = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetExpert, setTargetExpert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = { page, limit: 15 };
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/admin/experts', {
        headers: { Authorization: `Bearer ${token}` },
        params,
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

  useEffect(() => {
    fetchExperts();
  }, [page, verificationFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExperts();
  };

  // Realtime search trigger if enter is pressed or form is submitted
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchExperts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Specialty', 'Verification', 'Status', 'Joined'];
    const csvData = experts.map(e => [e.name, e.email, e.specialty, e.verificationStatus, e.status, new Date(e.createdAt).toLocaleDateString()].join(','));
    const blob = new Blob([headers.join(',') + '\\n' + csvData.join('\\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'experts.csv');
    a.click();
  };

  const handleApprove = async (expert) => {
    if (!window.confirm(`Approve expert "${expert.name}"?`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`https://astrotalk-hlg2.onrender.com/api/admin/experts/${expert._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExperts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve expert');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (expert) => {
    setTargetExpert(expert);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`https://astrotalk-hlg2.onrender.com/api/admin/experts/${targetExpert._id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRejectModal(false);
      fetchExperts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject expert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (expert, newStatus) => {
    if (!window.confirm(`Set "${expert.name}" account status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`https://astrotalk-hlg2.onrender.com/api/admin/experts/${expert._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchExperts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (expert) => {
    if (!window.confirm(`Are you sure you want to delete expert "${expert.name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`https://astrotalk-hlg2.onrender.com/api/admin/experts/${expert._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchExperts();
    } catch (err) {
      alert('Failed to delete expert');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expert Management</h1>
          <span className="text-sm text-slate-500">{total} expert(s) found</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dynamic Search */}
          {showSearch && (
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search name, email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 w-48"
              />
              <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </form>
          )}
          
          {/* Dynamic Filter */}
          {showFilters && (
            <div className="flex items-center gap-2">
              <select 
                value={verificationFilter}
                onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Verification</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Columns">
              <Columns size={16} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showFilters ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Filter">
              <Filter size={16} />
            </button>
            <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Download">
              <Download size={16} />
            </button>
            <button onClick={() => setShowSearch(!showSearch)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showSearch ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Search">
              <SearchIcon size={16} />
            </button>
          </div>
          

        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : loading ? (
        <div className="flex justify-center p-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div>
      ) : experts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center text-slate-500">
          No experts found for the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-700 text-sm">
                  <th className="p-4 font-semibold">Expert</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Specialty</th>
                  <th className="p-4 font-semibold">Verification</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody>
                {experts.map((expert) => (
                  <tr key={expert._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {expert.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{expert.name}</p>
                          <p className="text-xs text-slate-400">{expert.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{expert.categoryId?.name || '—'}</td>
                    <td className="p-4 text-slate-600">{expert.specialty || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[expert.verificationStatus] || STATUS_COLORS.PENDING}`}>
                        {expert.verificationStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4">
                      {expert.status === 'ACTIVE' ? (
                        <span className="text-slate-800">✓</span>
                      ) : (
                        <span className="text-slate-400">✕</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(expert.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 flex justify-end gap-2">
                      {expert.verificationStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(expert)}
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-green-600 hover:bg-green-50 transition"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => openRejectModal(expert)}
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-red-600 hover:bg-red-50 transition"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(expert)} 
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Reject Expert</h2>
              <p className="text-sm text-slate-500 mt-1">Expert: <span className="font-semibold text-slate-700">{targetExpert?.name}</span></p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Uploaded degree certificate is not readable."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none"
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Expert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertsList;
