#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore.sh backup_file.sql.gz

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 /var/backups/delivery-platform/delivery_platform_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="delivery_platform"
DB_USER="postgres"
DB_HOST="localhost"

echo "========================================="
echo "Database Restore - Delivery Platform"
echo "Backup file: $BACKUP_FILE"
echo "========================================="

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restoration
read -p "WARNING: This will overwrite the current database. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Drop and recreate database
echo "Dropping and recreating database..."
PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
echo "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="${DB_PASSWORD}" psql -h $DB_HOST -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "✓ Restore completed successfully"
else
    echo "✗ Restore failed!"
    exit 1
fi

echo "========================================="