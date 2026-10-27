import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send,
  Headphones,
  BookOpen,
  FileText,
  Shield,
  ExternalLink,
  ArrowRight,
  LifeBuoy,
  Sparkles,
  PhoneCall,
  Mail,
  Video
} from 'lucide-react';
import { createSocket } from '../utils/socket';
import { getApiUrl } from '../utils/apiConfig';

const POPULAR_SEARCHES = [
  { label: 'Refund Policy', query: 'refund', category: 'Payments & Refunds' },
  { label: 'Consultation Booking', query: 'booking', category: 'Bookings & Calls' },
  { label: 'Expert Verification', query: 'verification', category: 'Account & Safety' },
  { label: 'Call Connection', query: 'audio', category: 'Bookings & Calls' },
  { label: 'Payment Methods', query: 'payment', category: 'Payments & Refunds' }
];

const FAQ_CATEGORIES = [
  'All Questions (18)',
  'Getting Started',
  'Bookings & Calls',
  'Payments & Refunds',
  'Account & Safety'
];

const CURATED_FAQS = [
  {
    id: 1,
    category: 'Bookings & Calls',
    q: 'How do I book an instant consultation with a verified expert?',
    a: 'Simply explore verified experts from the Find Experts page, view their specialized skills, real client reviews, and per-minute consultation rates. Click "Start Chat" or "Book Call" to instantly connect in real time without any waiting.'
  },
  {
    id: 2,
    category: 'Bookings & Calls',
    q: 'What happens if an audio or video call disconnects unexpectedly?',
    a: 'Our smart billing algorithm pauses deductions the exact second a network disruption is detected. If the call cannot be resumed, any unused minutes remain safely in your wallet balance. You can also contact support for an immediate credit adjustment.'
  },
  {
    id: 3,
    category: 'Payments & Refunds',
    q: "How does the 100% refund guarantee work if I'm unsatisfied?",
    a: 'If an expert fails to join, cancels prematurely, or you experience critical technical connection issues, you can submit a dispute from My Appointments or open a ticket. Our dispute resolution team verifies system logs and processes full refunds within 24 hours.'
  },
  {
    id: 4,
    category: 'Account & Safety',
    q: 'How are experts vetted and verified on the platform?',
    a: 'All experts undergo a mandatory 3-stage verification process: government identity verification, domain expertise and certification audit, and a background quality check before receiving the verified badge.'
  },
  {
    id: 5,
    category: 'Account & Safety',
    q: 'Are my personal details and consultations confidential?',
    a: 'Yes, 100%. All chats, voice streams, and video calls are end-to-end encrypted. We never record calls without explicit written consent, and your personal phone number remains completely masked from the expert at all times.'
  },
  {
    id: 6,
    category: 'Getting Started',
    q: 'What is the difference between Chat, Audio Call, and Video Call sessions?',
    a: 'Chat allows real-time text messaging with file sharing. Audio calls provide high-definition voice consultation with zero video distractions. Video calls enable interactive face-to-face consultations, perfect for in-depth evaluations and consultations.'
  },
  {
    id: 7,
    category: 'Getting Started',
    q: 'Are there free consultation services available for new users?',
    a: 'Yes! First-time users can access eligible free consultation minutes with participating verified experts under the "Free Services" section from the top navigation.'
  },
  {
    id: 8,
    category: 'Bookings & Calls',
    q: 'How do I grant microphone and camera permissions for calls?',
    a: 'When starting a video consultation, your browser will prompt: "Allow this website to use your camera and microphone?". Click "Allow". If blocked, tap the lock/padlock icon in your browser URL bar, enable permissions, and refresh the tab.'
  },
  {
    id: 9,
    category: 'Bookings & Calls',
    q: 'Can I schedule a consultation for a future date and time?',
    a: 'Yes. On any expert profile, click "Schedule Session", pick an available calendar slot that fits your schedule, and complete the booking. You will receive SMS, email, and app notifications before the session begins.'
  },
  {
    id: 10,
    category: 'Payments & Refunds',
    q: 'How does per-minute real-time billing deduction work?',
    a: 'Billing is calculated second-by-second during active calls or chat consultations. Deductions happen directly from your prepaid wallet balance based on the published per-minute rate of the expert.'
  },
  {
    id: 11,
    category: 'Payments & Refunds',
    q: 'What payment methods can I use to recharge my wallet?',
    a: 'We support all major payment methods powered by Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards (Visa, MasterCard, RuPay), NetBanking from 50+ banks, and digital wallets.'
  },
  {
    id: 12,
    category: 'Payments & Refunds',
    q: 'How do I download consultation invoices or payment receipts?',
    a: 'Go to Wallet in your dashboard. Under Transaction History, click the "Download Receipt" icon next to any consultation or wallet recharge to get a GST-compliant invoice.'
  },
  {
    id: 13,
    category: 'Account & Safety',
    q: 'How do I reset my password if I forgot it?',
    a: 'Click "Login", then click "Forgot Password". Enter your registered email address to receive an instant password reset link valid for 1 hour.'
  },
  {
    id: 14,
    category: 'Account & Safety',
    q: 'What is the policy against sharing personal phone numbers or links in chat?',
    a: 'To protect user privacy and avoid unauthorized financial transactions, our automated system prevents sharing 10-digit phone numbers and external website links in chat. All consultations must stay protected on the platform.'
  },
  {
    id: 15,
    category: 'Getting Started',
    q: 'How do I leave a review and rating for an expert?',
    a: 'Immediately after concluding a consultation, a rating pop-up will appear allowing you to give 1 to 5 stars and write personal feedback. You can also rate any completed session from My Appointments.'
  },
  {
    id: 16,
    category: 'Bookings & Calls',
    q: 'What should I do if an expert does not join the scheduled session?',
    a: 'If an expert does not join within 5 minutes of the scheduled time, the session is automatically marked as missed, your wallet is not charged, and you can instantly re-book or claim an automatic refund.'
  },
  {
    id: 17,
    category: 'Payments & Refunds',
    q: 'Is there a minimum wallet recharge amount?',
    a: 'The minimum recharge amount is ₹50. There are no hidden fees or expiration dates on your wallet balance — your balance remains available indefinitely until used.'
  },
  {
    id: 18,
    category: 'Account & Safety',
    q: 'How can I update my profile details or delete my account?',
    a: 'Visit Settings from the sidebar to update your name, notification preferences, and security options. For complete account deletion or data wipe, submit a ticket under Account & Safety.'
  }
];

