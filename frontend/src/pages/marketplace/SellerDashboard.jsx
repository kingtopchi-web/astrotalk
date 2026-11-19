import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Package, PlusCircle, TrendingUp, DollarSign, ShoppingCart,
  Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, Clock,
  ArrowRight, ShieldCheck, RefreshCw, Layers, CreditCard, Building2, CheckCircle, X
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
  
  // Payout & Bank Details State
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
    passbookImage: ''
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'earnings') {
      fetchPayoutStatus();
    }
  }, [activeTab]);

  const fetchPayoutStatus = async () => {
    try {
      setPayoutLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/seller/payout-status'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setPayoutStatus(res.data);
        if (res.data.bankDetails) {
          setBankFormData({
            accountName: res.data.bankDetails.accountName || '',
            accountNumber: res.data.bankDetails.accountNumber || '',
            ifscCode: res.data.bankDetails.ifscCode || '',
            bankName: res.data.bankDetails.bankName || '',
            upiId: res.data.bankDetails.upiId || '',
            passbookImage: res.data.bankDetails.passbookImage || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to load seller payout status:', err);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handlePassbookFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setActionFeedback({
        type: 'error',
        message: 'Passbook / Cheque image size must be less than 5MB.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBankFormData(prev => ({ ...prev, passbookImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!bankFormData.passbookImage) {
      setActionFeedback({
        type: 'error',
        message: 'Kripya verification ke liye bank passbook ya cancelled cheque ki photo upload karein.'
      });
      return;
    }
    try {
      setPayoutLoading(true);
      const res = await axios.post(getApiUrl('/marketplace/seller/bank-details'), bankFormData, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setActionFeedback({ type: 'success', message: res.data.message });
        setShowBankModal(false);
        fetchPayoutStatus();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save bank details'
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleRequestSellerPayout = async () => {
    try {
      setPayoutLoading(true);
      const res = await axios.post(getApiUrl('/marketplace/seller/request-payout'), {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setActionFeedback({
          type: 'success',
          message: res.data.message || '₹1 verification initiated to your bank account!'
        });
        fetchPayoutStatus();
        fetchDashboard();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to initiate payout request'
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleConfirmSellerPennyDrop = async (payoutId) => {
    try {
      setPayoutLoading(true);
      const res = await axios.post(getApiUrl('/marketplace/seller/payout/confirm-penny-drop'), { payoutId }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setActionFeedback({
          type: 'success',
          message: res.data.message || '₹1 verification confirmed! Remaining balance scheduled for payout.'
        });
        fetchPayoutStatus();
        fetchDashboard();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to confirm verification'
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleCancelSellerPennyDrop = async (payoutId) => {
    if (!window.confirm('Are you sure you want to cancel this payout request?')) return;
    try {
      setPayoutLoading(true);
      const res = await axios.post(getApiUrl('/marketplace/seller/payout/cancel'), { payoutId }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setActionFeedback({ type: 'success', message: res.data.message });
        fetchPayoutStatus();
        fetchDashboard();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel payout request'
      });
    } finally {
      setPayoutLoading(false);
    }
  };

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
    netEarnings: 0,
    availableBalance: 0,
    pendingClearanceBalance: 0
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Products</span>
              <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.totalProducts}</p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                <span className="text-emerald-600 font-bold">{stats.publishedProducts} Live</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">{stats.pendingProducts} Pending</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Gross Sales</span>
              <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
                ₹{Number(stats.grossRevenue).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400">{stats.totalSales} items sold</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 bg-rose-50/20 shadow-xs space-y-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Fee / Tax Deducted</span>
              <p className="text-xl sm:text-3xl font-black text-rose-600">
                -₹{Number(stats.totalCommission).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] sm:text-[11px] text-rose-600/80">Platform commission deducted</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 bg-amber-50/30 shadow-xs space-y-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Clearance Hold</span>
              <p className="text-xl sm:text-3xl font-black text-amber-600">
                ₹{Number(stats.pendingClearanceBalance || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] sm:text-[11px] text-amber-700/80">Hold time set by admin</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 shadow-xs space-y-1.5 col-span-2 md:col-span-1">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Available Balance</span>
              <p className="text-xl sm:text-3xl font-black text-emerald-600">
                ₹{Number(stats.availableBalance || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-700/80">Ready for payout</p>
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

          {/* TAB 3: EARNINGS & PAYOUTS HUB */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              {/* Active ₹1 Penny-Drop Verification Banner */}
              {payoutStatus?.activePayout?.status === 'VERIFICATION_PENDING' && (
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-black text-base border border-amber-300 shadow-xs">
                      ₹1
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-amber-950">
                          ₹1 Bank Account Verification Sent
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 animate-pulse">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                        Aapke marketplace earnings payout ke verification ke liye aapke bank account (ending with <strong>****{payoutStatus?.activePayout?.bankDetails?.accountNumber?.slice(-4) || '****'}</strong>) mein ₹1 transfer kiya gaya hai. Kripya apna bank balance / SMS check karein.
                      </p>
                      <p className="text-xs text-amber-950 font-bold mt-1.5">
                        Aapke confirm karne par remaining <strong>₹{payoutStatus?.activePayout?.remainingAmount || (payoutStatus?.activePayout?.amount - 1)}</strong> (1 rupya deduct karke) aapke account mein transfer honge.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleCancelSellerPennyDrop(payoutStatus.activePayout._id)}
                      disabled={payoutLoading}
                      className="px-3.5 py-2.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold cursor-pointer transition-all"
                    >
                      Cancel Request
                    </button>
                    <button
                      onClick={() => handleConfirmSellerPennyDrop(payoutStatus.activePayout._id)}
                      disabled={payoutLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle2 size={16} />
                      <span>हाँ, ₹1 मिल गया (Confirm Receipt)</span>
                    </button>
                  </div>
                </div>
              )}

              {payoutStatus?.activePayout?.status === 'PENDING' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                    <span>
                      <strong>₹1 Verification Confirmed!</strong> Aapka remaining payout balance of <strong>₹{payoutStatus?.activePayout?.remainingAmount}</strong> process kiya ja raha hai.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-blue-700 shrink-0">#{payoutStatus?.activePayout?.internalTransactionId?.slice(-8)}</span>
                </div>
              )}

              {/* Bank Passbook Verification Lifecycle Status Banners */}
              {(() => {
                const bStatus = payoutStatus?.bankDetails?.verificationStatus || (payoutStatus?.bankDetails?.accountNumber ? 'PENDING' : 'NOT_SUBMITTED');
                if (bStatus === 'PENDING') {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <Clock size={20} className="text-amber-600 shrink-0 animate-pulse" />
                        <div>
                          <strong className="block text-amber-950 dark:text-amber-100 text-sm">Bank Passbook Verification Under Admin Review</strong>
                          <span className="text-amber-800 dark:text-amber-300">
                            Aapki bank details aur passbook photo Admin ke paas review ke liye submit hain. Admin dwara verify aur approve hone ke baad hi payout request kiya ja sakega.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase shrink-0">
                        Pending Admin Review
                      </span>
                    </div>
                  );
                }
                if (bStatus === 'REJECTED') {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-rose-900 dark:text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                        <div>
                          <strong className="block text-rose-950 dark:text-rose-100 text-sm">Bank Passbook Verification Rejected</strong>
                          <span className="text-rose-800 dark:text-rose-300">
                            Reason: <strong>{payoutStatus?.bankDetails?.rejectionReason || 'Uploaded passbook document was unclear or details did not match.'}</strong> Kripya sahi passbook photo upload karke re-submit karein.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBankModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        Re-upload Passbook
                      </button>
                    </div>
                  );
                }
                if (!payoutStatus?.bankDetails?.accountNumber || bStatus === 'NOT_SUBMITTED') {
                  return (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <Building2 size={20} className="text-blue-600 shrink-0" />
                        <div>
                          <strong className="block text-blue-950 dark:text-blue-100 text-sm">Bank Passbook Verification Required</strong>
                          <span className="text-blue-800 dark:text-blue-300">
                            Marketplace digital product earnings withdraw karne ke liye apni bank details aur passbook photo submit karein taaki Admin use approve kar sake.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBankModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        Upload Bank Passbook
                      </button>
                    </div>
                  );
                }
                if (bStatus === 'APPROVED') {
                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>
                          <strong>Bank Passbook Verified & Approved:</strong> Aapka bank account Admin dwara verified hai. Aap payout request kar sakte hain.
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider shrink-0">
                        ✓ Approved
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Earnings Metrics Cards */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Marketplace Earnings Ledger</h3>
                    <p className="text-xs text-slate-500">Transparent accounting of all digital product sales, platform deductions, and clearances.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBankModal(true)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Building2 size={14} className="text-blue-600" />
                      <span>{payoutStatus?.bankDetails?.accountNumber ? 'Update Bank Details' : 'Add Bank Account'}</span>
                    </button>
                    {(() => {
                      const isBankApproved = payoutStatus?.bankDetails?.verificationStatus === 'APPROVED';
                      const isBankPending = payoutStatus?.bankDetails?.verificationStatus === 'PENDING';
                      const isBankRejected = payoutStatus?.bankDetails?.verificationStatus === 'REJECTED';
                      const hasMinBalance = (payoutStatus?.availableForPayout || stats.availableBalance || 0) >= (payoutStatus?.minPayoutAmount || 100);
                      const hasActive = Boolean(payoutStatus?.activePayout);
                      const canRequest = isBankApproved && hasMinBalance && !hasActive && !payoutLoading;

                      return (
                        <button
                          type="button"
                          onClick={handleRequestSellerPayout}
                          disabled={!canRequest}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title={
                            !isBankApproved
                              ? (isBankPending ? 'Passbook verification pending with Admin' : isBankRejected ? 'Bank passbook rejected. Please re-upload.' : 'Upload bank passbook for verification first')
                              : !hasMinBalance
                              ? `Minimum balance required: ₹${payoutStatus?.minPayoutAmount || 100}`
                              : hasActive
                              ? 'Active payout already in progress'
                              : 'Request Payout'
                          }
                        >
                          <CreditCard size={14} />
                          <span>Request Payout</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Gross Sales</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹{stats.grossRevenue}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20">
                    <span className="text-[11px] font-bold uppercase text-rose-700">Platform Fee & Tax Deducted</span>
                    <p className="text-xl font-black text-rose-600 mt-1">-₹{stats.totalCommission}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
                    <span className="text-[11px] font-bold uppercase text-amber-700">Pending Clearance (Holding)</span>
                    <p className="text-xl font-black text-amber-600 mt-1">₹{stats.pendingClearanceBalance || 0}</p>
                    <span className="text-[10px] text-amber-700/80 block mt-0.5">Admin holding time poora hone par release hoga</span>
                  </div>
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <span className="text-[11px] font-bold uppercase text-emerald-700">Available For Payout</span>
                    <p className="text-xl font-black text-emerald-600 mt-1">₹{payoutStatus?.availableForPayout ?? stats.availableBalance ?? 0}</p>
                    <span className="text-[10px] text-emerald-700/80 block mt-0.5">Min withdrawal: ₹{payoutStatus?.minPayoutAmount || 100}</span>
                  </div>
                </div>
              </div>

              {/* Linked Bank Account Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 size={16} className="text-blue-600" />
                      <span>Payout Destination Account</span>
                    </h4>
                    {payoutStatus?.bankDetails?.verificationStatus === 'APPROVED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 size={11} /> Passbook Verified
                      </span>
                    ) : payoutStatus?.bankDetails?.verificationStatus === 'PENDING' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                        <Clock size={11} /> Review Pending
                      </span>
                    ) : payoutStatus?.bankDetails?.verificationStatus === 'REJECTED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                        <AlertTriangle size={11} /> Passbook Rejected
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => setShowBankModal(true)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {payoutStatus?.bankDetails?.accountNumber ? 'Edit Bank Details / Passbook' : 'Configure Bank Account'}
                  </button>
                </div>
                {payoutStatus?.bankDetails?.accountNumber ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Account Holder</span>
                        <strong className="text-slate-800 dark:text-slate-200">{payoutStatus.bankDetails.accountName || auth.user?.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Bank & Account Number</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {payoutStatus.bankDetails.bankName ? `${payoutStatus.bankDetails.bankName} • ` : ''}
                          ****{payoutStatus.bankDetails.accountNumber.slice(-4)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{payoutStatus.bankDetails.ifscCode}</strong>
                      </div>
                    </div>
                    {payoutStatus.bankDetails?.passbookImage && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                        <img 
                          src={payoutStatus.bankDetails.passbookImage} 
                          alt="Uploaded Passbook" 
                          className="w-14 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">Bank Passbook / Cheque Document</span>
                          <span className="text-[10px] text-slate-400">Submitted for Admin approval</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowBankModal(true)}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          Change Document
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                    No bank account configured yet. Add your bank account and passbook photo to receive digital product earnings.
                  </div>
                )}
              </div>

              {/* Payout History Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Payout Requests History</h4>
                </div>
                {payoutStatus?.payoutHistory?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No payout requests submitted yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 text-slate-500 font-bold uppercase">
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Ref ID</th>
                          <th className="px-5 py-3">Total Amount</th>
                          <th className="px-5 py-3">₹1 Verification</th>
                          <th className="px-5 py-3">Disbursed Balance</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(payoutStatus?.payoutHistory || []).map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-white">#{p.internalTransactionId?.slice(-8)}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">₹{p.amount}</td>
                            <td className="px-5 py-3.5">
                              {p.pennyDropConfirmed ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 size={12} /> Confirmed (₹1)
                                </span>
                              ) : p.status === 'VERIFICATION_PENDING' ? (
                                <span className="text-amber-600 font-bold animate-pulse">Pending Confirmation</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-emerald-600">
                              ₹{p.remainingAmount || (p.amount > 1 ? p.amount - 1 : p.amount)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                p.status === 'PROCESSED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'VERIFICATION_PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.status === 'FAILED' || p.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* BANK DETAILS MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                <span>Configure Payout Bank Account</span>
              </h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankFormData.accountName}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  required
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                  placeholder="Enter full account number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankFormData.ifscCode}
                    onChange={(e) => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono uppercase bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankFormData.bankName}
                    onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={bankFormData.upiId}
                  onChange={(e) => setBankFormData({ ...bankFormData, upiId: e.target.value })}
                  placeholder="e.g. username@okhdfcbank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-transparent"
                />
              </div>

              {/* Passbook / Cancelled Cheque upload for Admin Verification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Passbook / Cancelled Cheque Photo *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Admin verification ke liye passbook ya cheque ki clear photo upload karein jisme Account Number, Name aur IFSC spasht dikhte hon (Max 5MB).
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePassbookFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />

                {bankFormData.passbookImage ? (
                  <div className="mt-2.5 relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 flex items-center justify-between gap-3">
                    <img 
                      src={bankFormData.passbookImage} 
                      alt="Passbook Preview" 
                      className="w-16 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-600" 
                    />
                    <div className="flex-1 text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Passbook Document Ready</span>
                      <span className="text-emerald-600 font-semibold">✓ Image selected for Admin verification</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBankFormData(prev => ({ ...prev, passbookImage: '' }))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-amber-600 font-medium">
                    ⚠️ Passbook photo is required to submit bank details for verification.
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {payoutLoading ? 'Submitting...' : 'Submit for Admin Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </main>

      <Footer />
    </div>
  );
}

