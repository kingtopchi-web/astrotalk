import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createSocket } from '../../utils/socket';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';
import { 
  Send, 
  Search, 
  Check, 
  CheckCheck, 
  MessageSquare, 
  MoreVertical, 
  Phone, 
  Video, 
  ArrowLeft,
  Trash2,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  Paperclip,
  User
} from 'lucide-react';

function ExpertMessages() {
  const outletContext = useOutletContext();
  const { user } = useAuth();
  
  // Safe expert fallback
  const expert = outletContext?.expert || (user?.role === 'EXPERT' ? user : null) || (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [waitingCountdown, setWaitingCountdown] = useState(120);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete & Selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { type: 'single' | 'bulk' | 'clear' | 'conversation', id?: string }
  const [isDeleting, setIsDeleting] = useState(false);

  const isEndingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p.participantId?._id !== expert?._id)?.participantId || null;
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl('/messages/conversations'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
      return res.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (convId) => {
    const targetId = convId || activeConversation?._id;
    if (!targetId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl(`/messages/conversations/${targetId}/messages`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      if (socket) {
        socket.emit('join_conversation', targetId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchActiveChatConsultation = async (userId) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl(`/bookings/active-chat/${userId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const consult = res.data;
      setActiveConsultation(consult);

      if (consult?.chatStarted) {
        setChatStarted(true);
        if (consult.chatStartedAt) {
          const started = new Date(consult.chatStartedAt);
          setSeconds(Math.max(0, Math.floor((new Date() - started) / 1000)));
        } else {
          setSeconds(0);
        }
      } else {
        setChatStarted(false);
        setSeconds(0);
        if (consult?.startTime) {
          const elapsed = Math.floor((new Date() - new Date(consult.startTime)) / 1000);
          setWaitingCountdown(Math.max(0, 120 - elapsed));
        } else {
          setWaitingCountdown(120);
        }
      }
    } catch (err) {
      setActiveConsultation(null);
      setChatStarted(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!expert?._id) return;
    const newSocket = createSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_user', expert._id);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev => prev.map(conv => {
        if (conv._id === msg.conversationId || conv._id === msg.conversation) {
          return { ...conv, lastMessage: msg.text, lastMessageAt: msg.createdAt };
        }
        return conv;
      }));
    });

    newSocket.on('new_chat_consultation', (data) => {
      fetchConversations().then((convs) => {
        const otherUser = getOtherParticipant(activeConversation);
        if (otherUser && (otherUser._id === data.partnerId || otherUser._id === data.consultation?.user)) {
          fetchActiveChatConsultation(otherUser._id);
          fetchMessages(activeConversation?._id);
        } else if (convs) {
          const targetUser = data.partnerId || data.consultation?.user;
          const matchingConv = convs.find(c => {
            const p = c.participants?.find(part => part.participantId?._id !== expert._id)?.participantId?._id;
            return p === targetUser;
          });
          if (matchingConv) {
            setActiveConversation(matchingConv);
          }
        }
      });
    });

    newSocket.on('chat_session_started', (data) => {
      setChatStarted(true);
      setActiveConsultation(prev => prev ? { ...prev, chatStarted: true, chatStartedAt: data.chatStartedAt } : prev);
      setSeconds(0);
    });

    newSocket.on('session_ended', (data) => {
      setActiveConsultation(null);
      setChatStarted(false);
      if (data?.reason) {
        setErrorMessage(data.reason);
      }
    });

    newSocket.on('chat_error', (data) => {
      if (data?.message) {
        setErrorMessage(data.message);
      }
    });

    newSocket.on('messages_read', ({ conversationId, readBy }) => {
      setMessages(prev => prev.map(m => {
        if (m.conversationId === conversationId && m.sender !== readBy) {
          return { ...m, status: 'READ' };
        }
        return m;
      }));
    });

    // Real-time deletion events
    newSocket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('messages_bulk_deleted', ({ messageIds }) => {
      if (Array.isArray(messageIds)) {
        setMessages(prev => prev.filter(m => !messageIds.includes(m._id)));
      }
    });

    newSocket.on('conversation_cleared', ({ conversationId }) => {
      if (activeConversation?._id === conversationId) {
        setMessages([]);
      }
      setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, lastMessage: '', lastMessageAt: null } : c));
    });

    newSocket.on('conversation_deleted', ({ conversationId }) => {
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    });

    return () => newSocket.close();
  }, [expert?._id, activeConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation._id);
    setSelectionMode(false);
    setSelectedMsgIds([]);

    const otherUser = getOtherParticipant(activeConversation);
    if (otherUser) {
      fetchActiveChatConsultation(otherUser._id);
    }
  }, [activeConversation, socket]);

  const isFreeConsultation = Boolean(activeConsultation?.isFree);
  const freeDurationMins = activeConsultation?.freeChatDurationMinutes || activeConsultation?.durationInMinutes || 5;
  const freeTotalAllowedSeconds = freeDurationMins * 60;
  const freeRemainingSeconds = Math.max(0, freeTotalAllowedSeconds - seconds);

  // 1. Initial 2-minute countdown (120 seconds) for expert to reply
  useEffect(() => {
    if (!activeConsultation || chatStarted) return;

    const waitTimer = setInterval(() => {
      setWaitingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(waitTimer);
          if (!isEndingRef.current) {
            isEndingRef.current = true;
            handleEndConsultation(true, 0, 'You did not reply within 2 minutes. The chat session has expired.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(waitTimer);
  }, [activeConsultation, chatStarted]);

  // 2. Timer when chat is active
  useEffect(() => {
    if (!activeConsultation || !chatStarted) return;

    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (isFreeConsultation && next >= freeTotalAllowedSeconds) {
          if (!isEndingRef.current) {
            isEndingRef.current = true;
            setTimeout(() => {
              handleEndConsultation(
                false,
                next,
                `Free chat time limit of ${freeDurationMins} minutes has expired. Session ended.`
              );
            }, 300);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeConsultation, chatStarted, isFreeConsultation, freeTotalAllowedSeconds, freeDurationMins]);

  const handleEndConsultation = async (autoDisconnected = false, finalSecs = null, reason = '') => {
    if (!activeConsultation) return;
    try {
      const token = localStorage.getItem('token');
      const usedSeconds = finalSecs !== null ? finalSecs : (chatStarted ? seconds : 0);
      const actualDuration = chatStarted ? (Number((usedSeconds / 60).toFixed(2)) || 0.01) : 0;

      await axios.post(getApiUrl(`/bookings/${activeConsultation._id}/end`), {
        actualDuration,
        reason: reason || (autoDisconnected ? 'Expert did not reply within 2 minutes' : 'Session ended')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveConsultation(null);
      setChatStarted(false);
      if (reason) setErrorMessage(reason);
    } catch (err) {
      console.error("Error ending consultation", err);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateMessageText = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return { isValid: false, error: 'Message cannot be empty.' };

    if (/\d/.test(trimmed)) {
      return { isValid: false, error: 'Numbers/digits are not allowed in messages. Please type text using alphabets only.' };
    }

    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) || /@/.test(trimmed)) {
      return { isValid: false, error: 'Sharing email addresses or contact information is not allowed.' };
    }

    if (/(https?:\/\/|www\.|\.com|\.in|\.org|\.net|\.io|\.co)/i.test(trimmed)) {
      return { isValid: false, error: 'Sharing links, URLs or websites is not allowed.' };
    }

    const allowedRegex = /^[\p{L}\s.,!?'"\-()]+$/u;
    if (!allowedRegex.test(trimmed)) {
      return { isValid: false, error: 'Only alphabets and basic punctuation are allowed. Numbers, symbols, and special characters cannot be sent.' };
    }

    return { isValid: true };
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversation || !socket || !activeConsultation) return;

    const validation = validateMessageText(inputText);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    const messageData = {
      conversationId: activeConversation._id,
      senderId: expert._id,
      senderModel: 'Expert',
      text: inputText.trim(),
      fileUrl: null
    };

    socket.emit('send_message', messageData);
    setInputText('');
  };

  // Selection & Deletion Handlers
  const handleToggleSelectMessage = (msgId) => {
    setSelectedMsgIds(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSelectAllMessages = () => {
    if (selectedMsgIds.length === messages.length) {
      setSelectedMsgIds([]);
    } else {
      setSelectedMsgIds(messages.map(m => m._id));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    setIsDeleting(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (deleteConfirmModal.type === 'single') {
        await axios.delete(getApiUrl(`/messages/${deleteConfirmModal.id}`), { headers });
        setMessages(prev => prev.filter(m => m._id !== deleteConfirmModal.id));
      } else if (deleteConfirmModal.type === 'bulk') {
        await axios.post(getApiUrl('/messages/bulk-delete'), {
          conversationId: activeConversation._id,
          messageIds: selectedMsgIds
        }, { headers });
        setMessages(prev => prev.filter(m => !selectedMsgIds.includes(m._id)));
        setSelectedMsgIds([]);
        setSelectionMode(false);
      } else if (deleteConfirmModal.type === 'clear') {
        await axios.delete(getApiUrl(`/messages/conversations/${activeConversation._id}/clear`), { headers });
        setMessages([]);
        setConversations(prev => prev.map(c => c._id === activeConversation._id ? { ...c, lastMessage: '', lastMessageAt: null } : c));
      } else if (deleteConfirmModal.type === 'conversation') {
        await axios.delete(getApiUrl(`/messages/conversations/${activeConversation._id}`), { headers });
        setConversations(prev => prev.filter(c => c._id !== activeConversation._id));
        setActiveConversation(null);
        setMessages([]);
      }
      setDeleteConfirmModal(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm.trim()) return true;
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden flex h-[calc(100vh-100px)] min-h-[580px] relative w-full">
      
      {/* Conversations Sidebar (Full width on mobile when no chat open, hidden when chat open) */}
      <div className={`w-full md:w-80 lg:w-[320px] border-r border-slate-150 flex-col bg-white shrink-0 h-full ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 sm:p-5 pb-3 bg-white">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-100/80 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-white border border-transparent focus:border-amber-400 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
              <MessageSquare size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Clients will reach out to you here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map(conv => {
                const other = getOtherParticipant(conv);
                const isSelected = activeConversation?._id === conv._id;
                
                return (
                  <div 
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {other?.profileImage ? (
                        <img 
                          src={other.profileImage} 
                          alt={other?.name} 
                          className="w-11 h-11 rounded-full object-cover shadow-xs border border-slate-200/60"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs bg-[#FEF3C7] text-[#D97706]`}
                        style={{ display: other?.profileImage ? 'none' : 'flex' }}
                      >
                        <User size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {other?.name || 'Client'}
                        </h4>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-100 shrink-0">
                          Online
                        </span>
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCounts && conv.unreadCounts[expert?._id] ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                        {conv.lastMessage || 'Start the conversation'}
                      </p>
                    </div>
                    {conv.unreadCounts && conv.unreadCounts[expert?._id] > 0 && (
                      <div className="w-5 h-5 rounded-full bg-[#F5B52E] flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0">
                        {conv.unreadCounts[expert?._id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area (Full width on mobile when chat open, hidden when no chat selected) */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-white w-full h-full min-w-0">
          
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex justify-between items-center bg-white z-10 gap-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Back Button */}
              <button 
                onClick={() => {
                  setActiveConversation(null);
                  setSelectionMode(false);
                  setSelectedMsgIds([]);
                }}
                className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
                title="Back to conversations"
              >
                <ArrowLeft size={19} />
              </button>
              
              <div className="relative shrink-0">
                {getOtherParticipant(activeConversation)?.profileImage ? (
                  <img 
                    src={getOtherParticipant(activeConversation)?.profileImage} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-200/60"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shadow-xs"
                  style={{ display: getOtherParticipant(activeConversation)?.profileImage ? 'none' : 'flex' }}
                >
                  <User size={20} />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 leading-tight text-sm sm:text-base truncate max-w-[140px] sm:max-w-xs">
                  {getOtherParticipant(activeConversation)?.name || 'Client'}
                </h3>
                <p className="text-xs text-emerald-600 font-medium">Online</p>
              </div>
            </div>

            {/* Active Session Badges & Call Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {activeConsultation && (
                <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 bg-slate-50 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200">
                  {!chatStarted ? (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      <span>Reply within {Math.floor(waitingCountdown / 60)}:{(waitingCountdown % 60).toString().padStart(2, '0')}</span>
                    </div>
                  ) : isFreeConsultation ? (
                    <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg border shadow-xs ${
                      freeRemainingSeconds < 60 
                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Free: {Math.floor(freeRemainingSeconds / 60)}:{(freeRemainingSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}

                  <button 
                    onClick={() => handleEndConsultation(false)}
                    className="text-[10px] sm:text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    End Chat
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <button 
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                title="Video Call"
              >
                <Video size={19} />
              </button>
              <button 
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                title="Audio Call"
              >
                <Phone size={19} />
              </button>

              {/* More Menu Dropdown for Deletion Options */}
              <div className="relative" ref={moreMenuRef}>
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  title="Chat Options"
                >
                  <MoreVertical size={19} />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setSelectionMode(true);
                        setSelectedMsgIds([]);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <CheckSquare size={16} className="text-amber-600" />
                      <span>Select Messages</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setDeleteConfirmModal({ type: 'clear' });
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Trash2 size={16} className="text-amber-600" />
                      <span>Clear Chat History</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreMenu(false);
                        setDeleteConfirmModal({ type: 'conversation' });
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Trash2 size={16} className="text-red-600" />
                      <span>Delete Conversation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Active Consultation Sub-bar */}
          {activeConsultation && (
            <div className="sm:hidden px-3 py-1.5 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between gap-2 text-xs shrink-0">
              {!chatStarted ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Reply: {Math.floor(waitingCountdown / 60)}:{(waitingCountdown % 60).toString().padStart(2, '0')}</span>
                </div>
              ) : isFreeConsultation ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Free: {Math.floor(freeRemainingSeconds / 60)}:{(freeRemainingSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Time: {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</span>
                </div>
              )}

              <button 
                onClick={() => handleEndConsultation(false)}
                className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md"
              >
                End
              </button>
            </div>
          )}

          {/* Validation or Error Message Banner */}
          {errorMessage && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800 animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage('')} className="p-1 hover:bg-amber-100 rounded-full text-amber-700">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Bulk Selection Action Bar */}
          {selectionMode && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs shrink-0 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSelectAllMessages}
                  className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-amber-700 transition-colors cursor-pointer"
                >
                  {selectedMsgIds.length === messages.length && messages.length > 0 ? (
                    <CheckSquare size={17} className="text-amber-600" />
                  ) : (
                    <Square size={17} className="text-slate-400" />
                  )}
                  <span>Select All ({selectedMsgIds.length}/{messages.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  disabled={selectedMsgIds.length === 0}
                  onClick={() => setDeleteConfirmModal({ type: 'bulk' })}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedMsgIds([]);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Cancel Selection"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages Thread */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 bg-[#FDFBF9]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6">
                <MessageSquare size={36} className="mb-2 opacity-25" />
                <p className="text-sm font-medium">No messages in this chat</p>
                <p className="text-xs text-slate-400 mt-0.5">Send a message below to reply to the client</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender === expert?._id;
                const isSelected = selectedMsgIds.includes(msg._id);
                
                return (
                  <div 
                    key={msg._id || idx} 
                    onClick={() => selectionMode && handleToggleSelectMessage(msg._id)}
                    className={`flex items-end gap-2 group transition-colors ${isMe ? 'justify-end' : 'justify-start'} ${selectionMode ? 'cursor-pointer hover:bg-amber-50/50 p-1 rounded-xl' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    {selectionMode && (
                      <div className={`p-1 shrink-0 ${isMe ? 'order-2' : 'order-first'}`}>
                        {isSelected ? (
                          <CheckSquare size={18} className="text-amber-600 fill-amber-100" />
                        ) : (
                          <Square size={18} className="text-slate-400" />
                        )}
                      </div>
                    )}

                    <div className={`max-w-[85%] sm:max-w-[70%] relative ${isMe ? 'order-1' : 'order-2'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl shadow-xs relative ${
                        isMe 
                          ? 'bg-[#F5B52E] text-slate-950 font-normal rounded-tr-sm' 
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-sm'
                      } ${isSelected ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}>
                        <p className="text-xs sm:text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] font-medium ${isMe ? 'text-slate-600' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isMe && (
                          msg.status === 'READ' ? <CheckCheck size={13} className="text-emerald-700" /> :
                          msg.status === 'DELIVERED' ? <CheckCheck size={13} className="text-slate-600" /> :
                          <Check size={13} className="text-slate-600" />
                        )}
                        {/* Single message delete action button on hover */}
                        {!selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmModal({ type: 'single', id: msg._id });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-all cursor-pointer ml-1"
                            title="Delete Message"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 w-full max-w-full">
            {!activeConsultation ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-center gap-2 text-center text-slate-500 text-xs font-medium mb-1">
                <span className="material-symbols-outlined text-amber-500 text-base sm:text-lg shrink-0">lock</span>
                <span className="text-[11px] sm:text-xs">Chat session is currently inactive. You can reply once the client initiates a live chat session.</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 sm:gap-3 w-full">
              {/* Attachment Paperclip Button */}
              <button 
                type="button" 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer shrink-0" 
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>

              {/* Pill Text Input */}
              <div className="flex-1 bg-slate-100/80 rounded-full px-4 sm:px-5 py-2.5 flex items-center focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-400 focus-within:border-amber-400 border border-transparent transition-all">
                <input 
                  type="text"
                  value={inputText}
                  disabled={!activeConsultation}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={!activeConsultation ? "Chat session inactive..." : !chatStarted ? `Reply to start session (${Math.floor(waitingCountdown / 60)}m ${waitingCountdown % 60}s remaining)...` : "Type your message..."} 
                  className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 disabled:cursor-not-allowed"
                />
              </div>

              {/* Yellow Circle Send Button */}
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !activeConsultation}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F5B52E] hover:bg-[#eab308] disabled:opacity-40 text-slate-900 flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                title="Send Message"
              >
                <Send size={18} className="translate-x-0.5" />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Empty State when no conversation selected */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white p-6">
          <div className="w-16 h-16 rounded-full border border-amber-100 bg-amber-50/50 flex items-center justify-center text-amber-500 mb-3 shadow-xs">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Your Messages</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
            Select a conversation from the left to start viewing and replying to messages.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              {deleteConfirmModal.type === 'single' ? 'Delete Message?' :
               deleteConfirmModal.type === 'bulk' ? `Delete ${selectedMsgIds.length} Messages?` :
               deleteConfirmModal.type === 'clear' ? 'Clear Entire Chat History?' :
               'Delete Conversation?'}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              {deleteConfirmModal.type === 'conversation' 
                ? 'This will remove the entire chat thread from your conversations list permanently.'
                : 'This action cannot be undone and will delete the selected messages permanently.'}
            </p>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExpertMessages;
