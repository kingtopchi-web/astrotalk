import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-black text-slate-300 relative pt-16">
      {/* Top subtle gradient line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand & Contact Info - takes up 2 columns on large screens */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2 group mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined font-light text-[24px]">hub</span>
              </div>
              <span className="font-heading font-extrabold text-2xl text-white">
                ExpertHub
              </span>
            </Link>
            
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Connecting individuals across India with verified, affordable, and reliable expert consultation solutions. Join our community of trusted professionals today.
            </p>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px] mt-0.5">location_on</span>
                <span className="text-sm text-slate-300">ExpertHub HQ, Tech Park, Lucknow 560001</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-[20px]">call</span>
                <span className="text-sm text-slate-300">+91 5223657491</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-[20px]">mail</span>
                <span className="text-sm text-slate-300">support@experthub.com</span>
              </div>
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Twitter / X" className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" aria-label="Telegram" className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm5.894-17.585l-2.08 13.784c-.161 1.055-.838 1.332-1.687.844l-4.665-3.43-2.25 2.164c-.25.25-.456.456-.932.456l.334-4.75 8.647-7.81c.375-.333-.082-.518-.58-.184l-10.686 6.72-4.59-1.436c-.997-.312-1.018-.999.208-1.478l17.93-6.907c.83-.306 1.554.195 1.35 1.027z"/></svg>
              </a>
            </div>
          </div>
          
          {/* Links - Product */}
          <div className="flex flex-col gap-6">
            <h3 className="font-heading font-semibold text-white text-lg flex items-center gap-1">
              Product <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/experts" className="text-sm text-slate-400 hover:text-white transition-colors">Find Experts</Link></li>
              <li><Link to="/expert/register" className="text-sm text-slate-400 hover:text-white transition-colors">Offer Expertise</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>
          
          {/* Links - Company */}
          <div className="flex flex-col gap-6">
            <h3 className="font-heading font-semibold text-white text-lg flex items-center gap-1">
              Company <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Press</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          {/* Links - Support */}
          <div className="flex flex-col gap-6">
            <h3 className="font-heading font-semibold text-white text-lg flex items-center gap-1">
              Support <span className="material-symbols-outlined text-[16px] text-slate-500">arrow_outward</span>
            </h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-black py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-slate-400">
            © 2026 <span className="text-error font-medium">ExpertHub.com</span> all rights reserved
          </div>
          <div className="text-slate-400">
            Designed & developed by <a href="https://nextgoodtechnologies.in/" target="_blank" rel="noreferrer" className="text-error font-medium hover:underline transition-all">NextGood Technologies Pvt Ltd.</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
