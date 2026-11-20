import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, Edit2, Trash2, CheckCircle, XCircle, X, Plus, Building2, Eye, FileText, AlertTriangle, ShieldCheck, Clock, Ban, ShieldAlert, RotateCcw, AlertCircle, Zap } from 'lucide-react';
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

  // Disciplinary Suspension & Reinstatement state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedExpertForSuspend, setSelectedExpertForSuspend] = useState(null);
  const [suspendType, setSuspendType] = useState('TEMPORARY'); // TEMPORARY or PERMANENT
  const [durationPreset, setDurationPreset] = useState('3'); // '1', '3', '7', '14', '30', 'custom'
  const [customUntilDate, setCustomUntilDate] = useState('');
  const [suspendReasonCategory, setSuspendReasonCategory] = useState('Unprofessional conduct in consultation');
  const [customReasonText, setCustomReasonText] = useState('');
  const [suspendNoticeMessage, setSuspendNoticeMessage] = useState('');

  const [showReinstateModal, setShowReinstateModal] = useState(false);
  const [selectedExpertForReinstate, setSelectedExpertForReinstate] = useState(null);
  const [reinstateReason, setReinstateReason] = useState('');

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedNoticeExpert, setSelectedNoticeExpert] = useState(null);

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
    const isReapproving = Boolean(expert.isAutoApproved);
    const confirmMsg = isReapproving
      ? `Confirm manual admin approval for auto-approved expert "${expert.name}"? This will officially certify this expert under Admin review.`
      : `Approve expert "${expert.name}"?`;
    if (!window.confirm(confirmMsg)) return;
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

  const handleOpenSuspendModal = (expert) => {
    setSelectedExpertForSuspend(expert);
    setSuspendType('TEMPORARY');
    setDurationPreset('3');
    setCustomUntilDate('');
    setSuspendReasonCategory('Unprofessional conduct in consultation');
    setCustomReasonText('');
    setSuspendNoticeMessage(`Dear ${expert.name},\n\nYour expert consultation account has been temporarily suspended due to a violation of platform guidelines.\n\nReason: Unprofessional conduct reported during a recent consultation.\n\nDuring this suspension, you cannot go online or accept any consultations. Please review our Expert Code of Conduct.`);
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedExpertForSuspend) return;
    const finalReason = suspendReasonCategory === 'Other' ? customReasonText.trim() : suspendReasonCategory;
    if (!finalReason) {
      alert('Please specify the violation reason.');
      return;
    }
    if (!suspendNoticeMessage.trim()) {
      alert('Please write an official notice message explaining the violation and penalty.');
      return;
    }

    let payload = {
      type: suspendType,
      reason: finalReason,
      noticeMessage: suspendNoticeMessage.trim()
    };

    if (suspendType === 'TEMPORARY') {
      if (durationPreset === 'custom') {
        if (!customUntilDate) {
          alert('Please select a custom suspension expiry date & time.');
          return;
        }
        payload.suspendedUntil = new Date(customUntilDate).toISOString();
      } else {
        payload.durationDays = parseInt(durationPreset, 10);
      }
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${ADMIN_API_URL}/experts/${selectedExpertForSuspend._id}/suspend`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Expert has been suspended and official notice delivered.');
      setShowSuspendModal(false);
      setSelectedExpertForSuspend(null);
      fetchExperts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend expert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReinstateModal = (expert) => {
    setSelectedExpertForReinstate(expert);
    setReinstateReason('Disciplinary period completed / Issue resolved by Admin.');
    setShowReinstateModal(true);
  };

  const handleConfirmReinstate = async () => {
    if (!selectedExpertForReinstate) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${ADMIN_API_URL}/experts/${selectedExpertForReinstate._id}/reinstate`, {
        reason: reinstateReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Expert has been reinstated successfully.');
      setShowReinstateModal(false);
      setSelectedExpertForReinstate(null);
      fetchExperts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reinstate expert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewNotice = (expert) => {
    setSelectedNoticeExpert(expert);
    setShowNoticeModal(true);
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-700 text-sm whitespace-nowrap">
                  <th className="p-4 font-semibold min-w-[200px]">Expert</th>
                  <th className="p-4 font-semibold min-w-[130px]">Category</th>
                  <th className="p-4 font-semibold min-w-[150px]">Specialty</th>
                  <th className="p-4 font-semibold min-w-[150px]">Profile Status</th>
                  <th className="p-4 font-semibold min-w-[170px]">Bank & Passbook</th>
                  <th className="p-4 font-semibold min-w-[140px]">Status</th>
                  <th className="p-4 font-semibold min-w-[100px]">Joined</th>
                  <th className="p-4 font-semibold text-right min-w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {experts.map((expert) => (
                  <tr key={expert._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                    <td className="p-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {expert.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{expert.name}</p>
                          <p className="text-xs text-slate-400 truncate">{expert.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{expert.categoryId?.name || '—'}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{expert.specialty || '—'}</td>
                    <td className="p-4 whitespace-nowrap">
                      {expert.verificationStatus === 'APPROVED' ? (
                        expert.isAutoApproved ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                              <Zap size={11} className="fill-amber-500 text-amber-500" />
                              <span>Auto Approved</span>
                            </span>
                            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                              System Auto (Pending Review)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle size={11} />
                            <span>Admin Verified</span>
                          </span>
                        )
                      ) : expert.verificationStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <XCircle size={11} />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock size={11} />
                          <span>Pending Review</span>
                        </span>
                      )}
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : expert.status === 'SUSPENDED' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Ban size={12} /> Suspended {expert.suspensionDetails?.type === 'TEMPORARY' ? '(Temp)' : '(Perm)'}
                          </span>
                          {expert.suspensionDetails?.suspendedUntil && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={10} /> Until: {new Date(expert.suspensionDetails.suspendedUntil).toLocaleDateString()}
                            </span>
                          )}
                          {expert.suspensionDetails?.noticeMessage && (
                            <button
                              type="button"
                              onClick={() => handleViewNotice(expert)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer mt-0.5"
                            >
                              <Eye size={11} /> View Notice
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {expert.status || 'INACTIVE'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{new Date(expert.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right whitespace-nowrap min-w-[160px]">
                      <div className="inline-flex justify-end items-center gap-1.5">
                      {expert.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleOpenReinstateModal(expert)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          title="Reinstate Expert (Lift Suspension)"
                        >
                          <RotateCcw size={13} /> Reinstate
                        </button>
                      ) : expert.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleOpenSuspendModal(expert)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          title="Suspend / Terminate Temporarily with Notice"
                        >
                          <AlertTriangle size={13} /> Suspend / Notice
                        </button>
                      ) : null}

                      {expert.verificationStatus === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApprove(expert)}
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 transition cursor-pointer shrink-0"
                            title="Approve Expert"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => openRejectModal(expert)}
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer shrink-0"
                            title="Reject Expert"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      ) : expert.isAutoApproved ? (
                        <>
                          <button
                            onClick={() => handleApprove(expert)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                            title="Officially Approve & Verify Auto-Approved Expert"
                          >
                            <CheckCircle size={13} />
                            <span>Confirm Approval</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(expert)}
                            disabled={actionLoading}
                            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer shrink-0"
                            title="Reject / Revoke Auto-Approval"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      ) : null}
                      
                      <button 
                        onClick={() => handleDelete(expert)} 
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shrink-0 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      </div>
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

      {/* Disciplinary Suspension Modal */}
      {showSuspendModal && selectedExpertForSuspend && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Disciplinary Action: Suspend Expert
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expert: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedExpertForSuspend.name}</span> ({selectedExpertForSuspend.email})
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSuspendModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300">
              {/* Suspension Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Suspension Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSuspendType('TEMPORARY')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                      suspendType === 'TEMPORARY'
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="suspendTypeGroup"
                      checked={suspendType === 'TEMPORARY'}
                      onChange={() => setSuspendType('TEMPORARY')}
                      className="mt-0.5 accent-rose-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                        Temporary Suspension
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Restricts consultations for specified duration. Automatically lifts when time expires.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSuspendType('PERMANENT')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                      suspendType === 'PERMANENT'
                        ? 'border-red-600 bg-red-50/80 dark:bg-red-950/50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="suspendTypeGroup"
                      checked={suspendType === 'PERMANENT'}
                      onChange={() => setSuspendType('PERMANENT')}
                      className="mt-0.5 accent-red-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-red-700 dark:text-red-300">
                        Indefinite / Permanent
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Account stays suspended indefinitely until manually reinstated by an Admin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration Presets (for Temporary) */}
              {suspendType === 'TEMPORARY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Suspension Duration
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                    {[
                      { label: '1 Day', val: '1' },
                      { label: '3 Days', val: '3' },
                      { label: '7 Days', val: '7' },
                      { label: '14 Days', val: '14' },
                      { label: '30 Days', val: '30' },
                      { label: 'Custom', val: 'custom' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setDurationPreset(item.val)}
                        className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                          durationPreset === item.val
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {durationPreset === 'custom' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Select End Date & Time (IST)
                      </label>
                      <input
                        type="datetime-local"
                        value={customUntilDate}
                        onChange={(e) => setCustomUntilDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Violation Reason Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Violation / Mistake Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={suspendReasonCategory}
                  onChange={(e) => setSuspendReasonCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="Unprofessional conduct in consultation">Unprofessional conduct in consultation</option>
                  <option value="Inappropriate behavior or abusive language">Inappropriate behavior or abusive language</option>
                  <option value="Repeatedly missing scheduled appointments">Repeatedly missing scheduled appointments</option>
                  <option value="Soliciting payments / clients off-platform">Soliciting payments / clients off-platform</option>
                  <option value="Unverified / deceptive qualifications">Unverified / deceptive qualifications</option>
                  <option value="Spamming or harassment of clients">Spamming or harassment of clients</option>
                  <option value="Poor consultation quality / client complaints">Poor consultation quality / client complaints</option>
                  <option value="Other">Other (Custom Violation)</option>
                </select>

                {suspendReasonCategory === 'Other' && (
                  <input
                    type="text"
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    placeholder="Enter custom violation reason..."
                    className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                )}
              </div>

              {/* Official Notice to Expert ("kya kiya hai usne") */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Official Disciplinary Notice to Expert <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                    Visible to Expert on Login & Dashboard
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={suspendNoticeMessage}
                  onChange={(e) => setSuspendNoticeMessage(e.target.value)}
                  placeholder="Explain clearly what mistake the expert made, why this action is taken, and what they need to do..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed font-sans"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  ⚠️ This message will be sent immediately via <strong>Mobile Push Notification</strong>, <strong>In-app Notification</strong>, and shown as an alert banner across the expert’s dashboard and login screen.
                </p>
              </div>

              {/* Warning info box */}
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 text-rose-800 dark:text-rose-300 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <p>
                  While suspended, this expert is forced <strong>OFFLINE</strong>, cannot go online, cannot accept new chat/audio/video calls or bookings, and is hidden from public client search.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Ban size={14} />
                <span>{actionLoading ? 'Enforcing...' : 'Enforce Suspension & Send Notice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reinstate Modal */}
      {showReinstateModal && selectedExpertForReinstate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Reinstate Expert Privileges
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lift suspension for {selectedExpertForReinstate.name}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowReinstateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p>
                Are you sure you want to lift the suspension for <strong>{selectedExpertForReinstate.name}</strong>?
              </p>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300">
                ✓ Their account status will return to <strong>ACTIVE</strong> immediately.<br/>
                ✓ They will be able to go online and accept client consultations.<br/>
                ✓ A notification will be dispatched to let them know their account is reinstated.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Reinstatement Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reinstateReason}
                  onChange={(e) => setReinstateReason(e.target.value)}
                  placeholder="e.g. Disciplinary period concluded or appeal approved."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowReinstateModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReinstate}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{actionLoading ? 'Reinstating...' : 'Confirm Reinstatement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Suspension Notice Modal */}
      {showNoticeModal && selectedNoticeExpert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Disciplinary Notice Details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expert: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedNoticeExpert.name}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNoticeModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedNoticeExpert.suspensionDetails?.type === 'TEMPORARY' ? 'Temporary Suspension' : 'Indefinite / Permanent'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Suspended At</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedNoticeExpert.suspensionDetails?.suspendedAt ? new Date(selectedNoticeExpert.suspensionDetails.suspendedAt).toLocaleString() : '—'}
                  </span>
                </div>
                {selectedNoticeExpert.suspensionDetails?.suspendedUntil && (
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Suspended Until</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(selectedNoticeExpert.suspensionDetails.suspendedUntil).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Violation Reason</span>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold">
                  {selectedNoticeExpert.suspensionDetails?.reason || 'Violation of platform guidelines'}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Official Notice Delivered to Expert</span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                  {selectedNoticeExpert.suspensionDetails?.noticeMessage || 'No written notice message recorded.'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center">
              {selectedNoticeExpert.status === 'SUSPENDED' ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowNoticeModal(false);
                    handleOpenReinstateModal(selectedNoticeExpert);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} /> Reinstate Now
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertsList;
