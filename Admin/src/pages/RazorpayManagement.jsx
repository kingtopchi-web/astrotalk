import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard, ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Save, ArrowRightLeft, Send, BarChart3, Clock, Check,
  ExternalLink, Info, Activity, Radio, Copy, Building2, Wallet,
  Sparkles, CheckCheck, ChevronRight, Zap, ArrowUpRight
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

export default function RazorpayManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [defaultPaymentAccount, setDefaultPaymentAccount] = useState('RAZORPAY_1');
  const [defaultPayoutAccount, setDefaultPayoutAccount] = useState('RAZORPAY_1');
  const [enablePaymentFallback, setEnablePaymentFallback] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Testing connection state
  const [testingAccount, setTestingAccount] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Copy helper
  const [copiedKey, setCopiedKey] = useState(null);

  // Reporting state
  const [reportTab, setReportTab] = useState('accounts'); // 'accounts' | 'payouts' | 'reports' | 'audit'
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReportAccount, setSelectedReportAccount] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  // Payout requests state
  const [payoutsList, setPayoutsList] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState('ALL');
  const [processingPayoutId, setProcessingPayoutId] = useState(null);
  const [payoutActionFeedback, setPayoutActionFeedback] = useState(null);
  const [authError, setAuthError] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await axios.get(`${ADMIN_API_URL}/razorpay/accounts`, getHeaders());
      if (res.data && res.data.success) {
        setAccounts(res.data.accounts || []);
        setDefaultPaymentAccount(res.data.defaultPaymentAccount || 'RAZORPAY_1');
        setDefaultPayoutAccount(res.data.defaultPayoutAccount || 'RAZORPAY_1');
        setEnablePaymentFallback(!!res.data.enablePaymentFallback);
        setAuditLogs(res.data.auditLogs || []);
        setAuthError(false);
      }
    } catch (err) {
      console.error('Error fetching Razorpay accounts:', err);
      if (err.response?.status === 401) {
        setAuthError(true);
      }
      setErrorMessage(err.response?.data?.message || 'Failed to load Razorpay accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportLoading(true);
    try {
      let url = `${ADMIN_API_URL}/razorpay/reports?accountCode=${selectedReportAccount}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await axios.get(url, getHeaders());
      if (res.data && res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (err.response?.status === 401) setAuthError(true);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setPayoutsLoading(true);
    try {
      const url = `${ADMIN_API_URL}/razorpay/payouts${payoutFilter !== 'ALL' ? `?status=${payoutFilter}` : ''}`;
      const res = await axios.get(url, getHeaders());
      if (res.data && res.data.success) {
        setPayoutsList(res.data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching payout requests:', err);
      if (err.response?.status === 401) setAuthError(true);
    } finally {
      setPayoutsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchReports();
    fetchPayouts();
  }, []);

  useEffect(() => {
    if (reportTab === 'reports') {
      fetchReports();
    } else if (reportTab === 'payouts') {
      fetchPayouts();
    }
  }, [reportTab, selectedReportAccount, startDate, endDate, payoutFilter]);

  const handleProcessPayout = async (payoutId, mode, overrideAccount) => {
    setProcessingPayoutId(payoutId);
    setPayoutActionFeedback(null);
    try {
      let referenceNumber = null;
      if (mode === 'manual_transfer') {
        referenceNumber = window.prompt('Enter Bank / UPI UTR / Reference Number:');
        if (!referenceNumber) {
          setProcessingPayoutId(null);
          return;
        }
      }

      const res = await axios.post(
        `${ADMIN_API_URL}/razorpay/payouts/${payoutId}/process`,
        { mode, overrideAccountCode: overrideAccount, referenceNumber },
        getHeaders()
      );

      setPayoutActionFeedback({
        type: 'success',
        message: res.data.message || 'Payout successfully processed!'
      });
      fetchPayouts();
      fetchReports();
    } catch (err) {
      setPayoutActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to process payout'
      });
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleRejectPayout = async (payoutId) => {
    const reason = window.prompt('Enter rejection reason for expert:');
    if (!reason) return;

    setProcessingPayoutId(payoutId);
    setPayoutActionFeedback(null);
    try {
      const res = await axios.post(
        `${ADMIN_API_URL}/razorpay/payouts/${payoutId}/reject`,
        { reason },
        getHeaders()
      );
      setPayoutActionFeedback({
        type: 'success',
        message: res.data.message || 'Payout rejected.'
      });
      fetchPayouts();
      fetchReports();
    } catch (err) {
      setPayoutActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reject payout'
      });
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleQuickUpdateBank = async (payout) => {
    const currentIfsc = payout.bankDetails?.ifscCode || payout.expert?.bankDetails?.ifscCode || '';
    const newIfsc = window.prompt(
      `Edit Expert IFSC Code:\n(Current: ${currentIfsc})\nFor testing use valid IFSC format (e.g. RAZR0000001, HDFC0001234):`,
      currentIfsc
    );
    if (!newIfsc || newIfsc.trim().toUpperCase() === currentIfsc) return;

    const clean = newIfsc.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(clean)) {
      alert('Invalid IFSC Code format. Must be an 11-character code (e.g. HDFC0001234 or test IFSC RAZR0000001).');
      return;
    }

    try {
      setProcessingPayoutId(payout._id);
      const res = await axios.put(
        `${ADMIN_API_URL}/razorpay/payouts/${payout._id}/bank-details`,
        { ifscCode: clean },
        getHeaders()
      );
      setPayoutActionFeedback({
        type: 'success',
        message: res.data.message || 'Bank details updated. You can now process the payout.'
      });
      fetchPayouts();
    } catch (err) {
      setPayoutActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update bank details'
      });
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleTestConnection = async (accountCode) => {
    setTestingAccount(accountCode);
    setTestResults(prev => ({ ...prev, [accountCode]: { testing: true } }));
    try {
      const res = await axios.post(`${ADMIN_API_URL}/razorpay/accounts/${accountCode}/test`, {}, getHeaders());
      setTestResults(prev => ({
        ...prev,
        [accountCode]: {
          testing: false,
          success: res.data.success,
          latencyMs: res.data.latencyMs,
          message: res.data.message,
          mode: res.data.mode
        }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [accountCode]: {
          testing: false,
          success: false,
          message: err.response?.data?.message || 'Connection test failed'
        }
      }));
    } finally {
      setTestingAccount(null);
    }
  };

  const handleAccountFieldChange = (accountCode, field, value) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.accountCode === accountCode) {
        return { ...acc, [field]: value };
      }
      return acc;
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        defaultPaymentAccount,
        defaultPayoutAccount,
        enablePaymentFallback,
        accounts: accounts.map(a => ({
          accountCode: a.accountCode,
          displayName: a.displayName,
          isEnabled: a.isEnabled,
          payoutEnabled: a.payoutEnabled
        }))
      };

      const res = await axios.put(`${ADMIN_API_URL}/razorpay/accounts`, payload, getHeaders());
      if (res.data && res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        fetchAccounts();
      }
    } catch (err) {
      console.error('Error saving Razorpay settings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-12 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <RefreshCw className="animate-spin" size={26} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Loading Razorpay Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">Fetching live routing configs, credentials and payout requests...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingPayoutsCount = payoutsList.filter(p => p.status === 'PENDING').length;

  return (
    <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7">
      {/* ── Top Header Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-[1] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
              <Zap size={13} className="text-indigo-400" />
              <span>Multi-Merchant Gateway Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Razorpay Accounts & Payouts Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Orchestrate 3 independent Razorpay merchant accounts for customer payment collections, automated payout settlements, and real-time ledger accounting.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchAccounts();
                fetchReports();
                fetchPayouts();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer backdrop-blur-sm"
              title="Refresh all account data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving Changes...' : 'Save Routing Settings'}</span>
            </button>
          </div>
        </div>

        {/* Feedback pills */}
        {(saveSuccess || errorMessage) && (
          <div className="relative z-[1] mt-5 pt-4 border-t border-white/10">
            {saveSuccess && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>Gateway routing configuration successfully updated across all active services!</span>
              </div>
            )}
            {errorMessage && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/30 px-3.5 py-1.5 rounded-xl">
                <AlertTriangle size={15} className="text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth session warning if 401 */}
      {authError && (
        <div className="p-4 rounded-2xl border border-rose-300 bg-rose-50 text-rose-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>Admin session expired or token missing. Please log in again to manage Razorpay settings and approve payouts.</span>
          </div>
          <a
            href="/login"
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Log In Again
          </a>
        </div>
      )}

      {/* ── Modern Segmented Nav Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setReportTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            reportTab === 'accounts'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CreditCard size={15} className={reportTab === 'accounts' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Accounts & Routing</span>
        </button>

        <button
          onClick={() => setReportTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            reportTab === 'payouts'
              ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ArrowRightLeft size={15} className={reportTab === 'payouts' ? 'text-purple-600' : 'text-slate-400'} />
          <span>Expert Payout Requests</span>
          {pendingPayoutsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
              {pendingPayoutsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setReportTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            reportTab === 'reports'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <BarChart3 size={15} className={reportTab === 'reports' ? 'text-blue-600' : 'text-slate-400'} />
          <span>Gateway Analytics & Reports</span>
        </button>

        <button
          onClick={() => setReportTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            reportTab === 'audit'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Clock size={15} className={reportTab === 'audit' ? 'text-slate-700' : 'text-slate-400'} />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ACCOUNTS & ROUTING */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {reportTab === 'accounts' && (
        <div className="space-y-6">
          {/* Top 3 High-Level Routing Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Customer Payments */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border border-blue-200/80 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  Payment Gateway
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                  ACTIVE DEFAULT
                </span>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 font-mono tracking-tight">{defaultPaymentAccount}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  All customer consultation orders, digital marketplace purchases & wallet recharges route through this merchant ID.
                </p>
              </div>
            </div>

            {/* Card 2: Expert Payouts */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border border-purple-200/80 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Wallet size={14} />
                  Expert Disbursal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white shadow-xs">
                  ACTIVE DEFAULT
                </span>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 font-mono tracking-tight">{defaultPayoutAccount}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Approved expert earnings and bank withdrawals are settled via RazorpayX linked account number.
                </p>
              </div>
            </div>

            {/* Card 3: Failover Protection */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/50 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-slate-600" />
                    Failover Protection
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    enablePaymentFallback ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {enablePaymentFallback ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Auto-route transactions to the next active merchant account if the default account is offline or fails credentials.
                </p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  checked={enablePaymentFallback}
                  onChange={(e) => setEnablePaymentFallback(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Enable zero-downtime automatic fallback</span>
              </label>
            </div>
          </div>

          {/* ── 3 Merchant Virtual Cards Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              const testResult = testResults[acc.accountCode];
              const isSelectedPayment = defaultPaymentAccount === acc.accountCode;
              const isSelectedPayout = defaultPayoutAccount === acc.accountCode;

              return (
                <div
                  key={acc.accountCode}
                  className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isSelectedPayment && isSelectedPayout
                      ? 'border-indigo-500 ring-4 ring-indigo-50'
                      : isSelectedPayment
                      ? 'border-blue-500 ring-4 ring-blue-50'
                      : isSelectedPayout
                      ? 'border-purple-500 ring-4 ring-purple-50'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="space-y-5">
                    {/* Top Row: Account Badge, Mode & Active Switch */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg tracking-wider">
                            {acc.accountCode}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            acc.mode === 'live'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : (acc.mode === 'test' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {acc.mode || 'test'} Mode
                          </span>
                        </div>
                        <input
                          type="text"
                          value={acc.displayName || ''}
                          onChange={(e) => handleAccountFieldChange(acc.accountCode, 'displayName', e.target.value)}
                          placeholder="Account Display Name"
                          className="mt-2.5 text-base font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full transition-colors"
                        />
                      </div>

                      {/* Active toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={acc.isEnabled}
                          onChange={(e) => handleAccountFieldChange(acc.accountCode, 'isEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                      </label>
                    </div>

                    {/* Service Status Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                        acc.paymentGatewayConfigured
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          {acc.paymentGatewayConfigured ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-rose-500" />}
                          <span>PG Checkout</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {acc.paymentGatewayConfigured ? 'API Keys Active' : 'Missing Env Keys'}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                        acc.payoutConfigured
                          ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          {acc.payoutConfigured ? <CheckCircle2 size={14} className="text-purple-600" /> : <Info size={14} className="text-slate-400" />}
                          <span>RazorpayX</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {acc.payoutConfigured ? 'Account # Linked' : 'No Account #'}
                        </span>
                      </div>
                    </div>

                    {/* Key Preview Box with Copy */}
                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-sans font-bold uppercase tracking-wider">Public Key ID</span>
                        {acc.keyId && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(acc.keyId, `key_${acc.accountCode}`)}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-sans font-bold cursor-pointer"
                          >
                            {copiedKey === `key_${acc.accountCode}` ? (
                              <>
                                <CheckCheck size={12} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-slate-800 font-bold truncate text-[11px]">
                        {acc.keyId || 'Not set in .env'}
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-sans">Webhook Secret:</span>
                        <span className={`font-semibold ${acc.hasWebhookSecret ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {acc.hasWebhookSecret ? '✓ Verified in .env' : 'Not configured'}
                        </span>
                      </div>
                    </div>

                    {/* Role Selection Toggles */}
                    <div className="space-y-2 pt-2">
                      <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelectedPayment
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="defaultPaymentAccountRadio"
                            checked={isSelectedPayment}
                            onChange={() => setDefaultPaymentAccount(acc.accountCode)}
                            disabled={!acc.isEnabled || !acc.paymentGatewayConfigured}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs">Default for Payments</span>
                        </div>
                        {isSelectedPayment && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">Active</span>
                        )}
                      </label>

                      <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelectedPayout
                          ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="defaultPayoutAccountRadio"
                            checked={isSelectedPayout}
                            onChange={() => setDefaultPayoutAccount(acc.accountCode)}
                            disabled={!acc.isEnabled}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="text-xs">Default for Payouts</span>
                        </div>
                        {isSelectedPayout && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white">Active</span>
                        )}
                      </label>
                    </div>

                    {/* Test result feedback banner */}
                    {testResult && (
                      <div className={`p-3 rounded-xl text-xs border ${
                        testResult.testing
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : (testResult.success
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800')
                      }`}>
                        {testResult.testing ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw size={13} className="animate-spin text-blue-600" />
                            <span className="font-semibold">Testing credentials with Razorpay API...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold">
                                {testResult.success ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-rose-600" />}
                                <span>{testResult.success ? 'Credentials Verified' : 'Connection Failed'}</span>
                              </div>
                              {testResult.latencyMs && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                  {testResult.latencyMs}ms
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] leading-tight text-slate-600">{testResult.message}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test Connection Button Footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      /webhook/{acc.accountCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestConnection(acc.accountCode)}
                      disabled={testingAccount === acc.accountCode || !acc.paymentGatewayConfigured}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <Activity size={13} className={testingAccount === acc.accountCode ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                      <span>{testingAccount === acc.accountCode ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Webhook Configuration Guide ── */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Razorpay Webhook Setup Instructions</h3>
                  <p className="text-xs text-slate-500">Configure separate webhooks in each merchant dashboard to listen for payment and payout events.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3'].map(code => {
                const url = `https://experthub.nextgoodtechnologies.in/api/payment/webhook/${code}`;
                return (
                  <div key={code} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] font-sans font-bold uppercase tracking-wider">{code} Endpoint</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(url, `webhook_${code}`)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `webhook_${code}` ? (
                          <>
                            <CheckCheck size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-slate-800 font-mono text-[11px] break-all select-all font-semibold bg-white p-2 rounded-lg border border-slate-200/80">
                      {url}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Supported Events:</span>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">payment.captured</code>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">payment.failed</code>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">payout.processed</code>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">payout.failed</code>
              <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">payout.reversed</code>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PAYOUT REQUESTS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {reportTab === 'payouts' && (
        <div className="space-y-6">
          {/* Action Feedback Banner */}
          {payoutActionFeedback && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
              payoutActionFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2.5">
                {payoutActionFeedback.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
                <span>{payoutActionFeedback.message}</span>
              </div>
              <button onClick={() => setPayoutActionFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
          )}

          {/* Filter Bar with Counter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
              {['ALL', 'PENDING', 'FAILED', 'PROCESSED', 'CANCELLED'].map(st => (
                <button
                  key={st}
                  onClick={() => setPayoutFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    payoutFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Requests' : st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchPayouts}
              disabled={payoutsLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={payoutsLoading ? 'animate-spin text-purple-600' : ''} />
              <span>Refresh Payouts</span>
            </button>
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Expert Withdrawal Requests</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review, approve and transfer consultation earnings to verified expert bank accounts.</p>
              </div>
              <span className="text-xs font-extrabold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                {payoutsList.length} Total Requests
              </span>
            </div>

            {payoutsLoading ? (
              <div className="p-14 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-purple-600" />
                <span className="font-semibold">Loading payout requests...</span>
              </div>
            ) : payoutsList.length === 0 ? (
              <div className="p-14 text-center text-slate-400 text-xs">
                No payout requests found for the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Expert</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Bank Details</th>
                      <th className="px-5 py-3.5">Account</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutsList.map(p => {
                      const canTakeAction = p.status === 'PENDING' || p.status === 'QUEUED' || p.status === 'FAILED';
                      const isProcessingThis = processingPayoutId === p._id;

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {(p.expert?.name || 'E').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm">{p.expert?.name || 'Expert'}</span>
                                <span className="text-slate-400 text-[11px]">{p.expert?.specialty || p.expert?.email || 'Specialist'}</span>
                                <span className="text-slate-400 text-[10px] font-mono">{p.internalTransactionId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-base font-black text-slate-900">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[11px]">
                            <div className="space-y-0.5">
                              <div className="font-sans font-bold text-slate-800 flex items-center gap-1">
                                <Building2 size={12} className="text-slate-400" />
                                <span>{p.bankDetails?.bankName || p.expert?.bankDetails?.bankName || 'Bank Account'}</span>
                              </div>
                              <div className="text-slate-600">A/C: ****{String(p.bankDetails?.accountNumber || p.expert?.bankDetails?.accountNumber || '').slice(-4)}</div>
                              <div className="text-slate-600 font-bold">IFSC: {p.bankDetails?.ifscCode || p.expert?.bankDetails?.ifscCode}</div>
                              <div className="text-slate-400 text-[10px] font-sans">Name: {p.bankDetails?.accountHolderName || p.expert?.bankDetails?.accountHolderName}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                              {p.accountCode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              p.status === 'PROCESSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : (p.status === 'CANCELLED' || p.status === 'FAILED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800')
                            }`}>
                              {p.status}
                            </span>
                            {p.failureReason && (
                              <p className="text-[10px] text-rose-500 mt-1 max-w-xs font-sans leading-tight">{p.failureReason}</p>
                            )}
                            {p.providerPayoutId && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">{p.providerPayoutId}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {canTakeAction ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleProcessPayout(p._id, 'auto_razorpay', p.accountCode)}
                                  disabled={isProcessingThis}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                  title="Transfer funds directly through RazorpayX API"
                                >
                                  {isProcessingThis ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                                  <span>{p.status === 'FAILED' ? 'Retry via Razorpay' : 'Pay via Razorpay'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProcessPayout(p._id, 'manual_transfer')}
                                  disabled={isProcessingThis}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                  title="Mark as paid if you transferred funds manually via UPI/NetBanking"
                                >
                                  <span>Mark Paid</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickUpdateBank(p)}
                                  disabled={isProcessingThis}
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                                  title="Edit expert's bank IFSC or account details"
                                >
                                  <span>Edit IFSC</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPayout(p._id)}
                                  disabled={isProcessingThis}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                  title="Reject payout request"
                                >
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[11px] font-bold ${p.status === 'PROCESSED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {p.status === 'PROCESSED' ? '✓ Processed' : p.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ACCOUNT-WISE REPORTS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {reportTab === 'reports' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account:</label>
              <select
                value={selectedReportAccount}
                onChange={(e) => setSelectedReportAccount(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Accounts Combined</option>
                <option value="RAZORPAY_1">RAZORPAY_1</option>
                <option value="RAZORPAY_2">RAZORPAY_2</option>
                <option value="RAZORPAY_3">RAZORPAY_3</option>
              </select>

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={fetchReports}
              disabled={reportLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={reportLoading ? 'animate-spin text-blue-600' : ''} />
              <span>Refresh Report</span>
            </button>
          </div>

          {/* Volume Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Volume</span>
                <p className="text-2xl font-black text-slate-900">₹{reportData.summary.totalPaymentVolume.toLocaleString('en-IN')}</p>
                <span className="text-xs text-emerald-600 font-bold">{reportData.summary.totalSuccessPayments} successful transactions</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Payments</span>
                <p className="text-2xl font-black text-rose-600">{reportData.summary.totalFailedPayments}</p>
                <span className="text-xs text-slate-400 font-medium">Gateway verification failures</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payout Volume</span>
                <p className="text-2xl font-black text-purple-700">₹{reportData.summary.totalPayoutVolume.toLocaleString('en-IN')}</p>
                <span className="text-xs text-purple-600 font-bold">{reportData.summary.totalPayoutsCount} total payout requests</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payouts</span>
                <p className="text-2xl font-black text-amber-600">{reportData.summary.payoutsPending}</p>
                <span className="text-xs text-slate-400 font-medium">{reportData.summary.payoutsFailed} failed / reversed</span>
              </div>
            </div>
          )}

          {/* Account-by-Account Breakdown Table */}
          {reportData?.accountStats && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Account Volume Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Account</th>
                    <th className="px-6 py-3.5">Total Payments</th>
                    <th className="px-6 py-3.5">Success Rate</th>
                    <th className="px-6 py-3.5">Payment Volume (₹)</th>
                    <th className="px-6 py-3.5">Payouts Count</th>
                    <th className="px-6 py-3.5">Payout Volume (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(reportData.accountStats).map(([code, stats]) => {
                    const totalPay = stats.paymentsCount || 0;
                    const successPay = stats.successCount || 0;
                    const successRate = totalPay > 0 ? ((successPay / totalPay) * 100).toFixed(1) : '100.0';

                    return (
                      <tr key={code} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{code}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{totalPay}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{successRate}%</td>
                        <td className="px-6 py-4 font-black text-slate-900">₹{stats.paymentsAmount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-semibold text-purple-700">{stats.payoutsCount}</td>
                        <td className="px-6 py-4 font-black text-purple-900">₹{stats.payoutsAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Recent Payouts Table */}
          {reportData?.recentPayouts && reportData.recentPayouts.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Recent Expert Payouts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Txn ID</th>
                    <th className="px-6 py-3.5">Expert</th>
                    <th className="px-6 py-3.5">Account</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.recentPayouts.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-700">{p.internalTransactionId}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">{p.expert?.name || 'Expert'}</td>
                      <td className="px-6 py-3.5 font-mono text-purple-700 font-bold">{p.accountCode}</td>
                      <td className="px-6 py-3.5 font-black text-slate-900">₹{p.amount}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'PROCESSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (p.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {reportTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <span>Administrative Routing Audit Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Immutable audit trail of changes</span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No configuration changes logged yet.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{log.action}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-semibold">{log.changedBy}</span>
                    </div>
                    {log.details && (
                      <p className="text-slate-500 text-[11px] font-mono leading-relaxed">
                        Payment default: <strong className="text-slate-800">{log.details.newPaymentDefault}</strong> | Payout default: <strong className="text-slate-800">{log.details.newPayoutDefault}</strong> | Fallback: <strong className="text-slate-800">{log.details.enablePaymentFallback ? 'Yes' : 'No'}</strong>
                      </p>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px] whitespace-nowrap font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
