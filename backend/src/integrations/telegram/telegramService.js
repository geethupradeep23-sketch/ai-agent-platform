# 🖬 Telegram Integration Service
const TelegramBot = require('telegram-bot-api');
const logger = require('../../utils/logger');
const EncryptionService = require('../../security/encryptionService');
const db = require('../../database');
const redis = require('../../config/redis');
const { v4: uuidv4 } = require('uuid');

class TelegramService {
  constructor() {
    this.bot = null;
    this.encryptionService = new EncryptionService();
  }

  /**
   * Initialize Telegram Bot
   */
  async initialize(userId, config) {
    try {
      logger.info(`Initializing Telegram for user: ${userId}`);

      const decryptedConfig = this.encryptionService.decryptData(
        config,
        process.env.MASTER_ENCRYPTION_KEY
      );

      this.bot = new TelegramBot({
        token: decryptedConfig.botToken || process.env.TELEGRAM_BOT_TOKEN
      });

      // Handle incoming messages
      this.bot.on('message', async (message) => {
        await this.handleIncomingMessage(message, userId);
      });

      logger.info(`Telegram initialized for user: ${userId}`);
    } catch (error) {
      logger.error('Telegram initialization error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming Telegram message
   */
  async handleIncomingMessage(message, userId) {
    try {
      const messageData = {
        id: uuidv4(),
        telegramMessageId: message.message_id,
        sender_id: message.from.id,
        sender_name: message.from.first_name,
        message_text: message.text,
        timestamp: new Date(message.date * 1000)
      };

      // Encrypt message
      const encryptedData = this.encryptionService.encryptData(
        messageData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      // Store in database
      await db.query(
        `INSERT INTO telegram_messages 
         (id, user_id, telegram_message_id, sender_id, message_text, encrypted_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          messageData.id,
          userId,
          messageData.telegramMessageId,
          messageData.sender_id,
          messageData.message_text,
          JSON.stringify(encryptedData),
          messageData.timestamp
        ]
      );

      logger.info(`Telegram message stored: ${messageData.id}`);
    } catch (error) {
      logger.error('Error handling Telegram message:', error);
    }
  }

  /**
   * Send Telegram message
   */
  async sendMessage(chatId, message) {
    try {
      if (!this.bot) {
        throw new Error('Telegram bot not initialized');
      }

      const result = await this.bot.sendMessage({
        chat_id: chatId,
        text: message
      });

      return result;
    } catch (error) {
      logger.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    try {
      if (this.bot) {
        this.bot = null;
        logger.info('Telegram bot disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Telegram:', error);
    }
  }
}

module.exports = TelegramService;
