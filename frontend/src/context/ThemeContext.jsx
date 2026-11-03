import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_home_theme') || localStorage.getItem('app_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    }
    return 'light';
  });

  // Apply theme to document root ONLY when on the Home page ('/')
  useEffect(() => {
    const root = document.documentElement;

    if (isHomePage && theme === 'dark') {
      root.classList.add('dark');
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      // For all other pages (Dashboard, Expert Dashboard, Bookings, Profile, etc.) enforce pure Light mode
      root.classList.remove('dark');
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    return () => {
      // Ensure dark theme does not leak when unmounting
      if (isHomePage) {
        root.classList.remove('dark');
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };
  }, [theme, isHomePage, location.pathname]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_home_theme', next);
      }
      return next;
    });
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_home_theme', newTheme);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme, 
      isDark: isHomePage && theme === 'dark',
      isHomePage 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
