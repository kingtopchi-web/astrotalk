import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Users, ShieldAlert } from 'lucide-react';

export default function MarketplaceDisabledNotice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-md w-full bg-surface-card border border-border rounded-3xl p-6 sm:p-8 text-center shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
          <Store size={40} className="stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert size={14} />
            Temporarily Disabled
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-on-background tracking-tight">
            Marketplace is Offline
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            The Digital Products Marketplace has been temporarily disabled or hidden by the administrator. 
            Browsing, purchasing, and seller features are paused right now.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/experts')}
            className="w-full py-3 px-4 bg-primary text-slate-950 rounded-xl font-heading font-black text-xs sm:text-sm hover:bg-primary-light transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <Users size={16} />
            <span>Consult Experts Instead</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-surface hover:bg-surface-muted text-on-surface border border-border rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
