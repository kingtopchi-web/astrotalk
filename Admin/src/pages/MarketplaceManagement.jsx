import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShoppingBag,
  Package,
  Layers,
  FileCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Settings,
  DollarSign,
  Star,
  Eye,
  Trash2,
  Edit,
  Plus,
  Filter,
  TrendingUp,
  CreditCard,
  User,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

const API = ADMIN_API_URL;

export default function MarketplaceManagement() {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'orders', 'earnings', 'reviews', 'settings'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingProducts: 0,
    totalGross: 0,
    totalCommission: 0,
    totalOrders: 0
  });

  // PRODUCTS STATE
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ open: false, productId: null, reason: '' });

  // CATEGORIES STATE
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState({
    open: false,
    editingId: null,
    name: '',
    slug: '',
    description: '',
    icon: '',
    image: '',
    displayOrder: 0
  });

  // ORDERS STATE
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [refundModal, setRefundModal] = useState({ open: false, orderId: null, reason: '' });

  // EARNINGS STATE
  const [financials, setFinancials] = useState({
    totals: { grossSales: 0, platformCommission: 0, sellerPayoutDue: 0, orderCount: 0 },
    topProducts: [],
    recentEarnings: []
  });

  // REVIEWS STATE
  const [reviews, setReviews] = useState([]);

  // SETTINGS STATE
  const [settings, setSettings] = useState({
    enableMarketplace: true,
    marketplaceCommissionRate: 10,
    marketplaceAllowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'zip', 'rar', 'csv', 'txt', 'mp3', 'mp4'],
    marketplaceMaxFileSizeMb: 50,
    marketplaceAutoApprove: false,
    marketplacePayoutHoldDays: 7,
    marketplaceDownloadLimit: 5,
    marketplaceDownloadExpiryDays: 30,
    platformTaxRate: 18
  });
  const [extInput, setExtInput] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // INITIAL LOAD
  useEffect(() => {
    loadOverviewAndTab(activeTab);
  }, [activeTab]);

  const loadOverviewAndTab = async (tab) => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Load earnings overview for summary cards
      const earnRes = await axios.get(`${API}/marketplace/earnings`, { headers });
      if (earnRes.data?.success) {
        const rawTotals = earnRes.data.totals || earnRes.data.summary || {};
        const grossSales = Number(rawTotals.grossSales ?? rawTotals.totalVolume ?? 0);
        const commission = Number(rawTotals.platformCommission ?? rawTotals.totalCommission ?? 0);
        const sellerDue = Number(rawTotals.sellerPayoutDue ?? rawTotals.totalSellerEarnings ?? 0);
        const orders = Number(rawTotals.orderCount ?? rawTotals.totalTransactions ?? 0);

        setFinancials({
          totals: {
            grossSales,
            platformCommission: commission,
            sellerPayoutDue: sellerDue,
            orderCount: orders
          },
          topProducts: Array.isArray(earnRes.data.topProducts) ? earnRes.data.topProducts : [],
          recentEarnings: Array.isArray(earnRes.data.recentEarnings) ? earnRes.data.recentEarnings : []
        });

        setStats((prev) => ({
          ...prev,
          totalGross: grossSales,
          totalCommission: commission,
          totalOrders: orders
        }));
      }

      // Also fetch settings on initial load so toggle status is always up to date
      loadSettings();

      if (tab === 'products') {
        loadProducts();
      } else if (tab === 'categories') {
        loadCategories();
      } else if (tab === 'orders') {
        loadOrders();
      } else if (tab === 'earnings') {
        // already loaded
      } else if (tab === 'reviews') {
        loadReviews();
      } else if (tab === 'settings') {
        loadSettings();
      }
    } catch (err) {
      console.error('Error loading marketplace data:', err);
      showAlert('error', 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  // PRODUCTS API
  const loadProducts = async () => {
    try {
      const headers = getAuthHeaders();
      const params = {};
      if (productFilter !== 'ALL') params.status = productFilter;
      if (productSearch.trim()) params.search = productSearch.trim();
      const res = await axios.get(`${API}/marketplace/products`, { headers, params });
      if (res.data?.success) {
        setProducts(res.data.products || []);
        // Update stats
        const pending = (res.data.products || []).filter((p) => p.status === 'PENDING').length;
        setStats((prev) => ({ ...prev, totalProducts: res.data.total || res.data.products.length, pendingProducts: pending }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductStatus = async (productId, status, rejectionReason = '') => {
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        `${API}/marketplace/products/${productId}/status`,
        { status, rejectionReason },
        { headers }
      );
      if (res.data?.success) {
        showAlert('success', res.data.message || `Product ${status.toLowerCase()} successfully`);
        setRejectionModal({ open: false, productId: null, reason: '' });
        loadProducts();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update product status');
    } finally {
      setActionLoading(false);
    }
  };

  // CATEGORIES API
  const loadCategories = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/marketplace/categories`, { headers });
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        name: categoryModal.name,
        slug: categoryModal.slug,
        description: categoryModal.description,
        icon: categoryModal.icon,
        image: categoryModal.image || '',
        displayOrder: Number(categoryModal.displayOrder) || 0
      };

      if (categoryModal.editingId) {
        await axios.put(`${API}/marketplace/categories/${categoryModal.editingId}`, payload, { headers });
        showAlert('success', 'Category updated successfully');
      } else {
        await axios.post(`${API}/marketplace/categories`, payload, { headers });
        showAlert('success', 'Category created successfully');
      }
      setCategoryModal({ open: false, editingId: null, name: '', slug: '', description: '', icon: '', image: '', displayOrder: 0 });
      loadCategories();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API}/marketplace/categories/${catId}`, { headers });
      showAlert('success', 'Category deleted successfully');
      loadCategories();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete category');
    }
  };

  // ORDERS API
  const loadOrders = async () => {
    try {
      const headers = getAuthHeaders();
      const params = {};
      if (orderStatusFilter !== 'ALL') params.paymentStatus = orderStatusFilter;
      if (orderSearch.trim()) params.search = orderSearch.trim();
      const res = await axios.get(`${API}/marketplace/orders`, { headers, params });
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefundOrder = async () => {
    if (!refundModal.reason.trim()) {
      showAlert('error', 'Refund reason is required');
      return;
    }
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(
        `${API}/marketplace/orders/${refundModal.orderId}/refund`,
        { reason: refundModal.reason },
        { headers }
      );
      if (res.data?.success) {
        showAlert('success', res.data.message || 'Order refunded and access revoked successfully');
        setRefundModal({ open: false, orderId: null, reason: '' });
        loadOrders();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  };

  // REVIEWS API
  const loadReviews = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/marketplace/reviews`, { headers });
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReviewVisibility = async (reviewId, currentVisibility) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        `${API}/marketplace/reviews/${reviewId}/visibility`,
        { isVisible: !currentVisibility },
        { headers }
      );
      if (res.data?.success) {
        showAlert('success', 'Review visibility updated');
        loadReviews();
      }
    } catch (err) {
      showAlert('error', 'Failed to update review visibility');
    }
  };

  // SETTINGS API
  const loadSettings = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API}/marketplace/settings`, { headers });
      if (res.data?.success && res.data.settings) {
        setSettings({
          enableMarketplace: res.data.settings.enableMarketplace !== false,
          marketplaceCommissionRate: res.data.settings.marketplaceCommissionRate ?? 10,
          marketplaceAllowedExtensions: res.data.settings.marketplaceAllowedExtensions || [],
          marketplaceMaxFileSizeMb: res.data.settings.marketplaceMaxFileSizeMb ?? 50,
          marketplaceAutoApprove: !!res.data.settings.marketplaceAutoApprove
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMarketplaceActive = async () => {
    const nextState = !settings.enableMarketplace;
    const confirmMsg = nextState
      ? 'Enable Marketplace System?\n\n• Bottom-Nav will show 5 buttons: Home | Experts | Sell | Products | Account\n• Marketplace store, cart, purchases, and seller dashboard will be visible.'
      : 'Disable & Hide Marketplace System?\n\n• Bottom-Nav will be reduced to 3 buttons: Home | Experts | Account (Sell & Products hidden)\n• Marketplace routes, cart, and seller access will be locked.';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const updated = { ...settings, enableMarketplace: nextState };
      const res = await axios.put(`${API}/marketplace/settings`, updated, { headers });
      if (res.data?.success) {
        setSettings(updated);
        showAlert(
          'success',
          nextState
            ? 'Marketplace is now ACTIVE and visible (5 bottom-nav tabs)!'
            : 'Marketplace is now HIDDEN and locked (3 bottom-nav tabs)!'
        );
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to toggle marketplace status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.put(`${API}/marketplace/settings`, settings, { headers });
      if (res.data?.success) {
        showAlert('success', 'Marketplace settings saved successfully');
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save settings');
    } finally {
      setActionLoading(false);
    }
  };

  const addExtension = () => {
    const ext = extInput.trim().toLowerCase().replace(/^\./, '');
    if (ext && !settings.marketplaceAllowedExtensions.includes(ext)) {
      setSettings({
        ...settings,
        marketplaceAllowedExtensions: [...settings.marketplaceAllowedExtensions, ext]
      });
      setExtInput('');
    }
  };

  const removeExtension = (extToRemove) => {
    setSettings({
      ...settings,
      marketplaceAllowedExtensions: settings.marketplaceAllowedExtensions.filter((e) => e !== extToRemove)
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Alert banner */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Products Marketplace</h1>
              <p className="text-sm text-slate-500">
                Moderate digital assets, manage categories, track orders, oversee platform commissions & settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMarketplaceActive}
            disabled={actionLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all shadow-sm ${
              settings.enableMarketplace
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            }`}
            title="Click to toggle marketplace system on/off"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.enableMarketplace ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>
              {settings.enableMarketplace
                ? 'Marketplace: Visible (5 Tabs)'
                : 'Marketplace: Hidden (3 Tabs)'}
            </span>
          </button>

          <button
            onClick={() => loadOverviewAndTab(activeTab)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{stats.totalProducts}</div>
          <div className="mt-1 text-xs text-amber-600 font-semibold">{stats.pendingProducts} Pending Approval</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">₹{stats.totalGross.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">{stats.totalOrders} Completed Orders</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Platform Revenue</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-blue-700">₹{stats.totalCommission.toLocaleString('en-IN')}</div>
          <div className="mt-1 text-xs text-slate-500">Commission earned</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Seller Payouts</span>
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            ₹{(financials?.totals?.sellerPayoutDue || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Net seller earnings</div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-sm flex flex-wrap gap-2">
        {[
          { key: 'products', label: 'Products Moderation', icon: Package, badge: stats.pendingProducts },
          { key: 'categories', label: 'Categories', icon: Layers },
          { key: 'orders', label: 'Orders & Sales', icon: ShoppingBag },
          { key: 'earnings', label: 'Financials & Earnings', icon: TrendingUp },
          { key: 'reviews', label: 'Reviews', icon: Star },
          { key: 'settings', label: 'Marketplace Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm p-6">
        {/* ========================================================= */}
        {/* TAB 1: PRODUCTS MODERATION */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setProductFilter(st);
                      setTimeout(loadProducts, 50);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      productFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                  placeholder="Search products or seller..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                No products found matching the criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[720px]">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Seller</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                              <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="max-w-xs">
                              <div className="font-semibold text-slate-900 truncate" title={p.title}>
                                {p.title}
                              </div>
                              <div className="text-xs text-slate-400">Sales: {p.salesCount || 0} units</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{p.sellerName || 'Seller'}</div>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                              p.sellerModel === 'Expert' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {p.sellerModel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                          {p.category?.name || 'Uncategorized'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{p.discountedPrice || p.price}
                        </td>
                        <td className="py-3 px-4">
                          <span className="uppercase text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                            {p.digitalFile?.fileExtension || 'FILE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : p.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {p.status}
                          </span>
                          {p.rejectionReason && (
                            <div className="text-[11px] text-red-600 mt-1 max-w-xs truncate" title={p.rejectionReason}>
                              Reason: {p.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateProductStatus(p._id, 'APPROVED')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                                  title="Approve & Publish"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectionModal({ open: true, productId: p._id, reason: '' })}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                                  title="Reject Product"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}

                            {p.status === 'APPROVED' && (
                              <button
                                onClick={() => handleUpdateProductStatus(p._id, 'SUSPENDED')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold"
                                title="Suspend Listing"
                              >
                                Suspend
                              </button>
                            )}

                            {p.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleUpdateProductStatus(p._id, 'APPROVED')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                              >
                                Reactivate
                              </button>
                            )}
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

        {/* ========================================================= */}
        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Digital Product Categories</h3>
                <p className="text-xs text-slate-500">Organize digital items into discoverable catalogs</p>
              </div>
              <button
                onClick={() =>
                  setCategoryModal({
                    open: true,
                    editingId: null,
                    name: '',
                    slug: '',
                    description: '',
                    icon: 'Layers',
                    image: '',
                    displayOrder: categories.length
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{cat.slug}</span>
                      <span className="text-xs text-slate-400 font-mono">Order: {cat.displayOrder}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                          {cat.name.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{cat.name}</h4>
                        <span className="text-[11px] text-slate-400">{cat.image ? 'Custom image set' : 'Default placeholder'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'No description provided'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setCategoryModal({
                          open: true,
                          editingId: cat._id,
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                          icon: cat.icon || '',
                          image: cat.image || '',
                          displayOrder: cat.displayOrder || 0
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ORDERS & SALES */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setOrderStatusFilter(st);
                      setTimeout(loadOrders, 50);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                      orderStatusFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                  placeholder="Order ID, receipt or buyer..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No marketplace orders recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[720px]">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order ID / Receipt</th>
                      <th className="py-3 px-4">Buyer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Gateway / Account</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-slate-900 text-xs">
                            {ord.receipt || ord._id.slice(-8)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{ord.buyerName || 'Buyer'}</div>
                          <div className="text-xs text-slate-400">{ord.buyerEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                          {ord.items?.length || 0} product(s)
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{ord.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="font-semibold text-slate-800">{ord.paymentMethod}</span>
                          {ord.accountCode && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px]">
                              {ord.accountCode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.paymentStatus === 'REFUNDED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ord.paymentStatus === 'PAID' && (
                            <button
                              onClick={() => setRefundModal({ open: true, orderId: ord._id, reason: '' })}
                              className="px-2.5 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FINANCIALS & EARNINGS */}
        {/* ========================================================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Top Selling Digital Assets
                </h4>
                {financials.topProducts?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No sales data available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {financials.topProducts.map((p, idx) => (
                      <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-400 text-sm">#{idx + 1}</span>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                            <p className="text-xs text-slate-400">{p.sellerName} • {p.salesCount || 0} copies sold</p>
                          </div>
                        </div>
                        <span className="font-black text-indigo-600 text-sm">₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Commission Economics Summary */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Marketplace Commission Distribution
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-sm text-slate-600">Total Gross Marketplace Volume</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{(financials?.totals?.grossSales || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                    <span className="text-sm font-semibold text-indigo-900">Platform Commission Retained</span>
                    <span className="text-base font-black text-indigo-700">
                      ₹{(financials?.totals?.platformCommission || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-900">Net Seller Disbursable Balance</span>
                    <span className="text-base font-black text-emerald-700">
                      ₹{(financials?.totals?.sellerPayoutDue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REVIEWS MODERATION */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 mb-2">Verified Customer Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No customer reviews submitted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev._id} className="py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{rev.userName}</span>
                        <div className="flex items-center text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">on {rev.product?.title || 'Product'}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{rev.comment}</p>
                    </div>

                    <button
                      onClick={() => handleToggleReviewVisibility(rev._id, rev.isVisible)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                        rev.isVisible
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : 'border-red-300 text-red-700 hover:bg-red-50'
                      }`}
                    >
                      {rev.isVisible ? 'Visible (Hide)' : 'Hidden (Publish)'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
            {/* MASTER SYSTEM TOGGLE */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                settings.enableMarketplace
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings.enableMarketplace ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="text-sm font-bold text-slate-900">
                      Enable Digital Marketplace & Products System
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl">
                    Jab ye enabled rahega, mobile footer navbar mei 5 tabs{' '}
                    <b>(Home | Experts | Sell | Products | Account)</b> aur website header mei Marketplace, Cart
                    dikhenge. Jab ise hide/disable karenge, marketplace system lock ho jayega aur footer navbar mei sirf 3
                    tabs <b>(Home | Experts | Account)</b> dikhenge.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.enableMarketplace}
                    onChange={(e) =>
                      setSettings({ ...settings, enableMarketplace: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Platform Marketplace Commission Rate (%)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Deducted from each digital product sale. The remainder is credited directly to seller earnings.
              </p>
              <div className="relative w-40">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.marketplaceCommissionRate}
                  onChange={(e) =>
                    setSettings({ ...settings, marketplaceCommissionRate: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
              </div>
            </div>


            {/* Payout Clearance & Holding Period */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Marketplace Seller Payout Clearance / Holding Time (Days)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Kitne din tak product bikne ke baad paisa hold pe rahega. Hold time poora hone ke baad hi seller ko withdraw/payout ke liye amount Available hoga. (Set 0 for instant clearance).
                </p>
                <div className="relative w-44">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={settings.marketplacePayoutHoldDays ?? 7}
                    onChange={(e) =>
                      setSettings({ ...settings, marketplacePayoutHoldDays: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">Days</span>
                </div>
              </div>
            </div>

            {/* Buyer Download Limit & Expiry Window */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Product Download Limit (Max Downloads)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Ek buyer khareedne ke baad maximum kitni baar digital product download ya copy kar sakega. (Set 0 for unlimited downloads).
                </p>
                <div className="relative w-44">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.marketplaceDownloadLimit ?? 5}
                    onChange={(e) =>
                      setSettings({ ...settings, marketplaceDownloadLimit: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">Times</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Download Access Expiry Window (Days)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Order complete hone ke kitne din tak buyer file download kar sakega. Time khatam hone par download link expire ho jayegi. (Set 0 for lifetime access).
                </p>
                <div className="relative w-44">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={settings.marketplaceDownloadExpiryDays ?? 30}
                    onChange={(e) =>
                      setSettings({ ...settings, marketplaceDownloadExpiryDays: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">Days</span>
                </div>
              </div>
            </div>

            {/* Tax & GST Deduction Display */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Transparent Platform Tax / GST Rate (%)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                User aur expert ko transaction ke samay dikhne wala tax / GST rate percentage.
              </p>
              <div className="relative w-44">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.platformTaxRate ?? 18}
                  onChange={(e) =>
                    setSettings({ ...settings, platformTaxRate: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Maximum File Upload Size (MB)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Hard limit for individual digital downloadable product files.
              </p>
              <div className="relative w-40">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={settings.marketplaceMaxFileSizeMb}
                  onChange={(e) =>
                    setSettings({ ...settings, marketplaceMaxFileSizeMb: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold">MB</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Allowed File Extensions
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-300 bg-white mb-2 min-h-[44px]">
                {settings.marketplaceAllowedExtensions.map((ext) => (
                  <span
                    key={ext}
                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md uppercase font-semibold"
                  >
                    .{ext}
                    <button type="button" onClick={() => removeExtension(ext)} className="hover:text-red-500">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={extInput}
                  onChange={(e) => setExtInput(e.target.value)}
                  placeholder="e.g. epub, mobi, dmg"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={addExtension}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
                >
                  Add Extension
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketplaceAutoApprove}
                  onChange={(e) =>
                    setSettings({ ...settings, marketplaceAutoApprove: e.target.checked })
                  }
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900">Auto-Approve Submitted Products</span>
                  <p className="text-xs text-slate-500">
                    If enabled, newly uploaded products are published immediately without waiting for manual admin approval.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving Settings...' : 'Save Marketplace Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* REJECTION MODAL */}
      {rejectionModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reject Digital Product</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for the seller describing why the product submission was rejected.
            </p>
            <textarea
              rows={4}
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
              placeholder="e.g. Cover image resolution is too low, or license terms are incomplete."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectionModal({ open: false, productId: null, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateProductStatus(rejectionModal.productId, 'REJECTED', rejectionModal.reason)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE/EDIT MODAL */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full my-auto max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {categoryModal.editingId ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, editingId: null, name: '', slug: '', description: '', icon: '', displayOrder: 0 })}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={categoryModal.name}
                    onChange={(e) =>
                      setCategoryModal({
                        ...categoryModal,
                        name: e.target.value,
                        slug: categoryModal.editingId
                          ? categoryModal.slug
                          : e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Category Slug *</label>
                  <input
                    type="text"
                    required
                    value={categoryModal.slug}
                    onChange={(e) => setCategoryModal({ ...categoryModal, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Category Image URL (Unsplash / Direct Web Link)</label>
                  <input
                    type="url"
                    value={categoryModal.image || ''}
                    onChange={(e) => setCategoryModal({ ...categoryModal, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  {categoryModal.image && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <img
                        src={categoryModal.image}
                        alt="Category Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">Image Live Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={categoryModal.description}
                    onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Icon Name</label>
                    <input
                      type="text"
                      value={categoryModal.icon}
                      onChange={(e) => setCategoryModal({ ...categoryModal, icon: e.target.value })}
                      placeholder="e.g. Layers, Book"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={categoryModal.displayOrder}
                      onChange={(e) => setCategoryModal({ ...categoryModal, displayOrder: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, editingId: null, name: '', slug: '', description: '', icon: '', displayOrder: 0 })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer active:scale-95"
                >
                  {categoryModal.editingId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND ORDER MODAL */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 text-red-600">
              <RotateCcw className="w-5 h-5" /> Process Order Refund
            </h3>
            <p className="text-xs text-slate-500">
              Refunding this order will immediately revoke digital download access for the buyer, adjust seller commission ledgers, and mark the order as REFUNDED.
            </p>
            <textarea
              rows={3}
              value={refundModal.reason}
              onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
              placeholder="Reason for refund (e.g. buyer requested cancelation / corrupt file)"
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRefundModal({ open: false, orderId: null, reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundOrder}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Refund & Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

