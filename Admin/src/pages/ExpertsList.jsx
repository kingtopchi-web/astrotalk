import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, Edit2, Trash2, CheckCircle, XCircle, X, Plus, Building2, Eye, FileText, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

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
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search');
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState(searchParam || '');
  const [showSearch, setShowSearch] = useState(Boolean(searchParam));
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetExpert, setTargetExpert] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bank verification modal state
  const [selectedBankExpert, setSelectedBankExpert] = useState(null);
  const [showBankRejectInput, setShowBankRejectInput] = useState(false);
  const [bankRejectReason, setBankRejectReason] = useState('');
  const [previewPassbookFull, setPreviewPassbookFull] = useState(false);

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = { page, limit: 15 };
      if (verificationFilter) params.verificationStatus = verificationFilter;
      if (bankFilter) params.bankVerificationStatus = bankFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await axios.get(`${ADMIN_API_URL}/experts`, {
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
  }, [page, verificationFilter, bankFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExperts();
  };

  useEffect(() => {
    if (searchParam !== null && searchParam !== undefined) {
      setSearch(searchParam);
      setShowSearch(true);
      setPage(1);
    }
  }, [searchParam]);

  // Realtime search trigger if enter is pressed or form is submitted
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchExperts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Specialty', 'Profile Verification', 'Bank Status', 'Bank Name', 'Account No', 'IFSC', 'Status', 'Joined'];
    const csvData = experts.map(e => [
      e.name,
      e.email,
      e.specialty || '',
      e.verificationStatus || 'PENDING',
      e.bankDetails?.verificationStatus || 'NOT_SUBMITTED',
      e.bankDetails?.bankName || '',
      e.bankDetails?.accountNumber ? `"${e.bankDetails.accountNumber}"` : '',
      e.bankDetails?.ifscCode || '',
      e.status,
      new Date(e.createdAt).toLocaleDateString()
    ].join(','));
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
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
      await axios.patch(`${ADMIN_API_URL}/experts/${expert._id}/approve`, {}, {
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
      await axios.patch(`${ADMIN_API_URL}/experts/${targetExpert._id}/reject`,
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

  const handleApproveBank = async (expertId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(`${ADMIN_API_URL}/experts/${expertId}/bank/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update table list state instantly without page refresh
      setExperts(prev => prev.map(e => e._id === expertId ? res.data.expert : e));
      // Automatically exit from modal
      setSelectedBankExpert(null);
      setShowBankRejectInput(false);
      setBankRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve bank details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBank = async (expertId) => {
    if (!bankRejectReason.trim()) {
      alert('Please provide a reason for rejecting the bank details.');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(`${ADMIN_API_URL}/experts/${expertId}/bank/reject`, { reason: bankRejectReason.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update table list state instantly without page refresh
      setExperts(prev => prev.map(e => e._id === expertId ? res.data.expert : e));
      // Automatically exit from modal
      setSelectedBankExpert(null);
      setShowBankRejectInput(false);
      setBankRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject bank details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (expert, newStatus) => {
    if (!window.confirm(`Set "${expert.name}" account status to ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${ADMIN_API_URL}/experts/${expert._id}/status`,
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
      await axios.delete(`${ADMIN_API_URL}/experts/${expert._id}`,
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
            <div className="flex items-center gap-2 flex-wrap">
              <select 
                value={verificationFilter}
                onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Profile Status</option>
                <option value="PENDING">Profile Pending</option>
                <option value="APPROVED">Profile Approved</option>
                <option value="REJECTED">Profile Rejected</option>
              </select>
              <select 
                value={bankFilter}
                onChange={(e) => { setBankFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-amber-50/50 font-medium"
              >
                <option value="">All Bank Verification</option>
                <option value="PENDING">Bank Review Pending (Review Passbook)</option>
                <option value="APPROVED">Bank Approved</option>
                <option value="REJECTED">Bank Rejected</option>
                <option value="NOT_SUBMITTED">Bank Not Submitted</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              >
                <option value="">All Account Status</option>
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
                  <th className="p-4 font-semibold">Profile Status</th>
                  <th className="p-4 font-semibold">Bank & Passbook</th>
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
                      <button
                        type="button"
                        onClick={() => setSelectedBankExpert(expert)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition hover:shadow-xs cursor-pointer"
                        title="Click to view bank details and passbook document"
                      >
                        {expert.bankDetails?.verificationStatus === 'APPROVED' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle size={12} /> Bank Approved
                          </span>
                        ) : expert.bankDetails?.verificationStatus === 'PENDING' ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-bold animate-pulse">
                            <Clock size={12} /> Passbook Pending Review
                          </span>
                        ) : expert.bankDetails?.verificationStatus === 'REJECTED' ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <XCircle size={12} /> Bank Rejected
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-[11px]">
                            Not Submitted
                          </span>
                        )}
                      </button>
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

      {/* Bank Verification & Passbook Modal */}
      {selectedBankExpert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Expert Bank Details & Passbook</h3>
                  <p className="text-xs text-slate-400">{selectedBankExpert.name} ({selectedBankExpert.email})</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedBankExpert(null); setShowBankRejectInput(false); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Verification Status</span>
                {selectedBankExpert.bankDetails?.verificationStatus === 'APPROVED' ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                    <CheckCircle size={14} /> Approved & Payouts Active
                  </span>
                ) : selectedBankExpert.bankDetails?.verificationStatus === 'PENDING' ? (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 animate-pulse">
                    <Clock size={14} /> Pending Administrator Review
                  </span>
                ) : selectedBankExpert.bankDetails?.verificationStatus === 'REJECTED' ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                    <XCircle size={14} /> Rejected
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                    Not Submitted
                  </span>
                )}
              </div>

              {selectedBankExpert.bankDetails?.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                  <span className="font-bold">Previous Rejection Reason:</span> {selectedBankExpert.bankDetails.rejectionReason}
                </div>
              )}

              {/* Account Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold mb-0.5">Account Holder Name</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedBankExpert.bankDetails?.accountName || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold mb-0.5">Bank Name</p>
                  <p className="font-bold text-slate-800 text-sm">{selectedBankExpert.bankDetails?.bankName || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold mb-0.5">Account Number</p>
                  <p className="font-bold text-slate-800 text-sm font-mono tracking-wider">{selectedBankExpert.bankDetails?.accountNumber || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold mb-0.5">IFSC Code</p>
                  <p className="font-bold text-slate-800 text-sm font-mono uppercase">{selectedBankExpert.bankDetails?.ifscCode || '—'}</p>
                </div>
              </div>

              {/* Bank Passbook / Cheque Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-600" />
                    <span>Uploaded Bank Passbook / Cancelled Cheque</span>
                  </label>
                  {selectedBankExpert.bankDetails?.passbookImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewPassbookFull(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} /> View Fullscreen
                    </button>
                  )}
                </div>

                {selectedBankExpert.bankDetails?.passbookImage ? (
                  <div 
                    onClick={() => setPreviewPassbookFull(true)}
                    className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100 max-h-56 flex items-center justify-center p-2 cursor-pointer group"
                  >
                    <img 
                      src={selectedBankExpert.bankDetails.passbookImage} 
                      alt="Bank Passbook" 
                      className="max-h-52 w-auto object-contain rounded-lg transition-transform group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                      <Eye size={16} /> Click to expand
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs bg-slate-50">
                    No passbook image uploaded yet.
                  </div>
                )}
              </div>

              {/* Rejection input toggle */}
              {showBankRejectInput && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Reason for Bank Details Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={bankRejectReason}
                    onChange={(e) => setBankRejectReason(e.target.value)}
                    placeholder="e.g. Account name does not match passbook name, or IFSC code is incorrect..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-400 outline-none resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowBankRejectInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectBank(selectedBankExpert._id)}
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? 'Rejecting...' : 'Confirm Reject Bank Details'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => { setSelectedBankExpert(null); setShowBankRejectInput(false); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!showBankRejectInput && (
                  <button
                    type="button"
                    onClick={() => setShowBankRejectInput(true)}
                    disabled={actionLoading || !selectedBankExpert.bankDetails?.accountNumber}
                    className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    Reject Bank Details
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleApproveBank(selectedBankExpert._id)}
                  disabled={actionLoading || !selectedBankExpert.bankDetails?.accountNumber}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>{actionLoading ? 'Processing...' : 'Approve Bank Details'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Passbook Lightbox */}
      {previewPassbookFull && selectedBankExpert?.bankDetails?.passbookImage && (
        <div 
          onClick={() => setPreviewPassbookFull(false)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedBankExpert.bankDetails.passbookImage} 
              alt="Passbook Document" 
              className="max-h-[85vh] w-auto object-contain rounded-xl shadow-2xl" 
            />
            <button 
              onClick={() => setPreviewPassbookFull(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertsList;
