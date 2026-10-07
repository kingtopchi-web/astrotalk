import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardList, Search, CheckCircle, XCircle, Eye, ChevronLeft,
  ChevronRight, RefreshCw, X, AlertCircle, FileText
} from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

const VerifBadge = ({ status }) => {
  const map = {
    PENDING:  'bg-orange-50 text-orange-700 border-orange-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ expert, onClose, onAction }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('adminToken');

  const approve = async () => {
    setLoading(true);
    try {
      await axios.patch(`${API}/experts/${expert._id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      onAction(expert._id, 'APPROVED');
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to approve');
    } finally { setLoading(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    setLoading(true);
    try {
      await axios.patch(`${API}/experts/${expert._id}/reject`, { reason: rejectReason }, { headers: { Authorization: `Bearer ${token}` } });
      onAction(expert._id, 'REJECTED');
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reject');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-900">Expert Application</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-4">
            <img
              src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'E')}&background=ea580c&color=fff&size=64`}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              alt=""
            />
            <div>
              <h4 className="text-lg font-bold text-slate-900">{expert.name}</h4>
              <p className="text-sm text-slate-500">{expert.email}</p>
              <VerifBadge status={expert.verificationStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Specialty', value: expert.specialty },
              { label: 'Qualification', value: expert.qualification },
              { label: 'Experience', value: expert.experience },
              { label: 'Mobile', value: expert.mobile },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-400 italic">N/A</span>}</p>
              </div>
            ))}
          </div>

          {expert.bio && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Bio</p>
              <p className="text-sm text-slate-700 leading-relaxed">{expert.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Chat Rate</p>
              <p className="text-sm font-bold text-blue-700">₹{expert.rates?.chat || expert.pricePerMinute || 0}/min</p>
            </div>
            <div className="text-center bg-purple-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Audio Rate</p>
              <p className="text-sm font-bold text-purple-700">₹{expert.rates?.audio || 0}/min</p>
            </div>
            <div className="text-center bg-orange-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Video Rate</p>
              <p className="text-sm font-bold text-orange-700">₹{expert.rates?.video || 0}/min</p>
            </div>
          </div>

          {expert.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-[10px] text-red-500 font-semibold uppercase mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{expert.rejectionReason}</p>
            </div>
          )}

          {/* Reject with reason */}
          {showReject && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                placeholder="Explain why this application is being rejected..."
              />
              <div className="flex gap-2">
                <button
                  onClick={reject}
                  disabled={loading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? 'Processing...' : 'Confirm Reject'}
                </button>
                <button onClick={() => setShowReject(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {expert.verificationStatus === 'PENDING' && !showReject && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 shrink-0">
            <button
              onClick={approve}
              disabled={loading}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={loading}
              className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ExpertApplications() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem('adminToken');
  const limit = 15;

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit, verificationStatus: statusFilter };
      if (search) params.search = search;

      const res = await axios.get(`${API}/experts`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setExperts(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);

      // Also fetch counts for tabs
      const [p, a, r] = await Promise.all([
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'PENDING', limit: 1 } }),
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'APPROVED', limit: 1 } }),
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'REJECTED', limit: 1 } }),
      ]);
      setCounts({ PENDING: p.data.total, APPROVED: a.data.total, REJECTED: r.data.total });
    } catch (e) {
      setError('Failed to load applications.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleAction = (id, newStatus) => {
    setExperts(prev => prev.map(e => e._id === id ? { ...e, verificationStatus: newStatus } : e));
    setCounts(prev => ({
      ...prev,
      PENDING: newStatus !== 'PENDING' ? Math.max(0, prev.PENDING - 1) : prev.PENDING,
      [newStatus]: (prev[newStatus] || 0) + 1,
    }));
  };

  const TABS = [
    { key: 'PENDING', label: 'Pending', color: 'orange' },
    { key: 'APPROVED', label: 'Approved', color: 'green' },
    { key: 'REJECTED', label: 'Rejected', color: 'red' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Expert Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and manage expert verification requests</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${statusFilter === tab.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? (tab.color === 'orange' ? 'bg-orange-100 text-orange-700' : tab.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-slate-200 text-slate-600'}`}>
              {counts[tab.key] ?? '—'}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Try again</button>
          </div>
        ) : loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : experts.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No {statusFilter.toLowerCase()} applications</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Expert</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Specialty</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Experience</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Applied</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {experts.map(e => (
                    <tr key={e._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={e.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || 'E')}&background=ea580c&color=fff&size=36`}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                            <p className="text-xs text-slate-400">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{e.specialty || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{e.experience || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                      </td>
                      <td className="px-4 py-3"><VerifBadge status={e.verificationStatus} /></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelected(e)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Page {page} of {totalPages} — {total} total</p>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <DetailModal expert={selected} onClose={() => setSelected(null)} onAction={handleAction} />
      )}
    </div>
  );
}
