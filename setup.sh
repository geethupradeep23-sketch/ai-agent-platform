#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SecureAI Agent Platform - Setup${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Generate keys
echo -e "${BLUE}🔐 Generating encryption keys...${NC}"
JWT_SECRET=$(openssl rand -hex 32)
MASTER_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 24)

echo ""
echo -e "${BLUE}📝 Creating .env file...${NC}"

if [ ! -f .env ]; then
    cat > .env << EOF
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://aiuser:${DB_PASSWORD}@postgres:5432/secure_ai_db
DATABASE_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Redis
REDIS_URL=redis://:change_me@redis:6379
REDIS_PASSWORD=change_me

# Encryption
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
MASTER_ENCRYPTION_KEY=${MASTER_KEY}

# Authentication
BCRYPT_ROUNDS=12
MFA_ENABLED=true

# API Keys (add your own)
OPENAI_API_KEY=your-openai-key
CLAUDE_API_KEY=your-claude-key
GEMINI_API_KEY=your-gemini-key

# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_ACCESS_TOKEN=your-token

EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
docker-compose up -d

echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo ""
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker-compose exec -T backend npm run db:migrate

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}📍 Access your platform:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:3001/api/v1/docs${NC}"
echo -e "  Vault:    ${GREEN}http://localhost:8200${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  Security: ${GREEN}./docs/SECURITY.md${NC}"
echo -e "  API:      ${GREEN}./docs/API.md${NC}"
echo -e "  Deploy:   ${GREEN}./docs/DEPLOYMENT.md${NC}"
echo ""
