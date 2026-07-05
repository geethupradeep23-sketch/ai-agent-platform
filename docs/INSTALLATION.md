# 📚 Installation Guide

## System Requirements

- **OS**: Linux, macOS, or Windows (WSL2)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18.0+ (for local development)
- **Disk Space**: 10GB minimum
- **RAM**: 4GB minimum (8GB recommended)

## Step-by-Step Installation

### 1. Prerequisites Setup

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nodejs npm git curl openssl
sudo usermod -aG docker $USER
```

#### macOS
```bash
brew install docker docker-compose node git openssl
# Or use Docker Desktop for Mac
```

#### Windows (WSL2)
```bash
wsl --install
# Then in WSL terminal:
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nodejs npm git curl openssl
```

### 2. Clone Repository

```bash
git clone https://github.com/geethupradeep23-sketch/ai-agent-platform.git
cd ai-agent-platform
```

### 3. Generate Encryption Keys

```bash
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh > keys.txt
```

Save the output in a secure location. You'll need these for your `.env` file.

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your keys and credentials:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DATABASE_URL=postgresql://aiuser:your-secure-password@postgres:5432/secure_ai_db
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Redis
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-redis-password

# Encryption (from generate-keys.sh)
JWT_SECRET=<paste-from-keys.txt>
JWT_REFRESH_SECRET=<paste-from-keys.txt>
MASTER_ENCRYPTION_KEY=<paste-from-keys.txt>

# Security
BCRYPT_ROUNDS=12
MFA_ENABLED=true
LOG_LEVEL=info

# API Keys (optional)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

### 5. Start Services

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

### 6. Initialize Database

```bash
# Wait 30 seconds for PostgreSQL to be ready
sleep 30

# Run migrations
docker-compose exec backend npm run db:migrate

# (Optional) Seed with demo data
docker-compose exec backend npm run db:seed
```

### 7. Verify Installation

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000
```

## 🎉 You're Done!

Your SecureAI Agent Platform is now running!

### Next Steps

1. **Create Account**: Visit http://localhost:3000/register
2. **Enable 2FA**: Go to Settings and enable two-factor authentication
3. **Connect Integrations**: Link WhatsApp, Email, and Telegram
4. **Create Agents**: Start creating your AI agents
5. **Read Docs**: Check out the [API Documentation](./API.md)

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Change port in docker-compose.prod.yml
# Or kill the process using the port
lsof -i :3001
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Out of Memory

```bash
# Increase Docker memory limit
# In Docker Desktop: Preferences > Resources > Memory
```

### Permission Denied

```bash
# Fix file permissions
chmod +x setup.sh scripts/*.sh
sudo chown -R $USER:$USER .
```

## 📖 Local Development

For development without Docker:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install

# Start backend (in backend directory)
npm run dev

# Start frontend (in frontend directory)
npm start
```

## 🗑️ Clean Up

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove images
docker rmi secure-ai-agent:latest
```

## 📞 Need Help?

- Check logs: `docker-compose logs -f`
- GitHub Issues: https://github.com/geethupradeep23-sketch/ai-agent-platform/issues
- Documentation: See docs/ directory
