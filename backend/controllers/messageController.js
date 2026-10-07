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
    await Message.updateMany(
      { conversationId, sender: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a message via REST API (fallback if socket not used for some reason)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageType, text, fileUrl } = req.body;
    const senderId = req.user._id;
    let senderModel = 'User';
    
    if (req.user.role === 'EXPERT') {
      senderModel = 'Expert';
    } else if (req.user.role === 'ADMIN') {
      senderModel = 'Admin';
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.participantId': senderId
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
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
