import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, UserPlus, Search, KeyRound, 
  Trash2, AlertCircle, CheckCircle2, X, Eye, EyeOff, 
  UserCheck, UserX, Mail, Phone, Lock, Calendar,
  Shield, Check, SlidersHorizontal, Crown
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

export const ADMIN_MODULES = [
  { id: 'dashboard', name: 'Dashboard & Analytics', desc: 'Overview metrics, live counters, user growth and revenue analytics' },
  { id: 'experts', name: 'Experts Management', desc: 'Approve, reject, suspend, edit experts, view KYC and registration documents' },
  { id: 'categories', name: 'Categories & Subcategories', desc: 'Create, edit categories, commission take-rates and dynamic document requirements' },
  { id: 'users', name: 'Users Management', desc: 'View registered users, wallet balances, suspend or block users' },
  { id: 'consultations', name: 'Consultations & Bookings', desc: 'View chat, audio, video consultations, status and chat logs' },
  { id: 'marketplace', name: 'Digital Marketplace', desc: 'Approve or reject digital products, manage listings and sales' },
  { id: 'support', name: 'Support Tickets & Chat', desc: 'Resolve user tickets, chat with users, trash and auto-cleanup' },
  { id: 'inquiries', name: 'Contact Inquiries', desc: 'Respond to public inquiries and contact form submissions' },
  { id: 'reviews', name: 'Reviews & Ratings', desc: 'Moderate, approve or delete user-submitted reviews and ratings' },
  { id: 'finance', name: 'Finance, Transactions & Razorpay', desc: 'Monitor revenue, consultation payouts, settlements and Razorpay accounts' },
  { id: 'coupons', name: 'Coupons & Vouchers', desc: 'Create and configure promotional discount codes and platform vouchers' },
  { id: 'notifications', name: 'Broadcast Notifications', desc: 'Send targeted push or in-app announcements to users and experts' },
  { id: 'settings', name: 'Platform Settings', desc: 'Edit global fees, consultation commission, auto-approval and security rules' },
];

