# Deployment script for Windows Server

Write-Host "🚀 Starting deployment..." -ForegroundColor Green

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

Write-Host "✅ Deployment completed!" -ForegroundColor Green