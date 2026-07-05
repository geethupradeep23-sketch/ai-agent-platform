// WhatsApp Integration Routes
const express = require('express');
const router = express.Router();
const WhatsAppService = require('./whatsappService');
const auth = require('../../middleware/auth');
const logger = require('../../utils/logger');
const redis = require('../../config/redis');
const db = require('../../database');

const whatsappService = new WhatsAppService();

/**
 * POST /api/v1/integrations/whatsapp/initialize
 * Initialize WhatsApp connection
 */
router.post('/initialize', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Initialize WhatsApp service
    await whatsappService.initialize(userId);

    // Store integration in database
    await db.query(
      `INSERT INTO user_integrations (user_id, service_type, enabled, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, service_type) DO UPDATE SET enabled = true`,
      [userId, 'whatsapp', true, new Date()]
    );

    logger.info(`WhatsApp initialized for user: ${userId}`);
    res.json({ success: true, message: 'WhatsApp connection initiated. Scan QR code.' });
  } catch (error) {
    logger.error('Error initializing WhatsApp:', error);
    res.status(500).json({ error: 'Failed to initialize WhatsApp' });
  }
});

/**
 * GET /api/v1/integrations/whatsapp/qr
 * Get WhatsApp QR code
 */
router.get('/qr', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const qrCode = await redis.get(`whatsapp:qr:${userId}`);

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }

    res.json({ success: true, qrCode });
  } catch (error) {
    logger.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

/**
 * GET /api/v1/integrations/whatsapp/messages
 * Get WhatsApp messages
 */
router.get('/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await whatsappService.getMessages(userId, limit, offset);

    res.json({
      success: true,
      data: messages,
      meta: { limit, offset, count: messages.length }
    });
  } catch (error) {
    logger.error('Error fetching WhatsApp messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/v1/integrations/whatsapp/send
 * Send WhatsApp message
 */
router.post('/send', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message required' });
    }

    const result = await whatsappService.sendMessage(phoneNumber, message, userId);

    res.json({ success: true, messageId: result.id.id });
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/v1/integrations/whatsapp/sync
 * Manually sync WhatsApp messages
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await whatsappService.syncMessages(userId);

    res.json({ success: true, message: 'WhatsApp sync initiated' });
  } catch (error) {
    logger.error('Error syncing WhatsApp:', error);
    res.status(500).json({ error: 'Failed to sync WhatsApp' });
  }
});

module.exports = router;
