import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Search, MessageSquare, PhoneCall, Video, Wallet, 
  ShieldCheck, Clock, Award, ArrowRight, ChevronDown, 
  HelpCircle, Sparkles, CheckCircle2 
} from 'lucide-react';

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Find Your Ideal Expert',
      desc: 'Browse hundreds of verified specialists in Astrology, Legal, Mental Wellness, Tech, Finance, and Career Coaching. Filter by rating, languages, and pricing.',
      icon: Search,
      badge: 'Step 1'
    },
    {
      num: '02',
      title: 'Select Consultation Mode',
      desc: 'Choose how you want to connect: Live Chat for quick queries, Audio Call for detailed discussion, or HD Video Call for an immersive face-to-face session.',
      icon: Video,
      badge: 'Step 2'
    },
    {
      num: '03',
      title: 'Recharge Wallet Flexibly',
      desc: 'Add funds securely via UPI, NetBanking, Debit/Credit Cards using Razorpay. Enjoy pay-per-minute billing with no hidden fees or locked contracts.',
      icon: Wallet,
      badge: 'Step 3'
    },
    {
      num: '04',
      title: 'Connect & Get Real Guidance',
      desc: 'Instantly connect within seconds or schedule at your convenience. All consultations are end-to-end private and confidential.',
      icon: ShieldCheck,
      badge: 'Step 4'
    }
  ];

  const modes = [
    {
      title: 'Live Chat',
      price: 'From ₹10 / min',
      icon: MessageSquare,
      color: 'from-blue-600 to-indigo-600',
      desc: 'Fast, discreet text consultation. Share messages and queries on the go without noise.',
      perks: ['Instant responses', 'Chat history saved', 'Upload relevant notes/charts']
    },
    {
      title: 'Audio Call',
      price: 'From ₹15 / min',
      icon: PhoneCall,
      color: 'from-emerald-600 to-teal-600',
      desc: 'High-clarity voice calls for personalized advice and in-depth problem solving.',
      perks: ['Ultra-low latency', 'Hands-free discussion', 'Complete anonymity']
    },
    {
      title: 'HD Video Call',
      price: 'From ₹25 / min',
      icon: Video,
      color: 'from-amber-500 to-orange-600',
      desc: 'Face-to-face consultation built on WebRTC peer-to-peer technology for highest trust.',
      perks: ['Face-to-face interaction', 'Screen sharing capable', 'Personalized guidance']
    }
  ];

  const faqs = [
    {
      q: 'How are experts verified on ExpertHub?',
      a: 'Every consultant undergoes strict multi-step vetting: identity checks (Aadhaar/PAN), educational degree and certification validation, professional experience review, and background screenings before receiving platform approval.'
    },
    {
      q: 'How does per-minute billing work?',
      a: 'You only pay for the exact time you spend consulting. The timer starts only when the expert joins the call or accepts your chat. If your session ends early, unused wallet balance remains 100% yours.'
    },
    {
      q: 'What if I face network issues or a disconnected call?',
      a: 'Our smart billing system automatically pauses charges if a disconnection occurs. You can also raise an instant ticket from the Support page for auto-refund evaluation.'
    },
    {
      q: 'Is my personal information and consultation private?',
      a: 'Yes, 100%. All chats, calls, and videos are encrypted. Experts never see your phone number or financial details.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-20">
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200/80 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
              <Sparkles size={14} className="text-blue-600" />
              <span>Simple 4-Step Process</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ExpertHub</span> Works
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
              Connect with India’s top certified astrologers, legal counselors, career coaches, and industry consultants in just a few taps.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link 
                to="/experts" 
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Find an Expert <ArrowRight size={18} />
              </Link>
              <Link 
                to="/expert/register" 
                className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-xs transition-all"
              >
                Join as an Expert
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Steps Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Step-by-Step Experience</h2>
            <p className="text-slate-500 mt-2">Transparent, private, and instantaneous consultation from anywhere.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div 
                  key={i} 
                  className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {st.badge}
                      </span>
                      <span className="text-3xl font-black text-slate-200 group-hover:text-blue-500/30 transition-colors">
                        {st.num}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{st.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Consultation Modes */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                Choose Your Medium
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">Three Ways to Consult</h2>
              <p className="text-slate-500 mt-2 max-w-xl mx-auto">Pick whichever mode fits your comfort level, schedule, and depth of consultation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modes.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div 
                    key={idx}
                    className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${m.color} text-white flex items-center justify-center mb-6 shadow-md`}>
                        <Icon size={28} />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-slate-900">{m.title}</h3>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                          {m.price}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-6">{m.desc}</p>
                      
                      <div className="space-y-2.5 pt-4 border-t border-slate-200/80">
                        {m.perks.map((p, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link 
                      to="/experts" 
                      className="mt-8 w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl text-center shadow-xs transition-all block"
                    >
                      Browse {m.title} Experts
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-500 mt-2">Everything you need to know about getting started.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4.5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">{f.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
