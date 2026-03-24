#!/bin/bash
set -e

# Meetify Backup Script
# Usage: ./backup.sh [type]

TYPE=${1:-manual}
BACKUP_DIR="/opt/backups/meetify"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${TYPE}_${TIMESTAMP}"
RETENTION_DAYS=14

echo "📦 Starting backup ($TYPE)..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Database backup
echo "💾 Backing up database..."
if docker ps | grep -q meetify-db-1; then
    docker exec meetify-db-1 pg_dump -U postgres meetify > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    echo "✅ Database backup completed"
else
    echo "⚠️ Database container not running"
fi

# Redis backup
echo "💾 Backing up Redis..."
if docker ps | grep -q meetify-redis-1; then
    docker exec meetify-redis-1 redis-cli BGSAVE
    sleep 2
    docker cp meetify-redis-1:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis.rdb"
    echo "✅ Redis backup completed"
else
    echo "⚠️ Redis container not running"
fi

# Config backup
echo "💾 Backing up configurations..."
if [ -f /opt/meetify/.env ]; then
    cp /opt/meetify/.env "$BACKUP_DIR/$BACKUP_NAME/.env"
fi
if [ -f /opt/meetify/docker-compose.prod.yml ]; then
    cp /opt/meetify/docker-compose.prod.yml "$BACKUP_DIR/$BACKUP_NAME/"
fi
if [ -f /opt/meetify/nginx.conf ]; then
    cp /opt/meetify/nginx.conf "$BACKUP_DIR/$BACKUP_NAME/"
fi

# Compress backup
echo "📦 Compressing backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Get backup size
BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/${BACKUP_NAME}.tar.gz")
BACKUP_SIZE_HUMAN=$(numfmt --to=iec $BACKUP_SIZE 2>/dev/null || echo "$BACKUP_SIZE bytes")

echo "✅ Backup completed: ${BACKUP_NAME}.tar.gz ($BACKUP_SIZE_HUMAN)"

# Upload to S3 if configured
if [ -f /opt/meetify/scripts/upload-to-s3.sh ]; then
    echo "☁️  Uploading to S3..."
    /opt/meetify/scripts/upload-to-s3.sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Cleanup completed (retention: $RETENTION_DAYS days)"

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5 || echo "No backups found"
