// 🔐 Encryption Service - AES-256-GCM
const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.saltLength = 16;
    this.tagLength = 16;
    this.ivLength = 16;
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  encryptData(data, masterKey) {
    try {
      const keyBuffer = Buffer.from(masterKey, 'hex');
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  decryptData(encryptedData, masterKey) {
    try {
      const keyBuffer = Buffer.from(masterKey, 'hex');
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        keyBuffer,
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate secure API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate JWT secret
   */
  generateJWTSecret() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = EncryptionService;
