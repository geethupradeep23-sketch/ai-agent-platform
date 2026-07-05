#!/bin/bash

# Generate secure keys for deployment

echo "🔐 Generating secure keys..."
echo ""

echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "MASTER_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "DATABASE_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "DB_PASSWORD=$(openssl rand -base64 24)"
echo ""
echo "Add these to your .env file and keep them safe!"
