# 🤖 SecureAI Agent Platform

> Enterprise-Grade AI Agent System with Military-Level Security & Multi-Channel Integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)

## ✨ Features

### 🎯 Core Capabilities
- **Multi-Agent System**: Create and manage multiple specialized AI agents
- **WhatsApp Integration**: Read and respond to WhatsApp messages
- **Email Integration**: Sync Gmail, Outlook, and custom IMAP accounts
- **Telegram Support**: Connect Telegram bots for instant messaging
- **Unified Messaging Hub**: Access all messages from one dashboard
- **Real-time Sync**: Automatic message synchronization every 5 minutes

### 🔐 Security Features
- **Military-Grade Encryption**: AES-256-GCM for all data
- **Zero-Knowledge Architecture**: Only you can decrypt your data
- **Multi-Factor Authentication**: TOTP-based 2FA
- **Row-Level Security**: PostgreSQL RLS for data isolation
- **API Key Management**: Secure API key generation and rotation
- **Audit Logging**: Complete audit trail of all actions
- **TLS 1.3**: Encrypted communications

### 💻 Tech Stack

**Backend**
- Node.js 18+
- Express.js
- PostgreSQL 16
- Redis 7
- JWT Authentication

**Frontend**
- React 18
- Tailwind CSS
- Lucide Icons
- Framer Motion
- Recharts

**Integrations**
- WhatsApp Web.js
- Nodemailer (Gmail/Outlook/IMAP)
- Telegram Bot API
- Google APIs
- Microsoft Graph

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- OpenSSL (for key generation)

### 1. Clone Repository
```bash
git clone https://github.com/geethupradeep23-sketch/ai-agent-platform.git
cd ai-agent-platform
```

### 2. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Generate secure encryption keys
- Create `.env` file
- Start Docker containers
- Initialize database

### 3. Access Platform

```
🌐 Frontend:  http://localhost:3000
⚙️  Backend:   http://localhost:3001
📚 API Docs:  http://localhost:3001/api/v1/docs
🔐 Vault:     http://localhost:8200
🗄️  Database:  postgres://localhost:5432
💾 Cache:     redis://localhost:6379
```

### 4. Default Credentials

**First Time Setup:**
1. Go to http://localhost:3000
2. Click "Sign up"
3. Create your account
4. Enable 2FA for extra security

## 📖 Documentation

- **[Installation Guide](./docs/INSTALLATION.md)** - Detailed setup instructions
- **[API Documentation](./docs/API.md)** - Complete API reference
- **[Security Guide](./docs/SECURITY.md)** - Security best practices
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture

## 📁 Project Structure

```
.
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── index.js           # App entry point
│   │   ├── agents/            # Agent system
│   │   ├── integrations/      # WhatsApp, Email, Telegram
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth & validation
│   │   ├── security/          # Encryption
│   │   └── utils/             # Helpers
│   ├── database/              # Schema & migrations
│   └── package.json
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── store/             # Zustand stores
│   │   ├── services/          # API services
│   │   └── index.css          # Tailwind styles
│   └── package.json
├── docker-compose.prod.yml    # Production containers
├── Dockerfile                 # Multi-stage build
├── setup.sh                   # Setup script
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/secure_ai_db

# Cache
REDIS_URL=redis://:password@localhost:6379

# Encryption Keys (generate with: openssl rand -hex 32)
JWT_SECRET=your-jwt-secret
MASTER_ENCRYPTION_KEY=your-encryption-key

# API Keys (optional)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# WhatsApp
WHATSAPP_INCLUDE_GROUPS=false

# Telegram
TELEGRAM_BOT_TOKEN=your-token
```

## 📡 API Examples

### Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Agent

```bash
curl -X POST http://localhost:3001/api/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Agent",
    "description": "Handles customer inquiries",
    "type": "support",
    "config": {
      "model": "claude",
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }'
```

### Send Message

```bash
curl -X POST http://localhost:3001/api/v1/agents/:agentId/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can you help?"
  }'
```

## 🔐 Security Checklist

- ✅ Change all default passwords in `.env`
- ✅ Enable 2FA for all accounts
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Keep MASTER_ENCRYPTION_KEY secret
- ✅ Enable HTTPS in production
- ✅ Set up firewall rules
- ✅ Enable database backups
- ✅ Review audit logs regularly
- ✅ Keep dependencies updated
- ✅ Use VPN for admin access

## 🚢 Deployment

### Docker Compose

```bash
# Production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Kubernetes

```bash
# Build image
docker build -t secure-ai-agent:1.0.0 .

# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods
```

### AWS/Azure/GCP

See [Deployment Guide](./docs/DEPLOYMENT.md) for cloud-specific instructions.

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
# {"status": "ok", "timestamp": "2024-01-15T10:30:00.000Z"}
```

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

```bash
# Fork, then clone your fork
git clone https://github.com/YOUR_USERNAME/ai-agent-platform.git

# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -am 'Add amazing feature'

# Push to branch
git push origin feature/amazing-feature

# Create Pull Request
```

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@secureai.dev
- 💬 Discord: [Join our community](https://discord.gg/secureai)
- 🐛 Issues: [GitHub Issues](https://github.com/geethupradeep23-sketch/ai-agent-platform/issues)
- 📚 Wiki: [Project Wiki](https://github.com/geethupradeep23-sketch/ai-agent-platform/wiki)

## 🙏 Acknowledgments

- Built with ❤️ by the SecureAI Team
- Inspired by enterprise security standards
- Thanks to all contributors

## ⭐ Show Your Support

If you find this project useful, please give it a star! 🌟

---

<div align="center">

**[⬆ Back to Top](#-secureai-agent-platform)**

Made with ☕ and 🔐 Security

</div>
