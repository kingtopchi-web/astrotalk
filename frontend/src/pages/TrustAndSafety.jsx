import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ShieldCheck, Lock, CheckCircle2, UserCheck, AlertCircle, 
  CreditCard, RefreshCw, FileText, HeartHandshake, PhoneCall, ArrowRight
} from 'lucide-react';

export default function TrustAndSafety() {
  const pillars = [
    {
      icon: UserCheck,
      title: 'Rigorous 4-Tier Expert Vetting',
      desc: 'Only the top 5% of applying consultants make it to our platform. We verify academic certificates, professional credentials, government identity (Aadhaar/PAN), and conduct rigorous mock consultation audits.',
      points: [
        'Government ID and background verification',
        'Certified degrees & council registrations verified',
        'Technical & communication skill assessment',
        'Continuous quality monitoring and user rating audits'
      ]
    },
    {
      icon: Lock,
      title: 'Complete Privacy & Encryption',
      desc: 'Your consultations are completely private and strictly between you and your expert. We do not sell your personal data or share your conversation logs with third parties.',
      points: [
        'End-to-end encrypted audio and video streams',
        'Phone number and personal identity masking',
        'No eavesdropping or unapproved session recordings',
        'GDPR and Indian Digital Data Protection (DPDP) compliant'
      ]
    },
    {
      icon: CreditCard,
      title: 'Safe & Transparent Transactions',
      desc: 'Payments are handled through RBI-licensed gateway partners (Razorpay). Enjoy clear per-minute pricing with zero surprise charges or sneaky recurring fees.',
      points: [
        '256-bit SSL encrypted financial transactions',
        'Real-time second-by-second wallet deductions',
        'Instant downloadable invoices for all recharges',
        'Full dispute protection and fraud detection algorithms'
      ]
    },
    {
      icon: RefreshCw,
      title: 'Fair Refund & Satisfaction Guarantee',
      desc: 'If a session gets disrupted due to technical glitches or an unresponsive expert, our automated and human support team ensures you are fairly compensated.',
      points: [
        'Automated wallet credit for early network drops',
        'Dedicated dispute resolution within 24 hours',
        'Full satisfaction reviews on verified complaints',
        'Hassle-free refund back to original source or wallet'
      ]
    }
  ];

  const guidelines = [
    {
      title: 'For Clients & Seekers',
      items: [
        'Always keep consultations respectful and professional.',
        'Do not share sensitive passwords, banking OTPs, or financial secrets.',
        'Respect expert availability and consultation time boundaries.',
        'Report any suspicious or unprofessional behavior immediately.'
      ]
    },
    {
      title: 'For Verified Experts',
      items: [
        'Uphold the highest standard of ethical counsel in your domain.',
        'Never solicit offline direct payments or violate platform exclusivity.',
        'Maintain strict client confidentiality under all circumstances.',
        'Provide constructive, truthful, and empathetic consultation.'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Your Safety & Trust is Our #1 Priority</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Built on Trust. Protected by <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Integrity</span>.
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Discover how we verify experts, safeguard your sensitive conversations, secure transactions, and maintain a respectful consultation ecosystem.
            </p>
          </div>
        </section>

        {/* 4 Pillars of Trust */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Our Trust & Security Architecture</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Every feature on our platform is architected around security, transparency, and client peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{pillar.desc}</p>
                  
                  <ul className="space-y-2.5 border-t border-slate-100 pt-5">
                    {pillar.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Community Standards & Code of Conduct */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Community Standards & Fair Play</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm">
                Both clients and experts agree to adhere to our strict community guidelines for mutual respect and safe engagement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {guidelines.map((group, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-indigo-600" />
                    <span>{group.title}</span>
                  </h3>
                  <ul className="space-y-3">
                    {group.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-amber-50 rounded-2xl p-6 border border-amber-200/80 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-sm text-amber-900 text-center sm:text-left flex-1">
                <span className="font-bold">Zero Tolerance Policy:</span> Harassment, discriminatory language, fraud, impersonation, or solicitation of off-platform illegal activities will result in immediate permanent account termination and legal action.
              </div>
              <Link 
                to="/contact" 
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Report a Violation
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-10 sm:p-14 text-white shadow-xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Have questions regarding our safety protocols?</h2>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8 text-base">
              Our trust & safety compliance team is here 24/7 to answer security questions, verify credentials, and assist you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>Contact Trust & Safety</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/help-center" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20"
              >
                <span>Visit Help Center</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
