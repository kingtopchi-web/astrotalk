import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Briefcase, Sparkles, Heart, Globe, Zap, Users, 
  MapPin, Clock, ArrowRight, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function Careers() {
  const [selectedDept, setSelectedDept] = useState('All');

  const values = [
    {
      icon: Users,
      title: 'User Obsessed',
      desc: 'We put seekers and experts at the heart of every decision, feature, and line of code.'
    },
    {
      icon: Zap,
      title: 'Move with Urgency',
      desc: 'Speed and agility matter. We experiment, iterate, and deliver real impact continuously.'
    },
    {
      icon: Heart,
      title: 'Integrity & Empathy',
      desc: 'We build with deep respect for diverse disciplines, cultures, and authentic human connection.'
    },
    {
      icon: Globe,
      title: 'Remote-First Culture',
      desc: 'Work from wherever you are most productive. We value results, clarity, and autonomous execution.'
    }
  ];

  const perks = [
    'Competitive compensation & ESOP grants',
    'Comprehensive family health & mental wellness insurance',
    'Generous annual learning & conference stipend',
    'Home office setup & high-spec laptop allowance',
    'Flexible paid time off & parental leave',
    'Regular team meetups and company offsites'
  ];

  const jobs = [
    {
      id: 1,
      title: 'Senior Full Stack Engineer (MERN / WebRTC)',
      department: 'Engineering',
      location: 'Bengaluru / Remote',
      type: 'Full-time',
      experience: '3 - 6 Years',
      desc: 'Lead real-time audio/video infrastructure scaling using WebRTC, Socket.io, and high-concurrency Node.js microservices.'
    },
    {
      id: 2,
      title: 'Lead Product Designer (UI/UX)',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      experience: '4 - 7 Years',
      desc: 'Design intuitive, frictionless mobile and web consultation experiences for millions of daily active users.'
    },
    {
      id: 3,
      title: 'Growth & Performance Marketing Manager',
      department: 'Marketing',
      location: 'Mumbai / Hybrid',
      type: 'Full-time',
      experience: '3 - 5 Years',
      desc: 'Drive organic and paid user acquisition across consumer verticals including astrology, tech mentoring, and career coaching.'
    },
    {
      id: 4,
      title: 'Expert Onboarding & Quality Lead',
      department: 'Operations',
      location: 'Noida / Remote',
      type: 'Full-time',
      experience: '2 - 4 Years',
      desc: 'Curate, interview, and verify top-tier industry advisors, coaches, and astrologers joining our ecosystem.'
    },
    {
      id: 5,
      title: 'Senior DevOps / Cloud Security Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: '4 - 8 Years',
      desc: 'Maintain high availability, zero-downtime CI/CD pipelines, AWS/GCP clusters, and bank-grade data security standards.'
    }
  ];

  const departments = ['All', 'Engineering', 'Design', 'Marketing', 'Operations'];

  const filteredJobs = selectedDept === 'All' 
    ? jobs 
    : jobs.filter(j => j.department === selectedDept);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-1 w-full pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>We're Hiring Passionate Builders</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Build the Future of <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                Real-Time Knowledge Sharing
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join a high-growth team reimagining how millions discover guidance, learn from domain masters, and solve life's biggest questions.
            </p>

            <a 
              href="#openings" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <span>View Open Roles</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Culture & Values */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Our Culture & Principles</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              We are a team of curious problem solvers, craftspeople, and thinkers who thrive on building meaningful human impact.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{v.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Perks & Benefits */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Why You'll Love Working Here</h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto">
                Comprehensive benefits designed to support your work, health, and personal growth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-800">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section id="openings" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Open Positions</h2>
              <p className="text-slate-600 text-sm">Find your next role and help shape our next growth chapter.</p>
            </div>

            {/* Department Filter */}
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedDept === dept
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">{job.desc}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.experience}
                    </span>
                  </div>
                </div>

                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>Apply Now</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Spontaneous Application */}
          <div className="mt-12 text-center p-8 rounded-2xl bg-slate-100 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Don't see your role?</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              We are always looking for stellar engineers, growth hackers, and operators. Send your resume and portfolio!
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-xs sm:text-sm"
            >
              <span>Email careers@ourplatform.com</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
