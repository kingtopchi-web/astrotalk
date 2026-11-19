const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Setting = require('../models/Setting');

/**
 * GET /api/admin/chat-cleanup/stats
 * Return metrics on total messages, conversations, and messages eligible for deletion
 */
exports.getChatCleanupStats = async (req, res) => {
  try {
    const setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    const retentionDays = Number(setting?.chatRetentionDays ?? 30);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const [totalMessages, totalConversations, expiredMessagesCount] = await Promise.all([
      Message.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments({ createdAt: { $lt: cutoffDate } })
    ]);

    res.json({
      success: true,
      totalMessages,
      totalConversations,
      expiredMessagesCount,
      retentionDays,
      cutoffDate,
      enableAutoDelete: Boolean(setting?.enableAutoDeleteOldChats),
      lastChatCleanupAt: setting?.lastChatCleanupAt || null,
      lastCleanedMessagesCount: setting?.lastCleanedMessagesCount || 0
    });
  } catch (error) {
    console.error('Error fetching chat cleanup stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve chat cleanup metrics', error: error.message });
  }
};

/**
 * POST /api/admin/chat-cleanup/purge
 * Delete messages older than the specified retention days (or configured default)
 */
exports.purgeExpiredChats = async (req, res) => {
  try {
    const setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const requestedDays = req.body?.days !== undefined ? Number(req.body.days) : Number(setting?.chatRetentionDays ?? 30);
    
    if (isNaN(requestedDays) || requestedDays < 1) {
      return res.status(400).json({ success: false, message: 'Retention period must be at least 1 day' });
    }

    const cutoffDate = new Date(Date.now() - requestedDays * 24 * 60 * 60 * 1000);

    // 1. Delete messages older than cutoffDate
    const deleteResult = await Message.deleteMany({ createdAt: { $lt: cutoffDate } });

    // 2. Identify active conversation IDs remaining
    const remainingConvIds = await Message.distinct('conversationId');

    // 3. Remove stale conversations that have no messages and were created before cutoffDate
    const orphanDeleteResult = await Conversation.deleteMany({
      _id: { $nin: remainingConvIds },
      createdAt: { $lt: cutoffDate }
    });

    // 4. Update conversations where lastMessage was older than cutoffDate
    await Conversation.updateMany(
      {
        _id: { $in: remainingConvIds },
        lastMessageAt: { $lt: cutoffDate }
      },
      {
        $set: {
          lastMessage: '[Old message history archived as per retention policy]'
        }
      }
    );

    // 5. Update last cleanup metadata in settings
    await Setting.findOneAndUpdate(
      { singletonKey: 'GLOBAL_SETTINGS' },
      {
        $set: {
          lastChatCleanupAt: new Date(),
          lastCleanedMessagesCount: deleteResult.deletedCount
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} chat message(s) older than ${requestedDays} day(s).`,
      deletedCount: deleteResult.deletedCount,
      deletedConversationsCount: orphanDeleteResult.deletedCount,
      cutoffDate,
      days: requestedDays
    });
  } catch (error) {
    console.error('Error purging expired chats:', error);
    res.status(500).json({ success: false, message: 'Failed to purge expired chats', error: error.message });
  }
};

/**
 * Background auto-cleanup worker (called on schedule or server boot)
 */
exports.runAutoChatCleanup = async () => {
  try {
    const setting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' }).lean();
    if (!setting?.enableAutoDeleteOldChats) {
      return; // Disabled by admin
    }

    const retentionDays = Number(setting?.chatRetentionDays ?? 30);
    if (retentionDays < 1) return;

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const deleteResult = await Message.deleteMany({ createdAt: { $lt: cutoffDate } });

    if (deleteResult.deletedCount > 0) {
      console.log(`[AutoChatCleanup] Purged ${deleteResult.deletedCount} messages older than ${retentionDays} days.`);
      
      const remainingConvIds = await Message.distinct('conversationId');
      await Conversation.deleteMany({
        _id: { $nin: remainingConvIds },
        createdAt: { $lt: cutoffDate }
      });

      await Setting.findOneAndUpdate(
        { singletonKey: 'GLOBAL_SETTINGS' },
        {
          $set: {
            lastChatCleanupAt: new Date(),
            lastCleanedMessagesCount: deleteResult.deletedCount
          }
        }
      );
    }
  } catch (err) {
    console.error('[AutoChatCleanup] Periodic cleanup error:', err.message);
  }
};
