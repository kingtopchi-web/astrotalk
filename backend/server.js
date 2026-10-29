const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const expertRoutes = require('./routes/expertRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();

// Disable x-powered-by header
app.disable('x-powered-by');

// Security Headers via Helmet (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://experthub.nextgoodtechnologies.in",
        "wss://experthub.nextgoodtechnologies.in",
        "http://localhost:5000",
        "ws://localhost:5000",
        "http://localhost:5173",
        "ws://localhost:5173",
        "http://localhost:5174",
        "ws://localhost:5174"
      ],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  xFrameOptions: { action: 'sameorigin' },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Block malicious probes for common PHP/WordPress/Env attack vectors
app.use((req, res, next) => {
  const normalizedPath = (req.path || '').toLowerCase();
  if (
    normalizedPath.includes('.env') ||
    normalizedPath.includes('.git') ||
    normalizedPath.includes('/wp-admin') ||
    normalizedPath.includes('/wp-login') ||
    normalizedPath.includes('/phpmyadmin')
  ) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
});

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://experthub.nextgoodtechnologies.in,http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Parse JSON with raw body capture for webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const expertProfileRoutes = require('./routes/expertProfileRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const messageRoutes = require('./routes/messageRoutes');
const expertServiceRoutes = require('./routes/expertServiceRoutes');
const videoRoutes = require('./routes/videoRoutes');

app.use('/api/experts', expertRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/expert', expertProfileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/expert-services', expertServiceRoutes);
app.use('/api/video', videoRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/public', publicRoutes);

// Public category endpoints (no auth needed for registration forms)
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'ACTIVE' }).sort({ name: 1 });
    res.json(categories);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});
