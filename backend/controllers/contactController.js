const ContactInquiry = require('../models/ContactInquiry');
const Setting = require('../models/Setting');
const { sendNotification } = require('../utils/notificationDispatcher');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit public contact us form
// @route   POST /api/public/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please write a message before submitting.' });
    }

    // 1. Save to Database
    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'General Contact Inquiry',
      message: message.trim(),
      status: 'PENDING'
    });

    // 2. Fetch platform settings for branding & support email
    let settings = null;
    try {
      settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    } catch (e) {
      console.warn('Could not fetch settings for contact form:', e.message);
    }

    const platformName = settings?.platformName || process.env.FROM_NAME || 'ExpertHub';
    const adminNotificationEmail = process.env.ADMIN_EMAIL || settings?.supportEmail || process.env.EMAIL_USER;

    // 3. Dispatch real-time Admin Notification (In-App + Socket.IO)
    try {
      const io = req.app.get('io');
      await sendNotification({
        recipientRole: 'ADMIN',
        recipientModel: 'Admin',
        title: 'New Contact Inquiry',
        message: `${inquiry.name} (${inquiry.email}) sent: "${inquiry.message.slice(0, 80)}${inquiry.message.length > 80 ? '...' : ''}"`,
        type: 'complaint_report',
        link: '/contact-inquiries',
        actionText: 'View Inquiries',
        badge: 'Contact'
      }, io);
    } catch (notifErr) {
      console.error('Error dispatching admin notification for contact inquiry:', notifErr.message);
    }

    // 4. Send Email Alert to Admin/Support Team (Safe try-catch)
    if (adminNotificationEmail) {
      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">📬 New Website Contact Inquiry</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Received from ${platformName} public contact form</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${inquiry.email}" style="color: #2563eb;">${inquiry.email}</a></td>
            </tr>
            ${inquiry.phone ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Phone:</strong></td><td style="padding: 8px 0; color: #0f172a;">${inquiry.phone}</td></tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>Subject:</strong></td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.subject}</td>
            </tr>
          </table>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Log into the Admin Panel under <em>Communication &rarr; Contact Inquiries</em> to reply or update this inquiry.</p>
        </div>
      `;

      sendEmail({
        email: adminNotificationEmail,
        subject: `[New Inquiry] ${inquiry.subject} from ${inquiry.name}`,
        message: `New inquiry from ${inquiry.name} (${inquiry.email}):\n\n${inquiry.message}`,
        htmlMessage: adminHtml
      }).catch(err => console.error('Admin inquiry alert email error:', err.message));
    }

    // 5. Send Acknowledgment Email to User (Safe try-catch)
    const userAckHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Thanks for reaching out, ${inquiry.name}! 👋</h2>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          We have received your message regarding <strong>"${inquiry.subject}"</strong>. Our team is reviewing your query and will get back to you within 24 hours.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #64748b; font-size: 13px; font-style: italic;">"${inquiry.message}"</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          If this is urgent, you can also reach us directly at <a href="mailto:${settings?.supportEmail || 'support@stitchplatform.com'}" style="color: #2563eb;">${settings?.supportEmail || 'support@stitchplatform.com'}</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">${platformName} Support Team</p>
      </div>
    `;

    sendEmail({
      email: inquiry.email,
      subject: `We've received your message - ${platformName}`,
      message: `Hi ${inquiry.name},\n\nThank you for reaching out to ${platformName}. We have received your query and will respond shortly.\n\nBest regards,\n${platformName} Team`,
      htmlMessage: userAckHtml
    }).catch(err => console.error('User inquiry acknowledgment email error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      inquiryId: inquiry._id
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again or contact us directly via email.',
      error: error.message
    });
  }
};

// @desc    Get all contact inquiries (Admin only)
// @route   GET /api/admin/contact-inquiries
// @access  Private (Admin)
exports.getInquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { subject: { $regex: s, $options: 'i' } },
        { message: { $regex: s, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [inquiries, total, pendingCount, inProgressCount, resolvedCount] = await Promise.all([
      ContactInquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('repliedBy', 'name email'),
      ContactInquiry.countDocuments(query),
      ContactInquiry.countDocuments({ status: 'PENDING' }),
      ContactInquiry.countDocuments({ status: 'IN_PROGRESS' }),
      ContactInquiry.countDocuments({ status: 'RESOLVED' })
    ]);

    res.json({
      success: true,
      inquiries,
      total,
      counts: {
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        all: pendingCount + inProgressCount + resolvedCount
      },
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inquiries', error: error.message });
  }
};

// @desc    Update inquiry status or admin notes
// @route   PUT /api/admin/contact-inquiries/:id/status
// @access  Private (Admin)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const inquiry = await ContactInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (status) inquiry.status = status;
    if (adminNotes !== undefined) inquiry.adminNotes = adminNotes;

    await inquiry.save();

    res.json({ success: true, message: 'Inquiry updated successfully', inquiry });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to update inquiry', error: error.message });
  }
};

// @desc    Reply to inquiry via email (Admin only)
// @route   POST /api/admin/contact-inquiries/:id/reply
// @access  Private (Admin)
exports.replyToInquiry = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message is required.' });
    }

    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    let settings = null;
    try {
      settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    } catch (e) {
      console.warn('Could not fetch settings:', e.message);
    }
    const platformName = settings?.platformName || process.env.FROM_NAME || 'ExpertHub';

    // Send email to user
    const replyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Response from ${platformName} Support</h2>
        </div>
        <p style="color: #334155; font-size: 15px;">Hello ${inquiry.name},</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 20px;">${replyMessage}</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Your original message:</p>
          <p style="margin: 0; color: #64748b; font-size: 13px; font-style: italic;">"${inquiry.message}"</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          If you have additional questions, feel free to reply directly to this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">${platformName} Support Team</p>
      </div>
    `;

    await sendEmail({
      email: inquiry.email,
      subject: `Re: ${inquiry.subject || 'Your Inquiry'} - ${platformName}`,
      message: `Hello ${inquiry.name},\n\n${replyMessage}\n\n---\nYour original message:\n${inquiry.message}`,
      htmlMessage: replyHtml
    });

    inquiry.replyMessage = replyMessage.trim();
    inquiry.repliedAt = new Date();
    inquiry.repliedBy = req.user?._id;
    inquiry.status = 'RESOLVED';
    await inquiry.save();

    res.json({
      success: true,
      message: 'Reply sent successfully to ' + inquiry.email,
      inquiry
    });
  } catch (error) {
    console.error('Error replying to inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply email: ' + error.message,
      error: error.message
    });
  }
};

// @desc    Delete inquiry (Admin only)
// @route   DELETE /api/admin/contact-inquiries/:id
// @access  Private (Admin)
exports.deleteInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inquiry', error: error.message });
  }
};

