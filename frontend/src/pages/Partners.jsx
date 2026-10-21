import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Handshake, Share2, Building2, GraduationCap, Code2, 
  CheckCircle2, ArrowRight, Sparkles, Send, ShieldCheck 
} from 'lucide-react';

export default function Partners() {
  const [partnerType, setPartnerType] = useState('Affiliate');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const programs = [
    {
      type: 'Affiliate',
      icon: Share2,
      title: 'Creator & Affiliate Network',
      badge: 'High Revenue Share',
      desc: 'Content creators, bloggers, and influencers: Earn up to 25% recurring commission for every user who recharges and consults through your custom referral link.',
      benefits: [
        'Real-time conversion tracking & custom affiliate dashboard',
        'Bi-weekly direct bank payouts via UPI or IMPS',
        'Dedicated affiliate marketing manager & creative banners',
        'Custom promo codes for your audience with initial free minutes'
      ]
    },
    {
      type: 'Corporate',
      icon: Building2,
      title: 'Corporate Employee Wellness',
      badge: 'B2B Subsidized',
      desc: 'Empower your workforce with on-demand mental wellness, career mentoring, and life counseling allowances. Boost team retention and mental resilience.',
      benefits: [
        'Centralized corporate billing & monthly expenditure caps',
        'Strictly anonymized usage reports keeping employee privacy intact',
        'Access to India’s top certified psychologists and career coaches',
        'Custom company onboarding webinars and orientation'
      ]
    },
    {
      type: 'Institutions',
      icon: GraduationCap,
      title: 'Academies & Professional Bodies',
      badge: 'Accredited Centers',
      desc: 'Partner with us to provide your certified alumni and registered practitioners with a steady stream of verified global consultation opportunities.',
      benefits: [
        'Priority fast-track verification for your institute graduates',
        'Co-branded knowledge webinars and community workshops',
        'Direct accreditation badges displayed on expert profiles',
        'Revenue sharing on faculty consultations'
      ]
    },
    {
      type: 'Technology',
      icon: Code2,
      title: 'API & Platform Integrations',
      badge: 'Developer SDKs',
      desc: 'Embed our real-time consultation widgets, expert search APIs, and WebRTC calling engine directly into your health apps, portals, or super-apps.',
      benefits: [
        'REST APIs & Webhook integrations with 99.99% uptime',
        'White-label WebRTC audio/video call modules',
        'Comprehensive sandbox environment & developer docs',
        'Co-marketing and joint product announcements'
      ]
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-6">
              <Handshake className="w-4 h-4 text-purple-400" />
              <span>Collaborate & Grow Together</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Partner With the Leading <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-300">
                Consultation Ecosystem
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Whether you are an influencer, corporation, academy, or technology provider, join hands with us to unlock immense mutual value.
            </p>

            <a 
              href="#apply" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-lg shadow-purple-600/30 text-sm"
            >
              <span>Explore Partnership Programs</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Partnership Tracks */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Our Partnership Programs</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              Tailored collaboration tracks engineered for creators, enterprise benefits, and institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {programs.map((prog, idx) => {
              const Icon = prog.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                        {prog.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3">{prog.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{prog.desc}</p>

                    <div className="border-t border-slate-100 pt-5 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Program Perks</h4>
                      {prog.benefits.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-100">
                    <a 
                      href="#apply"
                      onClick={() => setPartnerType(prog.type)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700"
                    >
                      <span>Apply for {prog.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Application Form */}
        <section id="apply" className="py-20 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Submit Partnership Proposal</h2>
              <p className="text-slate-600 text-sm">
                Tell us about your brand, organization, or ideas. Our partnerships team will reply within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Proposal Received!</h3>
                <p className="text-emerald-700 text-sm max-w-md mx-auto mb-6">
                  Thank you for reaching out. Our strategic alliance manager has received your details and will follow up shortly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-8 border border-slate-200 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Select Partnership Track
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Affiliate', 'Corporate', 'Institutions', 'Technology'].map((track) => (
                      <button
                        type="button"
                        key={track}
                        onClick={() => setPartnerType(track)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
                          partnerType === track
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rahul@company.com" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Brand *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company or Channel name" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collaboration Proposal / Details *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your audience size, company goals, or how you wish to collaborate..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Partnership Request</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
