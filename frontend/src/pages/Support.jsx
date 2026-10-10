import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';
import { HelpCircle, Search, MessageSquare, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';

import { createSocket } from '../utils/socket';

function Support() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('faq');
  const [articles, setArticles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Other', priority: 'MEDIUM', description: '' });

  // Ticket Detail View state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Use a ref to access the latest selectedTicket inside the socket listener without recreating the listener
  const selectedTicketRef = React.useRef(selectedTicket);
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    fetchData();
    
    // Socket setup for dynamic ticket updates
    const socket = createSocket();
    
    if (socket && user) {
      socket.emit('join_user', user._id);
      
      const handleTicketReply = (data) => {
        // Also fetch tickets to update status/last message in the list
        fetchData();
        
        // If we have a ticket selected and it's the one that got a reply
        if (data.ticketId && selectedTicketRef.current && selectedTicketRef.current._id === data.ticketId) {
          setTicketMessages(prev => [...prev, data.reply]);
        }
      };
      
      socket.on('receive_ticket_reply', handleTicketReply);
      
      return () => {
        socket.off('receive_ticket_reply', handleTicketReply);
      };
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [articlesRes, ticketsRes] = await Promise.all([
        axios.get('https://astrotalk-hlg2.onrender.com/api/support/articles'),
        axios.get('https://astrotalk-hlg2.onrender.com/api/support/tickets', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setArticles(articlesRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch support data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://astrotalk-hlg2.onrender.com/api/support/tickets', newTicket, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewTicket({ subject: '', category: 'Other', priority: 'MEDIUM', description: '' });
      fetchData(); // Refresh tickets
      setActiveTab('tickets');
    } catch (error) {
      console.error('Error creating ticket', error);
      alert(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/support/tickets/${ticket._id}`, {
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
      const token = localStorage.getItem('token');
      const res = await axios.post(`https://astrotalk-hlg2.onrender.com/api/support/tickets/${selectedTicket._id}/reply`, { message: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketMessages([...ticketMessages, res.data.reply]);
      setReplyText('');
      
      // Update ticket status in list if it was closed
      const updatedTickets = tickets.map(t => t._id === selectedTicket._id ? { ...t, status: 'OPEN' } : t);
      setTickets(updatedTickets);
      setSelectedTicket({ ...selectedTicket, status: 'OPEN' });
    } catch (error) {
      console.error('Error sending reply', error);
      alert('Failed to send reply');
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'IN_PROGRESS': return 'text-primary bg-primary/10 border-blue-200';
      case 'RESOLVED': case 'CLOSED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-on-surface/80 bg-surface-light border-border-color';
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

  if (loading) {
    return (
      <UserLayout title="Help & Support" subtitle="We're here to help you">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Help & Support" subtitle="Find answers or contact our support team">
      
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 mb-8 text-center text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-surface opacity-5"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-surface opacity-5"></div>
        
        <h2 className="text-3xl font-bold mb-4 relative z-10">How can we help you today?</h2>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-on-surface/50" size={20} />
            <input 
              type="text" 
              placeholder="Search for articles, guides, or keywords..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveTab('faq');
              }}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-on-surface placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 text-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-2 flex flex-col gap-1 sticky top-24">
            <button 
              onClick={() => {setActiveTab('faq'); setSelectedTicket(null);}} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left ${activeTab === 'faq' ? 'bg-primary/10 text-primary' : 'text-on-surface/80 hover:bg-surface-light'}`}
            >
              <HelpCircle size={18} className={activeTab === 'faq' ? 'text-primary' : 'text-on-surface/50'} />
              FAQs & Guides
            </button>
            <button 
              onClick={() => {setActiveTab('tickets'); setSelectedTicket(null);}} 
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-colors text-left ${activeTab === 'tickets' ? 'bg-primary/10 text-primary' : 'text-on-surface/80 hover:bg-surface-light'}`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className={activeTab === 'tickets' ? 'text-primary' : 'text-on-surface/50'} />
                My Tickets
              </div>
              {tickets.filter(t => t.status === 'OPEN').length > 0 && (
                <span className="bg-primary text-background text-xs px-2 py-0.5 rounded-full font-bold">
                  {tickets.filter(t => t.status === 'OPEN').length}
                </span>
              )}
            </button>
            
            <div className="mt-4 p-4 border-t border-border-color">
              <p className="text-xs text-on-surface/60 mb-3 text-center">Can't find what you need?</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-background px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                <Plus size={16} /> Open a Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* FAQs View */}
          {activeTab === 'faq' && !selectedTicket && (
            <div className="space-y-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border border-border-color">
                  <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-on-surface">No articles found</h3>
                  <p className="text-on-surface/60">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredArticles.map(article => (
                    <div key={article._id} className="bg-surface rounded-2xl p-6 border border-border-color shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{article.category}</div>
                      <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-on-surface/80 text-sm line-clamp-3 leading-relaxed">{article.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tickets List View */}
          {activeTab === 'tickets' && !selectedTicket && (
            <div className="bg-surface rounded-2xl border border-border-color shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border-color flex justify-between items-center">
                <h3 className="text-lg font-bold text-on-surface">Support Tickets</h3>
                <button onClick={() => setIsModalOpen(true)} className="text-sm font-bold text-primary hover:text-primary flex items-center gap-1">
                  <Plus size={16} /> New Ticket
                </button>
              </div>
              
              {tickets.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-on-surface">No support tickets</h3>
                  <p className="text-on-surface/60 text-sm mt-1 mb-4">You haven't opened any support tickets yet.</p>
                  <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-light text-background font-bold py-2 px-6 rounded-xl transition-colors">
                    Create Ticket
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket._id} 
                      onClick={() => openTicketDetails(ticket)}
                      className="p-4 sm:p-6 hover:bg-surface-light transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold text-on-surface/50">#{ticket._id.slice(-6).toUpperCase()}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-on-surface/60 bg-surface-light px-2.5 py-1 rounded-full">
                            {ticket.category}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-on-surface">{ticket.subject}</h4>
                        <p className="text-sm text-on-surface/60 mt-1">Updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="text-on-surface/50 hidden sm:block" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Single Ticket Detail View */}
          {selectedTicket && (
            <div className="flex flex-col h-[600px] bg-surface rounded-2xl border border-border-color shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-border-color flex items-center justify-between bg-surface-light/50">
                <div>
                  <button 
                    onClick={() => setSelectedTicket(null)} 
                    className="text-sm font-semibold text-on-surface/60 hover:text-on-surface mb-2 flex items-center gap-1"
                  >
                    ← Back to tickets
                  </button>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-on-surface">{selectedTicket.subject}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusIcon(selectedTicket.status)} {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface/60">Ticket #{selectedTicket._id.slice(-6).toUpperCase()} • {selectedTicket.category}</p>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-surface-light space-y-6">
                {loadingTicket ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {ticketMessages.map((msg, index) => {
                      const isMe = msg.sender === user._id;
                      return (
                        <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${Number(
                            isMe ? 'bg-primary text-background rounded-tr-sm' : 'bg-surface border border-border-color text-on-surface rounded-tl-sm shadow-sm'
                          ).toFixed(2)}`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                          </div>
                          <span className="text-[11px] text-on-surface/50 font-medium mt-1 mx-1">
                            {isMe ? 'You' : msg.senderModel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>

              {/* Reply Area Disabled for Users */}
              {/* <div className="p-4 bg-surface border-t border-border-color"> ... </div> */}
            </div>
          )}

        </div>
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border-color flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface">Submit a Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface/50 hover:text-on-surface/80 bg-surface-light p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">Subject</label>
                <input 
                  type="text" 
                  required
                  value={newTicket.subject}
                  onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                  placeholder="Brief summary of your issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">Category</label>
                  <select 
                    value={newTicket.category}
                    onChange={e => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:border-blue-500 bg-surface"
                  >
                    <option value="Account">Account Settings</option>
                    <option value="Payments">Billing & Payments</option>
                    <option value="Consultations">Consultation Dispute</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Messages">Messages</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">Priority</label>
                  <select 
                    value={newTicket.priority}
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:border-blue-500 bg-surface"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">Description</label>
                <textarea 
                  required
                  rows="4" 
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" 
                  placeholder="Please describe your issue in detail..."
                ></textarea>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-primary hover:bg-primary-light text-background font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-200">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </UserLayout>
  );
}

export default Support;
