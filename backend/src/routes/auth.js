// 🙋 Authentication Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const EncryptionService = require('../security/encryptionService');
const logger = require('../utils/logger');
const db = require('../database');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const encryptionService = new EncryptionService();

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await encryptionService.hashPassword(password);

    // Create user
    const userId = uuidv4();
    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, mfa_enabled)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, passwordHash, fullName || '', false]
    );

    logger.info(`User registered: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await encryptionService.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check MFA
    if (user.mfa_enabled) {
      const sessionId = uuidv4();
      // Store session temporarily
      await db.query(
        'UPDATE users SET mfa_session_id = $1 WHERE id = $2',
        [sessionId, user.id]
      );
      
      return res.json({
        success: true,
        requiresMFA: true,
        sessionId,
        message: 'Enter MFA code'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info(`User logged in: ${user.id}`);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/mfa/setup
 * Setup MFA for user
 */
router.post('/mfa/setup', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `SecureAI (${req.user.email})`,
      issuer: 'SecureAI Agent Platform'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode,
      message: 'Scan with authenticator app and verify with code'
    });
  } catch (error) {
    logger.error('MFA setup error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

/**
 * POST /api/v1/auth/mfa/verify
 * Verify MFA token
 */
router.post('/mfa/verify', async (req, res) => {
  try {
    const { sessionId, totpToken } = req.body;

    if (!sessionId || !totpToken) {
      return res.status(400).json({ error: 'Session and token required' });
    }

    // Find user by session
    const result = await db.query(
      'SELECT * FROM users WHERE mfa_session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const user = result.rows[0];

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: totpToken,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Clear session
    await db.query('UPDATE users SET mfa_session_id = NULL WHERE id = $1', [user.id]);

    logger.info(`MFA verified for user: ${user.id}`);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    logger.error('MFA verification error:', error);
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

module.exports = router;
