const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

router.get('/conversations', auth, messageController.getConversations);
router.post('/conversations', auth, messageController.createConversation);
router.delete('/conversations/:conversationId/clear', auth, messageController.clearConversation);
router.delete('/conversations/:conversationId', auth, messageController.deleteConversation);
router.get('/conversations/:conversationId/messages', auth, messageController.getMessages);
router.post('/conversations/:conversationId/messages', auth, messageController.sendMessage);
router.post('/bulk-delete', auth, messageController.deleteBulkMessages);
router.delete('/:messageId', auth, messageController.deleteMessage);

module.exports = router;
