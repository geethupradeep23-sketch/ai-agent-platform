// 🤖 Core Agent System
const logger = require('../utils/logger');
const db = require('../database');
const EncryptionService = require('../security/encryptionService');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class Agent {
  constructor(agentData) {
    this.id = agentData.id || uuidv4();
    this.userId = agentData.user_id;
    this.name = agentData.name;
    this.description = agentData.description;
    this.type = agentData.agent_type;
    this.config = agentData.configuration;
    this.status = agentData.status || 'active';
    this.encryptionService = new EncryptionService();
    this.model = this.config.model || 'claude';
    this.temperature = this.config.temperature || 0.7;
  }

  /**
   * Initialize agent from database
   */
  static async init(agentId, userId) {
    try {
      const result = await db.query(
        'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
        [agentId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Agent not found');
      }

      return new Agent(result.rows[0]);
    } catch (error) {
      logger.error('Error initializing agent:', error);
      throw error;
    }
  }

  /**
   * Process message through agent
   */
  async processMessage(userMessage, sessionId) {
    try {
      logger.info(`Processing message for agent: ${this.id}`);

      // Get conversation history
      const history = await this.getConversationHistory(sessionId);

      // Build prompt with context
      const prompt = this.buildPrompt(userMessage, history);

      // Call AI model
      const response = await this.callAIModel(prompt);

      // Encrypt and store messages
      await this.storeConversation(sessionId, userMessage, response);

      return response;
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history (last 10 messages)
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      const result = await db.query(
        `SELECT role, message_text FROM messages 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows.reverse();
    } catch (error) {
      logger.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Build prompt for AI model
   */
  buildPrompt(userMessage, history) {
    let prompt = `You are ${this.name}, a ${this.type} AI agent.\n`;
    prompt += `Description: ${this.description}\n\n`;
    prompt += `Instructions: ${this.config.systemPrompt || 'Help the user with their request.'}\n\n`;

    // Add conversation history
    if (history.length > 0) {
      prompt += 'Conversation History:\n';
      for (const msg of history) {
        prompt += `${msg.role}: ${msg.message_text}\n`;
      }
      prompt += '\n';
    }

    prompt += `User: ${userMessage}`;

    return prompt;
  }

  /**
   * Call AI model (Claude, ChatGPT, Ollama, etc.)
   */
  async callAIModel(prompt) {
    try {
      switch (this.model.toLowerCase()) {
        case 'claude':
          return await this.callClaude(prompt);
        case 'chatgpt':
        case 'gpt-4':
          return await this.callOpenAI(prompt);
        case 'gemini':
          return await this.callGemini(prompt);
        case 'ollama':
        case 'llama2':
        case 'mistral':
          return await this.callOllama(prompt);
        default:
          return 'Model not supported';
      }
    } catch (error) {
      logger.error('Error calling AI model:', error);
      throw error;
    }
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-opus-20240229',
          max_tokens: this.config.maxTokens || 1000,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.temperature
        },
        {
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      logger.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Call OpenAI API (ChatGPT, GPT-4)
   */
  async callOpenAI(prompt) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model === 'chatgpt' ? 'gpt-3.5-turbo' : 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: this.temperature,
          max_tokens: this.config.maxTokens || 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Call Google Gemini API
   */
  async callGemini(prompt) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        {
          params: { key: process.env.GEMINI_API_KEY }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      logger.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Call Local Ollama (Llama2, Mistral, etc.)
   */
  async callOllama(prompt) {
    try {
      const response = await axios.post(
        `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          temperature: this.temperature
        }
      );

      return response.data.response;
    } catch (error) {
      logger.error('Ollama API error:', error);
      throw error;
    }
  }

  /**
   * Store conversation (encrypted)
   */
  async storeConversation(sessionId, userMessage, agentResponse) {
    try {
      // Store user message
      const userMsgData = {
        text: userMessage,
        timestamp: new Date()
      };

      const encryptedUserMsg = this.encryptionService.encryptData(
        userMsgData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      await db.query(
        `INSERT INTO messages (session_id, agent_id, user_id, message_text, encrypted_content, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          this.id,
          this.userId,
          userMessage.substring(0, 500),
          JSON.stringify(encryptedUserMsg),
          'user',
          new Date()
        ]
      );

      // Store agent response
      const agentMsgData = {
        text: agentResponse,
        timestamp: new Date()
      };

      const encryptedAgentMsg = this.encryptionService.encryptData(
        agentMsgData,
        process.env.MASTER_ENCRYPTION_KEY
      );

      await db.query(
        `INSERT INTO messages (session_id, agent_id, user_id, message_text, encrypted_content, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          this.id,
          this.userId,
          agentResponse.substring(0, 500),
          JSON.stringify(encryptedAgentMsg),
          'assistant',
          new Date()
        ]
      );

      // Trigger webhook if configured
      await this.triggerWebhook('agent.message.sent', {
        agentId: this.id,
        sessionId,
        userMessage,
        agentResponse
      });
    } catch (error) {
      logger.error('Error storing conversation:', error);
    }
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(eventType, payload) {
    try {
      const result = await db.query(
        'SELECT * FROM agents WHERE id = $1',
        [this.id]
      );

      if (result.rows.length === 0 || !result.rows[0].webhook_url) {
        return;
      }

      const agent = result.rows[0];
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', agent.webhook_secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      await axios.post(agent.webhook_url, payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (error) {
      logger.error('Error triggering webhook:', error);
    }
  }
}

module.exports = Agent;
