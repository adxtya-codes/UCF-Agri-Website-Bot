#!/bin/bash

# UCF Agri-Bot Deployment Script
# This script rebuilds the Docker image and restarts the container

echo "🚀 Starting deployment..."
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull
echo ""

# Rebuild Docker image (no cache to ensure patch is applied)
echo "🔨 Rebuilding Docker image (this may take a few minutes)..."
docker-compose build --no-cache
echo ""

# Stop and remove old container
echo "🛑 Stopping old container..."
docker-compose down
echo ""

# Start new container
echo "▶️  Starting new container..."
docker-compose up -d
echo ""

# Show logs
echo "📋 Showing container logs (press Ctrl+C to exit)..."
echo ""
docker-compose logs -f
