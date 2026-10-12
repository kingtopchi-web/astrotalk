const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Expert = require('../models/Expert'); // Assuming this exists

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      'participants.participantId': userId
    })
    .populate('participants.participantId', 'name profileImage')
    .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': req.user._id
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    
    // Mark messages as read
    const result = await Message.updateMany(
      { conversationId, sender: { $ne: req.user._id }, status: { $ne: 'READ' } },
      { $set: { status: 'READ' } }
    );

    if (result.modifiedCount > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: req.user._id
        });
      }
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a message via REST API (fallback if socket not used for some reason)
exports.sendMessage = async (req, res) => {
  try {
    // 1. Disallow documents, images or file attachments
    if (fileUrl) {
      return res.status(400).json({ 
        message: 'Files, images and documents are not allowed in chat. Only text messages can be sent.',
        code: 'ATTACHMENTS_NOT_ALLOWED' 
      });
    }

    const messageContent = typeof text === 'string' ? text.trim() : '';
    if (!messageContent) {
      return res.status(400).json({ message: 'Message text cannot be empty' });
    }

    // 2. Disallow numbers/digits
    if (/\d/.test(messageContent)) {
      return res.status(400).json({ 
        message: 'Numbers/digits are not allowed in messages. Please type text using alphabets only.',
        code: 'DIGITS_NOT_ALLOWED' 
      });
    }

    // 3. Disallow email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (emailRegex.test(messageContent) || /@/.test(messageContent)) {
      return res.status(400).json({ 
        message: 'Sharing email addresses or contact details is not allowed.',
        code: 'EMAIL_NOT_ALLOWED' 
      });
    }

    // 4. Disallow links, URLs and website addresses
    const urlRegex = /(https?:\/\/|www\.|\.com|\.in|\.org|\.net|\.io|\.co)/i;
    if (urlRegex.test(messageContent)) {
      return res.status(400).json({ 
        message: 'Sharing links, URLs or websites is not allowed.',
        code: 'URL_NOT_ALLOWED' 
      });
    }

    // 5. Must only contain alphabets (English/Hindi characters), spaces, and standard sentence punctuation (. , ! ? ' " -)
    const allowedCharsRegex = /^[\p{L}\s.,!?'"\-()]+$/u;
    if (!allowedCharsRegex.test(messageContent)) {
      return res.status(400).json({ 
        message: 'Only alphabets and basic punctuation are allowed. Numbers, symbols, and special characters cannot be sent.',
        code: 'INVALID_CHARACTERS' 
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': senderId
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const Consultation = require('../models/Consultation');
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

      if (!activeChatConsultation) {
        return res.status(403).json({ 
          message: 'No active chat session. Please start a new consultation to chat.',
          code: 'NO_ACTIVE_SESSION' 
        });
      }

      if (senderModel === 'Expert' && !activeChatConsultation.chatStarted) {
        activeChatConsultation.chatStarted = true;
        activeChatConsultation.chatStartedAt = new Date();
        activeChatConsultation.status = 'ongoing';
        await activeChatConsultation.save();

        const io = req.app.get('io');
        if (io) {
          io.to(`conversation_${conversationId}`).emit('chat_session_started', {
            consultationId: activeChatConsultation._id,
            chatStartedAt: activeChatConsultation.chatStartedAt,
            startTime: activeChatConsultation.chatStartedAt
          });
        }
      }
    }

    const message = new Message({
      conversationId: conversationId,
      sender: senderId,
      senderModel: senderModel,
      messageType: messageType || 'text',
      text,
      fileUrl
    });

    await message.save();

    conversation.lastMessage = text || 'File attached';
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Create a new conversation with an expert
exports.createConversation = async (req, res) => {
  try {
    const { expertId } = req.body;
    const userId = req.user._id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [
          { $elemMatch: { participantId: userId, participantModel: 'User' } },
          { $elemMatch: { participantId: expertId, participantModel: 'Expert' } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { participantId: userId, participantModel: 'User' },
          { participantId: expertId, participantModel: 'Expert' }
        ]
      });
      await conversation.save();
    }

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};
