#!/bin/bash
# Deploy wallet-api to production server
# Usage: ./deploy-wallet-api.sh [server-ip]

set -e

SERVER_IP="${1:-}"
DEPLOY_DIR="/opt/wallet-api"

if [ -z "$SERVER_IP" ]; then
    echo "Usage: $0 <server-ip>"
    echo "Example: $0 192.168.1.100"
    exit 1
fi

echo "🚀 Deploying wallet-api to $SERVER_IP"

# Check SSH connection
echo "📡 Checking SSH connection..."
ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'SSH connected'" || {
    echo "❌ Cannot connect to server via SSH"
    exit 1
}

# Create deployment directory
echo "📁 Creating deployment directory..."
ssh root@$SERVER_IP "mkdir -p $DEPLOY_DIR"

# Copy wallet-api files
echo "📦 Copying wallet-api files..."
scp -r wallet-api/src wallet-api/package.json wallet-api/bun.lock* wallet-api/Dockerfile wallet-api/tsconfig.json root@$SERVER_IP:$DEPLOY_DIR/

# Copy .env.example as template
if [ -f "wallet-api/.env.example" ]; then
    scp wallet-api/.env.example root@$SERVER_IP:$DEPLOY_DIR/.env
fi

# Deploy on server
echo "🔧 Deploying on server..."
ssh root@$SERVER_IP << 'EOF'
set -e

DEPLOY_DIR="/opt/wallet-api"
cd $DEPLOY_DIR

echo "📋 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed. Please install Docker first."
    exit 1
fi

echo "🔑 Checking for DACC_MNEMONIC environment variable..."
if [ -z "$DACC_MNEMONIC" ]; then
    echo "⚠️  WARNING: DACC_MNEMONIC not set!"
    echo "You need to set this in .env file:"
    echo "  cd $DEPLOY_DIR"
    echo "  nano .env"
    echo ""
    echo "Required variables:"
    echo "  DACC_MNEMONIC=your-mnemonic-here"
    echo "  WALLET_MASTER_KEY=your-master-key-32-chars-min"
    echo "  PORT=3001"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🏗️  Building Docker image..."
docker build -t wallet-api:latest .

echo "🛑 Stopping existing container..."
docker stop wallet-api 2>/dev/null || true
docker rm wallet-api 2>/dev/null || true

echo "🚀 Starting new container..."
docker run -d \
  --name wallet-api \
  --restart unless-stopped \
  --env-file .env \
  -p 3001:3001 \
  wallet-api:latest

echo "⏳ Waiting for container to start..."
sleep 5

echo "🏥 Checking health..."
docker logs wallet-api --tail 20

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Quick verification:"
echo "  curl http://localhost:3001/health"
echo ""
echo "View logs:"
echo "  docker logs -f wallet-api"
echo ""
echo "Restart service:"
echo "  docker restart wallet-api"
EOF

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. SSH to server: ssh root@$SERVER_IP"
echo "2. Verify .env has DACC_MNEMONIC set"
echo "3. Test: curl http://$SERVER_IP:3001/health"
echo "4. Restart PocketBase: docker restart pocketbase"
