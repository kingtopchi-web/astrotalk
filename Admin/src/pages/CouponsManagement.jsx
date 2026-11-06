import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tag,
  Gift,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Percent,
  Sparkles,
  Ticket
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, RECHARGE_BONUS, VOUCHER
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCount: 0,
    rechargeCount: 0,
    vouchersCount: 0
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    type: 'RECHARGE_BONUS',
    discountType: 'FLAT',
    discountValue: '',
    minRechargeAmount: '',
    maxDiscountAmount: '',
    badge: 'OFFER',
    validTill: '',
    usageLimit: 0,
    perUserLimit: 1,
    isActive: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = {
        page,
        limit: 15,
        status: statusFilter,
        type: typeFilter,
        search: search.trim() || undefined
      };

      const res = await axios.get(`${ADMIN_API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setCoupons(res.data.coupons || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setError('Unable to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCoupons();
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      type: 'RECHARGE_BONUS',
      discountType: 'FLAT',
      discountValue: '',
      minRechargeAmount: '',
      maxDiscountAmount: '',
      badge: 'OFFER',
      validTill: '',
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      type: coupon.type,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minRechargeAmount: coupon.minRechargeAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      badge: coupon.badge || 'OFFER',
      validTill: coupon.validTill ? new Date(coupon.validTill).toISOString().slice(0, 10) : '',
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit || 1,
      isActive: coupon.isActive
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = !coupon.isActive;
      const res = await axios.patch(
        `${ADMIN_API_URL}/coupons/${coupon._id}`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionMsg({
          type: 'success',
          text: `Coupon '${coupon.code}' is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`
        });
        setTimeout(() => setActionMsg(null), 3000);
        fetchCoupons();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle coupon status');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon '${coupon.code}' permanently?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`${ADMIN_API_URL}/coupons/${coupon._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActionMsg({ type: 'success', text: `Coupon '${coupon.code}' deleted.` });
        setTimeout(() => setActionMsg(null), 3000);
        fetchCoupons();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (formData.discountValue === '' || Number(formData.discountValue) < 0) {
      setFormError('Please enter a valid discount value.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const token = localStorage.getItem('adminToken');

      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        minRechargeAmount: Number(formData.minRechargeAmount) || 0,
        maxDiscountAmount: Number(formData.maxDiscountAmount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        perUserLimit: Number(formData.perUserLimit) || 1,
        validTill: formData.validTill ? new Date(formData.validTill) : null
      };

      let res;
      if (editingCoupon) {
        res = await axios.patch(`${ADMIN_API_URL}/coupons/${editingCoupon._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post(`${ADMIN_API_URL}/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.success) {
        setIsModalOpen(false);
        setActionMsg({
          type: 'success',
          text: `Coupon '${payload.code}' ${editingCoupon ? 'updated' : 'created'} successfully!`
        });
        setTimeout(() => setActionMsg(null), 3500);
        fetchCoupons();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-amber-500" />
            Coupons & Recharge Vouchers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, customize, and manage dynamic recharge bonus coupons and direct redeemable gift vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Coupon / Voucher
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Offers</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalCoupons}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Offers
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Recharge Bonus
          </p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{stats.rechargeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" /> Gift Vouchers
          </p>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{stats.vouchersCount}</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status & Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === st ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {['ALL', 'RECHARGE_BONUS', 'VOUCHER'].map((tp) => (
            <button
              key={tp}
              onClick={() => {
                setTypeFilter(tp);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                typeFilter === tp ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tp === 'ALL' ? 'All Types' : tp === 'RECHARGE_BONUS' ? 'Recharge Only' : 'Vouchers Only'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or title..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </form>
      </div>

      {/* Coupons Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
          Loading coupons...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 text-sm">
          {error}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No coupons or vouchers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click 'Create Coupon / Voucher' above to add your first dynamic recharge promotion.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Code & Badge</th>
                  <th className="px-5 py-3.5">Title & Description</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Benefit</th>
                  <th className="px-5 py-3.5">Min. Recharge</th>
                  <th className="px-5 py-3.5">Redemptions</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code & Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {c.code}
                        </span>
                        {c.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            {c.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Description */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{c.title}</p>
                      {c.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          c.type === 'VOUCHER'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.type === 'VOUCHER' ? <Gift className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                        {c.type === 'VOUCHER' ? 'GIFT VOUCHER' : 'RECHARGE BONUS'}
                      </span>
                    </td>

                    {/* Benefit */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Extra` : `+₹${c.discountValue} Extra`}
                      </span>
                      {c.maxDiscountAmount > 0 && (
                        <span className="text-[10px] text-slate-400 block">Up to ₹{c.maxDiscountAmount}</span>
                      )}
                    </td>

                    {/* Min Recharge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {c.minRechargeAmount > 0 ? `₹${c.minRechargeAmount}` : 'None (₹0)'}
                    </td>

                    {/* Redemptions */}
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-600">
                      {c.usedCount || 0} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : 'uses'}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {c.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon / Voucher'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WELCOME50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-1 focus:ring-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. POPULAR, BEST VALUE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Flat ₹50 Extra Bonus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description displayed to users"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Offer Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="RECHARGE_BONUS">Recharge Bonus (Paid top-up)</option>
                    <option value="VOUCHER">Gift Voucher (Direct 100% free claim)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Benefit Calculation</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="FLAT">Flat Cash Bonus (₹)</option>
                    <option value="PERCENTAGE">Percentage Extra (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Value {formData.discountType === 'FLAT' ? '(₹)' : '(%)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="e.g. 50 or 20"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-1 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Recharge (₹)</label>
                  <input
                    type="number"
                    value={formData.minRechargeAmount}
                    onChange={(e) => setFormData({ ...formData, minRechargeAmount: e.target.value })}
                    placeholder="e.g. 200"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="e.g. 300"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.validTill}
                    onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isActive" className="font-bold text-slate-800 cursor-pointer">
                  Activate this offer immediately for users
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

