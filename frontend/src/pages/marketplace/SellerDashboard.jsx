import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, PlusCircle, TrendingUp, DollarSign, ShoppingCart,
  Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, Clock,
  ArrowRight, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function SellerDashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'sales' | 'earnings'
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/seller/dashboard'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error loading seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to delete or unpublish "${title}"?`)) {
      return;
    }
    try {
      const res = await axios.delete(getApiUrl(`/marketplace/seller/products/${productId}`), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setActionFeedback({ type: 'success', message: res.data.message });
        fetchDashboard();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete product'
      });
    }
  };

  const stats = dashboardData?.stats || {
    totalProducts: 0,
    publishedProducts: 0,
    pendingProducts: 0,
    totalSales: 0,
    grossRevenue: 0,
    totalCommission: 0,
    netEarnings: 0
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-8 space-y-8">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-900">
                  Seller Hub
                </span>
                <span className="text-xs text-slate-400">Account: {auth.user?.name} ({auth.user?.role})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Marketplace Seller Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage your digital products, monitor real-time sales, and track net earnings.
              </p>
            </div>

            <Link
              to="/marketplace/sell"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 w-fit cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Add New Digital Product</span>
            </Link>
          </div>

          {actionFeedback && (
            <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <span>{actionFeedback.message}</span>
              <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Products</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.totalProducts}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-emerald-600 font-bold">{stats.publishedProducts} Live</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">{stats.pendingProducts} Pending</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Sales</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">{stats.totalSales}</p>
              <p className="text-[11px] text-slate-400">Completed digital file orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gross Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{Number(stats.grossRevenue).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Total customer order volume</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 shadow-xs space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Net Earnings</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                ₹{Number(stats.netEarnings).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-700/80">Available balance after platform commission</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Package size={16} />
              <span>My Products ({dashboardData?.products?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <ShoppingCart size={16} />
              <span>Recent Sales ({dashboardData?.recentSales?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'earnings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <DollarSign size={16} />
              <span>Earnings Ledger</span>
            </button>
          </div>

          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading products...</div>
              ) : dashboardData?.products?.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <Package size={44} className="mx-auto text-slate-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">You haven't listed any digital products yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Start selling e-books, spreadsheets, templates, and tools to the ExpertHub community today.
                  </p>
                  <Link
                    to="/marketplace/sell"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    <PlusCircle size={15} />
                    <span>Upload First Product</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Price</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Sales</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dashboardData.products.map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.coverImage}
                                alt={p.title}
                                className="w-12 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/marketplace/products/${p.slug}`}
                                  className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 truncate block"
                                >
                                  {p.title}
                                </Link>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Format: {p.digitalFile?.fileExtension?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                            {p.category?.name || 'General'}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                            ₹{Number(p.price).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              p.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.status}
                            </span>
                            {p.rejectionReason && (
                              <p className="text-[10px] text-rose-500 mt-1 max-w-xs">{p.rejectionReason}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                            {p.salesCount || 0}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/marketplace/products/${p.slug}`}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                                title="View live page"
                              >
                                <Eye size={14} />
                              </Link>
                              <Link
                                to={`/marketplace/edit/${p._id}`}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                                title="Edit details"
                              >
                                <Edit3 size={14} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p._id, p.title)}
                                className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Delete or Unpublish"
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
              )}
            </div>
          )}

          {/* TAB 2: RECENT SALES */}
          {activeTab === 'sales' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              {dashboardData?.recentSales?.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No sales recorded yet. Once clients purchase your digital assets, orders will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3">Order Number</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3">Item Price</th>
                        <th className="px-5 py-3">Your Net Earning</th>
                        <th className="px-5 py-3">Client Downloads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dashboardData.recentSales.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-mono font-bold text-slate-800 dark:text-white">
                            #{s.orderNumber}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {new Date(s.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                            {s.productTitle}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            ₹{s.price}
                          </td>
                          <td className="px-5 py-4 font-extrabold text-emerald-600">
                            +₹{s.netEarning}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {s.downloads} time(s)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EARNINGS & PAYOUTS */}
          {activeTab === 'earnings' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Marketplace Earnings Ledger</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Marketplace digital product earnings are recorded separately from consultation fees in your dedicated marketplace ledger.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Gross Sales</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{stats.grossRevenue}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Platform Commission</span>
                  <p className="text-xl font-black text-slate-600 dark:text-slate-300 mt-1">-₹{stats.totalCommission}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <span className="text-[11px] font-bold uppercase text-emerald-700">Total Net Earned</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">₹{stats.netEarnings}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

