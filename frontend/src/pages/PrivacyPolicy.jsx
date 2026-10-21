import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { Shield, Lock, Eye, FileText, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Effective Date & Last Updated: {lastUpdated}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              How {platformName} collects, stores, protects, and handles your personal information during expert consultations and platform usage.
            </p>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            {/* 1. Introduction */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">01.</span>
                <span>Introduction & Commitment</span>
              </h2>
              <p>
                Welcome to <strong>{platformName}</strong> ("we", "our", or "us"). We are committed to protecting the privacy and personal data of every individual who visits our marketplace, consults with our verified experts, or registers to offer professional advice.
              </p>
              <p className="mt-3">
                This Privacy Policy outlines how your data is collected, processed, and safeguarded in strict compliance with the <em>Digital Personal Data Protection Act (DPDP), 2023</em> and applicable global data protection regulations (such as GDPR).
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">02.</span>
                <span>Information We Collect</span>
              </h2>
              <p className="mb-3">We collect personal information that you provide to us directly or automatically through platform interaction:</p>
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">A. Account Credentials</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Full name, verified email address, hashed passwords, profile photo, and registered mobile phone number.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">B. Expert Verification Records (For Consultants)</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Government identity proofs (PAN/Aadhaar/Passport), professional degrees, certifications, banking details for payouts, and tax identification.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">C. Financial & Transaction Logs</h4>
                  <p className="text-xs sm:text-sm text-slate-600">Wallet balance, top-up receipts, per-minute transaction deduction logs, and Razorpay payment reference IDs (we do NOT store CVVs or card PINs).</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">D. Technical & Device Telemetry</h4>
                  <p className="text-xs sm:text-sm text-slate-600">IP address, browser type, device operating system, network latency for WebRTC call stability, and session duration timestamps.</p>
                </div>
              </div>
            </section>

            {/* 3. Consultation Privacy & Discretion */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">03.</span>
                <span>Consultation Discretion & Call Privacy</span>
              </h2>
              <p>
                We recognize that consultations in areas like mental wellness, astrology, legal advice, and career decisions can be deeply sensitive.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-slate-600">
                <li><strong>Masked Calling:</strong> When you connect via voice or video calls, your personal telephone number is strictly masked and never revealed to the other party.</li>
                <li><strong>No Unauthorized Recordings:</strong> Live audio and video streams via WebRTC are ephemeral and NOT stored on platform servers without explicit prior consent.</li>
                <li><strong>Chat Storage:</strong> Encrypted text chat history is stored so seekers can review recommendations and remedies, accessible only through your authenticated account.</li>
              </ul>
            </section>

            {/* 4. How We Use Your Data */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">04.</span>
                <span>How We Use Your Data</span>
              </h2>
              <p>Your data is used strictly for legitimate operational purposes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Matching you with the most qualified domain specialists.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Managing second-by-second wallet deductions and expert earnings.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Fraud prevention, trust & safety audits, and grievance redressal.</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Sending password recovery tokens and session appointment reminders.</span>
                </div>
              </div>
            </section>

            {/* 5. Data Security & Storage */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">05.</span>
                <span>Security Infrastructure</span>
              </h2>
              <p>
                We employ industry-standard 256-bit SSL encryption for data in transit and AES-256 for data at rest. Access to production databases is strictly restricted by role-based permissions, multi-factor authentication (MFA), and automated intrusion detection.
              </p>
            </section>

            {/* 6. Your Rights & Data Erasure */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-indigo-600 font-mono text-lg">06.</span>
                <span>Your Rights & Account Deletion</span>
              </h2>
              <p>You possess full autonomy over your data:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
                <li>Right to inspect and download your consultation history and billing receipts.</li>
                <li>Right to update or rectify inaccurate profile information.</li>
                <li>Right to request complete account and data erasure ("Right to be Forgotten").</li>
              </ul>
              <p className="mt-3 text-xs sm:text-sm text-slate-500">
                To request data deletion or an archive export, submit a request to <a href={`mailto:${supportEmail}`} className="text-indigo-600 font-semibold">{supportEmail}</a>.
              </p>
            </section>

            {/* 7. Grievance Officer & Contact */}
            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Grievance Redressal & Contact Officer</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                In accordance with Information Technology Act, 2000 and DPDP rules, our designated Grievance Officer can be contacted at:
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>{supportEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  <span>{contactPhone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
