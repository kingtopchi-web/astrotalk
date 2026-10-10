import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';
import { Send, Paperclip, Search, Check, CheckCheck, MessageSquare, MoreVertical, Phone, Video } from 'lucide-react';

function Messages() {
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
  const messagesEndRef = useRef(null);

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
        
        // Update last message time for auto-disconnect logic if we have an active consultation
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

    newSocket.on('messages_read', ({ conversationId, readBy }) => {
      setMessages(prev => prev.map(m => {
        if (m.conversationId === conversationId && m.sender !== readBy) {
          return { ...m, status: 'READ' };
        }
        return m;
      }));
    });

    return () => newSocket.close();
  }, [user?._id]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/messages/conversations/${activeConversation._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
        
        if (socket) {
          socket.emit('join_conversation', activeConversation._id);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    const fetchActiveChatConsultation = async (otherUserId) => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/bookings/active-chat/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveConsultation(res.data);
        
        // If it's LIVE/ongoing, we might calculate seconds
        if (res.data && res.data.startTime) {
           const started = new Date(res.data.startTime);
           setSeconds(Math.floor((new Date() - started) / 1000));
        } else {
           setSeconds(0);
        }
        setLastMessageTime(Date.now()); // initialize
      } catch (err) {
        setActiveConsultation(null);
      }
    };

    fetchMessages();
    
    // Check if there is an active consultation for this pair
    const otherUser = getOtherParticipant(activeConversation);
    if (otherUser) {
      fetchActiveChatConsultation(otherUser._id);
    }

  }, [activeConversation, socket]);

  // Timer for active consultation
  useEffect(() => {
    if (!activeConsultation) return;
    
    const isExpert = user.role === 'EXPERT';
    const ratePerMinute = activeConsultation.cost / activeConsultation.durationInMinutes;
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (next % 60 === 0 && ratePerMinute > 0) {
          setBilledAmount(b => b + ratePerMinute);
        }
        return next;
      });
      
      // Auto disconnect logic: If no message from expert for 1 minute (60 seconds)
      // Only the user checks this to end it automatically? Or both?
      // Let's have the user trigger the end if the expert hasn't replied for 1 minute.
      if (!isExpert && lastMessageTime) {
         const idleTime = (Date.now() - lastMessageTime) / 1000;
         if (idleTime > 60) {
            handleEndConsultation(true);
         }
      }
      
      // Auto disconnect if max duration reached
      if (seconds >= activeConsultation.durationInMinutes * 60) {
         handleEndConsultation(false);
      }
      
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeConsultation, seconds, lastMessageTime, user]);

  const handleEndConsultation = async (autoDisconnected = false) => {
    if (!activeConsultation) return;
    try {
      const token = localStorage.getItem('token');
      // Use exact fractional minutes for per-second billing accuracy
      const actualDuration = Number((seconds / 60).toFixed(2)) || 0.01;
      await axios.post(`https://astrotalk-hlg2.onrender.com/api/bookings/${activeConsultation._id}/end`, { actualDuration }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveConsultation(null);
      alert(autoDisconnected ? "Session ended automatically due to inactivity or time limit." : "Session ended.");
    } catch (err) {
      console.error("Error ending consultation", err);
    }
  };


  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversation || !socket) return;

    const messageData = {
      conversationId: activeConversation._id,
      senderId: user._id,
      senderModel: user.role === 'ADMIN' ? 'Admin' : (user.role === 'EXPERT' ? 'Expert' : 'User'),
      text: inputText,
      fileUrl: null
    };

    socket.emit('send_message', messageData);
    setInputText('');
    setLastMessageTime(Date.now()); // Update my own last message time too, so we don't disconnect while actively typing/sending
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p.participantId?._id !== user._id)?.participantId || null;
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
                  <div className="flex items-center gap-2 mr-4 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                    <span className="text-sm font-bold text-blue-700">
                      {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
                    </span>
                    {user?.role !== 'EXPERT' && (
                       <span className="text-xs font-semibold text-blue-500 bg-white px-2 py-0.5 rounded shadow-sm">
                         ₹{billedAmount.toFixed(2)}
                       </span>
                    )}
                    <button 
                      onClick={() => handleEndConsultation(false)}
                      className="ml-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
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

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors shrink-0">
                  <Paperclip size={20} />
                </button>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[40px] py-2 text-sm text-slate-800 placeholder-slate-400"
                  rows="1"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shrink-0 shadow-sm"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </div>
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
    </UserLayout>
  );
}

export default Messages;
