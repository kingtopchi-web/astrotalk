const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const HelpArticle = require('../models/HelpArticle');
const { sendNotification } = require('../utils/notificationDispatcher');

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

    const io = req.app.get('io');
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: 'New Complaint or Report',
      message: `${userType} submitted ticket "${subject}" [${category}].`,
      type: 'complaint_report',
      link: '/admin/support',
      actionText: 'Review ticket',
      badge: 'Support'
    }, io).catch(e => console.error('Support ticket notification error:', e));

    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      user: req.user._id,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
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

// Admin: Get all tickets (Excluding deleted tickets in Recycle Bin)
exports.getAllTickets = async (req, res) => {
  try {
    const [tickets, recycleCount] = await Promise.all([
      SupportTicket.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .populate('user', 'name email profileImage'),
      SupportTicket.countDocuments({ isDeleted: true })
    ]);

    // Return array with meta property or formatted response
    // For backward compatibility, if caller checks Array.isArray, attach recycleCount
    res.json({
      success: true,
      tickets,
      recycleCount
    });
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

// Soft Delete Ticket -> Move to Recycle Bin (Auto-deleted after 7 days)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Must be Admin or the ticket creator
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = ticket.user.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    ticket.isDeleted = true;
    ticket.deletedAt = new Date();
    ticket.deletedBy = req.user._id;
    ticket.deletedByModel = isAdmin ? 'Admin' : (req.user.role === 'EXPERT' ? 'Expert' : 'User');
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket moved to Recycle Bin. It will be permanently removed after 7 days unless restored.',
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error moving ticket to recycle bin', error: error.message });
  }
};

// Admin: Get all tickets in Recycle Bin (with 7-day auto-expiry countdown)
exports.getRecycleBinTickets = async (req, res) => {
  try {
    const deletedTickets = await SupportTicket.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .populate('user', 'name email profileImage');

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const formatted = deletedTickets.map(t => {
      const deletedTime = new Date(t.deletedAt || t.updatedAt).getTime();
      const expiresAt = new Date(deletedTime + SEVEN_DAYS_MS);
      const msRemaining = Math.max(0, expiresAt.getTime() - now);
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1000)));

      return {
        ...t.toObject(),
        expiresAt,
        daysRemaining,
        hoursRemaining
      };
    });

    res.json({
      success: true,
      total: formatted.length,
      tickets: formatted
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recycle bin tickets', error: error.message });
  }
};

// Admin: Restore Ticket from Recycle Bin back to active
exports.restoreTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.isDeleted = false;
    ticket.deletedAt = null;
    ticket.deletedBy = null;
    ticket.deletedByModel = null;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket restored successfully to active tickets.',
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring ticket', error: error.message });
  }
};

// Admin: Permanently Delete Ticket immediately
exports.permanentlyDeleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await Promise.all([
      SupportTicket.findByIdAndDelete(req.params.id),
      SupportMessage.deleteMany({ ticket: req.params.id })
    ]);

    res.json({
      success: true,
      message: 'Ticket and associated conversation history permanently deleted.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting ticket', error: error.message });
  }
};

// Admin: Empty Recycle Bin permanently
exports.emptyRecycleBin = async (req, res) => {
  try {
    const deletedTickets = await SupportTicket.find({ isDeleted: true }).select('_id');
    const ticketIds = deletedTickets.map(t => t._id);

    if (ticketIds.length > 0) {
      await Promise.all([
        SupportTicket.deleteMany({ _id: { $in: ticketIds } }),
        SupportMessage.deleteMany({ ticket: { $in: ticketIds } })
      ]);
    }

    res.json({
      success: true,
      message: `Permanently removed ${ticketIds.length} ticket(s) from Recycle Bin.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error emptying recycle bin', error: error.message });
  }
};
