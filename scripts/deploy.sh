#!/bin/bash
set -e

# Meetify Deployment Script
# Usage: ./deploy.sh [environment]

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/opt/backups/meetify"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please run as non-root user (deploy)"
   exit 1
fi

# Create backup before deploy
echo "📦 Creating pre-deploy backup..."
mkdir -p "$BACKUP_DIR"
docker exec meetify-db-1 pg_dump -U postgres meetify > "$BACKUP_DIR/pre_deploy_$TIMESTAMP.sql" 2>/dev/null || echo "⚠️ Database backup skipped"

# Pull latest images
echo "⬇️  Pulling latest images..."
docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" pull

# Rolling update for zero-downtime deployment
echo "🔄 Performing rolling update..."

# Start new API containers alongside existing ones
docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" up -d --no-deps --scale api=2 --no-recreate api

# Wait for new containers to be healthy
echo "⏳ Waiting for health checks..."
sleep 10

# Verify health
if ! curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Health check failed! Rolling back..."
    docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" up -d --no-deps --scale api=1 api
    exit 1
fi

# Scale down to normal
docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" up -d --no-deps --scale api=1 api

# Update remaining services
echo "🔄 Updating remaining services..."
docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" up -d

# Cleanup
echo "🧹 Cleaning up..."
docker system prune -f

# Verify deployment
echo "✅ Verifying deployment..."
if curl -sf https://46-149-68-9.nip.io/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "📊 Services status:"
    docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" ps
else
    echo "❌ Deployment verification failed!"
    exit 1
fi
