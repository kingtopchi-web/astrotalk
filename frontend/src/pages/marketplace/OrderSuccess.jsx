import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2, Download, ShoppingBag, ArrowRight, ShieldCheck,
  FileText, ExternalLink, Sparkles
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { auth } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/purchases'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success && res.data.purchases) {
        const matches = res.data.purchases.filter(p => p.orderId === orderId);
        setOrder({
          orderId,
          orderNumber: matches[0]?.orderNumber || 'MKT-COMPLETED',
          purchasedAt: matches[0]?.purchasedAt || new Date(),
          items: matches
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (productId, filename) => {
    try {
      setDownloadingId(productId);
      const url = getApiUrl(`/marketplace/downloads/${orderId}/${productId}`);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.token}` },
        responseType: 'blob'
      });

      // Trigger browser save dialog
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'digital-asset.dat';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download file. Please try again from My Purchases.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px] flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-10 text-center space-y-6">
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Payment Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Thank You for Your Purchase!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Your digital assets are unlocked and ready for instant download. A copy has also been permanently added to your <strong>My Purchases</strong> library.
            </p>
          </div>

          {/* Purchased Items & Downloads */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Download Your Files
            </h3>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading download links...</div>
            ) : order?.items?.length > 0 ? (
              <div className="space-y-2.5">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                          {item.product?.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Format: {item.product?.fileExtension?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(item.product?._id, `${item.product?.title}.${item.product?.fileExtension}`)}
                      disabled={downloadingId === item.product?._id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Download size={14} className={downloadingId === item.product?._id ? 'animate-bounce' : ''} />
                      <span>{downloadingId === item.product?._id ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                You can download your files anytime from My Purchases.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/marketplace/purchases"
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 hover:opacity-90"
            >
              <span>Go to My Purchases</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/marketplace/catalog"
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-bold text-xs text-slate-700 dark:text-slate-200"
            >
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

