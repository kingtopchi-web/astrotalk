import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';
import { Send, Paperclip, Search, Check, CheckCheck, MessageSquare, MoreVertical, Phone, Video } from 'lucide-react';

function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [billedAmount, setBilledAmount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [isBalanceExhausted, setIsBalanceExhausted] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [waitingCountdown, setWaitingCountdown] = useState(120);
  const [errorMessage, setErrorMessage] = useState('');
  const isEndingRef = useRef(false);
  const messagesEndRef = useRef(null);

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p.participantId?._id !== user._id)?.participantId || null;
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/messages/conversations', {
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
      const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/messages/conversations/${targetId}/messages`, {
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

  const fetchActiveChatConsultation = async (otherUserId) => {
    if (!otherUserId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/bookings/active-chat/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const consult = res.data;
      setActiveConsultation(consult);
      
      // Check if expert has already replied
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
        // Calculate remaining waiting seconds from startTime (2 minutes = 120s)
        if (consult?.startTime) {
          const elapsedSinceCreation = Math.floor((new Date() - new Date(consult.startTime)) / 1000);
          setWaitingCountdown(Math.max(0, 120 - elapsedSinceCreation));
        } else {
          setWaitingCountdown(120);
        }
      }
      
      setLastMessageTime(Date.now()); // initialize

      // Also fetch user wallet balance if client
      if (user?.role !== 'EXPERT') {
        try {
          const wRes = await axios.get('https://astrotalk-hlg2.onrender.com/api/wallet', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wRes.data && typeof wRes.data.balance === 'number') {
            setUserWalletBalance(wRes.data.balance);
          }
        } catch (wErr) {
          console.error('Error fetching wallet:', wErr);
        }
      }
    } catch (err) {
      setActiveConsultation(null);
      setChatStarted(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;
    const newSocket = createSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Messages connected:', newSocket.id);
      newSocket.emit('join_user', user._id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error (server may be waking up):', err.message);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicate messages if we are the sender
        if (prev.find(m => m._id === msg._id)) return prev;
        
        // Update last message time
        if (msg.sender !== user._id) {
          setLastMessageTime(Date.now());
        }
        
        return [...prev, msg];
      });
      // Update the last message in conversations list
      setConversations(prev => prev.map(conv => {
        if (conv._id === msg.conversation) {
          return { ...conv, lastMessage: msg.text, lastMessageAt: msg.createdAt };
        }
        return conv;
      }));
    });

    newSocket.on('new_chat_consultation', (data) => {
      console.log('[Socket] new_chat_consultation event received:', data);
      fetchConversations().then((convs) => {
        const otherUser = getOtherParticipant(activeConversation);
        if (otherUser && (otherUser._id === data.partnerId || otherUser._id === data.consultation?.expert)) {
          fetchActiveChatConsultation(otherUser._id);
          fetchMessages(activeConversation?._id);
        } else if (convs && (!activeConversation || !activeConversation._id)) {
          // If no conversation currently selected, select the relevant conversation
          const matchingConv = convs.find(c => {
            const p = c.participants?.find(part => part.participantId?._id !== user._id)?.participantId?._id;
            return p === data.partnerId || p === data.consultation?.expert;
          });
          if (matchingConv) {
            setActiveConversation(matchingConv);
          }
        }
      });
    });

    newSocket.on('chat_session_started', (data) => {
      console.log('[Socket] chat_session_started received:', data);
      setChatStarted(true);
      setActiveConsultation(prev => prev ? { ...prev, chatStarted: true, chatStartedAt: data.chatStartedAt } : prev);
      setSeconds(0);
      setLastMessageTime(Date.now());
    });

    newSocket.on('session_ended', (data) => {
      console.log('[Socket] session_ended received:', data);
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

    return () => newSocket.close();
  }, [user?._id, activeConversation]);

  // Fetch conversations on load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages and active consultation when a conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation._id);
    
    const otherUser = getOtherParticipant(activeConversation);
    if (otherUser) {
      fetchActiveChatConsultation(otherUser._id);
    }
  }, [activeConversation, socket]);

  const isExpert = user?.role === 'EXPERT';
  const expertRatePerMin = activeConsultation?.cost && activeConsultation?.durationInMinutes
    ? (activeConsultation.cost / activeConsultation.durationInMinutes)
    : 30;
  const costPerSecond = Number(((expertRatePerMin * 1.20) / 60).toFixed(4));
  const maxAllowedSeconds = userWalletBalance > 0 && costPerSecond > 0 
    ? Math.floor(userWalletBalance / costPerSecond) 
    : 3600;
  const currentBilled = chatStarted ? Number((seconds * costPerSecond).toFixed(2)) : 0;
  const remainingLiveBalance = Math.max(0, Number((userWalletBalance - currentBilled).toFixed(2)));
  const remainingSeconds = Math.max(0, maxAllowedSeconds - seconds);

  // 1. Initial 2-minute countdown (120 seconds) while waiting for expert reply
  useEffect(() => {
    if (!activeConsultation || chatStarted) return;

    const waitTimer = setInterval(() => {
      setWaitingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(waitTimer);
          // 2 minutes passed without expert reply: AUTO-END SESSION!
          if (!isEndingRef.current) {
            isEndingRef.current = true;
            handleEndConsultation(true, false, 0, 'Expert did not reply within 2 minutes. Session ended with ₹0 charge.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(waitTimer);
  }, [activeConsultation, chatStarted]);

  // 2. Active billing timer ONLY runs once chatStarted is true!
  useEffect(() => {
    if (!activeConsultation || !chatStarted) return;
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        // Check if user runs out of balance: Disconnect chat immediately
        if (!isExpert && userWalletBalance > 0 && maxAllowedSeconds > 0 && next >= maxAllowedSeconds) {
          if (!isEndingRef.current) {
            isEndingRef.current = true;
            setIsBalanceExhausted(true);
            setTimeout(() => {
              handleEndConsultation(false, true, next);
            }, 500);
          }
        }
        return next;
      });
      
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeConsultation, chatStarted, isExpert, userWalletBalance, maxAllowedSeconds]);

  const handleEndConsultation = async (autoDisconnected = false, isInsufficientBalance = false, finalSecs = null, reason = '') => {
    if (!activeConsultation) return;
    try {
      const token = localStorage.getItem('token');
      const usedSeconds = finalSecs !== null ? finalSecs : (chatStarted ? seconds : 0);
      // Use exact fractional minutes for per-second billing accuracy
      const actualDuration = chatStarted ? (Number((usedSeconds / 60).toFixed(2)) || 0.01) : 0;
      await axios.post(`https://astrotalk-hlg2.onrender.com/api/bookings/${activeConsultation._id}/end`, { 
        actualDuration,
        reason: reason || (autoDisconnected ? 'Expert did not reply within 2 minutes' : 'Session ended')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveConsultation(null);
      setChatStarted(false);
      
      if (isInsufficientBalance) {
        setIsBalanceExhausted(true);
        return;
      }
      if (reason) {
        setErrorMessage(reason);
      } else if (autoDisconnected) {
        setErrorMessage("Chat session ended automatically.");
      }
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

    // Check for digits
    if (/\d/.test(trimmed)) {
      return { isValid: false, error: 'Numbers/digits are not allowed in messages. Please type text using alphabets only.' };
    }

    // Check for email
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) || /@/.test(trimmed)) {
      return { isValid: false, error: 'Sharing email addresses or contact information is not allowed.' };
    }

    // Check for links / URLs
    if (/(https?:\/\/|www\.|\.com|\.in|\.org|\.net|\.io|\.co)/i.test(trimmed)) {
      return { isValid: false, error: 'Sharing links, URLs or websites is not allowed.' };
    }

    // Only allow letters (any language including Hindi/English), spaces and standard punctuation
    const allowedRegex = /^[\p{L}\s.,!?'"\-()]+$/u;
    if (!allowedRegex.test(trimmed)) {
      return { isValid: false, error: 'Only alphabets and basic punctuation are allowed. Numbers, symbols, and special characters cannot be sent.' };
    }

    return { isValid: true };
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversation || !socket) return;

    const validation = validateMessageText(inputText);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    const messageData = {
      conversationId: activeConversation._id,
      senderId: user._id,
      senderModel: user.role === 'ADMIN' ? 'Admin' : (user.role === 'EXPERT' ? 'Expert' : 'User'),
      text: inputText.trim(),
      fileUrl: null
    };

    socket.emit('send_message', messageData);
    setInputText('');
    setLastMessageTime(Date.now()); // Update my own last message time too, so we don't disconnect while actively typing/sending
  };

  return (
    <UserLayout title="Messages" subtitle="Chat with your experts">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex h-[600px]">
        
        {/* Conversations Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50 shrink-0">
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                <MessageSquare size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Book an expert to start chatting</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map(conv => {
                  const other = getOtherParticipant(conv);
                  const isSelected = activeConversation?._id === conv._id;
                  
                  return (
                    <div 
                      key={conv._id}
                      onClick={() => setActiveConversation(conv)}
                      className={`p-4 flex gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-100 border-l-4 border-transparent'}`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={other?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'Expert')}&background=random`} 
                          alt="avatar" 
                          className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{other?.name || 'Expert User'}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${conv.unreadCount ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                          {conv.lastMessage || 'Start the conversation'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-2">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                <img 
                  src={getOtherParticipant(activeConversation)?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherParticipant(activeConversation)?.name || 'Expert')}&background=random`} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{getOtherParticipant(activeConversation)?.name || 'Expert User'}</h3>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {activeConsultation && (
                  <div className="flex items-center gap-2 mr-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                    {!chatStarted ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Waiting for Expert Reply ({Math.floor(waitingCountdown / 60)}m {waitingCountdown % 60}s)</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</span>
                        </div>

                        {user?.role !== 'EXPERT' && (
                          <>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <span>₹{remainingLiveBalance.toFixed(2)}</span>
                            </div>
                            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${remainingSeconds < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              <span>{Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:{(remainingSeconds % 60).toString().padStart(2, '0')} left</span>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <button 
                      onClick={() => handleEndConsultation(false)}
                      className="ml-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      End Chat
                    </button>
                  </div>
                )}
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Phone size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Video size={18} /></button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              {messages.map((msg, idx) => {
                const isMe = msg.sender === user._id;
                
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${Number(
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                      ).toFixed(2)}`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isMe && (
                          msg.status === 'READ' ? <CheckCheck size={14} className="text-blue-500" /> :
                          msg.status === 'DELIVERED' ? <CheckCheck size={14} className="text-slate-400" /> :
                          <Check size={14} className="text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input or Session Inactive Warning */}
            <div className="p-4 bg-white border-t border-slate-100">
              {!activeConsultation ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                    <span className="material-symbols-outlined text-amber-500 text-lg">lock</span>
                    <span>Chat session is currently inactive or ended. Book a new session to chat.</span>
                  </div>
                  <button
                    onClick={() => navigate('/experts')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shrink-0"
                  >
                    Book New Chat
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message (alphabets only, no numbers/links/files)..." 
                      className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[40px] py-2 text-sm text-slate-800 placeholder-slate-400"
                      rows="1"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
                    >
                      <Send size={18} className="ml-0.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-2 font-medium">
                    <span className="material-symbols-outlined text-[13px] text-blue-500">info</span>
                    <span>Note: Only text (alphabets) allowed. Numbers, documents, images, emails, and links are restricted.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Your Messages</h3>
            <p className="text-slate-500 mt-2 max-w-sm text-center">
              Select a conversation from the sidebar or book a new consultation to start chatting with experts.
            </p>
          </div>
        )}
      </div>

      {/* Insufficient Balance Auto-Disconnect Modal */}
      {isBalanceExhausted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Insufficient Balance / अपर्याप्त बैलेंस</h3>
            
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              आपके वॉलेट में बैलेंस समाप्त हो गया है, इसलिए चैट सत्र समाप्त कर दिया गया है।
              <br />
              <span className="text-xs text-slate-500 mt-1 block font-medium">
                Total Chat Duration: {Math.floor(seconds / 60)}m {seconds % 60}s | Deducted: ₹{(seconds * costPerSecond).toFixed(2)}
              </span>
            </p>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-6 text-left">
              <p className="text-xs text-red-600 font-medium">
                💡 आगे बातचीत जारी रखने के लिए कृपया अपने वॉलेट में बैलेंस ऐड (Recharge) करें।
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/wallet')}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Add Balance to Wallet / बैलेंस जोड़ें
              </button>
              
              <button
                onClick={() => setIsBalanceExhausted(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Notification / Inactivity Disconnect Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">timer_off</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chat Notice / सूचना</h3>
            
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {errorMessage}
            </p>

            <button
              onClick={() => setErrorMessage('')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm cursor-pointer"
            >
              Okay / ठीक है
            </button>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

export default Messages;
