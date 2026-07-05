// 🛣️ Agent Routes
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const agentManager = require('../manager/AgentManager');
const logger = require('../../utils/logger');
const db = require('../../database');

/**
 * POST /api/v1/agents
 * Create new agent
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, type, config } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const agent = await agentManager.createAgent(userId, {
      name,
      description,
      type,
      config: config || { model: 'claude', temperature: 0.7 }
    });

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

/**
 * GET /api/v1/agents
 * List user's agents
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const agents = await agentManager.listAgents(userId, limit, offset);

    res.json({
      success: true,
      data: agents,
      meta: { limit, offset, count: agents.length }
    });
  } catch (error) {
    logger.error('Error listing agents:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

/**
 * GET /api/v1/agents/:agentId
 * Get agent details
 */
router.get('/:agentId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { agentId } = req.params;

    const result = await db.query(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [agentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

/**
 * PUT /api/v1/agents/:agentId
 * Update agent
 */
router.put('/:agentId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { agentId } = req.params;
    const { name, description, config } = req.body;

    const result = await db.query(
      `UPDATE agents 
       SET name = COALESCE($3, name), 
           description = COALESCE($4, description),
           configuration = COALESCE($5, configuration),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        agentId,
        userId,
        name,
        description,
        config ? JSON.stringify(config) : null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * DELETE /api/v1/agents/:agentId
 * Delete agent
 */
router.delete('/:agentId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { agentId } = req.params;

    await agentManager.deleteAgent(agentId, userId);

    res.json({ success: true, message: 'Agent deleted' });
  } catch (error) {
    logger.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

/**
 * POST /api/v1/agents/:agentId/message
 * Send message to agent
 */
router.post('/:agentId/message', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { agentId } = req.params;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await agentManager.processMessage(userId, message, agentId);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