export default function Administrators() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'ADMIN',
    permissions: ['dashboard', 'experts', 'categories', 'support']
  });
  
  // Permissions modal form state
  const [permFormData, setPermFormData] = useState({
    role: 'ADMIN',
    permissions: []
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Current logged in admin
  const currentAdmin = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('adminUser') || '{}');
      return raw.user || raw || {};
    } catch {
      return {};
    }
  })();

  const isSuperAdmin = currentAdmin?.role === 'SUPER_ADMIN';

  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${ADMIN_API_URL}/administrators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setError('Only Super Administrators have permission to create administrators.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        ...formData,
        permissions: formData.role === 'SUPER_ADMIN' ? ['*'] : formData.permissions
      };
      const res = await axios.post(`${ADMIN_API_URL}/administrators`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data.message || 'Administrator created successfully!');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: 'ADMIN',
        permissions: ['dashboard', 'experts', 'categories', 'support']
      });
      fetchAdmins();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create administrator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPermModal = (admin) => {
    setSelectedAdmin(admin);
    const existingPerms = Array.isArray(admin.permissions) ? admin.permissions : [];
    setPermFormData({
      role: admin.role || 'ADMIN',
      permissions: admin.role === 'SUPER_ADMIN' ? ADMIN_MODULES.map(m => m.id) : existingPerms
    });
    setShowPermModal(true);
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (!isSuperAdmin) {
      setError('Only Super Administrators have permission to modify roles and module permissions.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        role: permFormData.role,
        permissions: permFormData.role === 'SUPER_ADMIN' ? ['*'] : permFormData.permissions
      };

      const res = await axios.patch(
        `${ADMIN_API_URL}/administrators/${selectedAdmin._id}/permissions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || 'Permissions updated successfully');
      setShowPermModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update administrator permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    if (!isSuperAdmin) {
      setError('Only Super Administrators can suspend or activate administrator accounts.');
      return;
    }
    const newStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to mark ${admin.name} as ${newStatus}?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(
        `${ADMIN_API_URL}/administrators/${admin._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data.message || 'Status updated');
      fetchAdmins();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update administrator status');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (!isSuperAdmin) {
      setError('Only Super Administrators can reset administrator passwords.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(
        `${ADMIN_API_URL}/administrators/${selectedAdmin._id}/password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data.message || 'Password changed successfully');
      setShowPasswordModal(false);
      setSelectedAdmin(null);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!isSuperAdmin) {
      setError('Only Super Administrators can delete administrator accounts.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete administrator account "${admin.name}" (${admin.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`${ADMIN_API_URL}/administrators/${admin._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data.message || 'Administrator deleted successfully');
      fetchAdmins();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete administrator');
    }
  };

  const toggleFormPermission = (modId) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(modId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== modId)
          : [...prev.permissions, modId]
      };
    });
  };

  const toggleModalPermission = (modId) => {
    setPermFormData(prev => {
      const exists = prev.permissions.includes(modId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== modId)
          : [...prev.permissions, modId]
      };
    });
  };

  const filteredAdmins = admins.filter(a => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.mobile?.includes(term)
    );
  });

  const totalCount = admins.length;
  const activeCount = admins.filter(a => a.status === 'ACTIVE').length;
  const suspendedCount = admins.filter(a => a.status === 'SUSPENDED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Administrators & Permissions</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Role-Based Access Control (RBAC)
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Super Admin has master control over all platform modules; assign granular permissions to sub-admins per section.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Add Administrator</span>
          </button>
        )}
      </div>

      {/* Super Admin Notice if Sub-Admin views this page */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <span>You are logged in as a <strong>Sub-Administrator</strong>. Only the platform <strong>Super Administrator</strong> can add new administrators, modify module permissions, or suspend team members.</span>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Administrators</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Control panel accounts</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Administrators</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Can sign in right now</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm border-l-4 border-l-orange-500">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suspended Accounts</div>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">{suspendedCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Access disabled</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
            Showing <span className="font-semibold text-slate-800 dark:text-white">{filteredAdmins.length}</span> of {totalCount} administrators
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading administrators...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Administrators Found</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              {search ? 'Try adjusting your search criteria.' : 'Click "Add Administrator" to create an administrator account.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Email / Login ID</th>
                  <th className="py-3 px-4">Role & Access Level</th>
                  <th className="py-3 px-4">Permitted Modules</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredAdmins.map((admin) => {
                  const isCurrent = currentAdmin?.email === admin.email || currentAdmin?._id === admin._id;
                  const initial = admin.name ? admin.name.charAt(0).toUpperCase() : 'A';
                  const adminRole = admin.role || 'ADMIN';
                  const isTargetSuper = adminRole === 'SUPER_ADMIN';
                  const adminPerms = Array.isArray(admin.permissions) ? admin.permissions : [];

                  return (
                    <tr key={admin._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm ${
                            isTargetSuper
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}>
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{admin.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            {admin.mobile && (
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone size={11} />
                                <span>{admin.mobile}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          <span>{admin.email}</span>
                        </div>
                      </td>

                      {/* Role & Access Level */}
                      <td className="py-3.5 px-4">
                        {isTargetSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Crown size={13} className="text-purple-600" />
                            <span>SUPER ADMIN (Master)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Shield size={12} className="text-blue-600" />
                            <span>Sub-Admin ({adminPerms.length} / {ADMIN_MODULES.length} parts)</span>
                          </span>
                        )}
                      </td>

                      {/* Permitted Modules */}
                      <td className="py-3.5 px-4">
                        {isTargetSuper ? (
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            ★ Full Access to All Parts
                          </span>
                        ) : adminPerms.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No module permissions assigned</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {adminPerms.slice(0, 3).map(p => {
                              const mod = ADMIN_MODULES.find(m => m.id === p);
                              return (
                                <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {mod?.name ? mod.name.split(' ')[0] : p}
                                </span>
                              );
                            })}
                            {adminPerms.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                +{adminPerms.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            admin.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                          {admin.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Permissions (Shield) */}
                          <button
                            onClick={() => handleOpenPermModal(admin)}
                            disabled={!isSuperAdmin}
                            title={isSuperAdmin ? "Configure Role & Module Permissions" : "Only Super Admin can edit permissions"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              !isSuperAdmin
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                : 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 cursor-pointer'
                            }`}
                          >
                            <SlidersHorizontal size={15} />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={!isSuperAdmin || isCurrent}
                            title={isCurrent ? "You cannot suspend yourself" : !isSuperAdmin ? "Only Super Admin can toggle status" : (admin.status === 'ACTIVE' ? 'Suspend Administrator' : 'Activate Administrator')}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              !isSuperAdmin || isCurrent
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                : admin.status === 'ACTIVE'
                                ? 'border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 cursor-pointer'
                                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer'
                            }`}
                          >
                            {admin.status === 'ACTIVE' ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Change Password */}
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setNewPassword('');
                              setError('');
                              setShowPasswordModal(true);
                            }}
                            disabled={!isSuperAdmin}
                            title={isSuperAdmin ? "Reset / Change Password" : "Only Super Admin can reset password"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              !isSuperAdmin
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                            }`}
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Delete Admin */}
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={!isSuperAdmin || isCurrent}
                            title={isCurrent ? "You cannot delete yourself" : !isSuperAdmin ? "Only Super Admin can delete administrators" : "Delete Administrator"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              !isSuperAdmin || isCurrent
                                ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer'
                            }`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD ADMINISTRATOR */}
      {showAddModal && isSuperAdmin && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-xl my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
            style={{ maxHeight: 'min(88vh, 750px)' }}
          >
            {/* Pinned Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Administrator</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Create new login credentials & assign module permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Body */}
              <div 
                className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain"
                style={{ maxHeight: 'calc(88vh - 140px)' }}
              >
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email / Gmail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address / Gmail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin.team@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">This email will be used as their login ID</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">They will use this password to sign into the control panel</p>
                </div>

                {/* Mobile (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Role Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Access Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.role === 'ADMIN'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="newAdminRole"
                          checked={formData.role === 'ADMIN'}
                          onChange={() => setFormData({ ...formData, role: 'ADMIN' })}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Sub-Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5 leading-relaxed">
                        Granular access. Can only view and edit the specific modules selected below.
                      </p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, role: 'SUPER_ADMIN' })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.role === 'SUPER_ADMIN'
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="newAdminRole"
                          checked={formData.role === 'SUPER_ADMIN'}
                          onChange={() => setFormData({ ...formData, role: 'SUPER_ADMIN' })}
                          className="accent-purple-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Super Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5 leading-relaxed">
                        Master administrator. Has complete access to manage all modules & platform administrators.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Granular Module Permissions (If Sub-Admin) */}
                {formData.role === 'ADMIN' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-white">
                          Select Permitted Modules ({formData.permissions.length}/{ADMIN_MODULES.length})
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Check which sections this admin is authorized to view and edit.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, permissions: ADMIN_MODULES.map(m => m.id) })}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, permissions: [] })}
                          className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                      {ADMIN_MODULES.map((mod) => {
                        const isChecked = formData.permissions.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleFormPermission(mod.id)}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-white block">{mod.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{mod.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-end gap-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERMISSIONS & ROLE */}
      {showPermModal && selectedAdmin && isSuperAdmin && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPermModal(false);
          }}
        >
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-xl my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
            style={{ maxHeight: 'min(88vh, 750px)' }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Permissions: {selectedAdmin.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAdmin.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPermModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div 
                className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain"
                style={{ maxHeight: 'calc(88vh - 140px)' }}
              >
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Administrator Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setPermFormData({ ...permFormData, role: 'ADMIN' })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        permFormData.role === 'ADMIN'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="editAdminRole"
                          checked={permFormData.role === 'ADMIN'}
                          onChange={() => setPermFormData({ ...permFormData, role: 'ADMIN' })}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Sub-Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                        Selected parts only. Access is restricted to assigned checkboxes below.
                      </p>
                    </div>

                    <div
                      onClick={() => setPermFormData({ ...permFormData, role: 'SUPER_ADMIN' })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        permFormData.role === 'SUPER_ADMIN'
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="editAdminRole"
                          checked={permFormData.role === 'SUPER_ADMIN'}
                          onChange={() => setPermFormData({ ...permFormData, role: 'SUPER_ADMIN' })}
                          className="accent-purple-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Super Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                        Full Master Access across all platform modules & administrators.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions Checkbox Grid (When Sub-Admin) */}
                {permFormData.role === 'ADMIN' ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-white">
                          Assigned Module Permissions ({permFormData.permissions.length}/{ADMIN_MODULES.length})
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Toggle which parts this administrator is allowed to view and edit.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPermFormData({ ...permFormData, permissions: ADMIN_MODULES.map(m => m.id) })}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setPermFormData({ ...permFormData, permissions: [] })}
                          className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                      {ADMIN_MODULES.map((mod) => {
                        const isChecked = permFormData.permissions.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModalPermission(mod.id)}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-white block">{mod.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">{mod.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-xs text-purple-900 dark:text-purple-300">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <Crown size={14} className="text-purple-600" />
                      <span>Full Master Privileges</span>
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      As a Super Administrator, this user will have unrestricted permissions across all platform modules, financial systems, settings, and administrator team management.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-end gap-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setShowPermModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {showPasswordModal && selectedAdmin && isSuperAdmin && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
              setSelectedAdmin(null);
            }
          }}
        >
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
            style={{ maxHeight: 'min(88vh, 500px)' }}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update password for {selectedAdmin.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedAdmin(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  Changing password for: <span className="font-semibold text-slate-800 dark:text-white">{selectedAdmin.email}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Enter new password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-end gap-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
