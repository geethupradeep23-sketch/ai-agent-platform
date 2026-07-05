// 📈 Webhook Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * POST /api/v1/webhooks
 * Create webhook
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, events, active } = req.body;

    if (!url || !events || events.length === 0) {
      return res.status(400).json({ error: 'URL and events are required' });
    }

    const webhookId = uuidv4();
    const secret = crypto.randomBytes(32).toString('hex');

    await db.query(
      `INSERT INTO webhooks (id, user_id, url, events, active, secret, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        webhookId,
        userId,
        url,
        events,
        active !== false,
        secret,
        new Date()
      ]
    );

    logger.info(`Webhook created: ${webhookId}`);

    res.status(201).json({
      success: true,
      data: { id: webhookId, secret }
    });
  } catch (error) {
    logger.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * GET /api/v1/webhooks
 * List webhooks
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, url, events, active, created_at FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

/**
 * DELETE /api/v1/webhooks/:webhookId
 * Delete webhook
 */
router.delete('/:webhookId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { webhookId } = req.params;

    await db.query(
      'DELETE FROM webhooks WHERE id = $1 AND user_id = $2',
      [webhookId, userId]
    );

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    logger.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

module.exports = router;
