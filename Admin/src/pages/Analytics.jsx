import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, UserCheck, CalendarClock, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

const API = 'https://astrotalk-hlg2.onrender.com/api/admin';
const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444'];

const StatCard = ({ label, value, icon: Icon, color = 'blue', sub }) => {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value ?? '—'}</p>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [dashStats, setDashStats] = useState(null);
  const [consultStats, setConsultStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('adminToken');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [dRes, cRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/consultations/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDashStats(dRes.data);
      setConsultStats(cRes.data);
    } catch (e) {
      setError('Failed to load analytics data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <p className="text-red-600">{error}</p>
      <button onClick={fetchData} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  const expertPieData = [
    { name: 'Approved', value: dashStats?.approvedExperts || 0 },
    { name: 'Pending', value: dashStats?.pendingExperts || 0 },
    { name: 'Rejected', value: dashStats?.rejectedExperts || 0 },
  ];

  const consultPieData = consultStats ? [
    { name: 'Scheduled', value: consultStats.scheduled || 0 },
    { name: 'Completed', value: consultStats.completed || 0 },
    { name: 'Ongoing', value: consultStats.ongoing || 0 },
    { name: 'Cancelled', value: consultStats.cancelled || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform-wide statistics and growth insights</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={dashStats?.totalUsers} icon={Users} color="blue" />
        <StatCard label="Total Experts" value={dashStats?.totalExperts} icon={UserCheck} color="orange" />
        <StatCard label="Total Consultations" value={consultStats?.total} icon={CalendarClock} color="purple" />
        <StatCard label="Total Revenue" value={`₹${(consultStats?.totalRevenue || 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="green" sub="From completed sessions" />
      </div>

      {/* Registration Growth */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">User & Expert Registrations — Last 7 Days</h2>
        {dashStats?.last7Days?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dashStats.last7Days}>
              <defs>
                <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#3b82f6" fill="url(#gu)" strokeWidth={2} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="experts" name="Experts" stroke="#f97316" fill="url(#ge)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-400 text-center py-12">No registration data available</p>}
      </div>

      {/* Monthly Growth + Consultation Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Monthly Growth — Last 6 Months</h2>
          {dashStats?.last6Months?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dashStats.last6Months} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="experts" name="Experts" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No growth data available</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Consultation Revenue — Last 6 Months</h2>
          {consultStats?.last6Months?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consultStats.last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`₹${v}`, 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400 text-center py-12">No revenue data yet</p>}
        </div>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Expert Verification Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={expertPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {expertPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Consultation Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={consultPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                {consultPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category + Sub stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-900">{dashStats?.totalCategories ?? '—'}</p>
          <p className="text-sm text-slate-500 mt-1">Total Categories</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-900">{dashStats?.totalSubCategories ?? '—'}</p>
          <p className="text-sm text-slate-500 mt-1">Sub-categories</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-900">{dashStats?.activeExperts ?? '—'}</p>
          <p className="text-sm text-slate-500 mt-1">Active Experts</p>
        </div>
      </div>
    </div>
  );
}
