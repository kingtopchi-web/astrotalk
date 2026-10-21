import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { FileText, Scale, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function TermsOfService() {
  const { platformName, supportEmail, contactPhone, address } = usePlatformSettings();

  const lastUpdated = 'October 21, 2026';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero */}
        <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-4">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Effective Date & Last Updated: {lastUpdated}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Please review these terms carefully before creating an account, booking consultations, or offering expertise on {platformName}.
            </p>
          </div>
        </section>

        {/* Terms Container */}
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">

            {/* 1. Acceptance */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">01.</span>
                <span>Acceptance of Terms</span>
              </h2>
              <p>
                By accessing, registering with, or utilizing the services provided by <strong>{platformName}</strong> ("Platform", "we", "us"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not accept these terms, you must discontinue using the platform immediately.
              </p>
            </section>

            {/* 2. Platform Role & Nature of Service */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">02.</span>
                <span>Marketplace Facilitator Role</span>
              </h2>
              <p>
                {platformName} operates solely as a technological marketplace connecting independent seekers ("Clients") with certified independent third-party consultants ("Experts").
              </p>
              <p className="mt-2 text-slate-600 text-sm">
                Experts are independent professionals and are not employees, agents, or partners of {platformName}. While we conduct multi-tier verification of qualifications, opinions, interpretations, and guidance delivered during consultations represent the expert's independent professional judgment.
              </p>
            </section>

            {/* 3. Advisory Disclaimers */}
            <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-950 text-base mb-1">Important Advisory Disclaimers</h3>
                  <ul className="text-xs sm:text-sm text-amber-900 space-y-1.5 list-disc pl-4 mt-2">
                    <li><strong>Medical & Psychiatric Emergencies:</strong> Our consultations do not replace in-person emergency hospital care. If you are experiencing suicidal thoughts or medical distress, please contact emergency helpline services (112 or local emergency psychiatric services) immediately.</li>
                    <li><strong>Astrology & Numerology:</strong> Astrological charts and readings are based on ancient interpretive sciences. They are intended for guidance and entertainment, and should not replace prudent judgment in critical matters.</li>
                    <li><strong>Financial & Legal Matters:</strong> Consultations provide general domain guidance and do not constitute formal courtroom representation or licensed securities solicitation.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Wallet, Billing & Rates */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">03.</span>
                <span>Wallet, Billing & Per-Minute Pricing</span>
              </h2>
              <p>
                Consultations are billed on a pay-per-minute basis as specified on the expert's verified public profile.
              </p>
              <div className="space-y-2 mt-3 text-sm text-slate-600">
                <p>• <strong>Wallet Top-ups:</strong> Users prepay for consultations by topping up their in-app wallet via Razorpay (UPI, Cards, NetBanking).</p>
                <p>• <strong>Second-by-Second Deductions:</strong> When a live chat, audio call, or video session is initiated, the fee is deducted in real-time according to active connected duration.</p>
                <p>• <strong>Minimum Balance:</strong> To initiate a session, your wallet balance must cover at least 3 minutes of the expert's published rate.</p>
              </div>
            </section>

            {/* 5. Cancellation & Refund Policy */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">04.</span>
                <span>Refund & Dispute Resolution</span>
              </h2>
              <p>We are dedicated to fair commerce. You are entitled to a full or pro-rated wallet refund under the following conditions:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
                <li>Immediate technical drop or platform server disconnection within the first 60 seconds.</li>
                <li>Expert is unresponsive, fails to attend a pre-booked scheduled slot, or has persistent audio/video failure.</li>
                <li>Proven breach of professional conduct or abusive behavior reported within 24 hours.</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Disputes can be logged through your order history or by emailing <a href={`mailto:${supportEmail}`} className="text-indigo-600 font-medium">{supportEmail}</a> with your session booking ID.
              </p>
            </section>

            {/* 6. Prohibited Conduct */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">05.</span>
                <span>User & Expert Code of Conduct</span>
              </h2>
              <p>Users and Experts agree NEVER to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
                <li>Solicit or encourage direct offline payments bypassing {platformName} wallet systems.</li>
                <li>Record, screenshot, or publicly post confidential session recordings without express written consent.</li>
                <li>Engage in harassment, verbal abuse, obscene language, or extortion.</li>
                <li>Use automated scripts, bots, or reverse-engineering techniques against our platform APIs.</li>
              </ul>
            </section>

            {/* 7. Limitation of Liability */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">06.</span>
                <span>Limitation of Liability & Jurisdiction</span>
              </h2>
              <p>
                In no event shall {platformName}, its directors, or affiliates be liable for indirect, punitive, or consequential damages resulting from advice received during a session.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                These terms are governed by the laws of India. Any legal dispute or controversy shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
              </p>
            </section>

            {/* Contact for Inquiries */}
            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-1">Questions Regarding Terms?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-3">
                For questions or clarifications regarding our Terms of Service:
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Email: <a href={`mailto:${supportEmail}`} className="text-indigo-600">{supportEmail}</a>
              </p>
              <p className="text-xs text-slate-500 mt-1">{address}</p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
