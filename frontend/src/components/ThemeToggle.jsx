import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ variant = 'segmented', className = '' }) => {
  const { toggleTheme, setTheme, isDark } = useTheme();

  // Segmented Pill (Two options: Light | Dark)
  if (variant === 'segmented') {
    return (
      <div 
        className={`inline-flex items-center p-1 rounded-full bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 shadow-inner transition-colors ${className}`}
        role="group"
        aria-label="Theme selector"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            !isDark
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Light Mode"
        >
          <Sun size={13} className={!isDark ? 'text-amber-500 fill-amber-400' : 'text-slate-400'} />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Dark Mode"
        >
          <Moon size={13} className={isDark ? 'text-indigo-400 fill-indigo-400' : 'text-slate-400'} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Floating button (for bottom-right corner of home page)
  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
          isDark
            ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 shadow-slate-950/40'
            : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/80 shadow-slate-400/20'
        } ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Sun size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold">Light Mode</span>
          </>
        ) : (
          <>
            <Moon size={16} className="text-slate-700 fill-slate-700" />
            <span className="text-xs font-bold">Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default compact icon button (for navbar)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle color theme"
    >
      {isDark ? (
        <Sun size={16} className="fill-amber-400" />
      ) : (
        <Moon size={16} className="fill-slate-600 text-slate-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
