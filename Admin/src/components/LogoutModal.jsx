import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm, title = "Confirm Logout", message = "Are you sure you want to log out of the Admin panel?" }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18181b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-zinc-800 transform transition-all animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 border border-red-100 dark:border-red-500/20 shadow-sm">
            <LogOut size={26} className="translate-x-0.5" />
          </div>

          <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-2">
            {title}
          </h3>

          <p className="font-body text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-xs">
            {message}
          </p>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md shadow-red-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Yes, Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
