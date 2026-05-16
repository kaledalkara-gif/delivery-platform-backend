#!/bin/bash

# Deployment script for delivery platform

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Run migrations
npm run migration:run

# Restart PM2
pm2 reload ecosystem.config.js --env production

# Check status
pm2 status

echo "✅ Deployment completed!"