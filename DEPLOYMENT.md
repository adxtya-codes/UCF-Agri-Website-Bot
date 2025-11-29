# UCF Agri-Bot Deployment Guide

## Docker Deployment

### Prerequisites
- Docker installed on your server
- Docker Compose installed (optional but recommended)

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agri-bot
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   nano .env
   ```

3. **Build and run**
   ```bash
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Manual Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t ucf-agri-bot .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name ucf-agri-bot \
     -p 3000:3000 \
     -v $(pwd)/src/data:/app/src/data \
     -v $(pwd)/temp:/app/temp \
     --env-file .env \
     ucf-agri-bot
   ```

3. **View logs**
   ```bash
   docker logs -f ucf-agri-bot
   ```

4. **Stop the container**
   ```bash
   docker stop ucf-agri-bot
   docker rm ucf-agri-bot
   ```

## First-Time Setup

### WhatsApp Authentication

When you first run the bot, you'll need to scan a QR code:

1. **View the QR code in logs**
   ```bash
   docker-compose logs -f agri-bot
   ```

2. **Scan the QR code** with WhatsApp on your phone:
   - Open WhatsApp
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code from the terminal

3. **Session**: The WhatsApp session is NOT persisted. You will need to scan the QR code each time the container is deployed or restarted.

## Accessing the Dashboard

Once deployed, access the dashboard at:
- **Local**: http://localhost:3000
- **Production**: http://your-server-ip:3000

**Default credentials:**
- Username: `UCF ADMIN`
- Password: `Add1ngt0N@26`

## Environment Variables

Required environment variables in `.env`:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# UploadThing (for file uploads)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Session name (optional)
SESSION_NAME=UCF_AGRIBOT
```

## Production Recommendations

### 1. Use a Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
```

### 3. Set up automatic backups

```bash
# Backup data files
docker exec ucf-agri-bot tar czf /tmp/backup.tar.gz /app/src/data
docker cp ucf-agri-bot:/tmp/backup.tar.gz ./backups/
```

### 4. Monitor logs

```bash
# View real-time logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs agri-bot

# Rebuild the image
docker-compose build --no-cache
docker-compose up -d
```

### WhatsApp session expired
```bash
# Remove old session
rm -rf .wwebjs_auth .wwebjs_cache

# Restart container to get new QR code
docker-compose restart
```

### Dashboard not accessible
```bash
# Check if port 3000 is exposed
docker ps

# Check firewall rules
sudo ufw allow 3000
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Data Persistence

The following directories are persisted using Docker volumes:
- `src/data` - All JSON data files (users, receipts, etc.)
- `temp` - Temporary image files

## Support

For issues or questions, contact the development team.
