const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

router.get('/conversations', auth, messageController.getConversations);
router.post('/conversations', auth, messageController.createConversation);
router.get('/conversations/:conversationId/messages', auth, messageController.getMessages);
router.post('/conversations/:conversationId/messages', auth, messageController.sendMessage);

module.exports = router;
