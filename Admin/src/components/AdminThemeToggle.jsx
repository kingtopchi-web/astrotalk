import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const AdminThemeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('admin_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('admin_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
        isDark
          ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun size={15} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400 hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={15} className="fill-slate-600 text-slate-600" />
          <span className="text-[11px] font-bold text-slate-700 hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
};

export default AdminThemeToggle;
