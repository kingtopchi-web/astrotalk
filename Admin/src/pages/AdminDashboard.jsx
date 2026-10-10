import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line
} from 'recharts';
import { Search, Calendar, Bell, Settings, ChevronRight, Wand2 } from 'lucide-react';

// Sparkbar component
const SparkBar = () => (
  <div className="flex items-end gap-[2px] h-6 w-16">
    {[3, 5, 4, 7, 6, 8, 5].map((h, i) => (
      <div key={i} className="w-1.5 bg-blue-500 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
    ))}
  </div>
);

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentExperts, setRecentExperts] = useState([]);
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Generate dynamic sparklines from recent 7 days data if available
  const getSparklineData = (key) => {
    if (!stats || !stats.last7Days) return [{v: 0}, {v: 0}];
    return stats.last7Days.map(day => ({ v: day[key] || 0 }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [statsRes, expertsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/dashboard/stats', { headers }),
          axios.get('http://localhost:5000/api/admin/experts?limit=5', { headers })
        ]);
        
        setStats(statsRes.data);
        setRecentExperts(expertsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-6 pb-20">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center text-sm font-medium text-slate-500">
          <span>Dashboard</span>
          <ChevronRight size={16} className="mx-1" />
          <span className="text-slate-900 font-bold">Home</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Calendar size={16} />
            <span className="hidden sm:inline">{currentDate}</span>
          </button>
          
          <button className="p-2 bg-white border border-slate-200 rounded-lg relative hover:bg-slate-50">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button 
            onClick={() => navigate('/settings')}
            title="Settings"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Overview</h2>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Users</p>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{stats ? stats.totalUsers : '...'}</h3>
                <p className="text-xs text-slate-400 mt-1">Platform registrants</p>
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">+12%</span>
            </div>
          </div>
          <div className="h-12 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getSparklineData('users')}>
                <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Experts</p>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{stats ? stats.totalExperts : '...'}</h3>
                <p className="text-xs text-slate-400 mt-1">Registered consultants</p>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">+5%</span>
            </div>
          </div>
          <div className="h-12 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getSparklineData('experts')}>
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Pending Approvals</p>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{stats ? stats.pendingExperts : '...'}</h3>
                <p className="text-xs text-slate-400 mt-1">Experts waiting verification</p>
              </div>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">Action Needed</span>
            </div>
          </div>
          <div className="h-12 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getSparklineData('experts')}>
                <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4 - Dark */}
        <div className="bg-[#f4f7fb] p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex flex-col items-start gap-3">
             <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center">
               <Wand2 size={16} className="text-slate-700" />
             </div>
             <h3 className="font-bold text-slate-800">Platform Categories</h3>
             <p className="text-sm text-slate-500 leading-relaxed mb-1">
               {stats ? stats.totalCategories : '...'} Categories, {stats ? stats.totalSubCategories : '...'} Sub-categories available.
             </p>
             <button onClick={() => navigate('/categories')} className="mt-2 bg-[#0f172a] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
               Manage Categories &rsaquo;
             </button>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        {/* Sessions Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-slate-500 font-medium">Daily Platform Registrations</p>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-2xl font-bold">
                  {stats?.last7Days ? stats.last7Days.reduce((sum, d) => sum + d.total, 0) : '...'}
                </h3>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Last 7 Days</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Combined User & Expert registrations</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.last7Days || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExperts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip />
                <Area type="monotone" name="Users" dataKey="users" stackId="1" stroke="#2563eb" fill="url(#colorUsers)" strokeWidth={2} />
                <Area type="monotone" name="Experts" dataKey="experts" stackId="2" stroke="#f59e0b" fill="url(#colorExperts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Page Views Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-slate-500 font-medium">Monthly Registration Growth</p>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-2xl font-bold">
                  {stats?.last6Months ? stats.last6Months.reduce((sum, d) => sum + d.users + d.experts, 0) : '...'}
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Last 6 Months</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Total account creations month-over-month</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.last6Months || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="users" name="Users" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="experts" name="Experts" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Experts</h2>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 font-medium border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-4 py-4">Expert Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4 text-center">Verification</th>
                  <th className="px-4 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentExperts.length > 0 ? recentExperts.map((expert) => (
                  <tr key={expert._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">{expert.name}</td>
                    <td className="px-4 py-3 text-slate-600">{expert.email}</td>
                    <td className="px-4 py-3 text-slate-600">{expert.categoryId?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(
                        expert.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 
                        expert.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      ).toFixed(2)}`}>
                        {expert.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(
                        expert.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      ).toFixed(2)}`}>
                        {expert.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No recent experts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tree Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
          <h3 className="font-bold text-sm text-slate-800 mb-4">Platform Health</h3>
          <div className="space-y-4 text-sm">
            
            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-slate-600">
                 <span>Active Experts</span>
                 <span className="font-medium text-slate-800">{stats?.activeExperts || 0}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${stats?.totalExperts ? (stats.activeExperts/stats.totalExperts)*100 : 0}%` }}></div>
               </div>
            </div>

            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-slate-600">
                 <span>Approved Experts</span>
                 <span className="font-medium text-slate-800">{stats?.approvedExperts || 0}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats?.totalExperts ? (stats.approvedExperts/stats.totalExperts)*100 : 0}%` }}></div>
               </div>
            </div>
            
            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-slate-600">
                 <span>Pending Verifications</span>
                 <span className="font-medium text-slate-800">{stats?.pendingExperts || 0}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stats?.totalExperts ? (stats.pendingExperts/stats.totalExperts)*100 : 0}%` }}></div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
