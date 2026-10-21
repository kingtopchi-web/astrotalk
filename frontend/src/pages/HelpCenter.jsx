import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  HelpCircle, Search, Wallet, Video, User, ShieldCheck, 
  MessageSquare, ChevronDown, ChevronRight, PhoneCall, Mail, 
  Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'All', name: 'All Topics', icon: HelpCircle },
    { id: 'wallet', name: 'Wallet & Payments', icon: Wallet },
    { id: 'consultation', name: 'Calls & Video Sessions', icon: Video },
    { id: 'account', name: 'Account & Settings', icon: User },
    { id: 'expert', name: 'For Experts & Payouts', icon: ShieldCheck }
  ];

  const faqs = [
    {
      id: 1,
      category: 'wallet',
      q: 'How does per-minute billing work on the platform?',
      a: 'Billing is calculated in real time per minute of active consultation. Your wallet balance is deducted second-by-second while you are on a call or in an active chat session. The rate is clearly displayed on the expert profile before you begin.'
    },
    {
      id: 2,
      category: 'wallet',
      q: 'What payment methods can I use to recharge my wallet?',
      a: 'We support all major Indian and international payment methods via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards (Visa, MasterCard, RuPay), NetBanking from 50+ banks, and popular wallets.'
    },
    {
      id: 3,
      category: 'wallet',
      q: 'What if a call gets disconnected due to network issues?',
      a: 'Our smart billing algorithm pauses deductions the moment a network interruption is detected. If the call cannot be resumed, any unused minutes remain safely in your wallet. If you face an issue, contact support for an immediate credit adjustment.'
    },
    {
      id: 4,
      category: 'consultation',
      q: 'How do I grant microphone and camera permissions for video calls?',
      a: 'When starting a video consultation, your browser will prompt: "Allow this website to use your camera and microphone?". Click "Allow". If you accidentally blocked it, click the lock icon in your browser URL bar, enable permissions, and refresh the tab.'
    },
    {
      id: 5,
      category: 'consultation',
      q: 'Is my consultation completely private and confidential?',
      a: 'Yes, 100%. All chats, voice streams, and video calls are end-to-end encrypted. We never record calls without explicit written consent. Even your personal phone number remains completely masked from the expert.'
    },
    {
      id: 6,
      category: 'account',
      q: 'How can I reset my password if I forgot it?',
      a: 'Click on "Sign In" in the top navigation, select "Forgot Password?", enter your registered email address, and you will receive a secure password reset link valid for 1 hour.'
    },
    {
      id: 7,
      category: 'expert',
      q: 'How can I register as a verified expert on the platform?',
      a: 'Click "Offer Expertise" or visit the Expert Registration page. Submit your professional bio, certifications, domain experience, and identity proof. Our team reviews applications within 24 to 48 hours.'
    },
    {
      id: 8,
      category: 'expert',
      q: 'When and how do experts receive consultation payouts?',
      a: 'Experts can request payouts from their Earnings dashboard at any time. Payouts are processed via direct NEFT/IMPS bank transfer or UPI within 24 business hours.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Search Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-6">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>24/7 Dedicated Support & FAQ</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              How Can We Help You Today?
            </h1>
            <p className="text-slate-300 text-base mb-8">
              Find instant answers to common questions about consultations, wallet recharges, and expert guidance.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search queries (e.g. refund, camera permissions, wallet)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Categories Tabs */}
        <section className="py-8 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedCategory === 'All' ? 'Frequently Asked Questions' : `${categories.find(c => c.id === selectedCategory)?.name}`}
            </h2>
            <span className="text-xs text-slate-500">{filteredFaqs.length} Articles</span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">No matching articles found</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">
                Try searching with different terms or reach out to our support team directly.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div 
                    key={faq.id} 
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 text-sm sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Contact Support Options */}
        <section className="py-16 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Still need help?</h2>
              <p className="text-slate-600 text-sm">
                Our support agents are available around the clock to assist you with any questions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Email Support</h3>
                <p className="text-slate-500 text-xs mb-4">Send a ticket with attachments</p>
                <Link to="/contact" className="text-blue-600 font-bold text-xs sm:text-sm hover:underline">
                  support@ourplatform.com
                </Link>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Helpline Support</h3>
                <p className="text-slate-500 text-xs mb-4">Mon - Sat from 9 AM to 9 PM IST</p>
                <span className="text-emerald-700 font-bold text-xs sm:text-sm">+91 (800) 123-4567</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Contact Form</h3>
                <p className="text-slate-500 text-xs mb-4">Detailed inquiry or feedback</p>
                <Link to="/contact" className="text-purple-600 font-bold text-xs sm:text-sm hover:underline">
                  Open Contact Form &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
