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
    const { conversationId } = req.params;
    const { text, fileUrl, messageType } = req.body;
    const senderId = req.user._id;
    const senderModel = req.user.role === 'EXPERT' ? 'Expert' : (req.user.role === 'ADMIN' ? 'Admin' : 'User');

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

    // 2. Disallow links, URLs and website addresses
    const urlRegex = /(https?:\/\/|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|in|org|net|io|co|me|ai|app|xyz|info|biz|tv)\b)/i;
    if (urlRegex.test(messageContent)) {
      return res.status(400).json({ 
        message: 'Sharing links, URLs or websites is not allowed.',
        code: 'URL_NOT_ALLOWED' 
      });
    }

    // 3. Disallow 10-digit phone numbers only (other numbers/digits are permitted)
    const isPhoneBlocked = () => {
      // Continuous 10 or more digits
      if (/\b\d{10,}\b/.test(messageContent)) return true;
      // 10 digits separated by spaces, dots, dashes
      const spacedPhoneRegex = /(?:(?:\+|0{0,2})91[\s.-]*)?(?:\d[\s.-]*){10}/g;
      const matches = messageContent.match(spacedPhoneRegex);
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
      return res.status(400).json({ 
        message: 'Sharing 10-digit phone numbers is not allowed. Other numbers and digits are permitted.',
        code: 'PHONE_NOT_ALLOWED' 
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

      // AUTO-TERMINATE IF FREE CHAT DURATION HAS ELAPSED
      if (activeChatConsultation.isFree && activeChatConsultation.chatStarted && activeChatConsultation.chatStartedAt) {
        const allowedMinutes = activeChatConsultation.freeChatDurationMinutes || 5;
        const elapsedMs = Date.now() - new Date(activeChatConsultation.chatStartedAt).getTime();
        if (elapsedMs >= allowedMinutes * 60 * 1000) {
          activeChatConsultation.status = 'completed';
          await activeChatConsultation.save();

          const io = req.app.get('io');
          if (io) {
            io.to(`conversation_${conversationId}`).emit('session_ended', {
              consultationId: activeChatConsultation._id,
              reason: `Free chat time limit of ${allowedMinutes} minutes has expired. Session ended.`
            });
          }
          return res.status(403).json({ 
            message: `Free chat session time limit of ${allowedMinutes} minutes has expired. Session ended.`,
            code: 'SESSION_EXPIRED' 
          });
        }
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

// Delete a single message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      'participants.participantId': req.user._id
    });
    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    // Update conversation lastMessage
    const latest = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
    conversation.lastMessage = latest ? (latest.text || 'File attached') : '';
    conversation.lastMessageAt = latest ? latest.createdAt : null;
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversation._id}`).emit('message_deleted', {
        conversationId: conversation._id,
        messageId
      });
    }

    res.json({ success: true, message: 'Message deleted successfully', messageId });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Delete multiple selected messages
exports.deleteBulkMessages = async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    if (!conversationId || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Please provide conversationId and messageIds array' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': req.user._id
    });
    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    await Message.deleteMany({ _id: { $in: messageIds }, conversationId });

    // Update conversation lastMessage
    const latest = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
    conversation.lastMessage = latest ? (latest.text || 'File attached') : '';
    conversation.lastMessageAt = latest ? latest.createdAt : null;
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('messages_bulk_deleted', {
        conversationId,
        messageIds
      });
    }

    res.json({ success: true, message: `${messageIds.length} messages deleted successfully`, messageIds });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting messages', error: error.message });
  }
};

// Clear all messages in a conversation
exports.clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': req.user._id
    });
    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    await Message.deleteMany({ conversationId });

    conversation.lastMessage = '';
    conversation.lastMessageAt = null;
    conversation.unreadCounts = {};
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('conversation_cleared', { conversationId });
    }

    res.json({ success: true, message: 'All messages cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing conversation', error: error.message });
  }
};

// Delete entire conversation and its messages
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': req.user._id
    });
    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('conversation_deleted', { conversationId });
    }

    res.json({ success: true, message: 'Conversation deleted successfully', conversationId });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting conversation', error: error.message });
  }
};
