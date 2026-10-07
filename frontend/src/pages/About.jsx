import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Target, Lightbulb, Shield, Clock, Users, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans overflow-x-hidden">
      <Header />
      
      <main className="flex-1 w-full pt-20">
        
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
          {/* Abstract background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-1/2 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-6">
              <Zap size={16} />
              <span>NextGood Technologies</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Knowledge</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              We bridge the gap between ambitious seekers and industry-leading experts. A modern platform built to make professional consultation accessible, reliable, and effortless.
            </p>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="group relative bg-white p-10 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                  <Target size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
                  <Target className="text-blue-600" size={28} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  To democratize access to high-quality mentorship and professional advice. We believe everyone deserves the opportunity to learn from the best in the industry, regardless of their background or location.
                </p>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-900 to-indigo-950 p-10 rounded-3xl shadow-lg border border-slate-800 hover:shadow-2xl transition-all duration-300 overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:-scale-110 group-hover:-rotate-12 duration-500">
                  <Lightbulb size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm">
                  <Lightbulb className="text-blue-300" size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Our Vision</h2>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Creating a global network where knowledge flows seamlessly. ExpertHub empowers professionals to monetize their expertise while providing seekers with the clarity they need to make better decisions.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Why Choose ExpertHub?</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">We've built a platform that puts quality, security, and convenience at the forefront of every interaction.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Shield size={32} />, title: "Verified Experts", desc: "Every professional on our platform is rigorously vetted to ensure top-tier quality and reliability.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { icon: <Clock size={32} />, title: "Flexible Scheduling", desc: "Book sessions seamlessly at your convenience with our integrated calendar management.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { icon: <Users size={32} />, title: "1-on-1 Sessions", desc: "Get undivided attention through secure, high-quality video consultations tailored to your needs.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
              ].map((feature, idx) => (
                <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} border ${feature.border}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
