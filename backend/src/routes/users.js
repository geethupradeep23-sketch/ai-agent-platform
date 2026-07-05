// 👤 User Routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../database');

/**
 * GET /api/v1/users/profile
 * Get user profile
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, email, full_name, mfa_enabled, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/v1/users/profile
 * Update user profile
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName } = req.body;

    const result = await db.query(
      `UPDATE users SET full_name = COALESCE($2, full_name), updated_at = NOW() 
       WHERE id = $1 RETURNING id, email, full_name`,
      [userId, fullName]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
