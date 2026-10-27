import React from 'react';
import { Link } from 'react-router-dom';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

function Footer() {
  const { platformName, supportEmail, contactPhone, address } = usePlatformSettings();

  return (
    <footer className="bg-black text-slate-300 relative pt-10 sm:pt-12">
      {/* Top subtle gradient line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          
          {/* Brand & Contact Info - takes up 2 columns on large screens */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 group mb-1">
              <img 
                src="/logo.png" 
                alt={`${platformName || 'ExpertHub'} Logo`} 
                className="w-9 h-9 object-contain rounded-lg shrink-0" 
              />
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                {platformName || 'ExpertHub'}
              </span>
            </Link>
            
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Connecting individuals across India with verified, affordable, and reliable expert consultation solutions. Join our community of trusted professionals today.
            </p>
            
            <div className="flex flex-col gap-2.5 mt-1">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">location_on</span>
                <span className="text-sm text-slate-300">{address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-error text-[18px]">call</span>
                <a href={`tel:${contactPhone || '+91 98765 43210'}`} className="text-sm text-slate-300 hover:text-white transition-colors">
                  {contactPhone || '+91 98765 43210'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-error text-[18px]">mail</span>
                <a href={`mailto:${supportEmail || 'support@stitchplatform.com'}`} className="text-sm text-slate-300 hover:text-white transition-colors break-all">
                  {supportEmail || 'support@stitchplatform.com'}
                </a>
              </div>
            </div>
            
          </div>
          
          {/* Links - Product */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-white text-base flex items-center gap-1">
              Product <span className="material-symbols-outlined text-[15px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li><Link to="/experts" className="text-sm text-slate-400 hover:text-white transition-colors">Find Experts</Link></li>
              <li><Link to="/expert/register" className="text-sm text-slate-400 hover:text-white transition-colors">Offer Expertise</Link></li>
              <li><Link to="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/trust-and-safety" className="text-sm text-slate-400 hover:text-white transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>
          
          {/* Links - Company */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-white text-base flex items-center gap-1">
              Company <span className="material-symbols-outlined text-[15px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li><Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/press" className="text-sm text-slate-400 hover:text-white transition-colors">Press</Link></li>
              <li><Link to="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/partners" className="text-sm text-slate-400 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          {/* Links - Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-heading font-semibold text-white text-base flex items-center gap-1">
              Support <span className="material-symbols-outlined text-[15px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li><Link to="/help-center" className="text-sm text-slate-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/community" className="text-sm text-slate-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Horizontal Row: Social Icons on Left, 100% Secure Payments on Right border-t border-slate-800/80*/}
        <div className="mt-8 pt-6  flex flex-col lg:flex-row items-center justify-between gap-5">
          {/* Left: Social Icons */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mr-1">Follow Us:</span>
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" aria-label="Twitter / X" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>

          {/* Right: 100% Secure Payments directly horizontal */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5 mr-1">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
              <span className="whitespace-nowrap">100% SECURE PAYMENTS:</span>
            </span>

            {/* Razorpay Badge */}
            <div className="h-7 px-2.5 bg-slate-900 border border-slate-700/80 rounded-md flex items-center gap-1.5 shadow-xs" title="Secured by Razorpay">
              <svg className="h-3.5 w-auto" viewBox="0 0 70 20" fill="none">
                <path d="M11 2L4 18H9L11 13H15C17.5 13 19 11.5 19 8.5C19 4 15.5 2 11 2ZM12 9.5H9L10 6H12C13.5 6 14.5 6.5 14.5 7.5C14.5 8.5 13.5 9.5 12 9.5Z" fill="#3395FF"/>
                <path d="M8.5 11L4 18H9L11 13H8.5Z" fill="#0284C7"/>
                <text x="22" y="14" fill="#FFFFFF" fontFamily="sans-serif" fontSize="11" fontWeight="700">Razorpay</text>
              </svg>
            </div>

            {/* UPI Badge */}
            <div className="h-7 px-2.5 bg-slate-900 border border-slate-700/80 rounded-md flex items-center gap-1 shadow-xs" title="UPI - Unified Payments Interface">
              <svg className="h-3.5 w-auto" viewBox="0 0 52 20" fill="none">
                <path d="M3 15L8 5L13 15H3Z" fill="#097939"/>
                <path d="M9 15L14 5L19 15H9Z" fill="#ED752E"/>
                <text x="21" y="14.5" fill="#FFFFFF" fontFamily="sans-serif" fontSize="11" fontWeight="800" letterSpacing="0.5">UPI</text>
              </svg>
            </div>

            {/* VISA Badge */}
            <div className="h-7 px-2.5 bg-slate-900 border border-slate-700/80 rounded-md flex items-center justify-center shadow-xs" title="Visa">
              <span className="text-[#2563EB] font-black italic text-xs tracking-wider">VISA</span>
            </div>

            {/* Mastercard Badge */}
            <div className="h-7 px-2.5 bg-slate-900 border border-slate-700/80 rounded-md flex items-center gap-1.5 shadow-xs" title="Mastercard">
              <div className="flex items-center -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-300 hidden sm:inline">mastercard</span>
            </div>

            {/* RuPay Badge */}
            <div className="h-7 px-2.5 bg-slate-900 border border-slate-700/80 rounded-md flex items-center gap-1 shadow-xs" title="RuPay">
              <span className="text-white font-bold text-[11px] tracking-tight">RuPay</span>
              <div className="flex items-center -space-x-0.5">
                <span className="text-[#0079C1] font-black text-xs">❯</span>
                <span className="text-[#F37021] font-black text-xs">❯</span>
              </div>
            </div>

            {/* SSL 256-Bit Badge */}
            <div className="h-7 px-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-md flex items-center gap-1 text-emerald-400 text-[10px] font-semibold shadow-xs" title="256-Bit SSL Secured">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span>256-Bit SSL</span>
            </div>
          </div>
        </div>

      </div>
      
      {/* Bottom Bar */}
      <div className="bg-black py-4 border-t border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-slate-400 text-xs sm:text-sm">
            © 2026 <span className="text-error font-medium">{platformName || 'ExpertHub'}.com</span> all rights reserved
          </div>
          <div className="text-slate-400 text-xs sm:text-sm">
            Designed & developed by <a href="https://nextgoodtechnologies.in/" target="_blank" rel="noreferrer" className="text-error font-medium hover:underline transition-all">NextGood Technologies Pvt Ltd.</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
