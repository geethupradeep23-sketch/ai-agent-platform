# 📡 API Documentation

## Authentication

All API requests require an `Authorization` header:

```bash
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "requiresMFA": true,
    "sessionId": "sess_123456"
  }
}
```

### Verify MFA
```http
POST /api/v1/auth/mfa/verify
Content-Type: application/json

{
  "sessionId": "sess_123456",
  "totpToken": "123456"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Agent Endpoints

### Create Agent
```http
POST /api/v1/agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Financial Manager",
  "description": "Manages financial transactions",
  "type": "financial",
  "config": {
    "model": "claude",
    "temperature": 0.7,
    "maxTokens": 2000
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "agent_123456",
    "name": "Financial Manager",
    "createdAt": "2024-01-15T10:30:00Z",
    "status": "active"
  }
}
```

### List Agents
```http
GET /api/v1/agents?limit=20&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "agent_123456",
      "name": "Financial Manager",
      "type": "financial",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

### Get Agent Details
```http
GET /api/v1/agents/{agentId}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "agent_123456",
    "name": "Financial Manager",
    "description": "Manages financial transactions",
    "type": "financial",
    "config": {...},
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Agent
```http
PUT /api/v1/agents/{agentId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Agent Name",
  "config": {...}
}
```

### Delete Agent
```http
DELETE /api/v1/agents/{agentId}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

## Message Endpoints

### Send Message
```http
POST /api/v1/agents/{agentId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What's my account balance?",
  "context": {
    "userId": "user_123",
    "metadata": {...}
  }
}

Response:
{
  "success": true,
  "data": {
    "messageId": "msg_123456",
    "agentResponse": "Your current balance is $5,432.10",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Get Message History
```http
GET /api/v1/agents/{agentId}/messages?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "messageId": "msg_123456",
      "userMessage": "What's my balance?",
      "agentResponse": "Your balance is $5,432.10",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Webhook Endpoints

### Create Webhook
```http
POST /api/v1/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": ["agent.message.sent", "agent.created"],
  "active": true,
  "secret": "webhook_secret_key"
}

Response:
{
  "success": true,
  "data": {
    "id": "webhook_123456",
    "url": "https://your-domain.com/webhook",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Webhook Signature Verification
```javascript
const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const payload = req.body;
const secret = process.env.WEBHOOK_SECRET;

const hash = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (hash !== signature) {
  throw new Error('Invalid webhook signature');
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication token",
    "details": {
      "field": "token",
      "issue": "expired"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

API endpoints are rate limited per user:
- **Standard users**: 100 requests per 15 minutes
- **Premium users**: 1000 requests per 15 minutes

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705325400
```

---

**For more details, visit: https://api.yourdomain.com/docs**