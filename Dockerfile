# Use Node.js LTS version (20+ required for Next.js)
FROM node:20-alpine

# Install dependencies for Puppeteer and cron (required for whatsapp-web.js and monitoring)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dcron \
    bash

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build Next.js application
RUN npm run build

# Create necessary directories
RUN mkdir -p temp .wwebjs_auth .wwebjs_cache /var/log/cron

# Expose ports
# 3000 for Next.js dashboard
EXPOSE 3000

# Create bot monitoring script
RUN echo '#!/bin/bash' > /app/monitor-bot.sh && \
    echo '# Bot monitoring script - checks if bot is running and restarts if needed' >> /app/monitor-bot.sh && \
    echo 'LOG_FILE="/var/log/cron/monitor-bot.log"' >> /app/monitor-bot.sh && \
    echo 'echo "$(date): Checking bot status..." >> $LOG_FILE' >> /app/monitor-bot.sh && \
    echo '' >> /app/monitor-bot.sh && \
    echo '# Check if bot process is running' >> /app/monitor-bot.sh && \
    echo 'BOT_PID=$(pgrep -f "node src/bot.js")' >> /app/monitor-bot.sh && \
    echo '' >> /app/monitor-bot.sh && \
    echo 'if [ -z "$BOT_PID" ]; then' >> /app/monitor-bot.sh && \
    echo '  echo "$(date): Bot is not running! Clearing auth and restarting..." >> $LOG_FILE' >> /app/monitor-bot.sh && \
    echo '  # Clear auth session to force QR regeneration' >> /app/monitor-bot.sh && \
    echo '  rm -rf /app/.wwebjs_auth 2>/dev/null || true' >> /app/monitor-bot.sh && \
    echo '  rm -rf /app/.wwebjs_cache 2>/dev/null || true' >> /app/monitor-bot.sh && \
    echo '  # Restart bot' >> /app/monitor-bot.sh && \
    echo '  cd /app && npm start >> /var/log/cron/bot.log 2>&1 &' >> /app/monitor-bot.sh && \
    echo '  echo "$(date): Bot restarted successfully" >> $LOG_FILE' >> /app/monitor-bot.sh && \
    echo 'else' >> /app/monitor-bot.sh && \
    echo '  echo "$(date): Bot is running (PID: $BOT_PID)" >> $LOG_FILE' >> /app/monitor-bot.sh && \
    echo 'fi' >> /app/monitor-bot.sh && \
    chmod +x /app/monitor-bot.sh

# Create crontab for monitoring (runs every 5 minutes)
RUN echo '*/5 * * * * /app/monitor-bot.sh' > /etc/crontabs/root

# Create a startup script to run all services
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "Starting UCF Agri-Bot..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Clean up stale Chromium lock files from previous runs' >> /app/start.sh && \
    echo 'echo "Cleaning up Chromium lock files..."' >> /app/start.sh && \
    echo 'rm -f /app/.wwebjs_cache/*/SingletonLock 2>/dev/null || true' >> /app/start.sh && \
    echo 'rm -f /app/.wwebjs_cache/*/SingletonCookie 2>/dev/null || true' >> /app/start.sh && \
    echo 'rm -f /app/.wwebjs_cache/*/SingletonSocket 2>/dev/null || true' >> /app/start.sh && \
    echo 'rm -rf /app/.wwebjs_cache/*/Singleton* 2>/dev/null || true' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Clear WhatsApp auth session to force new QR code generation' >> /app/start.sh && \
    echo 'echo "Clearing WhatsApp auth session for fresh QR code..."' >> /app/start.sh && \
    echo 'rm -rf /app/.wwebjs_auth 2>/dev/null || true' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start cron daemon for monitoring' >> /app/start.sh && \
    echo 'echo "Starting cron daemon for bot monitoring..."' >> /app/start.sh && \
    echo 'crond -b -l 2' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Next.js dashboard in background' >> /app/start.sh && \
    echo 'echo "Starting Next.js dashboard on port 3000..."' >> /app/start.sh && \
    echo 'npm run next-start &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for dashboard to start' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start WhatsApp bot (foreground process)' >> /app/start.sh && \
    echo 'echo "Starting WhatsApp bot..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start all services
CMD ["/app/start.sh"]
