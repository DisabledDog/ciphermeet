# CipherMeet VPS Deployment Guide (Hostinger)

## Step 1: Get Your VPS Ready on Hostinger

1. Log into https://hpanel.hostinger.com
2. Go to **VPS** section
3. If you haven't already, choose a VPS plan (KVM 2 minimum — 2 cores, 2GB RAM)
4. When setting up, choose **Ubuntu 22.04** as the OS
5. Set a **root password** — save this somewhere safe
6. Once provisioned, find your **IP address** on the VPS dashboard (e.g. 187.124.87.147)

## Step 2: Point Your Domain

1. In Hostinger, go to **Domains** > ciphermeet.io > **DNS / Nameservers**
2. Add an **A Record**:
   - Name: `@`
   - Points to: `YOUR_VPS_IP` (e.g. 187.124.87.147)
   - TTL: 3600
3. Add another **A Record** for www:
   - Name: `www`
   - Points to: `YOUR_VPS_IP`
   - TTL: 3600
4. Wait 5-15 minutes for DNS to propagate

## Step 3: SSH Into Your VPS

Open your Mac terminal (not Claude Code) and run:

```bash
ssh root@YOUR_VPS_IP
```

Enter your root password when prompted. You're now on the server.

## Step 4: Run the Setup Script

Copy and paste this ENTIRE block into your VPS terminal:

```bash
#!/bin/bash
set -e

echo "=== CipherMeet Server Setup ==="

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install build tools (mediasoup needs these to compile)
apt install -y python3 make g++ gcc

# Install nginx and certbot
apt install -y nginx certbot python3-certbot-nginx

# Install pm2 for process management
npm install -g pm2

# Clone the repo
cd /opt
git clone https://github.com/DisabledDog/ciphermeet.git
cd ciphermeet

# Install frontend dependencies
npm ci

# Build the frontend
npm run build

# Install server dependencies
cd server
npm ci

# Build the server
npx tsc

cd /opt/ciphermeet

echo "=== Base install complete ==="
```

## Step 5: Configure Environment Variables

Still on the VPS, create the env files:

```bash
# Server env — replace YOUR_VPS_IP with your actual IP
cat > /opt/ciphermeet/server/.env << 'EOF'
PORT=3001
ANNOUNCED_IP=YOUR_VPS_IP
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999
EOF

# Frontend env — replace with your domain
cat > /opt/ciphermeet/.env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=https://ciphermeet.io
EOF
```

**IMPORTANT:** Edit the files to replace the placeholders:
```bash
nano /opt/ciphermeet/server/.env
# Change YOUR_VPS_IP to your actual VPS IP (e.g. 187.124.87.147)
# Save with Ctrl+O, Enter, then Ctrl+X

nano /opt/ciphermeet/.env.local
# Verify the domain is correct
# Save with Ctrl+O, Enter, then Ctrl+X
```

Then rebuild the frontend (it bakes in the env var):
```bash
cd /opt/ciphermeet && npm run build
```

## Step 6: Open Firewall Ports

```bash
# Enable firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 3001
ufw allow 40000:49999/udp
ufw --force enable
```

## Step 7: Set Up Nginx + SSL

```bash
# Remove default nginx config
rm /etc/nginx/sites-enabled/default

# Create CipherMeet nginx config — replace ciphermeet.io with your domain
cat > /etc/nginx/sites-available/ciphermeet << 'NGINX'
upstream nextjs {
    server 127.0.0.1:3000;
}

upstream mediasoup {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name ciphermeet.io www.ciphermeet.io;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://mediasoup;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://mediasoup;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# Enable the site
ln -s /etc/nginx/sites-available/ciphermeet /etc/nginx/sites-enabled/

# Test and restart nginx
nginx -t && systemctl restart nginx

# Get SSL certificate (replace with your domain and email)
certbot --nginx -d ciphermeet.io -d www.ciphermeet.io --non-interactive --agree-tos -m YOUR_EMAIL@example.com
```

**IMPORTANT:** Replace `YOUR_EMAIL@example.com` with your real email for SSL cert notifications.

## Step 8: Start the App with PM2

```bash
# Start the mediasoup server
cd /opt/ciphermeet
pm2 start server/dist/index.js --name ciphermeet-server

# Start the Next.js frontend
pm2 start npm --name ciphermeet-frontend -- start -- -p 3000

# Save PM2 config so it survives reboots
pm2 save
pm2 startup
```

## Step 9: Verify Everything Works

```bash
# Check both processes are running
pm2 status

# Check nginx is running
systemctl status nginx

# Test the health endpoint
curl http://localhost:3001/api/health

# Test from outside (run this from your Mac, not the VPS)
# curl https://ciphermeet.io
```

Now open **https://ciphermeet.io** in your browser. You should see CipherMeet.

## Troubleshooting

### App won't load
```bash
pm2 logs                    # Check app logs
pm2 logs ciphermeet-server  # Check server logs specifically
```

### WebRTC not connecting (can't see video)
- Make sure ANNOUNCED_IP in server/.env is your VPS public IP
- Make sure UDP ports 40000-49999 are open: `ufw status`
- Check Hostinger VPS firewall panel — some block UDP by default

### SSL certificate issues
```bash
certbot renew --dry-run     # Test renewal
```

### Restart everything
```bash
pm2 restart all
systemctl restart nginx
```

### Update the app (after pushing new code)
```bash
cd /opt/ciphermeet
git pull
npm ci && npm run build
cd server && npm ci && npx tsc
cd ..
pm2 restart all
```

## TURN Server (Optional but Recommended)

Some users behind strict firewalls won't be able to connect without a TURN server.
The cheapest option is a free-tier account at https://www.metered.ca/stun-turn
which gives you TURN credentials to add to the client config.