app.get('/api/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const subs = await SubCategory.find({ categoryId: req.params.categoryId, status: 'ACTIVE' }).sort({ name: 1 });
    res.json(subs);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('ExpertHub API is running. Welcome!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('ERROR: MONGODB_URI is not defined in your .env file!');
      console.error('Please add your MongoDB Atlas URI to backend/.env (e.g. MONGODB_URI=mongodb+srv://...)');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('MongoDB Connected successfully to Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// Socket.IO Handshake Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    // Flag as unauthenticated
    socket.userId = null;
    socket.userRole = 'ANONYMOUS';
    return next();
  }

  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    socket.userId = decoded.id;
    socket.userRole = (decoded.role || 'USER').toUpperCase();
    return next();
  } catch (err) {
    // If an invalid token was explicitly supplied, reject connection
    return next(new Error('Authentication error: invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected to socket: ${socket.id}`);
  
  // Join a room specific to a user ID to receive direct notifications/messages
  socket.on('join_user', async (userId) => {
    if (!userId) return;
    if (socket.userId && socket.userId.toString() !== userId.toString() && socket.userRole !== 'ADMIN') {
      console.warn(`Unauthorized join_user attempt by ${socket.id} for user ${userId}`);
      return;
    }
    socket.join(`user_${userId}`);
    if (!socket.userId) socket.userId = userId;
    console.log(`Socket ${socket.id} joined user_${userId}`);

    // If an expert connects, ensure their status is marked online
    try {
      const Expert = require('./models/Expert');
      await Expert.findByIdAndUpdate(userId, { onlineStatus: 'online' });
    } catch (e) {}
  });

  // Join a role-based room (for ADMIN/EXPERT alerts)
  socket.on('join_role', (role) => {
    if (!role) return;
    const upperRole = role.toUpperCase();
    if (socket.userRole && socket.userRole !== upperRole && socket.userRole !== 'ADMIN') {
      console.warn(`Unauthorized join_role attempt by ${socket.id} for role ${role}`);
      return;
    }
    socket.join(`role_${upperRole}`);
    console.log(`Socket ${socket.id} joined role_${upperRole}`);
  });

  // Join a specific conversation room (authorized participants only)
  socket.on('join_conversation', async (conversationId) => {
    if (!conversationId) return;
    try {
      const Conversation = require('./models/Conversation');
      const conv = await Conversation.findById(conversationId);
      if (conv && socket.userId) {
        const isParticipant = conv.participants?.some(p => p.participantId?.toString() === socket.userId.toString());
        if (!isParticipant && socket.userRole !== 'ADMIN') {
          console.warn(`Unauthorized join_conversation attempt by ${socket.id} for ${conversationId}`);
          return;
        }
      }
    } catch (e) {}
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
  });

  // Handle incoming message
  socket.on('send_message', async (data) => {
    // data = { conversationId, senderId, senderModel, text, fileUrl }
    if (!socket.userId) {
      socket.emit('chat_error', { message: 'Authentication required to send messages', code: 'UNAUTHORIZED' });
      return;
    }
    // Enforce authenticated sender identity
    data.senderId = socket.userId.toString();
    data.senderModel = socket.userRole === 'EXPERT' ? 'Expert' : (socket.userRole === 'ADMIN' ? 'Admin' : 'User');
    try {
      // 1. Disallow any documents or images / attachments
      if (data.fileUrl) {
        socket.emit('chat_error', {
          message: 'Files, images and documents are not allowed in chat. Only text messages can be sent.',
          code: 'ATTACHMENTS_NOT_ALLOWED'
        });
        return;
      }

      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) return;

      // 2. Disallow links, URLs and website addresses
      const urlRegex = /(https?:\/\/|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|in|org|net|io|co|me|ai|app|xyz|info|biz|tv)\b)/i;
      if (urlRegex.test(text)) {
        socket.emit('chat_error', {
          message: 'Sharing links, URLs or websites is not allowed.',
          code: 'URL_NOT_ALLOWED'
        });
        return;
      }

      // 3. Disallow 10-digit phone numbers only (other numbers/digits are permitted)
      const isPhoneBlocked = () => {
        // Continuous 10 or more digits
        if (/\b\d{10,}\b/.test(text)) return true;
        // 10 digits separated by spaces, dots, dashes (e.g. 98765 43210 or +91 9876543210)
        const spacedPhoneRegex = /(?:(?:\+|0{0,2})91[\s.-]*)?(?:\d[\s.-]*){10}/g;
        const matches = text.match(spacedPhoneRegex);
        if (matches) {
          for (const match of matches) {
            const digitsOnly = match.replace(/\D/g, '');
            if (digitsOnly.length === 10 || 
               (digitsOnly.length === 11 && digitsOnly.startsWith('0')) || 
               (digitsOnly.length === 12 && digitsOnly.startsWith('91'))) {
              return true;
            }
          }
        }
        return false;
      };

      if (isPhoneBlocked()) {
        socket.emit('chat_error', {
          message: 'Sharing 10-digit phone numbers is not allowed. Other numbers and digits are permitted.',
          code: 'PHONE_NOT_ALLOWED'
        });
        return;
      }

      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');
      
      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) return;

      let status = 'SENT';
      
      // Find recipient
      const recipient = conversation.participants.find(p => p.participantId.toString() !== data.senderId);
      if (recipient) {
        const recipientId = recipient.participantId.toString();
        
        // Get all socket IDs for recipient
        const recipientSockets = io.sockets.adapter.rooms.get(`user_${recipientId}`);
        if (recipientSockets && recipientSockets.size > 0) {
          status = 'DELIVERED'; // At least they are online
          
          // Check if any of these sockets are also in the conversation room
          const conversationSockets = io.sockets.adapter.rooms.get(`conversation_${data.conversationId}`);
          if (conversationSockets) {
            for (const socketId of recipientSockets) {
              if (conversationSockets.has(socketId)) {
                status = 'READ';
                break;
              }
            }
          }
        }
      }

      const Consultation = require('./models/Consultation');
      
      // Check if there is an active/ongoing chat consultation between the participants
      const userParticipant = conversation.participants.find(p => p.participantModel === 'User');
      const expertParticipant = conversation.participants.find(p => p.participantModel === 'Expert');

      let activeChatConsultation = null;
      if (userParticipant && expertParticipant) {
        activeChatConsultation = await Consultation.findOne({
          user: userParticipant.participantId,
          expert: expertParticipant.participantId,
          type: 'chat',
          status: { $in: ['scheduled', 'ongoing'] }
        }).sort({ startTime: -1 });

        // REQUIREMENT: If no active chat session is ongoing, neither user nor expert can reply/message
        if (!activeChatConsultation) {
          socket.emit('chat_error', { 
            message: 'No active chat session. Please start a new consultation to chat.',
            code: 'NO_ACTIVE_SESSION'
          });
          return;
        }

        // AUTO-TERMINATE IF FREE CHAT DURATION HAS ELAPSED
        if (activeChatConsultation.isFree && activeChatConsultation.chatStarted && activeChatConsultation.chatStartedAt) {
          const allowedMinutes = activeChatConsultation.freeChatDurationMinutes || 5;
          const elapsedMs = Date.now() - new Date(activeChatConsultation.chatStartedAt).getTime();
          if (elapsedMs >= allowedMinutes * 60 * 1000) {
            activeChatConsultation.status = 'completed';
            await activeChatConsultation.save();

            io.to(`conversation_${data.conversationId}`).emit('session_ended', {
              consultationId: activeChatConsultation._id,
              reason: `Free chat time limit of ${allowedMinutes} minutes has expired. Session ended.`
            });
            socket.emit('chat_error', { 
              message: `Free chat time limit of ${allowedMinutes} minutes has expired. Session ended.`,
              code: 'SESSION_EXPIRED'
            });
            return;
          }
        }

        // If the sender is the EXPERT and chat has not officially started yet, mark it started!
        if (data.senderModel === 'Expert' && !activeChatConsultation.chatStarted) {
          activeChatConsultation.chatStarted = true;
          activeChatConsultation.chatStartedAt = new Date();
          activeChatConsultation.status = 'ongoing';
          await activeChatConsultation.save();

          // Broadcast to conversation that expert has replied and session timer has officially begun!
          io.to(`conversation_${data.conversationId}`).emit('chat_session_started', {
            consultationId: activeChatConsultation._id,
            chatStartedAt: activeChatConsultation.chatStartedAt,
            startTime: activeChatConsultation.chatStartedAt
          });
        }
      }

      const message = new Message({
        conversationId: data.conversationId,
        sender: data.senderId,
        senderModel: data.senderModel || 'User',
        text: data.text,
        fileUrl: data.fileUrl,
        messageType: data.fileUrl ? 'file' : 'text',
        status: status
      });
      await message.save();

      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: data.text || 'File attached',
        lastMessageAt: Date.now()
      });

      // Broadcast to everyone in the conversation room
      io.to(`conversation_${data.conversationId}`).emit('receive_message', message);

      // Create dynamic notification for recipient
      if (recipient) {
        const { sendNotification } = require('./utils/notificationDispatcher');
        const isFromExpert = data.senderModel === 'Expert';
        const senderName = isFromExpert ? 'Your expert' : 'A user';
        
        await sendNotification({
          recipient: recipient.participantId,
          recipientRole: recipient.participantModel === 'Expert' ? 'EXPERT' : 'USER',
          recipientModel: recipient.participantModel || 'User',
          title: isFromExpert ? 'New Chat Message' : 'New Message from Client',
          message: `${senderName} has sent you a message: "${data.text ? (data.text.slice(0, 50) + (data.text.length > 50 ? '...' : '')) : 'File attached'}"`,
          actionText: 'Open chat',
          link: recipient.participantModel === 'Expert' ? '/expert/messages' : '/messages',
          type: 'chat_message',
          badge: 'New'
        }, io);
      }
    } catch (err) {
      console.error('Socket message error', err);
    }
  });

  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', { senderId: data.senderId });
  });

  socket.on('stop_typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', { senderId: data.senderId });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Export io to app so controllers can use req.app.get('io')
  app.set('io', io);

  // --- WebRTC Signaling ---
  socket.on('join_call_room', async (roomId) => {
    if (!roomId) return;
    try {
      const Consultation = require('./models/Consultation');
      const consultation = await Consultation.findById(roomId);
      if (consultation && socket.userId) {
        const uId = consultation.user?.toString();
        const eId = consultation.expert?.toString();
        const myId = socket.userId.toString();
        if (myId !== uId && myId !== eId && socket.userRole !== 'ADMIN') {
          console.warn(`Unauthorized join_call_room by ${socket.id} for room ${roomId}`);
          return;
        }
      }
    } catch (e) {}
    socket.join(`call_room_${roomId}`);
    console.log(`Socket ${socket.id} joined call room ${roomId}`);
    // Notify others in the room that a new user joined
    socket.to(`call_room_${roomId}`).emit('user_joined_call', { userId: socket.id });
  });

  socket.on('webrtc_ready', (data) => {
    socket.to(`call_room_${data.roomId}`).emit('webrtc_ready', { senderId: socket.id });
  });

  socket.on('webrtc_offer', (data) => {
    const payload = { signal: data.signal, callerId: socket.id };
    if (data.targetRoom) socket.to(`call_room_${data.targetRoom}`).emit('webrtc_offer', payload);
    else io.to(data.target).emit('webrtc_offer', payload);
  });

  socket.on('webrtc_answer', (data) => {
    const payload = { signal: data.signal, answererId: socket.id };
    if (data.targetRoom) socket.to(`call_room_${data.targetRoom}`).emit('webrtc_answer', payload);
    else io.to(data.target).emit('webrtc_answer', payload);
  });

  socket.on('webrtc_ice_candidate', (data) => {
    const payload = { candidate: data.candidate, senderId: socket.id };
    if (data.targetRoom) socket.to(`call_room_${data.targetRoom}`).emit('webrtc_ice_candidate', payload);
    else io.to(data.target).emit('webrtc_ice_candidate', payload);
  });

  socket.on('leave_call_room', (roomId) => {
    socket.leave(`call_room_${roomId}`);
    socket.to(`call_room_${roomId}`).emit('user_left_call', { userId: socket.id });
  });

  // Handle call decline / reject from expert
  socket.on('reject_call', (data) => {
    if (data?.consultationId) {
      const reason = data.reason || 'Call declined by expert';
      io.to(`call_room_${data.consultationId}`).emit('VIDEO_SESSION_ENDED', { consultationId: data.consultationId, reason });
      io.to(`call_room_${data.consultationId}`).emit('session_ended', { consultationId: data.consultationId, reason });
      if (data.userId) {
        io.to(`user_${data.userId}`).emit('VIDEO_SESSION_ENDED', { consultationId: data.consultationId, reason });
        io.to(`user_${data.userId}`).emit('session_ended', { consultationId: data.consultationId, reason });
      }
    }
  });

  // Handle chat consultation decline / reject from expert
  socket.on('reject_chat', (data) => {
    if (data?.consultationId && data?.userId) {
      const reason = data.reason || 'Chat request declined by expert';
      io.to(`user_${data.userId}`).emit('chat_rejected', { consultationId: data.consultationId, reason });
      io.to(`user_${data.userId}`).emit('session_ended', { consultationId: data.consultationId, reason });
    }
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
