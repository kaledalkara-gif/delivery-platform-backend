#!/bin/bash

# Database Backup Script for Delivery Platform
# Run this script daily via cron job

# Configuration
BACKUP_DIR="/var/backups/delivery-platform"
DB_NAME="delivery_platform"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Database Backup - Delivery Platform"
echo "Started at: $(date)"
echo "========================================="

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Failed to create backup directory${NC}"
        exit 1
    fi
fi

# Perform the backup
echo "Backing up database: $DB_NAME"
PGPASSWORD="${DB_PASSWORD}" pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup successful${NC}"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $FILE_SIZE"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Remove old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo "  Backups remaining: $BACKUP_COUNT"

# Optional: Upload to cloud storage (AWS S3, Google Cloud, etc.)
# Uncomment and configure if needed
# echo ""
# echo "Uploading to cloud storage..."
# aws s3 cp "$BACKUP_FILE" s3://your-bucket/backups/

echo ""
echo "========================================="
echo "Backup completed at: $(date)"
echo "========================================="