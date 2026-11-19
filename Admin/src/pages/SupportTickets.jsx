import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Search, 
  X, 
  Send, 
  Mail, 
  Trash2, 
  RotateCcw, 
  AlertTriangle,
  Calendar,
  User,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

const API = API_BASE_URL;

export default function SupportTickets() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'recycle'
  const [tickets, setTickets] = useState([]);
  const [recycleTickets, setRecycleTickets] = useState([]);
  const [recycleCount, setRecycleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingRecycle, setLoadingRecycle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single Ticket Detail View
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/support/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.tickets) {
        setTickets(res.data.tickets);
        setRecycleCount(res.data.recycleCount || 0);
      } else {
        setTickets(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecycleTickets = async () => {
    setLoadingRecycle(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/support/admin/recycle-bin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecycleTickets(res.data.tickets || []);
      setRecycleCount(res.data.total ?? (res.data.tickets?.length || 0));
    } catch (error) {
      console.error('Failed to fetch recycle bin tickets', error);
    } finally {
      setLoadingRecycle(false);
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingTicket(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/support/tickets/${ticket._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketMessages(res.data.messages);
    } catch (error) {
      console.error('Error fetching ticket details', error);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API}/support/tickets/${selectedTicket._id}/reply`, { message: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketMessages([...ticketMessages, res.data.reply]);
      setReplyText('');
      
      const updatedTickets = tickets.map(t => t._id === selectedTicket._id ? { ...t, status: 'IN_PROGRESS' } : t);
      setTickets(updatedTickets);
      setSelectedTicket({ ...selectedTicket, status: 'IN_PROGRESS' });
    } catch (error) {
      console.error('Error sending reply', error);
      alert('Failed to send reply');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API}/support/admin/tickets/${selectedTicket._id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedTickets = tickets.map(t => t._id === selectedTicket._id ? { ...t, status } : t);
      setTickets(updatedTickets);
      setSelectedTicket({ ...selectedTicket, status });
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteTicket = async (ticket) => {
    const isResolvedOrClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    const confirmMsg = isResolvedOrClosed
      ? `Move resolved ticket "${ticket.ticketId}" to Recycle Bin?\n\nIt will be automatically and permanently deleted after 7 days unless restored.`
      : `Ticket "${ticket.ticketId}" is still ${ticket.status}. Are you sure you want to move it to the Recycle Bin? (Auto-deletes after 7 days)`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/support/tickets/${ticket._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(null);
      fetchTickets();
      if (activeTab === 'recycle') {
        fetchRecycleTickets();
      }
    } catch (error) {
      console.error('Error moving ticket to recycle bin', error);
      alert(error.response?.data?.message || 'Failed to move ticket to recycle bin');
    }
  };

  const handleRestoreTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/support/admin/tickets/${ticketId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecycleTickets();
      fetchTickets();
    } catch (error) {
      console.error('Error restoring ticket', error);
      alert(error.response?.data?.message || 'Failed to restore ticket');
    }
  };

  const handlePermanentDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this ticket and all its messages? This action cannot be undone!')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/support/admin/tickets/${ticketId}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecycleTickets();
    } catch (error) {
      console.error('Error permanently deleting ticket', error);
      alert(error.response?.data?.message || 'Failed to permanently delete ticket');
    }
  };

  const handleEmptyRecycleBin = async () => {
    if (!window.confirm('Are you sure you want to EMPTY the entire Recycle Bin? All deleted tickets will be permanently removed!')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/support/admin/recycle-bin/empty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecycleTickets();
      setRecycleCount(0);
    } catch (error) {
      console.error('Error emptying recycle bin', error);
      alert(error.response?.data?.message || 'Failed to empty recycle bin');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'RESOLVED': case 'CLOSED': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'OPEN': return <AlertCircle size={14} />;
      case 'IN_PROGRESS': return <Clock size={14} />;
      case 'RESOLVED': case 'CLOSED': return <CheckCircle2 size={14} />;
      default: return null;
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.user?.name && t.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRecycleTickets = recycleTickets.filter(t => 
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.user?.name && t.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Support Messages & Tickets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage user queries, dispute resolutions and ticket recycle bin</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/contact-inquiries"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Mail size={15} />
            <span>Website Inquiries</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs: Active Tickets vs Recycle Bin */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('active'); setSelectedTicket(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare size={14} />
            <span>Active Tickets</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'active' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('recycle'); setSelectedTicket(null); fetchRecycleTickets(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recycle'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Trash2 size={14} />
            <span>Recycle Bin (Trash)</span>
            {recycleCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'recycle' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'}`}>
                {recycleCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'recycle' && recycleTickets.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyRecycleBin}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Permanently remove all tickets in Recycle Bin"
          >
            <Trash2 size={13} />
            <span>Empty Recycle Bin</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ACTIVE TICKETS VIEW */}
      {activeTab === 'active' && (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          {/* Tickets List */}
          <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-col flex ${selectedTicket ? 'hidden lg:flex w-1/3' : 'w-full'}`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search tickets by ID, subject, user..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No active tickets found</p>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div 
                    key={ticket._id}
                    onClick={() => openTicketDetails(ticket)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedTicket?._id === ticket._id ? 'bg-blue-50/50 dark:bg-blue-950/40 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400 font-mono">{ticket.ticketId}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 mb-1">{ticket.subject}</h4>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{ticket.user?.name || 'Unknown User'}</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail */}
          {selectedTicket ? (
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedTicket(null)} className="lg:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white p-1">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedTicket.ticketId} • {selectedTicket.category} • By <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTicket.user?.name || 'Unknown User'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                  {selectedTicket.status !== 'CLOSED' && (
                    <button onClick={() => handleUpdateStatus('CLOSED')} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer">
                      Mark Closed
                    </button>
                  )}
                  {selectedTicket.status !== 'RESOLVED' && (
                    <button onClick={() => handleUpdateStatus('RESOLVED')} className="text-xs font-bold px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer">
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket)}
                    className="text-xs font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Move ticket to Recycle Bin (Auto-deleted after 7 days)"
                  >
                    <Trash2 size={13} />
                    <span>Delete to Recycle Bin</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                {/* Initial Description */}
                {selectedTicket.description && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-1">
                      Original Query / Complaint:
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>
                )}

                {loadingTicket ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  ticketMessages.map((msg, index) => {
                    const isAdmin = msg.senderModel === 'Admin';
                    return (
                      <div key={index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isAdmin 
                            ? 'bg-blue-600 text-white rounded-tr-sm shadow-xs' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-xs'
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 mx-1">
                          {isAdmin ? 'You (Admin)' : msg.senderModel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <div className="flex gap-3">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the user..." 
                    className="flex-1 resize-none h-12 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button 
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-12 rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={30} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Select a Ticket to View Thread</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Click any ticket from the left list to review dispute details, reply to client, mark resolved, or move to Recycle Bin.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: RECYCLE BIN VIEW */}
      {activeTab === 'recycle' && (
        <div className="space-y-4">
          {/* Policy Banner */}
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Trash2 size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-rose-950 dark:text-rose-100 flex items-center gap-2">
                  <span>Recycle Bin — 7 Days Auto-Deletion Policy</span>
                  <span className="text-[10px] uppercase font-black bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.2 rounded-full">
                    Auto Clean Active
                  </span>
                </h4>
                <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                  Deleted support tickets are stored in this Recycle Bin for <strong>7 days</strong> before being permanently erased from the database automatically. You can restore any ticket back to Active Tickets or permanently remove it immediately.
                </p>
              </div>
            </div>
            {recycleTickets.length > 0 && (
              <button
                type="button"
                onClick={handleEmptyRecycleBin}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
              >
                Empty Bin
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search Recycle Bin by ID, subject, user..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
            />
          </div>

          {/* Recycle Bin Table / List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {loadingRecycle ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : filteredRecycleTickets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={26} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recycle Bin is Empty</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No deleted tickets in the recycle bin. Tickets deleted after resolution will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      <th className="p-3.5 sm:p-4">Ticket</th>
                      <th className="p-3.5 sm:p-4">User</th>
                      <th className="p-3.5 sm:p-4">Category</th>
                      <th className="p-3.5 sm:p-4">Original Status</th>
                      <th className="p-3.5 sm:p-4">Deleted On</th>
                      <th className="p-3.5 sm:p-4">Auto-Purge Expiry</th>
                      <th className="p-3.5 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredRecycleTickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="font-mono text-xs font-bold text-slate-400 block">{ticket.ticketId}</span>
                          <span className="font-bold text-slate-800 dark:text-white line-clamp-1">{ticket.subject}</span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{ticket.user?.name || 'Unknown User'}</span>
                          <span className="text-[11px] text-slate-400">{ticket.user?.email || '—'}</span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {ticket.category}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)} {ticket.status}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-slate-500 dark:text-slate-400 text-xs">
                          {ticket.deletedAt ? new Date(ticket.deletedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock size={12} className="text-amber-600" />
                            <span>Auto-deletes in {ticket.daysRemaining ?? 7} day(s)</span>
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestoreTicket(ticket._id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Restore ticket to Active Tickets list"
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(ticket._id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Delete permanently right now"
                            >
                              <Trash2 size={12} />
                              <span>Delete Forever</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