const USER_GUIDES = [
  {
    id: 'g1',
    badge: 'Getting Started',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    title: 'Quick Start Guide for New Clients',
    description: 'Everything you need to find, book, and complete your first 1-on-1 expert call.',
    readTime: '3 min read'
  },
  {
    id: 'g2',
    badge: 'Billing & Rates',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    title: 'Consultation Formats & Invoicing',
    description: 'Understand per-minute rates, fixed packages, and business expense receipts.',
    readTime: '5 min read'
  },
  {
    id: 'g3',
    badge: 'Technical',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
    title: 'Fixing Video & Mic Permissions',
    description: 'Step-by-step permission check on iOS Safari, Chrome, and Android devices.',
    readTime: '2 min read'
  }
];

export default function Support() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('faq'); // 'faq' | 'tickets' | 'contact' | 'guidelines'
  const [selectedCategory, setSelectedCategory] = useState('All Questions (18)');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(1); // default expand 1st item like reference
  
  // Backend data
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ticket creation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Consultations', priority: 'MEDIUM', description: '' });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Ticket detail view
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(false);

  const selectedTicketRef = useRef(selectedTicket);
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axios.get(getApiUrl('/support/tickets'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Could not fetch support tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Socket for real-time ticket replies
    let socket = null;
    try {
      socket = createSocket();
      if (socket && user?._id) {
        socket.emit('join_user', user._id);
        socket.on('receive_ticket_reply', (data) => {
          fetchTickets();
          if (data.ticketId && selectedTicketRef.current && selectedTicketRef.current._id === data.ticketId) {
            setTicketMessages(prev => [...prev, data.reply]);
          }
        });
      }
    } catch (err) {
      console.warn('Socket warning:', err);
    }

    return () => {
      if (socket) {
        socket.off('receive_ticket_reply');
        socket.disconnect();
      }
    };
  }, [user]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmittingTicket(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('/support/tickets'), newTicket, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewTicket({ subject: '', category: 'Consultations', priority: 'MEDIUM', description: '' });
      await fetchTickets();
      setActiveNav('tickets');
    } catch (error) {
      console.error('Error creating ticket', error);
      alert(error.response?.data?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl(`/support/tickets/${ticket._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error fetching ticket details', error);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl(`/support/tickets/${selectedTicket._id}/reply`), { message: replyText.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketMessages(prev => [...prev, res.data.reply]);
      setReplyText('');
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, status: 'OPEN' } : t));
    } catch (error) {
      console.error('Error sending reply', error);
      alert('Failed to send reply');
    }
  };

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;

  // Filter FAQs based on category pill & search query
  const filteredFaqs = CURATED_FAQS.filter(faq => {
    const matchesCategory = 
      selectedCategory === 'All Questions (18)' || 
      faq.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'Payments & Refunds' && faq.category.includes('Payments')) ||
      (selectedCategory === 'Bookings & Calls' && faq.category.includes('Bookings')) ||
      (selectedCategory === 'Account & Safety' && faq.category.includes('Account')) ||
      (selectedCategory === 'Getting Started' && faq.category.includes('Getting'));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'IN_PROGRESS': return 'text-blue-700 bg-blue-50 border-blue-300';
      case 'RESOLVED': case 'CLOSED': return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'OPEN': return <AlertCircle size={13} />;
      case 'IN_PROGRESS': return <Clock size={13} />;
      case 'RESOLVED': case 'CLOSED': return <CheckCircle2 size={13} />;
      default: return null;
    }
  };

  return (
    <UserLayout title="Help & Support" subtitle="Find verified solutions, guides, or contact support">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">

        {/* 1. TOP HERO SECTION */}
        <section className="relative overflow-hidden bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs text-center">
          {/* Subtle warm amber radial glow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-28 bg-amber-400/15 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold mb-4 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-amber-600">support_agent</span>
              <span>Support & Helpdesk</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-slate-900 tracking-tight mb-3">
              How can we help you today?
            </h1>

            {/* Subheading */}
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
              Search for articles, guides, or explore quick verified solutions to all your consultation and account questions.
            </p>

            {/* Search Input Box */}
            <div className="w-full max-w-2xl relative flex items-center mb-4">
              <Search className="absolute left-4 sm:left-5 text-slate-400 pointer-events-none" size={20} />
              
              <input 
                type="text" 
                placeholder="Search for articles, guides, or keywords (e.g. refund, audio issue, booking)..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveNav('faq');
                }}
                className="w-full pl-12 sm:pl-13 pr-10 sm:pr-12 py-3.5 sm:py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-xs sm:text-sm shadow-xs transition-all"
              />

              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="absolute right-4 hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-mono border border-slate-200">
                  ⌘K
                </div>
              )}
            </div>

            {/* Popular Searches Pills */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Popular searches:</span>
              {POPULAR_SEARCHES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(item.query);
                    setSelectedCategory(item.category);
                    setActiveNav('faq');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-amber-100/80 hover:text-amber-900 border border-slate-200/80 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* 2. MAIN LAYOUT: LEFT SIDEBAR + RIGHT CONTENT */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT COLUMN: NAVIGATION MENU & "NEED SPECIFIC HELP?" */}
          <aside className="w-full lg:w-72 shrink-0 space-y-5">
            
            {/* Card 1: Navigation Menu */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex flex-row lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
              <button 
                type="button"
                onClick={() => {
                  setActiveNav('faq');
                  setSelectedTicket(null);
                }} 
                className={`flex-1 lg:w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeNav === 'faq' && !selectedTicket
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-950 shadow-2xs' 
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[20px] ${activeNav === 'faq' ? 'text-amber-600' : 'text-slate-400'}`}>
                    history_edu
                  </span>
                  <span>FAQs & Guides</span>
                </div>
                {activeNav === 'faq' && !selectedTicket && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-2" />
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setActiveNav('tickets');
                  setSelectedTicket(null);
                }} 
                className={`flex-1 lg:w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeNav === 'tickets' || selectedTicket
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-950 shadow-2xs' 
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={18} className={activeNav === 'tickets' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>My Tickets</span>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200/80 ml-2">
                  {openTicketsCount > 0 ? `${openTicketsCount} Open` : `${tickets.length} Total`}
                </span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                }} 
                className={`flex-1 lg:w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer text-slate-700 hover:bg-slate-50 border border-transparent`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-slate-400">mail</span>
                  <span>Contact Support</span>
                </div>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setActiveNav('guidelines');
                  setSelectedTicket(null);
                }} 
                className={`flex-1 lg:w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeNav === 'guidelines'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-950 shadow-2xs' 
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className={activeNav === 'guidelines' ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Platform Guidelines</span>
                </div>
              </button>
            </div>

            {/* Card 2: "NEED SPECIFIC HELP?" Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 flex items-center justify-center mb-3 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>

              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                Need Specific Help?
              </span>

              <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                Can't find what you need?
              </h4>

              <p className="text-xs text-slate-500 leading-relaxed mb-4 px-1">
                Our specialized support team is available 24/7 to resolve consultation and billing issues.
              </p>

              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Plus size={15} /> <span>Open a Ticket</span>
              </button>

              <Link 
                to="/messages" 
                className="inline-flex items-center gap-1.5 mt-3.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Start Live Chat (Avg wait 2m)</span>
              </Link>
            </div>

          </aside>


          {/* RIGHT COLUMN: FAQs, TICKETS OR GUIDELINES */}
          <main className="flex-1 min-w-0">

            {/* VIEW A: FAQs & Guides View */}
            {activeNav === 'faq' && !selectedTicket && (
              <div className="space-y-6">

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {FAQ_CATEGORIES.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-950 shadow-2xs' 
                          : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Frequently Asked Questions Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-heading font-bold text-slate-900">
                        Frequently Asked Questions
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Find direct solutions regarding consultations, audio-video setups, and platform protection.
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap self-start sm:self-auto">
                      Updated 2 days ago
                    </span>
                  </div>

                  {/* FAQ Accordion List */}
                  {filteredFaqs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <HelpCircle size={40} className="mx-auto mb-2 opacity-30 text-amber-500" />
                      <p className="text-sm font-bold text-slate-700">No matching questions found</p>
                      <p className="text-xs text-slate-400 mt-1">Try another search term or click "All Questions"</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All Questions (18)'); }}
                        className="mt-3 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredFaqs.map((faq, index) => {
                        const isExpanded = expandedFaqId === faq.id;
                        return (
                          <div key={faq.id} className="py-3.5 transition-colors">
                            <button
                              type="button"
                              onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-amber-100/80 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <span className={`text-xs sm:text-sm font-bold transition-colors ${
                                  isExpanded ? 'text-amber-900' : 'text-slate-800 group-hover:text-slate-950'
                                }`}>
                                  {faq.q}
                                </span>
                              </div>
                              <ChevronDown 
                                size={18} 
                                className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-amber-600' : 'group-hover:text-slate-600'
                                }`} 
                              />
                            </button>

                            {isExpanded && (
                              <div className="mt-2.5 ml-9 pr-4 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                {/* 3. POPULAR USER GUIDES & TUTORIALS (Matching Screenshot 2) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-amber-600 text-base">📖</span> 
                      <span>Popular User Guides & Tutorials</span>
                    </h3>
                    <button 
                      onClick={() => { setSelectedCategory('All Questions (18)'); setSearchQuery(''); }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer hover:underline"
                    >
                      View all 24 guides &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {USER_GUIDES.map(guide => (
                      <div 
                        key={guide.id}
                        className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] border mb-3 ${guide.badgeColor}`}>
                            {guide.badge}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors mb-2 leading-snug">
                            {guide.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                            {guide.description}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {guide.readTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}


            {/* VIEW B: My Tickets List */}
            {activeNav === 'tickets' && !selectedTicket && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Your Support Tickets</h3>
                    <p className="text-xs text-slate-500">Track and respond to your active inquiries</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus size={15} /> New Ticket
                  </button>
                </div>
                
                {tickets.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <MessageSquare size={44} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
                    <p className="text-slate-500 text-xs mt-1 mb-4 max-w-sm mx-auto">
                      Have a query regarding consultations, refunds, or technical setups? Create a ticket and our 24/7 desk will assist you.
                    </p>
                    <button 
                      onClick={() => setIsModalOpen(true)} 
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-xs"
                    >
                      Create First Ticket
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tickets.map(ticket => (
                      <div 
                        key={ticket._id} 
                        onClick={() => openTicketDetails(ticket)}
                        className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                              #{ticket._id.slice(-6).toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              {ticket.category}
                            </span>
                            {ticket.priority && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                Priority: {ticket.priority}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Last updated {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-700 sm:self-center">
                          <span>View Thread</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* VIEW C: Single Ticket Thread Detail */}
            {selectedTicket && (
              <div className="flex flex-col h-[640px] bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <button 
                      onClick={() => setSelectedTicket(null)} 
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 mb-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Back to all tickets
                    </button>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{selectedTicket.subject}</h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusIcon(selectedTicket.status)} {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ticket #{selectedTicket._id.slice(-6).toUpperCase()} • Category: {selectedTicket.category}
                    </p>
                  </div>
                </div>
                
                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40 space-y-4">
                  {/* Initial Ticket Description */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-slate-800 text-xs sm:text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">Original Issue Description:</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  {loadingTicket ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-500"></div>
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No replies yet. An agent will respond shortly.
                    </div>
                  ) : (
                    ticketMessages.map((msg, index) => {
                      const isMe = msg.sender === user?._id;
                      return (
                        <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            isMe 
                              ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
                            {isMe ? 'You' : (msg.senderModel || 'Support Agent')} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Input Box */}
                <form onSubmit={handleSendReply} className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the support agent..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2.5 sm:px-4 sm:py-2.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={15} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            )}


            {/* VIEW D: Platform Guidelines View */}
            {activeNav === 'guidelines' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="text-amber-500" size={22} />
                    Platform Safety & Community Guidelines
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ensuring fair, verified, and secure consultation standards across India.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">1. Zero Off-Platform Solicitations</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      All communication, payments, and document exchange must take place strictly inside ExpertHub. Exchanging direct phone numbers or personal UPI IDs is strictly prohibited to prevent fraud.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">2. Transparent Per-Minute Billing</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Consultation charges only apply while you are on an active connected call or chat. If network disconnects on either end, seconds are automatically paused and saved.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">3. Privacy & Call Confidentiality</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Neither party's real contact information is revealed. All calls use WebRTC peer security with SSL encryption. Calls are never recorded unless specifically requested for quality audit.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">4. Refund & Dispute Redressal</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Users can file a refund request within 48 hours of any consultation if the expert did not join or technical audio-video issues prevented consultation delivery.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>


        {/* 4. SUBMIT TICKET MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
              
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Open a Support Ticket</h3>
                    <p className="text-[11px] text-slate-400">Our specialized team will assist you within 2-4 hours</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={newTicket.subject}
                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900" 
                    placeholder="E.g. Disconnected call credit refund / Audio mic error"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
                    <select 
                      value={newTicket.category}
                      onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 bg-slate-50 text-xs sm:text-sm text-slate-900"
                    >
                      <option value="Consultations">Consultation Issue</option>
                      <option value="Payments">Billing & Wallet</option>
                      <option value="Account">Account Settings</option>
                      <option value="Technical">Audio/Video Technical</option>
                      <option value="Other">Other Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Priority</label>
                    <select 
                      value={newTicket.priority}
                      onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 bg-slate-50 text-xs sm:text-sm text-slate-900"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Detailed Description</label>
                  <textarea 
                    required
                    rows="4" 
                    value={newTicket.description}
                    onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 resize-none leading-relaxed" 
                    placeholder="Please explain what happened with date, expert name, or booking details if applicable..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingTicket}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                  >
                    {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
