import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Experts', path: '/experts' },
    // { name: 'Market', path: '/market' }, // Add later if needed
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center flex-1">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white transform group-hover:scale-105 transition-transform">
               <span className="material-symbols-outlined font-light text-[20px]">hub</span>
             </div>
             <span className="font-heading font-extrabold text-xl text-on-background">
               ExpertHub
             </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-12">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="font-body font-semibold text-base text-on-surface hover:text-primary transition-colors">
              {link.name}
            </Link>
          ))}
          <Link to="/about" className="font-body font-semibold text-base text-on-surface hover:text-primary transition-colors">About</Link>
          <Link to="/contact" className="font-body font-semibold text-base text-on-surface hover:text-primary transition-colors">Contact</Link>
        </nav>

        {/* Right Section (Auth / Profile) */}
        <div className="hidden md:flex items-center justify-end gap-4 flex-1">
          {!auth.token ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-body font-semibold text-sm bg-primary-dark text-white hover:bg-primary transition-colors px-6 py-2 rounded-lg shadow-sm">
                Login
              </Link>
            </div>
          ) : auth.user?.role === 'EXPERT' ? (
            <div className="flex items-center gap-4">
              <Link to="/expert/dashboard" className="font-body font-medium text-secondary hover:text-secondary-dark transition-colors">
                Dashboard
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <button onClick={handleLogout} className="font-body font-medium text-error hover:text-error/80 transition-colors">
                Logout
              </button>
            </div>
          ) : (
             <div className="flex items-center gap-4">
               {/* User Wallet */}
               <div className="flex items-center bg-primary-light/50 pl-3 pr-1 py-1 rounded-full border border-primary/20">
                 <span className="material-symbols-outlined text-primary text-[18px] mr-1">account_balance_wallet</span>
                 <span className="font-body font-bold text-primary-dark mr-2">₹500</span>
                 <button onClick={() => navigate('/wallet')} aria-label="Add Funds" className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors shadow-sm">
                   <span className="material-symbols-outlined text-[16px]">add</span>
                 </button>
               </div>
               
               <button aria-label="Notifications" className="relative text-on-surface-variant hover:text-primary transition-colors">
                 <span className="material-symbols-outlined text-[24px]">notifications</span>
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white"></span>
               </button>
               
               <Link to="/profile" className="flex items-center gap-2 group">
                 <div className="w-10 h-10 rounded-full bg-secondary-light border border-secondary/20 overflow-hidden group-hover:border-secondary transition-colors">
                    <span className="material-symbols-outlined text-secondary mt-1.5 w-full text-center">person</span>
                 </div>
               </Link>
               
               <button onClick={handleLogout} className="font-body font-medium text-error hover:text-error/80 transition-colors">
                 <span className="material-symbols-outlined text-[20px]">logout</span>
               </button>
             </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-on-surface-variant p-2 -mr-2"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-border shadow-card py-4 px-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className="font-heading font-semibold text-lg text-on-surface py-2 border-b border-border/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {!auth.token ? (
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-body font-semibold text-on-surface border border-border py-3 rounded-xl">
                Login
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-body font-semibold bg-primary text-white py-3 rounded-xl">
                Sign Up
              </Link>
              <Link to="/expert/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-body text-sm text-on-surface-variant mt-2">
                Become an Expert
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
               {auth.user?.role === 'EXPERT' ? (
                 <Link to="/expert/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-semibold text-lg text-secondary py-2 border-b border-border/50">
                    Dashboard
                 </Link>
               ) : (
                 <>
                   <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-semibold text-lg text-on-surface py-2 border-b border-border/50">
                     My Profile
                   </Link>
                   <Link to="/wallet" onClick={() => setIsMobileMenuOpen(false)} className="font-heading font-semibold text-lg text-on-surface py-2 border-b border-border/50">
                     Wallet balance (₹500)
                   </Link>
                 </>
               )}
               <button onClick={handleLogout} className="text-left font-heading font-semibold text-lg text-error py-2">
                 Logout
               </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
