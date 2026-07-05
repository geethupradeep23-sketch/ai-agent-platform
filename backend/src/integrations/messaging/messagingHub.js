// 🔐 Unified Messaging Hub
const WhatsAppService = require('./whatsappService');
const EmailService = require('./emailService');
const TelegramService = require('./telegramService');
const logger = require('../../utils/logger');
const db = require('../../database');
const redis = require('../../config/redis');

class MessagingHub {
  constructor() {
    this.whatsapp = new WhatsAppService();
    this.email = new EmailService();
    this.telegram = new TelegramService();
    this.activeServices = new Map();
  }

  /**
   * Initialize all messaging services for user
   */
  async initializeServices(userId) {
    try {
      logger.info(`Initializing messaging services for user: ${userId}`);

      // Get user's enabled integrations
      const result = await db.query(
        `SELECT service_type, configuration FROM user_integrations 
         WHERE user_id = $1 AND enabled = true`,
        [userId]
      );

      for (const integration of result.rows) {
        try {
          switch (integration.service_type) {
            case 'whatsapp':
              await this.whatsapp.initialize(userId);
              this.activeServices.set(`whatsapp:${userId}`, this.whatsapp);
              logger.info(`WhatsApp service initialized for user: ${userId}`);
              break;

            case 'email':
              await this.email.initialize(userId, integration.configuration);
              this.activeServices.set(`email:${userId}`, this.email);
              logger.info(`Email service initialized for user: ${userId}`);
              break;

            case 'telegram':
              await this.telegram.initialize(userId, integration.configuration);
              this.activeServices.set(`telegram:${userId}`, this.telegram);
              logger.info(`Telegram service initialized for user: ${userId}`);
              break;
          }
        } catch (error) {
          logger.error(`Error initializing ${integration.service_type}:`, error);
        }
      }

      // Set sync interval for all services
      this.startSyncInterval(userId);
    } catch (error) {
      logger.error('Error initializing messaging services:', error);
    }
  }

  /**
   * Start periodic sync of all messages
   */
  startSyncInterval(userId) {
    const syncInterval = setInterval(async () => {
      try {
        // Sync WhatsApp
        if (this.activeServices.has(`whatsapp:${userId}`)) {
          await this.whatsapp.syncMessages(userId);
        }

        // Sync Email
        if (this.activeServices.has(`email:${userId}`)) {
          const emailConfig = await db.query(
            'SELECT configuration FROM user_integrations WHERE user_id = $1 AND service_type = $2',
            [userId, 'email']
          );
          if (emailConfig.rows.length > 0) {
            await this.email.fetchGmailEmails(userId);
            await this.email.fetchImapEmails(userId);
          }
        }

        logger.info(`Messaging sync completed for user: ${userId}`);
      } catch (error) {
        logger.error('Error in messaging sync:', error);
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes

    // Store interval ID for cleanup
    redis.setex(`messaging:sync:${userId}`, 86400, syncInterval.toString());
  }

  /**
   * Get unified message feed
   */
  async getUnifiedFeed(userId, limit = 50, offset = 0) {
    try {
      // Fetch from all sources
      const [whatsappMessages, emailMessages, telegramMessages] = await Promise.all([
        db.query(
          `SELECT 'whatsapp' as source, id, sender as from_address, content, created_at FROM whatsapp_messages 
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        ),
        db.query(
          `SELECT 'email' as source, id, sender as from_address, subject as content, created_at FROM emails 
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        ),
        db.query(
          `SELECT 'telegram' as source, id, sender_id as from_address, message_text as content, created_at FROM telegram_messages 
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        )
      ]);

      // Merge and sort by timestamp
      const unified = [
        ...whatsappMessages.rows,
        ...emailMessages.rows,
        ...telegramMessages.rows
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return unified.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching unified feed:', error);
      throw error;
    }
  }

  /**
   * Search across all messaging services
   */
  async searchMessages(userId, query, sources = ['whatsapp', 'email', 'telegram']) {
    try {
      const results = [];

      if (sources.includes('whatsapp')) {
        const whatsappResults = await db.query(
          `SELECT * FROM whatsapp_messages 
           WHERE user_id = $1 AND (content ILIKE $2 OR sender ILIKE $2)
           ORDER BY created_at DESC LIMIT 20`,
          [userId, `%${query}%`]
        );
        results.push(...whatsappResults.rows.map(r => ({ ...r, source: 'whatsapp' })));
      }

      if (sources.includes('email')) {
        const emailResults = await db.query(
          `SELECT * FROM emails 
           WHERE user_id = $1 AND (subject ILIKE $2 OR content ILIKE $2 OR sender ILIKE $2)
           ORDER BY created_at DESC LIMIT 20`,
          [userId, `%${query}%`]
        );
        results.push(...emailResults.rows.map(r => ({ ...r, source: 'email' })));
      }

      if (sources.includes('telegram')) {
        const telegramResults = await db.query(
          `SELECT * FROM telegram_messages 
           WHERE user_id = $1 AND message_text ILIKE $2
           ORDER BY created_at DESC LIMIT 20`,
          [userId, `%${query}%`]
        );
        results.push(...telegramResults.rows.map(r => ({ ...r, source: 'telegram' })));
      }

      return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Disconnect all services
   */
  async disconnectAll() {
    try {
      await Promise.all([
        this.whatsapp.disconnect(),
        this.email.disconnect(),
        this.telegram.disconnect()
      ]);
      this.activeServices.clear();
      logger.info('All messaging services disconnected');
    } catch (error) {
      logger.error('Error disconnecting messaging services:', error);
    }
  }
}

module.exports = MessagingHub;
