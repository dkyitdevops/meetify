#!/bin/bash

# Meetify Restore Script
# Usage: ./restore.sh [backup-file]

BACKUP_FILE=${1:-}
BACKUP_DIR="/opt/backups/meetify"

if [ -z "$BACKUP_FILE" ]; then
    echo "📋 Available backups:"
    ls -lt "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -10 || echo "No backups found"
    echo ""
    echo "Usage: $0 [backup-file]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    # Try to find in backup directory
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo "❌ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

echo "⚠️  WARNING: This will restore from backup and may overwrite current data!"
echo "📦 Backup: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Extract backup
TEMP_DIR=$(mktemp -d)
echo "📂 Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Restore database
if [ -f "$TEMP_DIR"/*/database.sql ]; then
    echo "💾 Restoring database..."
    docker exec -i meetify-db-1 psql -U postgres -d meetify < "$TEMP_DIR"/*/database.sql
    echo "✅ Database restored"
fi

# Restore Redis
if [ -f "$TEMP_DIR"/*/redis.rdb ]; then
    echo "💾 Restoring Redis..."
    docker cp "$TEMP_DIR"/*/redis.rdb meetify-redis-1:/data/dump.rdb
    docker restart meetify-redis-1
    echo "✅ Redis restored"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Restore completed!"
