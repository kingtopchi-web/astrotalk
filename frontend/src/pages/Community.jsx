import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Users, MessageCircle, Heart, Sparkles, Award, 
  Calendar, ArrowRight, ShieldAlert, CheckCircle2, Star 
} from 'lucide-react';

export default function Community() {
  const circles = [
    {
      title: 'Vedic Astrology & Planetary Insights',
      members: '42,500+ Members',
      topics: 'Transits, Kundali discussions, gemstone recommendations, planetary remedies',
      tag: 'Astrology',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      title: 'Mindfulness & Emotional Wellbeing',
      members: '28,100+ Members',
      topics: 'Daily stress relief, cognitive habits, breathing exercises, therapist Q&As',
      tag: 'Wellness',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Tech Careers & Engineering Mentorship',
      members: '35,400+ Members',
      topics: 'System design, interview prep, remote job negotiations, code reviews',
      tag: 'Career & Tech',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Founders, Startups & Legal Advisory',
      members: '19,800+ Members',
      topics: 'Cap-table planning, trademark filing, term-sheet breakdown, early hiring',
      tag: 'Business',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  const events = [
    {
      title: 'Live AMA: Career Pivots in the Age of Generative AI',
      expert: 'Dr. Sarah Jenkins (Tech Advisor)',
      date: 'This Thursday, 7:00 PM IST',
      attendees: '450+ Registered',
      mode: 'Live Video Broadcast'
    },
    {
      title: 'Understanding Saturn Retrograde: Insights for Your Sign',
      expert: 'Pandit Ravi Sharma (Senior Astrologer)',
      date: 'Saturday, 6:00 PM IST',
      attendees: '1,200+ Registered',
      mode: 'Interactive Audio Room'
    },
    {
      title: 'Work-Life Balance for Remote High-Performers',
      expert: 'Emily Rodriguez (Clinical Counselor)',
      date: 'Sunday, 11:00 AM IST',
      attendees: '380+ Registered',
      mode: 'Live Workshop'
    }
  ];

  const rules = [
    {
      title: 'Foster Respect & Kindness',
      desc: 'Treat every seeker and mentor with courtesy. Constructive disagreement is welcome; harassment, hate speech, and derogatory remarks are not tolerated.'
    },
    {
      title: 'No Spam or Unsolicited Promotion',
      desc: 'Do not post self-promotional affiliate links, pyramid schemes, or unsolicited commercial offers in discussion threads.'
    },
    {
      title: 'Protect Personal Privacy',
      desc: 'Never post personal contact details, private phone numbers, passwords, or confidential consultation notes on public boards.'
    },
    {
      title: 'Quality & Value-Driven Contributions',
      desc: 'Share genuine experiences, thoughtful queries, and constructive answers that help other members navigate their challenges.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Over 120,000+ Community Members</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Learn, Connect & Grow with <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-pink-300">
                A Thriving Global Community
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join focused knowledge circles, attend live expert AMAs, exchange experiences, and discover mentors who guide your journey.
            </p>

            <Link 
              to="/experts" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <span>Explore Top Mentors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Knowledge Circles */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Community Knowledge Circles</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              Participate in vibrant domain hubs moderated by accredited experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {circles.map((circle, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${circle.color}`}>
                      {circle.tag}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{circle.members}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{circle.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{circle.topics}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-semibold">Active discussions happening now</span>
                  <Link 
                    to="/experts" 
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-indigo-600"
                  >
                    <span>View Experts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Live AMAs & Events */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Free Community Sessions</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Upcoming Live Expert AMAs</h2>
              </div>
              <p className="text-slate-600 text-sm max-w-md">
                Attend interactive group sessions, ask real-time questions, and learn alongside peers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="inline-block px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
                      {event.mode}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-xs mb-4">Host: {event.expert}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{event.date}</span>
                      <span>{event.attendees}</span>
                    </div>
                    <Link 
                      to="/contact" 
                      className="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center transition-colors text-xs"
                    >
                      Reserve Free Spot
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Our Code of Conduct</h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Our standards keep our community welcoming, constructive, and safe for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rules.map((rule, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">{rule.title}</h3>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed pl-7">{rule.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-indigo-950 text-base mb-1">Notice a violation?</h3>
            <p className="text-xs sm:text-sm text-indigo-800 mb-4">
              Help us maintain community health. You can flag inappropriate comments or message our moderation team anytime.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs transition-colors hover:bg-indigo-700"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Contact Moderation Team</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
