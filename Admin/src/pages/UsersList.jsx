import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Columns, Filter, Download, Search as SearchIcon, Trash2, X,
  Building2, CheckCircle2, Clock, AlertTriangle, Eye, Check, RefreshCw, ZoomIn
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

const UsersList = () => {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bankStatusFilter, setBankStatusFilter] = useState('');
  const [search, setSearch] = useState(searchParam || '');
  const [showSearch, setShowSearch] = useState(Boolean(searchParam));
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bank Passbook Modal State
  const [selectedUserForBank, setSelectedUserForBank] = useState(null);
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (bankStatusFilter) params.bankVerificationStatus = bankStatusFilter;
      if (search) params.search = search;

      const res = await axios.get(`${ADMIN_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);

      // Refresh currently open modal user if exists
      if (selectedUserForBank) {
        const updated = res.data.data.find(u => u._id === selectedUserForBank._id);
        if (updated) setSelectedUserForBank(updated);
      }
    } catch (err) {
      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, bankStatusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  useEffect(() => {
    if (searchParam !== null && searchParam !== undefined) {
      setSearch(searchParam);
      setShowSearch(true);
      setPage(1);
    }
  }, [searchParam]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Mobile', 'Status', 'Bank Status', 'Account Number', 'IFSC', 'Joined'];
    const csvData = users.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.mobile || ''}"`,
      u.status,
      u.bankDetails?.verificationStatus || 'NOT_SUBMITTED',
      `"${u.bankDetails?.accountNumber || ''}"`,
      `"${u.bankDetails?.ifscCode || ''}"`,
      new Date(u.createdAt).toLocaleDateString()
    ].join(','));
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'users_with_bank_details.csv');
    a.click();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${ADMIN_API_URL}/users/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleApproveBank = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user\'s bank passbook and details? They will be able to request marketplace earnings payouts.')) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${ADMIN_API_URL}/users/${userId}/bank/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User bank passbook approved successfully! Marketplace payouts are now enabled for this user.');
      setShowRejectPrompt(false);
      setRejectReason('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve bank details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBank = async (userId) => {
    if (!rejectReason || !rejectReason.trim()) {
      alert('Please provide a reason for rejecting the bank details/passbook.');
      return;
    }
    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${ADMIN_API_URL}/users/${userId}/bank/reject`, {
        reason: rejectReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User bank details rejected. Notification sent to user with the rejection reason.');
      setShowRejectPrompt(false);
      setRejectReason('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject bank details');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <span className="text-sm text-slate-500">{total} user(s) found</span>
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
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
              >
                <option value="">All Account Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLOCKED">Blocked</option>
              </select>

              <select 
                value={bankStatusFilter}
                onChange={(e) => { setBankStatusFilter(e.target.value); setPage(1); }}
                className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white font-medium"
              >
                <option value="">All Bank Status</option>
                <option value="PENDING">🟡 Passbook Pending Review</option>
                <option value="APPROVED">🟢 Bank Approved</option>
                <option value="REJECTED">🔴 Bank Rejected</option>
                <option value="NOT_SUBMITTED">⚪ No Bank Submitted</option>
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
            <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Download CSV">
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
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center text-slate-500">
          No users found for the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-700 text-sm">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Mobile</th>
                  <th className="p-4 font-semibold">Wallet</th>
                  <th className="p-4 font-semibold">Marketplace Bank & Passbook</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const bStatus = user.bankDetails?.verificationStatus || (user.bankDetails?.accountNumber ? 'PENDING' : 'NOT_SUBMITTED');
                  const hasBank = Boolean(user.bankDetails?.accountNumber);

                  return (
                    <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{user.mobile || '—'}</td>
                      <td className="p-4 text-slate-600 font-semibold">₹{user.walletBalance || 0}</td>
                      
                      {/* Bank & Passbook Verification Status */}
                      <td className="p-4">
                        {bStatus === 'APPROVED' ? (
                          <button
                            onClick={() => setSelectedUserForBank(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                            title="Click to view verified bank details"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Verified</span>
                            {user.bankDetails?.bankName && (
                              <span className="text-[10px] text-emerald-600/80">({user.bankDetails.bankName})</span>
                            )}
                          </button>
                        ) : bStatus === 'PENDING' ? (
                          <button
                            onClick={() => setSelectedUserForBank(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition animate-pulse cursor-pointer shadow-xs"
                            title="Click to review passbook and approve/reject"
                          >
                            <Clock size={13} className="text-amber-600" />
                            <span>Review Passbook</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          </button>
                        ) : bStatus === 'REJECTED' ? (
                          <button
                            onClick={() => setSelectedUserForBank(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                            title="Click to view rejection details"
                          >
                            <X size={13} className="text-rose-600" />
                            <span>Rejected</span>
                          </button>
                        ) : hasBank ? (
                          <button
                            onClick={() => setSelectedUserForBank(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Building2 size={12} />
                            <span>Details Added</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Submitted</span>
                        )}
                      </td>

                      <td className="p-4">
                        {user.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">{user.status}</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasBank && (
                            <button
                              onClick={() => setSelectedUserForBank(user)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                              title="View Bank & Passbook Details"
                            >
                              <Building2 size={13} className="text-blue-600" />
                              <span>Passbook</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(user)} 
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* USER BANK DETAILS & PASSBOOK VERIFICATION MODAL */}
      {selectedUserForBank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Marketplace Bank & Passbook Verification</h3>
                  <p className="text-xs text-slate-500">{selectedUserForBank.name} ({selectedUserForBank.email})</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedUserForBank(null); setShowRejectPrompt(false); setRejectReason(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Verification Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  selectedUserForBank.bankDetails?.verificationStatus === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedUserForBank.bankDetails?.verificationStatus === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedUserForBank.bankDetails?.verificationStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedUserForBank.bankDetails?.verificationStatus || 'NOT_SUBMITTED'}
                </span>
              </div>
              {selectedUserForBank.bankDetails?.submittedAt && (
                <span className="text-xs text-slate-400">
                  Submitted: {new Date(selectedUserForBank.bankDetails.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* If Rejected, show reason */}
            {selectedUserForBank.bankDetails?.verificationStatus === 'REJECTED' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span>Rejection Reason:</span>
                </span>
                <p className="text-rose-700 pl-5">{selectedUserForBank.bankDetails.rejectionReason || 'Documents did not meet criteria.'}</p>
              </div>
            )}

            {/* Bank Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Account Holder Name</span>
                <strong className="text-slate-800 font-semibold text-sm">
                  {selectedUserForBank.bankDetails?.accountName || selectedUserForBank.name}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Bank Name</span>
                <strong className="text-slate-800 font-semibold text-sm">
                  {selectedUserForBank.bankDetails?.bankName || 'Not specified'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Bank Account Number</span>
                <strong className="text-slate-800 font-mono text-sm tracking-wide">
                  {selectedUserForBank.bankDetails?.accountNumber || '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">IFSC Code</span>
                <strong className="text-slate-800 font-mono text-sm uppercase">
                  {selectedUserForBank.bankDetails?.ifscCode || '—'}
                </strong>
              </div>
              {selectedUserForBank.bankDetails?.upiId && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px] font-medium">UPI ID</span>
                  <strong className="text-slate-800 font-mono text-xs">
                    {selectedUserForBank.bankDetails.upiId}
                  </strong>
                </div>
              )}
            </div>

            {/* Passbook / Cancelled Cheque Document Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" />
                  <span>Bank Passbook / Cancelled Cheque Proof</span>
                </span>
                {selectedUserForBank.bankDetails?.passbookImage && (
                  <button
                    type="button"
                    onClick={() => setLightboxImage(selectedUserForBank.bankDetails.passbookImage)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn size={13} />
                    <span>View Fullscreen</span>
                  </button>
                )}
              </div>

              {selectedUserForBank.bankDetails?.passbookImage ? (
                <div 
                  onClick={() => setLightboxImage(selectedUserForBank.bankDetails.passbookImage)}
                  className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center max-h-56 cursor-pointer hover:border-blue-400 transition"
                >
                  <img 
                    src={selectedUserForBank.bankDetails.passbookImage} 
                    alt="Bank Passbook / Cheque Proof" 
                    className="w-full h-auto max-h-56 object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
                    <ZoomIn size={16} />
                    <span>Click to Zoom</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 text-xs">
                  No passbook or cheque image has been uploaded by this user yet.
                </div>
              )}
            </div>

            {/* Rejection Form Input */}
            {showRejectPrompt && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <label className="block text-xs font-bold text-rose-900">
                  Reason for rejecting bank passbook / details: *
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Passbook name doesn't match account name, or image is blurry..."
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || !rejectReason.trim()}
                    onClick={() => handleRejectBank(selectedUserForBank._id)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : null}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Action Buttons */}
            {!showRejectPrompt && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedUserForBank(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectPrompt(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Reject Passbook</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApproveBank(selectedUserForBank._id)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Approve Bank Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX FOR PASSBOOK IMAGE */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={lightboxImage} 
              alt="Bank Passbook Full Proof" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-black/60 px-3 py-1.5 rounded-full hover:bg-black/90 flex items-center gap-1"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
