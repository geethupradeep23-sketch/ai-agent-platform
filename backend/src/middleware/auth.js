// 🔐 Authentication Middleware
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../database');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted
    const blacklist = await db.query(
      'SELECT id FROM api_keys WHERE key_hash = $1 AND expires_at < NOW()',
      [token]
    );

    if (blacklist.rows.length > 0) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Attach user to request
    req.user = decoded;
    req.user.id = decoded.userId || decoded.sub;

    // Log request
    logger.info(`Authenticated request from user: ${req.user.id}`);

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const optional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    req.user.id = decoded.userId || decoded.sub;
  } catch (error) {
    // Continue without authentication
  }

  next();
};

module.exports = auth;
module.exports.optional = optional;
