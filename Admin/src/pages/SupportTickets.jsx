import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, Search, X, Send } from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setTickets(res.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'RESOLVED': case 'CLOSED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Support Messages & Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user queries and support requests</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Tickets List */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col flex ${selectedTicket ? 'hidden lg:flex w-1/3' : 'w-full'}`}>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-500 text-sm">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket._id}
                  onClick={() => openTicketDetails(ticket)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${selectedTicket?._id === ticket._id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-400">{ticket.ticketId}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{ticket.subject}</h4>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{ticket.user?.name || 'Unknown User'}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTicket(null)} className="lg:hidden text-slate-500 hover:text-slate-800 p-1">
                  <X size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{selectedTicket.subject}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedTicket.ticketId} • {selectedTicket.category} • By {selectedTicket.user?.name || 'Unknown User'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status !== 'CLOSED' && (
                  <button onClick={() => handleUpdateStatus('CLOSED')} className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    Mark Closed
                  </button>
                )}
                {selectedTicket.status !== 'RESOLVED' && (
                  <button onClick={() => handleUpdateStatus('RESOLVED')} className="text-xs font-bold px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors">
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
              {loadingTicket ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                ticketMessages.map((msg, index) => {
                  const isAdmin = msg.senderModel === 'Admin';
                  return (
                    <div key={index} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${Number(
                        isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                      ).toFixed(2)}`}>
                        <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 mx-1">
                        {isAdmin ? 'You (Admin)' : msg.senderModel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-3">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the user..." 
                  className="flex-1 resize-none h-12 py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-sm"
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
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-12 rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
