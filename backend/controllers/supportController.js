const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const HelpArticle = require('../models/HelpArticle');

// Get all help articles
exports.getHelpArticles = async (req, res) => {
  try {
    const articles = await HelpArticle.find({ isActive: true }).sort({ category: 1, order: 1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
};

// Create a new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;
    
    // Determine user type and id
    let userType = 'User';
    let userId = req.user._id; // Default assumes normal user authentication
    
    if (req.user.role === 'EXPERT') {
      userType = 'Expert';
    }

    const ticket = new SupportTicket({
      ticketId: `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: userId,
      userModel: userType,
      subject,
      category,
      description,
      priority,
      status: 'OPEN'
    });

    await ticket.save();

    // Create the initial message
    const initialMessage = new SupportMessage({
      ticket: ticket._id,
      sender: userId,
      senderModel: userType,
      message: description,
      isInternal: false
    });

    await initialMessage.save();

    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
};

// Get single ticket with messages
exports.getTicketDetails = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Ensure the user owns this ticket
    if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await SupportMessage.find({ ticket: ticket._id, isInternal: false }).sort({ createdAt: 1 });
    
    res.json({ ticket, messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket details', error: error.message });
  }
};

// Add a reply to a ticket
exports.addReply = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let senderModel = 'User';
    if (req.user.role === 'ADMIN') senderModel = 'Admin';
    if (req.user.role === 'EXPERT') senderModel = 'Expert';

    const reply = new SupportMessage({
      ticket: ticket._id,
      sender: req.user._id,
      senderModel: senderModel,
      message,
      isInternal: false
    });

    await reply.save();

    // If user replies, set status back to OPEN or IN_PROGRESS, not CLOSED
    if (senderModel !== 'Admin' && ticket.status === 'CLOSED') {
      ticket.status = 'OPEN';
    }

    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      // Notify the user who created the ticket dynamically
      io.to(`user_${ticket.user}`).emit('receive_ticket_reply', { ticketId: ticket._id, reply });
    }

    res.status(201).json({ message: 'Reply added successfully', reply });
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
};

// Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({}).sort({ createdAt: -1 }).populate('user', 'name email profileImage');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all tickets', error: error.message });
  }
};

// Admin: Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    ticket.status = status;
    await ticket.save();
    
    res.json({ message: 'Ticket status updated', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket status', error: error.message });
  }
};
