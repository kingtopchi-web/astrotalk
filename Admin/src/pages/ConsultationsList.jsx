import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CalendarClock, Search, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Video, MessageSquare, Phone, User as UserIcon,
  Award, X
} from 'lucide-react';

const API = 'https://astrotalk-hlg2.onrender.com/api/admin';

const STATUS_COLORS = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  ongoing:   'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const TYPE_ICONS = {
  video: <Video size={14} />,
  chat:  <MessageSquare size={14} />,
  call:  <Phone size={14} />,
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
    {status === 'scheduled' && <Clock size={10} />}
    {status === 'completed' && <CheckCircle size={10} />}
    {status === 'cancelled' && <XCircle size={10} />}
    {status === 'ongoing'   && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
    {status}
  </span>
);

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ consultation, onClose, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const token = localStorage.getItem('adminToken');

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await axios.patch(`${API}/consultations/${consultation._id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onStatusUpdate(consultation._id, status);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Consultation Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={consultation.status} />
            <span className="text-xs text-slate-400">#{consultation._id?.slice(-8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">User</p>
              <div className="flex items-center gap-2">
                <img
                  src={consultation.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.user?.name || 'U')}&background=2563eb&color=fff&size=32`}
                  className="w-7 h-7 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{consultation.user?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-400">{consultation.user?.email}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Expert</p>
              <div className="flex items-center gap-2">
                <img
                  src={consultation.expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.expert?.name || 'E')}&background=ea580c&color=fff&size=32`}
                  className="w-7 h-7 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{consultation.expert?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-400">{consultation.expert?.specialty}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Type</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                {TYPE_ICONS[consultation.type]} {consultation.type}
              </span>
            </div>
            <div className="text-center bg-purple-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Duration</p>
              <p className="text-sm font-bold text-purple-700">{consultation.durationInMinutes} min</p>
            </div>
            <div className="text-center bg-green-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Cost</p>
              <p className="text-sm font-bold text-green-700">₹{Number(consultation.cost).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Scheduled At</p>
            <p className="text-sm font-semibold text-slate-800">
              {consultation.startTime ? new Date(consultation.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
            </p>
          </div>

          {/* Actions */}
          {consultation.status !== 'completed' && consultation.status !== 'cancelled' && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {consultation.status === 'pending' && (
                <button
                  onClick={() => updateStatus('scheduled')}
                  disabled={updating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  Accept/Schedule
                </button>
              )}
              {consultation.status === 'scheduled' && (
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  Mark Completed
                </button>
              )}
              {consultation.status !== 'cancelled' && (
                <button
                  onClick={() => updateStatus('cancelled')}
                  disabled={updating}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function ConsultationsList({ filterStatus }) {
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(filterStatus || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setStatusFilter(filterStatus || '');
    setPage(1);
  }, [filterStatus]);

  const token = localStorage.getItem('adminToken');
  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const [consultRes, statsRes] = await Promise.all([
        axios.get(`${API}/consultations`, { headers: { Authorization: `Bearer ${token}` }, params }),
        stats === null ? axios.get(`${API}/consultations/stats`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: stats }),
      ]);

      let data = consultRes.data.data || [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(c =>
          c.user?.name?.toLowerCase().includes(q) ||
          c.expert?.name?.toLowerCase().includes(q) ||
          c.user?.email?.toLowerCase().includes(q)
        );
      }

      setConsultations(data);
      setTotal(consultRes.data.total || 0);
      setTotalPages(consultRes.data.totalPages || 1);
      if (stats === null) setStats(statsRes.data);
    } catch (e) {
      setError('Failed to load consultations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, typeFilter]);
  useEffect(() => { setPage(1); fetchData(); }, [search]);

  const handleStatusUpdate = (id, newStatus) => {
    setConsultations(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
  };

  const statCards = stats ? [
    { label: 'Total', value: stats.total, color: 'blue', filter: '' },
    { label: 'Scheduled', value: stats.scheduled, color: 'indigo', filter: 'scheduled' },
    { label: 'Ongoing', value: stats.ongoing, color: 'green', filter: 'ongoing' },
    { label: 'Completed', value: stats.completed, color: 'slate', filter: 'completed' },
    { label: 'Cancelled', value: stats.cancelled, color: 'red', filter: 'cancelled' },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Consultations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all platform consultations</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map(card => (
            <button
              key={card.label}
              onClick={() => { setStatusFilter(card.filter); setPage(1); }}
              className={`text-left p-4 rounded-xl border transition-all ${statusFilter === card.filter ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
            >
              <p className="text-2xl font-extrabold text-slate-900">{card.value ?? '—'}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by user or expert name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')}><X size={14} className="text-slate-400 hover:text-slate-600" /></button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="video">Video</option>
          <option value="call">Call</option>
          <option value="chat">Chat</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Try again</button>
          </div>
        ) : loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-16 text-center">
            <CalendarClock size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No consultations found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Expert</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Date & Time</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">Cost</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consultations.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'U')}&background=2563eb&color=fff&size=28`}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.user?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{c.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.expert?.name || 'E')}&background=ea580c&color=fff&size=28`}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.expert?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{c.expert?.specialty}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {TYPE_ICONS[c.type]} {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {c.startTime ? new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">₹{Number(c.cost).toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelected(c)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          consultation={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
