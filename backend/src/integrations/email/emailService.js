// 🔐 Secure Email Integration Service
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const Imap = require('imap');
const { google } = require('googleapis');
const logger = require('../../utils/logger');
const EncryptionService = require('../../security/encryptionService');
const db = require('../../database');
const redis = require('../../config/redis');
const { v4: uuidv4 } = require('uuid');

class EmailService {
  constructor() {
    this.transporter = null;
    this.imapClient = null;
    this.encryptionService = new EncryptionService();
    this.oauth2Client = null;
  }

  /**
   * Initialize Email Service with secure credentials
   */
  async initialize(userId, emailConfig) {
    try {
      logger.info(`Initializing Email Service for user: ${userId}`);

      // Decrypt email credentials
      const decryptedCreds = this.encryptionService.decryptData(
        emailConfig,
        process.env.MASTER_ENCRYPTION_KEY
      );

      const { email, password, provider, imapConfig, smtpConfig } = decryptedCreds;

      if (provider === 'gmail') {
        await this.initializeGmail(userId, decryptedCreds);
      } else if (provider === 'outlook') {
        await this.initializeOutlook(userId, decryptedCreds);
      } else {
        await this.initializeImap(userId, decryptedCreds);
      }

      logger.info(`Email service initialized for user: ${userId}`);
    } catch (error) {
      logger.error('Email initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize Gmail with OAuth2
   */
  async initializeGmail(userId, credentials) {
    try {
      const { clientId, clientSecret, refreshToken } = credentials.oauth2;

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3001/api/v1/integrations/email/google/callback'
      );

      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      // Test connection
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });

      logger.info(`Gmail authenticated for user: ${userId}`);
    } catch (error) {
      logger.error('Gmail initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize Outlook/Office365
   */
  async initializeOutlook(userId, credentials) {
    try {
      const { clientId, clientSecret, refreshToken } = credentials.oauth2;

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3001/api/v1/integrations/email/outlook/callback'
      );

      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      logger.info(`Outlook authenticated for user: ${userId}`);
    } catch (error) {
      logger.error('Outlook initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize standard IMAP connection
   */
  async initializeImap(userId, credentials) {
    try {
      const { email, password, imapConfig } = credentials;

      this.imapClient = new Imap({
        user: email,
        password: password,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      // Connect to IMAP server
      await new Promise((resolve, reject) => {
        this.imapClient.openBox('INBOX', false, (err, box) => {
          if (err) reject(err);
          else resolve(box);
        });
      });

      logger.info(`IMAP connected for user: ${userId}`);
    } catch (error) {
      logger.error('IMAP initialization error:', error);
      throw error;
    }
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchGmailEmails(userId, maxResults = 50) {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Get email list
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: 'is:unread'
      });

      const messages = response.data.messages || [];

      for (const message of messages) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        await this.storeEmailMessage(userId, fullMessage.data);
      }

      logger.info(`Fetched ${messages.length} Gmail emails for user: ${userId}`);
    } catch (error) {
      logger.error('Error fetching Gmail emails:', error);
    }
  }

  /**
   * Fetch emails from IMAP
   */
  async fetchImapEmails(userId, limit = 50) {
    try {
      return new Promise((resolve, reject) => {
        this.imapClient.search(['UNSEEN'], (err, results) => {
          if (err) reject(err);

          if (results.length === 0) {
            resolve([]);
            return;
          }

          const f = this.imapClient.fetch(results.slice(0, limit), { bodies: '' });

          const emails = [];

          f.on('message', (msg, seqno) => {
            simpleParser(msg, async (err, parsed) => {
              if (err) {
                logger.error('Error parsing email:', err);
                return;
              }

              const emailData = {
                id: uuidv4(),
                from: parsed.from.text,
                to: parsed.to.text,
                subject: parsed.subject,
                text: parsed.text,
                html: parsed.html,
                timestamp: parsed.date,
                attachments: parsed.attachments || []
              };

              await this.storeEmailMessage(userId, emailData);
              emails.push(emailData);
            });
          });

          f.on('error', reject);
          f.on('end', () => resolve(emails));
        });
      });
    } catch (error) {
      logger.error('Error fetching IMAP emails:', error);
      throw error;
    }
  }

  /**
   * Store email securely in database
   */
  async storeEmailMessage(userId, emailData) {
    try {
      // Extract text content
      const textContent = emailData.text || emailData.body?.data || '';

      // Encrypt email data
      const encryptedData = this.encryptionService.encryptData(
        emailData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      // Check if email already exists
      const exists = await db.query(
        'SELECT id FROM emails WHERE user_id = $1 AND message_id = $2',
        [userId, emailData.messageId || emailData.id]
      );

      if (exists.rows.length === 0) {
        await db.query(
          `INSERT INTO emails 
           (id, user_id, message_id, sender, subject, content, encrypted_data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            userId,
            emailData.messageId || emailData.id,
            emailData.from,
            emailData.subject,
            textContent.substring(0, 500), // Preview
            JSON.stringify(encryptedData),
            emailData.timestamp || new Date()
          ]
        );

        logger.info(`Email stored and encrypted for user: ${userId}`);
      }
    } catch (error) {
      logger.error('Error storing email:', error);
    }
  }

  /**
   * Send encrypted email
   */
  async sendEmail(userId, to, subject, body, attachments = []) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        html: body,
        attachments: attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log sent email (encrypted)
      const emailData = {
        id: uuidv4(),
        to: to,
        subject: subject,
        body: body,
        timestamp: new Date(),
        isSent: true,
        messageId: info.messageId
      };

      const encryptedData = this.encryptionService.encryptData(
        emailData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      await db.query(
        `INSERT INTO emails 
         (id, user_id, message_id, sender, subject, content, encrypted_data, is_sent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          emailData.id,
          userId,
          info.messageId,
          process.env.EMAIL_FROM,
          subject,
          body.substring(0, 500),
          JSON.stringify(encryptedData),
          true,
          emailData.timestamp
        ]
      );

      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Get emails for user
   */
  async getEmails(userId, limit = 50, offset = 0) {
    try {
      const result = await db.query(
        `SELECT id, user_id, sender, subject, content, created_at FROM emails 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Disconnect email service
   */
  async disconnect() {
    try {
      if (this.imapClient) {
        this.imapClient.closeBox(false, () => {});
        this.imapClient.closeBox(true, () => {});
        this.imapClient.end();
      }
      logger.info('Email service disconnected');
    } catch (error) {
      logger.error('Error disconnecting email service:', error);
    }
  }
}

module.exports = EmailService;
