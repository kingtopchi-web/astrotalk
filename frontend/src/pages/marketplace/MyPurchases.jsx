import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Download, ShoppingBag, FileText, ArrowRight, Star,
  ShieldCheck, RefreshCw, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function MyPurchases() {
  const { auth } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/purchases'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      if (res.data?.success) {
        setPurchases(res.data.purchases || []);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (orderId, productId, filename) => {
    try {
      setDownloadingId(productId);
      const url = getApiUrl(`/marketplace/downloads/${orderId}/${productId}`);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.token}` },
        responseType: 'blob'
      });

      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'digital-asset.dat';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh to update download count
      fetchPurchases();
    } catch (err) {
      alert('Download failed. If this issue persists, please check your network or contact support.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                My Digital Purchases
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Lifetime access to all digital files, templates, and e-books you've purchased
              </p>
            </div>
            <Link
              to="/marketplace/catalog"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs w-fit"
            >
              <ShoppingBag size={14} />
              <span>Browse More Products</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <RefreshCw size={28} className="animate-spin text-blue-600" />
              <p className="text-xs text-slate-500">Loading your purchased library...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <FileText size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No digital purchases yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the marketplace to purchase expert-crafted e-books, spreadsheets, templates, and tools.
              </p>
              <Link
                to="/marketplace/catalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                <span>Browse Marketplace</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.product?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
                      alt={item.product?.title}
                      className="w-20 h-16 object-cover rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800">
                          {item.product?.fileExtension?.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{item.orderNumber}
                        </span>
                      </div>
                      <Link
                        to={`/marketplace/products/${item.product?.slug || item.product?._id}`}
                        className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 truncate block"
                      >
                        {item.product?.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
                        <span>By {item.sellerName}</span>
                        <span>•</span>
                        <span>Purchased: {new Date(item.purchasedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Downloaded: {item.downloadCount} time(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <Link
                      to={`/marketplace/products/${item.product?.slug || item.product?._id}`}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                      title="Rate & Review"
                    >
                      <Star size={13} className="text-amber-500" />
                      <span>Review</span>
                    </Link>

                    {item.downloadAccessRevoked ? (
                      <span className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        Access Revoked (Refunded)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload(item.orderId, item.product?._id, `${item.product?.title}.${item.product?.fileExtension}`)}
                        disabled={downloadingId === item.product?._id}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Download size={15} className={downloadingId === item.product?._id ? 'animate-bounce' : ''} />
                        <span>{downloadingId === item.product?._id ? 'Downloading...' : 'Download File'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

