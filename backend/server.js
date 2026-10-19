const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const expertRoutes = require('./routes/expertRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
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
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`User connected to socket: ${socket.id}`);
  
  // Join a room specific to a user ID to receive direct notifications/messages
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user_${userId}`);
  });

  // Join a role-based room (for ADMIN/EXPERT alerts)
  socket.on('join_role', (role) => {
    if (role) {
      socket.join(`role_${role}`);
      console.log(`Socket ${socket.id} joined role_${role}`);
    }
  });

  // Join a specific conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
  });

  // Handle incoming message
  socket.on('send_message', async (data) => {
    // data = { conversationId, senderId, senderModel, text, fileUrl }
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

      // 2. Disallow numbers/digits (na koi phone number ya digits)
      if (/\d/.test(text)) {
        socket.emit('chat_error', {
          message: 'Numbers/digits are not allowed in messages. Please type text using alphabets only.',
          code: 'DIGITS_NOT_ALLOWED'
        });
        return;
      }

      // 3. Disallow email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      if (emailRegex.test(text) || /@/.test(text)) {
        socket.emit('chat_error', {
          message: 'Sharing email addresses or contact details is not allowed.',
          code: 'EMAIL_NOT_ALLOWED'
        });
        return;
      }

      // 4. Disallow links, URLs and website addresses
      const urlRegex = /(https?:\/\/|www\.|\.com|\.in|\.org|\.net|\.io|\.co)/i;
      if (urlRegex.test(text)) {
        socket.emit('chat_error', {
          message: 'Sharing links, URLs or websites is not allowed.',
          code: 'URL_NOT_ALLOWED'
        });
        return;
      }

      // 5. Must only contain alphabets (English/Hindi characters), spaces, and standard sentence punctuation (. , ! ? ' " -)
      const allowedCharsRegex = /^[\p{L}\s.,!?'"\-()]+$/u;
      if (!allowedCharsRegex.test(text)) {
        socket.emit('chat_error', {
          message: 'Only alphabets and basic punctuation are allowed. Numbers, symbols, and special characters cannot be sent.',
          code: 'INVALID_CHARACTERS'
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
  socket.on('join_call_room', (roomId) => {
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
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
