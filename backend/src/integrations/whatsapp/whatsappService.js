// 🔐 Secure WhatsApp Integration Service
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode-terminal');
const logger = require('../../utils/logger');
const EncryptionService = require('../../security/encryptionService');
const db = require('../../database');
const redis = require('../../config/redis');
const { v4: uuidv4 } = require('uuid');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isAuthenticated = false;
    this.encryptionService = new EncryptionService();
    this.messageQueue = [];
  }

  /**
   * Initialize WhatsApp client with secure local authentication
   */
  async initialize(userId) {
    try {
      logger.info(`Initializing WhatsApp for user: ${userId}`);

      this.client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ]
        },
        restartOnAuthFail: true,
        qrMaxRetries: 5
      });

      // QR Code Event for scanning
      this.client.on('qr', (qr) => {
        logger.info(`WhatsApp QR Code generated for user: ${userId}`);
        QRCode.generate(qr, { small: true });
        
        // Store QR in Redis for web display (expires in 5 min)
        redis.setex(`whatsapp:qr:${userId}`, 300, qr);
      });

      // Authentication Success
      this.client.on('authenticated', () => {
        this.isAuthenticated = true;
        logger.info(`WhatsApp authenticated for user: ${userId}`);
        redis.del(`whatsapp:qr:${userId}`);
      });

      // Authentication Failed
      this.client.on('auth_failure', (msg) => {
        logger.error(`WhatsApp auth failed for user: ${userId}`, msg);
        this.isAuthenticated = false;
      });

      // Ready Event
      this.client.on('ready', async () => {
        logger.info(`WhatsApp client ready for user: ${userId}`);
        await this.syncMessages(userId);
      });

      // Incoming Messages
      this.client.on('message', async (message) => {
        await this.handleIncomingMessage(message, userId);
      });

      // Disconnected
      this.client.on('disconnected', () => {
        this.isAuthenticated = false;
        logger.warn(`WhatsApp disconnected for user: ${userId}`);
      });

      await this.client.initialize();
      logger.info(`WhatsApp client initialized for user: ${userId}`);
    } catch (error) {
      logger.error('WhatsApp initialization error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages securely
   */
  async handleIncomingMessage(message, userId) {
    try {
      // Skip group messages if configured
      if (message.isGroupMsg && !process.env.WHATSAPP_INCLUDE_GROUPS) {
        return;
      }

      // Extract message data
      const messageData = {
        id: uuidv4(),
        whatsappMessageId: message.id.id,
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: new Date(message.timestamp * 1000),
        isGroup: message.isGroupMsg,
        hasMedia: message.hasMedia,
        mediaType: message.type,
        senderName: message._data.notifyName || 'Unknown'
      };

      // Encrypt message content
      const encryptedData = this.encryptionService.encryptData(
        messageData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      // Store in database
      await db.query(
        `INSERT INTO whatsapp_messages 
         (id, user_id, whatsapp_message_id, sender, content, encrypted_data, message_type, is_group, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          messageData.id,
          userId,
          messageData.whatsappMessageId,
          messageData.from,
          messageData.body.substring(0, 100), // Preview
          JSON.stringify(encryptedData),
          messageData.mediaType,
          messageData.isGroup,
          messageData.timestamp
        ]
      );

      // Store in cache for real-time access
      await redis.setex(
        `whatsapp:msg:${messageData.id}`,
        86400, // 24 hours
        JSON.stringify(encryptedData)
      );

      // Trigger agent processing
      await this.processWithAgent(userId, messageData);

      logger.info(`WhatsApp message received and encrypted: ${messageData.id}`);
    } catch (error) {
      logger.error('Error handling incoming WhatsApp message:', error);
    }
  }

  /**
   * Sync historical messages
   */
  async syncMessages(userId) {
    try {
      logger.info(`Syncing WhatsApp messages for user: ${userId}`);

      const chats = await this.client.getChats();

      for (const chat of chats) {
        // Limit to last 100 messages per chat
        const messages = await chat.fetchMessages({ limit: 100 });

        for (const message of messages) {
          const messageData = {
            id: uuidv4(),
            whatsappMessageId: message.id.id,
            from: message.from,
            body: message.body,
            timestamp: new Date(message.timestamp * 1000),
            isGroup: message.isGroupMsg,
            senderName: message._data.notifyName || 'Unknown'
          };

          // Encrypt and store
          const encryptedData = this.encryptionService.encryptData(
            messageData,
            process.env.MASTER_ENCRYPTION_KEY
          );

          // Check if message already exists
          const exists = await db.query(
            'SELECT id FROM whatsapp_messages WHERE whatsapp_message_id = $1 AND user_id = $2',
            [messageData.whatsappMessageId, userId]
          );

          if (exists.rows.length === 0) {
            await db.query(
              `INSERT INTO whatsapp_messages 
               (id, user_id, whatsapp_message_id, sender, content, encrypted_data, is_group, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                messageData.id,
                userId,
                messageData.whatsappMessageId,
                messageData.from,
                messageData.body.substring(0, 100),
                JSON.stringify(encryptedData),
                messageData.isGroup,
                messageData.timestamp
              ]
            );
          }
        }
      }

      logger.info(`WhatsApp sync completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error syncing WhatsApp messages:', error);
    }
  }

  /**
   * Send encrypted message via WhatsApp
   */
  async sendMessage(phoneNumber, message, userId) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('WhatsApp client not authenticated');
      }

      // Ensure phone number format
      const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;

      // Send message
      const result = await this.client.sendMessage(chatId, message);

      // Log sent message (encrypted)
      const messageData = {
        id: uuidv4(),
        whatsappMessageId: result.id.id,
        from: 'self',
        to: phoneNumber,
        body: message,
        timestamp: new Date(),
        isSent: true
      };

      const encryptedData = this.encryptionService.encryptData(
        messageData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      await db.query(
        `INSERT INTO whatsapp_messages 
         (id, user_id, whatsapp_message_id, sender, content, encrypted_data, is_sent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          messageData.id,
          userId,
          messageData.whatsappMessageId,
          'self',
          message.substring(0, 100),
          JSON.stringify(encryptedData),
          true,
          messageData.timestamp
        ]
      );

      logger.info(`WhatsApp message sent: ${messageData.id}`);
      return result;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Process message with AI agent
   */
  async processWithAgent(userId, messageData) {
    try {
      // Decrypt message
      const decryptedMessage = this.encryptionService.decryptData(
        JSON.parse(messageData.encrypted_data),
        process.env.MASTER_ENCRYPTION_KEY
      );

      // Send to agent for processing
      // This will be handled by the agent system
      logger.info(`Processing WhatsApp message with agent: ${messageData.id}`);
    } catch (error) {
      logger.error('Error processing message with agent:', error);
    }
  }

  /**
   * Get messages for user
   */
  async getMessages(userId, limit = 50, offset = 0) {
    try {
      const result = await db.query(
        `SELECT * FROM whatsapp_messages 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching WhatsApp messages:', error);
      throw error;
    }
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isAuthenticated = false;
        logger.info('WhatsApp client disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting WhatsApp:', error);
    }
  }
}

module.exports = WhatsAppService;
