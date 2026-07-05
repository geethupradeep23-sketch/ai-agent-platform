// Email Integration Routes
const express = require('express');
const router = express.Router();
const EmailService = require('./emailService');
const auth = require('../../middleware/auth');
const logger = require('../../utils/logger');
const EncryptionService = require('../../security/encryptionService');
const db = require('../../database');

const emailService = new EmailService();
const encryptionService = new EncryptionService();

/**
 * POST /api/v1/integrations/email/connect
 * Connect email account
 */
router.post('/connect', auth, async (req, res) => {
  try {
    const { email, password, provider, imapConfig } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !provider) {
      return res.status(400).json({ error: 'Email and provider required' });
    }

    // Encrypt credentials
    const credentialsData = {
      email,
      password,
      provider,
      imapConfig
    };

    const encryptedCreds = encryptionService.encryptData(
      credentialsData,
      process.env.MASTER_ENCRYPTION_KEY
    );

    // Store in database
    await db.query(
      `INSERT INTO user_integrations (user_id, service_type, configuration, enabled, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, service_type) DO UPDATE SET configuration = $3, enabled = true`,
      [
        userId,
        'email',
        JSON.stringify(encryptedCreds),
        true,
        new Date()
      ]
    );

    // Initialize email service
    await emailService.initialize(userId, encryptedCreds);

    // Fetch initial emails
    await emailService.fetchGmailEmails(userId);
    await emailService.fetchImapEmails(userId);

    logger.info(`Email connected for user: ${userId}`);
    res.json({ success: true, message: 'Email connected successfully' });
  } catch (error) {
    logger.error('Error connecting email:', error);
    res.status(500).json({ error: 'Failed to connect email' });
  }
});

/**
 * GET /api/v1/integrations/email/messages
 * Get user's emails
 */
router.get('/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const emails = await emailService.getEmails(userId, limit, offset);

    res.json({
      success: true,
      data: emails,
      meta: { limit, offset, count: emails.length }
    });
  } catch (error) {
    logger.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

/**
 * POST /api/v1/integrations/email/send
 * Send encrypted email
 */
router.post('/send', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { to, subject, body, attachments } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body required' });
    }

    const result = await emailService.sendEmail(userId, to, subject, body, attachments);

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    logger.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/v1/integrations/email/sync
 * Manually sync emails
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await emailService.fetchGmailEmails(userId);
    await emailService.fetchImapEmails(userId);

    res.json({ success: true, message: 'Email sync initiated' });
  } catch (error) {
    logger.error('Error syncing emails:', error);
    res.status(500).json({ error: 'Failed to sync emails' });
  }
});

module.exports = router;
