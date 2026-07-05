// 🎯 Agent Manager - Multi-Agent Orchestration
const logger = require('../../utils/logger');
const db = require('../../database');
const Agent = require('./Agent');
const { v4: uuidv4 } = require('uuid');

class AgentManager {
  constructor() {
    this.agents = new Map();
  }

  /**
   * Create new agent
   */
  async createAgent(userId, agentData) {
    try {
      const agentId = uuidv4();

      const result = await db.query(
        `INSERT INTO agents 
         (id, user_id, name, description, agent_type, configuration, api_key, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          agentId,
          userId,
          agentData.name,
          agentData.description,
          agentData.type,
          JSON.stringify(agentData.config),
          this.generateApiKey(),
          'active'
        ]
      );

      logger.info(`Agent created: ${agentId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Load agent from database
   */
  async loadAgent(agentId, userId) {
    try {
      const cacheKey = `agent:${agentId}`;
      
      // Check cache
      if (this.agents.has(cacheKey)) {
        return this.agents.get(cacheKey);
      }

      // Load from database
      const agent = await Agent.init(agentId, userId);
      this.agents.set(cacheKey, agent);

      return agent;
    } catch (error) {
      logger.error('Error loading agent:', error);
      throw error;
    }
  }

  /**
   * Process message across agents
   */
  async processMessage(userId, message, agentId = null) {
    try {
      let agent;

      if (agentId) {
        // Route to specific agent
        agent = await this.loadAgent(agentId, userId);
      } else {
        // Route to best matching agent
        agent = await this.selectBestAgent(userId, message);
      }

      if (!agent) {
        throw new Error('No suitable agent found');
      }

      // Create or get session
      const sessionId = await this.getOrCreateSession(userId, agent.id);

      // Process message
      const response = await agent.processMessage(message, sessionId);

      return { agentId: agent.id, response, sessionId };
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Select best agent for message
   */
  async selectBestAgent(userId, message) {
    try {
      const result = await db.query(
        'SELECT * FROM agents WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
        [userId, 'active']
      );

      if (result.rows.length === 0) {
        return null;
      }

      // For now, return the first active agent
      // In production, use ML to match best agent
      return new Agent(result.rows[0]);
    } catch (error) {
      logger.error('Error selecting agent:', error);
      return null;
    }
  }

  /**
   * Get or create session
   */
  async getOrCreateSession(userId, agentId) {
    try {
      const result = await db.query(
        `SELECT id FROM agent_sessions 
         WHERE user_id = $1 AND agent_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, agentId]
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Create new session
      const sessionId = uuidv4();
      await db.query(
        `INSERT INTO agent_sessions (id, agent_id, user_id, session_name, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, agentId, userId, `Session ${new Date().toLocaleString()}`, new Date()]
      );

      return sessionId;
    } catch (error) {
      logger.error('Error getting or creating session:', error);
      throw error;
    }
  }

  /**
   * List user's agents
   */
  async listAgents(userId, limit = 20, offset = 0) {
    try {
      const result = await db.query(
        `SELECT id, name, description, agent_type, status, created_at FROM agents 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error listing agents:', error);
      throw error;
    }
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId, userId) {
    try {
      const cacheKey = `agent:${agentId}`;
      this.agents.delete(cacheKey);

      const result = await db.query(
        'DELETE FROM agents WHERE id = $1 AND user_id = $2 RETURNING id',
        [agentId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Agent not found');
      }

      logger.info(`Agent deleted: ${agentId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting agent:', error);
      throw error;
    }
  }

  /**
   * Generate API key
   */
  generateApiKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new AgentManager();
