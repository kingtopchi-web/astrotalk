import React, { useState } from 'react';
import { Share2, Copy, Check, X, Phone, Sparkles } from 'lucide-react';

export default function FreeCallShareModal({ 
  isOpen, 
  onClose, 
  onProceed,
  onContinue,
  expertName = '', 
  freeDuration = 5 
}) {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleContinue = onProceed || onContinue;

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://experthub.nextgoodtechnologies.in';
  const shareText = `🎁 Mujhe ExpertHub par ${expertName ? expertName + ' ke sath ' : ''}100% FREE call consultation mil rahi hai! Aap bhi apne friends ke sath share karke apni problem expert ke dwara free me solve karein. Check it out: ${currentUrl}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareAll = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ExpertHub 100% Free Consultation',
          text: shareText,
          url: currentUrl
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border text-on-background rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider inline-block">
                🎉 100% Free Consultation
              </span>
              <h3 className="text-lg font-bold text-on-background leading-snug mt-1">
                Share & Enjoy Free Call
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-muted hover:bg-border text-on-surface-variant hover:text-on-background flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/25 space-y-1.5">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
            Dosto ke sath share karein aur muft me baat karein!
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Isko kisi bhi app par apne friends ya family ke sath share karein aur expert ke sath muft me call consultation shuru karein!
          </p>
          {freeDuration > 0 && (
            <div className="pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>⏱️ Admin Gift: {freeDuration} Minutes Free Talk Time</span>
            </div>
          )}
        </div>

        {/* Sharing Options */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Share with Friends:
          </div>
          
          {/* Universal Share All Button */}
          <button
            type="button"
            onClick={handleShareAll}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Share2 size={18} className="animate-pulse" />
            <span>Share All / किसी भी ऐप पर शेयर करें</span>
          </button>

          {shareSuccess && (
            <p className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Shared successfully! Click Continue below to start your call.
            </p>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-muted hover:bg-border text-on-background font-semibold text-xs border border-border flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-500 font-bold">Link Copied Successfully! / लिंक कॉपी हो गया!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Shareable Link / लिंक कॉपी करें</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Action CTA */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Phone size={17} />
            <span>Continue to Free Call / मुफ़्त कॉल शुरू करें (₹0)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1 text-center text-xs text-on-surface-variant hover:text-on-background font-semibold cursor-pointer"
          >
            Cancel / रद्द करें
          </button>
        </div>

      </div>
    </div>
  );
}
