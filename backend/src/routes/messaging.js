// 🗣️ Messaging Routes
const express = require('express');
const router = express.Router();
const MessagingHub = require('../integrations/messaging/messagingHub');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const messagingHub = new MessagingHub();

/**
 * GET /api/v1/integrations/messaging/feed
 * Get unified message feed
 */
router.get('/feed', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await messagingHub.getUnifiedFeed(userId, limit, offset);

    res.json({
      success: true,
      data: messages,
      meta: { limit, offset, count: messages.length }
    });
  } catch (error) {
    logger.error('Error fetching unified feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

/**
 * GET /api/v1/integrations/messaging/search
 * Search across all messaging services
 */
router.get('/search', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, sources } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const sourcesArray = sources ? sources.split(',') : ['whatsapp', 'email', 'telegram'];
    const results = await messagingHub.searchMessages(userId, query, sourcesArray);

    res.json({
      success: true,
      data: results,
      meta: { query, sources: sourcesArray, count: results.length }
    });
  } catch (error) {
    logger.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

/**
 * POST /api/v1/integrations/messaging/initialize
 * Initialize all messaging services for user
 */
router.post('/initialize', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await messagingHub.initializeServices(userId);

    res.json({ success: true, message: 'Messaging services initialized' });
  } catch (error) {
    logger.error('Error initializing messaging:', error);
    res.status(500).json({ error: 'Failed to initialize messaging' });
  }
});

module.exports = router;
