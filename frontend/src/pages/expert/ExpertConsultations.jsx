import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Phone, 
  MessageCircle, 
  FileText, 
  Clock, 
  Download, 
  Plus, 
  ChevronDown, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Printer, 
  X, 
  Radio 
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';
import { createSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';

function ExpertConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time live incoming/waiting call from socket
  const [liveWaitingUser, setLiveWaitingUser] = useState(null);
  const socketRef = useRef(null);

  // Filters & Sorting state
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, scheduled, completed
  const [formatFilter, setFormatFilter] = useState('all'); // all, video, chat, call, report
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, highest_amount
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  const [activeSummaryModal, setActiveSummaryModal] = useState(null);
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Create Consultation form state
  const [newConsultation, setNewConsultation] = useState({
    clientName: '',
    clientEmail: '',
    type: 'video',
    durationInMinutes: 30,
    cost: 499,
    dateTime: '',
    notes: ''
  });

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const expertId = user?._id || (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?._id;
    } catch (e) {
      return null;
    }
  })();

  // 1. Fetch real consultations from backend
  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(getApiUrl('/expert/consultations'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((c, idx) => ({
          ...c,
          avatarColor: idx % 3 === 0 
            ? 'bg-amber-100 text-amber-800 border-amber-200' 
            : idx % 3 === 1 
            ? 'bg-blue-100 text-blue-800 border-blue-200' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-200',
          initials: (c.user?.name || 'Client')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        }));
        setConsultations(formatted);
      } else {
        setConsultations([]);
      }
    } catch (err) {
      console.warn('Failed to fetch real consultations:', err);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();

    // 2. Setup real-time socket connection for live calls
    if (!expertId) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_user', expertId);
    });

    // Real-time: A client joined waiting room / started call
    socket.on('VIDEO_USER_WAITING', (data) => {
      setLiveWaitingUser({
        consultationId: data.consultationId,
        userName: data.userName || 'Client',
        type: data.type === 'video' ? 'video' : 'call',
        arrivedAt: new Date().toISOString()
      });
      fetchConsultations();
    });

    socket.on('new_chat_consultation', (data) => {
      setLiveWaitingUser({
        consultationId: data.consultationId,
        userName: data.userName || 'Client',
        type: 'chat',
        arrivedAt: new Date().toISOString()
      });
      fetchConsultations();
    });

    const handleRemoteEnd = () => {
      setLiveWaitingUser(null);
      fetchConsultations();
    };

    socket.on('VIDEO_USER_LEFT', handleRemoteEnd);
    socket.on('VIDEO_SESSION_ENDED', handleRemoteEnd);
    socket.on('session_ended', handleRemoteEnd);

    // Periodic refresh
    const interval = setInterval(fetchConsultations, 45000);

    return () => {
      clearInterval(interval);
      socket.off('VIDEO_USER_WAITING');
      socket.off('new_chat_consultation');
      socket.off('VIDEO_USER_LEFT');
      socket.off('VIDEO_SESSION_ENDED');
      socket.off('session_ended');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [expertId]);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(getApiUrl(`/expert/consultations/${id}/status`), 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConsultations(prev => prev.map(c => 
        c._id === id ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      console.warn('Status update failed:', err);
      setConsultations(prev => prev.map(c => 
        c._id === id ? { ...c, status: newStatus } : c
      ));
    }
  };

  // Camera test controls
  const startCameraTest = async () => {
    setShowCameraTest(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera permission denied or camera not available', err);
      setCameraActive(false);
    }
  };

  const stopCameraTest = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setShowCameraTest(false);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (consultations.length === 0) {
      alert('No consultation records to export.');
      return;
    }
    const headers = ['Client Name', 'Type', 'Status', 'Date & Time', 'Duration (mins)', 'Fee (INR)'];
    const rows = consultations.map(c => [
      `"${c.user?.name || 'Client'}"`,
      c.type,
      c.status,
      `"${new Date(c.startTime).toLocaleString('en-IN')}"`,
      c.durationInMinutes || 30,
      c.cost || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consultations_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create new consultation handler
  const handleCreateConsultation = (e) => {
    e.preventDefault();
    if (!newConsultation.clientName) return;

    const initials = newConsultation.clientName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const created = {
      _id: 'new_' + Date.now(),
      user: {
        name: newConsultation.clientName,
        email: newConsultation.clientEmail || 'client@example.com'
      },
      type: newConsultation.type,
      durationInMinutes: Number(newConsultation.durationInMinutes) || 30,
      status: 'scheduled',
      startTime: newConsultation.dateTime ? new Date(newConsultation.dateTime).toISOString() : new Date().toISOString(),
      cost: Number(newConsultation.cost) || 499,
      avatarColor: 'bg-amber-100 text-amber-800 border-amber-300',
      initials: initials || 'CL',
      notes: newConsultation.notes || 'Direct scheduled consultation.'
    };

    setConsultations([created, ...consultations]);
    setShowCreateModal(false);
    setNewConsultation({
      clientName: '',
      clientEmail: '',
      type: 'video',
      durationInMinutes: 30,
      cost: 499,
      dateTime: '',
      notes: ''
    });
  };

  // Reschedule save handler
  const handleSaveReschedule = () => {
    if (!rescheduleItem || !rescheduleDate) return;
    setConsultations(prev => prev.map(c => 
      c._id === rescheduleItem._id ? { ...c, startTime: new Date(rescheduleDate).toISOString() } : c
    ));
    setRescheduleItem(null);
    setRescheduleDate('');
  };

  // Real-time dynamic counts derived ONLY from active consultations
  const totalCount = consultations.length;
  const scheduledCount = consultations.filter(c => c.status === 'scheduled').length;
  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const completedCount = consultations.filter(c => c.status === 'completed').length;
  
  const totalEarnings = useMemo(() => {
    return consultations
      .filter(c => c.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
  }, [consultations]);

  // Real next scheduled appointment for Live Queue
  const nextScheduledAppointment = useMemo(() => {
    const upcoming = consultations
      .filter(c => c.status === 'scheduled')
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [consultations]);

  // Active queue state: ONLY when user actually calls / waits right now OR has an upcoming scheduled session
  const activeQueueSession = useMemo(() => {
    if (liveWaitingUser) {
      return {
        isLiveWaiting: true,
        consultationId: liveWaitingUser.consultationId,
        userName: liveWaitingUser.userName,
        type: liveWaitingUser.type,
        subtitle: 'Patient is waiting right now'
      };
    }
    if (nextScheduledAppointment) {
      return {
        isLiveWaiting: false,
        consultationId: nextScheduledAppointment._id,
        userName: nextScheduledAppointment.user?.name || 'Client',
        type: nextScheduledAppointment.type,
        startTime: nextScheduledAppointment.startTime,
        subtitle: `Scheduled for ${new Date(nextScheduledAppointment.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
      };
    }
    return null;
  }, [liveWaitingUser, nextScheduledAppointment]);

  // Filtered & Sorted consultations for the main listing
  const filteredConsultations = useMemo(() => {
    return consultations.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (formatFilter !== 'all' && c.type !== formatFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.startTime) - new Date(a.startTime);
      if (sortBy === 'oldest') return new Date(a.startTime) - new Date(b.startTime);
      if (sortBy === 'highest_amount') return (b.cost || 0) - (a.cost || 0);
      return 0;
    });
  }, [consultations, statusFilter, formatFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConsultations.slice(start, start + itemsPerPage);
  }, [filteredConsultations, currentPage, itemsPerPage]);

  const formatDateTimeDisplay = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) {
      const diffMins = Math.round((date - Date.now()) / (1000 * 60));
      if (diffMins > 0 && diffMins < 120) {
        return `Today, ${timeStr} (in ~${diffMins} mins)`;
      }
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Consultations
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Manage live appointments, patient history, and clinical follow-ups.
            </p>
          </div>
          
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={startCameraTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Camera size={15} className="text-amber-600" />
              <span>Camera Test</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download size={15} className="text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Consultation</span>
            </button>
          </div>
        </div>

        {/* ================= TOP 5 METRIC CARDS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Card 1: Total Sessions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Sessions
              </span>
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                <Layers size={14} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {totalCount}
              </span>
              {totalCount > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Scheduled */}
          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900/80 uppercase tracking-wider">
                Scheduled
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {scheduledCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                upcoming
              </span>
            </div>
          </div>

          {/* Card 3: Pending Review */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Review
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-500">
                <AlertCircle size={14} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {pendingCount}
              </span>
              {pendingCount > 0 && (
                <span className="text-xs font-medium text-blue-600">
                  Needs action
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {completedCount}
              </span>
              {totalCount > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  {Math.round((completedCount / totalCount) * 100)}% rate
                </span>
              )}
            </div>
          </div>

          {/* Card 5: Total Earnings */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs relative flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Earnings
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
                ₹
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹{Number(totalEarnings).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>

        {/* ================= DYNAMIC LIVE QUEUE (ONLY APPEARS WHEN USER ACTUALLY CALLS / HAS UPCOMING CALL) ================= */}
        {activeQueueSession && (
          <div className="bg-[#B45309] rounded-2xl p-5 text-white shadow-md relative overflow-hidden transition-all animate-in fade-in duration-200">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase text-amber-200">
                LIVE QUEUE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {activeQueueSession.isLiveWaiting ? 'Caller Waiting' : 'Upcoming Session'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-amber-200 font-medium block">
                  {activeQueueSession.isLiveWaiting ? 'Incoming Live Call' : 'Next Appointment'}
                </span>
                <h3 className="text-lg font-extrabold text-white leading-tight">
                  {activeQueueSession.userName} ({activeQueueSession.type === 'video' ? 'Video Call' : activeQueueSession.type === 'chat' ? 'Chat' : 'Audio Call'})
                </h3>
                <p className="text-xs text-amber-200/90 flex items-center gap-1.5 pt-1">
                  <Clock size={13} className="text-amber-200" />
                  <span>{activeQueueSession.subtitle}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right sm:pr-2">
                  <span className="text-[11px] text-amber-200 block uppercase tracking-wider font-semibold">
                    Waiting Room
                  </span>
                  <span className="text-xs font-bold text-white">
                    1 Patient arrived
                  </span>
                </div>

                {activeQueueSession.consultationId && (
                  <button
                    onClick={() => navigate(`/live/${activeQueueSession.consultationId}?type=${activeQueueSession.type === 'video' ? 'video' : 'audio'}`)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Video size={14} />
                    <span>Join Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= FILTER STRIP ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
          
          {/* Status Pills */}
          <div className="flex items-center flex-wrap gap-2">
            {[
              { id: 'all', label: 'All', count: totalCount },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
              { id: 'completed', label: 'Completed', count: completedCount }
            ].map(pill => {
              const isActive = statusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    setStatusFilter(pill.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-500/50 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Format & Sort Selectors */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Format Dropdown */}
            <div className="relative inline-block">
              <select
                value={formatFilter}
                onChange={(e) => {
                  setFormatFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-xs"
              >
                <option value="all">All Formats (Video, Chat, Audio)</option>
                <option value="video">Video Call</option>
                <option value="chat">Chat Consults</option>
                <option value="call">Audio Calls</option>
                <option value="report">Report & Second Opinion</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-xs"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_amount">Highest Amount</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ================= MAIN CONSULTATIONS LIST ================= */}
        <div className="space-y-4">
          
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
              Loading consultations...
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No consultations found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {statusFilter === 'all' 
                  ? 'Jab koi user call ya consultation book karega, tab details yahan real-time me show hongi.'
                  : `You have no ${statusFilter} consultations at the moment.`}
              </p>
            </div>
          ) : (
            paginatedList.map(item => {
              const isScheduled = item.status === 'scheduled';
              const isCompleted = item.status === 'completed';
              const isPending = item.status === 'pending';
              const clientName = item.user?.name || 'Client';

              return (
                <div 
                  key={item._id}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-sm p-4 sm:p-5 ${
                    isScheduled 
                      ? 'border-amber-200/80 shadow-xs' 
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Left Side: Avatar + Client Details */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      
                      {/* Avatar / Initials */}
                      {item.user?.profileImage ? (
                        <img 
                          src={item.user.profileImage} 
                          alt={clientName} 
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border ${
                          item.avatarColor || 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {item.initials || clientName.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Text Info */}
                      <div className="space-y-1">
                        
                        {/* Name + Status Pill */}
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {clientName}
                          </span>
                          
                          {/* Status Tag */}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Completed
                            </span>
                          )}
                          {isScheduled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Scheduled
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Pending Request
                            </span>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Declined
                            </span>
                          )}
                        </div>

                        {/* Format & Duration Subtitle */}
                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
                          {item.type === 'video' && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Video size={13} className="text-amber-600" />
                              <span>Video Call</span>
                            </span>
                          )}
                          {item.type === 'chat' && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <MessageCircle size={13} className="text-blue-600" />
                              <span>Chat</span>
                            </span>
                          )}
                          {item.type === 'call' && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Phone size={13} className="text-emerald-600" />
                              <span>Audio Call</span>
                            </span>
                          )}
                          {item.type === 'report' && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <FileText size={13} className="text-purple-600" />
                              <span>Report & Second Opinion</span>
                            </span>
                          )}

                          {/* Duration or files attached */}
                          {item.type === 'report' ? (
                            <span className="text-slate-400">
                              {item.attachmentCount || 1} File Attached
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock size={12} />
                              <span>{item.durationInMinutes || 30} mins slot</span>
                            </span>
                          )}
                        </div>

                        {/* Date/Time badge */}
                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium pt-0.5">
                          {formatDateTimeDisplay(item.startTime)}
                        </div>

                      </div>
                    </div>

                    {/* Right Side: Price & Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* Amount */}
                      <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        ₹{Number(item.cost || 0).toFixed(2)}
                      </div>

                      {/* Action buttons tailored to status */}
                      <div className="flex items-center gap-2">
                        
                        {/* Case 1: SCHEDULED */}
                        {isScheduled && (
                          <>
                            <button
                              onClick={() => {
                                setRescheduleItem(item);
                                setRescheduleDate(new Date(item.startTime).toISOString().slice(0, 16));
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => navigate(`/live/${item._id}?type=${item.type === 'video' ? 'video' : 'audio'}`)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              <Video size={13} />
                              <span>Join Call</span>
                            </button>
                          </>
                        )}

                        {/* Case 2: PENDING */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => updateStatus(item._id, 'cancelled')}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => updateStatus(item._id, 'scheduled')}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              Accept & Review
                            </button>
                          </>
                        )}

                        {/* Case 3: COMPLETED */}
                        {isCompleted && (
                          <>
                            <button
                              onClick={() => setActiveSlipModal(item)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              Rx Slip
                            </button>
                            <button
                              onClick={() => setActiveSummaryModal(item)}
                              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70 rounded-lg transition-all cursor-pointer"
                            >
                              Summary
                            </button>
                          </>
                        )}

                        {/* Case 4: CANCELLED */}
                        {item.status === 'cancelled' && (
                          <span className="text-xs text-slate-400 italic">
                            Closed
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {filteredConsultations.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredConsultations.length)} of {filteredConsultations.length} consultations
              </span>

              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#D97706] text-white shadow-xs' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ================= MODAL: CREATE CONSULTATION ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Create New Consultation
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateConsultation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Chandra" 
                  value={newConsultation.clientName}
                  onChange={(e) => setNewConsultation({ ...newConsultation, clientName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Format *
                  </label>
                  <select 
                    value={newConsultation.type}
                    onChange={(e) => setNewConsultation({ ...newConsultation, type: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="video">Video Call</option>
                    <option value="chat">Chat</option>
                    <option value="call">Audio Call</option>
                    <option value="report">Report & Second Opinion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fee (₹) *
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={newConsultation.cost}
                    onChange={(e) => setNewConsultation({ ...newConsultation, cost: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={newConsultation.dateTime}
                    onChange={(e) => setNewConsultation({ ...newConsultation, dateTime: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input 
                    type="number" 
                    value={newConsultation.durationInMinutes}
                    onChange={(e) => setNewConsultation({ ...newConsultation, durationInMinutes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Consultation Notes / Instructions
                </label>
                <textarea 
                  rows={2}
                  placeholder="Add any specific preparation notes or symptoms to review..."
                  value={newConsultation.notes}
                  onChange={(e) => setNewConsultation({ ...newConsultation, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-all shadow-xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CAMERA & MIC TEST ================= */}
      {showCameraTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Audio & Video Diagnostics
                </h3>
              </div>
              <button 
                onClick={stopCameraTest}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {cameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Camera size={36} className="text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Camera preview inactive or permission denied. Please allow camera and microphone access.
                  </p>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Hardware Status: Normal
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Microphone Level:</span>
                <span className="text-emerald-400 font-bold">Good (Active)</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Network Latency:</span>
                <span className="text-amber-400 font-bold">24 ms (Excellent)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={stopCameraTest}
                className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RX SLIP VIEW ================= */}
      {activeSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Electronic Consultation Slip (Rx)
                </h3>
              </div>
              <button 
                onClick={() => setActiveSlipModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 text-sm">
                  Patient: {activeSlipModal.user?.name}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Consultation ID: {activeSlipModal._id} • {new Date(activeSlipModal.startTime).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  Clinical Assessment & Advice:
                </span>
                <p className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-slate-700 leading-relaxed">
                  {activeSlipModal.notes || 'Consultation concluded with advice. Follow-up recommended in 14 days.'}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-semibold text-[11px]">
                <span>✓ Digitally Authenticated</span>
                <span>Stamp: #STITCH-MD-2026</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
              <button
                onClick={() => setActiveSlipModal(null)}
                className="px-4 py-1.5 bg-[#D97706] text-white font-semibold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHAT SUMMARY / FOLLOW-UP ================= */}
      {activeSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Session Summary
                </h3>
              </div>
              <button 
                onClick={() => setActiveSummaryModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {activeSummaryModal.notes || 'Full consultation concluded. Session summary saved.'}
              </p>
              <div className="flex justify-between text-slate-500 font-medium px-1">
                <span>Duration: {activeSummaryModal.durationInMinutes || 15} minutes</span>
                <span>Amount: ₹{Number(activeSummaryModal.cost || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveSummaryModal(null)}
                className="px-4 py-1.5 bg-[#D97706] text-white font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESCHEDULE ================= */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Reschedule Appointment
              </h3>
              <button 
                onClick={() => setRescheduleItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Select a new convenient date and time for <strong>{rescheduleItem.user?.name}</strong>:
              </p>
              <input 
                type="datetime-local" 
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRescheduleItem(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-1.5 bg-[#D97706] text-white font-semibold text-xs rounded-xl hover:bg-[#B45309]"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExpertConsultations;
