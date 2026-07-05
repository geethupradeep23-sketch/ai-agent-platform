# 🚀 Deployment Guide

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Git

## Self-Hosted Deployment (Docker Compose)

### Step 1: Clone Repository
```bash
git clone https://github.com/geethupradeep23-sketch/ai-agent-platform.git
cd ai-agent-platform
```

### Step 2: Generate Encryption Keys
```bash
node scripts/generate-keys.js
```

### Step 3: Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
nano .env
```

### Step 4: Start Services
```bash
docker-compose up -d
```

### Step 5: Initialize Database
```bash
docker-compose exec backend npm run db:migrate
```

### Step 6: Access Platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Vault: http://localhost:8200
- Ollama: http://localhost:11434

## Production Deployment

### AWS EC2 + RDS Setup

1. **Create VPC and Security Groups**
   - Allow inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - Allow outbound: All

2. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Configure security group

3. **Create RDS Instance**
   - PostgreSQL 14+
   - Multi-AZ for high availability
   - Enable encryption at rest
   - Create automated backups

4. **SSH and Deploy**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and configure
git clone https://github.com/geethupradeep23-sketch/ai-agent-platform.git
cd ai-agent-platform

# Update .env with RDS endpoint
DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/secure_ai_db

# Deploy
sudo docker-compose -f docker-compose.prod.yml up -d
```

## SSL/TLS Configuration

### Let's Encrypt (Production)
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./security/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./security/certs/
```

## Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Frontend dev
sudo ufw allow 3001/tcp  # Backend dev
```

## Monitoring & Logging

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Setup Monitoring
```bash
# Install Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Install Grafana
docker run -d -p 3003:3000 grafana/grafana
```

## Backup & Recovery

### Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$BACKUP_DATE.sql.gz

# Encrypt backup
openssl enc -aes-256-cbc -in $BACKUP_DIR/db_$BACKUP_DATE.sql.gz -out $BACKUP_DIR/db_$BACKUP_DATE.sql.gz.enc

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$BACKUP_DATE.sql.gz.enc s3://your-backup-bucket/

# Cleanup
rm $BACKUP_DIR/db_$BACKUP_DATE.sql.gz
```

### Recovery Procedure
```bash
# Download and decrypt backup
aws s3 cp s3://your-backup-bucket/db_BACKUP.sql.gz.enc .
openssl enc -d -aes-256-cbc -in db_BACKUP.sql.gz.enc | gunzip > db_backup.sql

# Restore database
psql -U $DB_USER $DB_NAME < db_backup.sql
```

---

**Deployment checklist:**
- [ ] Encryption keys generated
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups enabled
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] Regular backup testing completed