# 🚀 Deployment Guide

## Production Deployment Checklist

- [ ] SSL/TLS certificates obtained
- [ ] Domain configured
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Load balancer configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Firewall rules set
- [ ] Backup strategy documented

## Docker Compose Production

### 1. Update Environment

```bash
NODE_ENV=production
DOMAIN=yourdomain.com
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com
```

### 2. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d

# Verify all services are running
docker-compose ps
```

### 3. Configure SSL

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d yourdomain.com

# Update docker-compose to use certificates
volumes:
  - /etc/letsencrypt:/etc/letsencrypt
```

## Cloud Deployment

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name secure-ai-agent

# Build and push image
docker build -t secure-ai-agent .
docker tag secure-ai-agent:latest <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/secure-ai-agent:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
docker push <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/secure-ai-agent:latest
```

### Heroku

```bash
heroku login
heroku create your-app-name
heroku addons:create heroku-postgresql
heroku config:set NODE_ENV=production
git push heroku main
```

### DigitalOcean

```bash
doctl auth init
doctl apps create --spec app.yaml
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace secure-ai
```

### 2. Create Secrets

```bash
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD=<password> \
  --from-literal=JWT_SECRET=<secret> \
  -n secure-ai
```

### 3. Deploy

```bash
kubectl apply -f k8s/postgres.yaml -n secure-ai
kubectl apply -f k8s/redis.yaml -n secure-ai
kubectl apply -f k8s/backend.yaml -n secure-ai
kubectl apply -f k8s/frontend.yaml -n secure-ai

# Check status
kubectl get pods -n secure-ai
```

## Monitoring & Logging

### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# Add to docker-compose.prod.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch
```

### Prometheus & Grafana

```bash
# Add metrics collection
npm install prometheus-client

# View metrics at http://localhost:9090
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > /backups/db-$(date +%Y%m%d).sql

# Upload to S3
aws s3 sync /backups s3://my-backups/db/
```

### Restore from Backup

```bash
psql $DATABASE_URL < /backups/db-20240115.sql
```

## Performance Optimization

### Database

```sql
-- Create indexes
CREATE INDEX idx_agents_user_created ON agents(user_id, created_at);
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at);

-- Enable query optimization
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
```

### Caching

```javascript
// Set Redis TTL for frequently accessed data
const CACHE_TTL = 3600; // 1 hour
await redis.setex(`agent:${agentId}`, CACHE_TTL, JSON.stringify(agent));
```

### Load Balancing

```nginx
upstream backend {
  server backend1:3001;
  server backend2:3001;
  server backend3:3001;
}

server {
  listen 80;
  server_name yourdomain.com;
  
  location /api {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Or with Kubernetes
kubectl scale deployment backend --replicas=5 -n secure-ai
```

### Vertical Scaling

```bash
# Increase resource limits in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Maintenance

### Database Maintenance

```sql
-- Weekly maintenance
VACUUM ANALYZE;
REINDEX DATABASE secure_ai_db;

-- Remove old audit logs
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

### Log Rotation

```bash
# Configure logrotate
/var/log/secure-ai/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 secure-ai secure-ai
  sharedscripts
}
```
