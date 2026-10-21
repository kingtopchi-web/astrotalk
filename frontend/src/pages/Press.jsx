import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Newspaper, Download, ExternalLink, Mail, Award, 
  TrendingUp, Users, Calendar, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function Press() {
  const stats = [
    { label: 'Consultations Completed', value: '1.2M+' },
    { label: 'Verified Global Experts', value: '15,000+' },
    { label: 'User Satisfaction Rating', value: '4.85 / 5' },
    { label: 'Active Countries Reached', value: '35+' }
  ];

  const pressReleases = [
    {
      title: 'Platform Crosses 1 Million Consultations with 98.5% Positive Feedback',
      outlet: 'TechInAsia / PR Newswire',
      date: 'September 15, 2026',
      summary: 'Marking a major milestone in on-demand advice, our platform scaled its real-time multi-modal consultation engine across career, mental wellness, and astrology.',
      link: '#'
    },
    {
      title: 'Introducing Ultra-Low Latency Video Calls with In-Session Secure Notes',
      outlet: 'YourStory Media',
      date: 'July 28, 2026',
      summary: 'New WebRTC enhancements drop call connection times to sub-2 seconds, while ensuring 100% end-to-end encrypted client consultations.',
      link: '#'
    },
    {
      title: 'Stitch Closes Strategic Growth Round to Expand Specialist Marketplace',
      outlet: 'Inc42 Magazine',
      date: 'May 10, 2026',
      summary: 'Platform plans to expand its legal, financial, and tech coaching verticals, scaling vetting infrastructure and AI-assisted expert matching.',
      link: '#'
    },
    {
      title: 'How On-Demand Micro-Consultations are Replacing Retainers for SMBs',
      outlet: 'Economic Times',
      date: 'February 18, 2026',
      summary: 'Founders and professionals share how pay-per-minute advisory models reduce consultation costs by 65% while increasing speed of execution.',
      link: '#'
    }
  ];

  const brandAssets = [
    {
      title: 'Official Logo Pack (SVG, PNG)',
      desc: 'High-res transparent PNGs, SVGs in light, dark, and monochrome formats.',
      size: '2.4 MB'
    },
    {
      title: 'Brand Guidelines & Color Palette',
      desc: 'Official typography rules, hex color codes, spacing rules, and usage restrictions.',
      size: '1.8 MB'
    },
    {
      title: 'Executive Team Photos & Bios',
      desc: 'High-resolution headshots and verified executive biographies of leadership.',
      size: '8.5 MB'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-semibold mb-6">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              <span>Newsroom & Media Relations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Press, Stories & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                Brand Resources
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore our latest announcements, press coverage, company milestones, and official brand assets.
            </p>
          </div>
        </section>

        {/* Key Metrics / Highlights */}
        <section className="py-12 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="p-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Recent Press & Announcements</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              Catch up on key company developments, product launches, and editorial coverage.
            </p>
          </div>

          <div className="space-y-6">
            {pressReleases.map((pr, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {pr.outlet}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{pr.date}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 hover:text-indigo-600 transition-colors cursor-pointer">
                  {pr.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {pr.summary}
                </p>

                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs sm:text-sm">
                  <span>Read Full Article</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Media Kit & Brand Assets */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Brand & Press Kit</h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto">
                Download verified platform logos, brand style guidelines, and executive media assets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brandAssets.map((asset, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                      <Download className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">{asset.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">{asset.desc}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-auto">
                    <span className="text-xs text-slate-500">{asset.size}</span>
                    <button 
                      onClick={() => alert('Media asset kit download initiated.')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                    >
                      Download ZIP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Media Inquiries Contact */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <div className="bg-slate-900 text-white rounded-3xl p-10 sm:p-12 shadow-xl">
            <Mail className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Media & Interview Inquiries</h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto mb-6">
              Journalists, podcast hosts, and reporters looking for commentary, executive quotes, or market data:
            </p>
            <div className="inline-block bg-white/10 px-6 py-3 rounded-xl border border-white/20 text-cyan-300 font-mono text-sm sm:text-base font-bold mb-6">
              press@ourplatform.com
            </div>
            <p className="text-xs text-slate-400">
              Typical response time: Under 12 hours on business days.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
