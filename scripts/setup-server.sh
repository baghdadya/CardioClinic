#!/bin/bash
set -e

echo "=== Maadi Clinic Server Setup ==="
echo ""

# 1. Update system
echo "[1/6] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed."
fi

# 3. Install Docker Compose plugin
echo "[3/6] Checking Docker Compose..."
docker compose version || {
    apt-get install -y -qq docker-compose-plugin
}

# 4. Firewall
echo "[4/6] Configuring firewall..."
apt-get install -y -qq ufw
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

# 5. Create app directory
echo "[5/6] Creating app directory..."
mkdir -p /opt/maadi-clinic
cd /opt/maadi-clinic

# 6. Create .env file
echo "[6/6] Creating environment file..."
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
# Production environment — edit these values
DOMAIN=YOUR_DOMAIN_OR_IP
DB_PASSWORD=CHANGE_ME_GENERATE_A_STRONG_PASSWORD
SECRET_KEY=CHANGE_ME_GENERATE_A_STRONG_SECRET
ENVEOF
    echo ".env created. Edit DOMAIN when you have a domain name."
else
    echo ".env already exists, skipping."
fi

echo ""
echo "=== Server setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Copy your project files to /opt/maadi-clinic/"
echo "  2. cd /opt/maadi-clinic"
echo "  3. docker compose -f docker-compose.prod.yml up -d --build"
echo ""
