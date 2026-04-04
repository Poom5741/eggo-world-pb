# Wallet API Production Deployment Guide

## Quick Deploy (SSH to server and run)

```bash
# 1. SSH to your production server
ssh root@your-server-ip

# 2. Create deployment directory
mkdir -p /opt/wallet-api
cd /opt/wallet-api

# 3. Copy project files (from your local machine)
# From local machine:
scp -r wallet-api/* root@your-server-ip:/opt/wallet-api/

# 4. Create .env file
cat > .env << 'EOF'
DACC_MNEMONIC=your-dacc-mnemonic-phrase-here
WALLET_MASTER_KEY=your-super-secret-master-key-at-least-32-characters-long
PORT=3001
NODE_ENV=production
EOF

# 5. Build Docker image
docker build -t wallet-api:latest .

# 6. Run container
docker run -d \
  --name wallet-api \
  --restart unless-stopped \
  --env-file .env \
  -p 3001:3001 \
  wallet-api:latest

# 7. Verify deployment
curl http://localhost:3001/health
# Expected: {"status":"OK","service":"wallet-api","version":"2.0.0"}
```

## Add to Existing PocketBase Docker Compose

If you're using docker-compose on production:

```yaml
# Add to your existing docker-compose.yml
services:
  wallet-api:
    build: ./wallet-api
    container_name: wallet-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DACC_MNEMONIC=${DACC_MNEMONIC}
      - WALLET_MASTER_KEY=${WALLET_MASTER_KEY}
    expose:
      - "3001"
    networks:
      - pocketbase_network
    healthcheck:
      test: wget --no-verbose --tries=1 --spider http://localhost:3001/health
      interval: 30s
      timeout: 10s
      retries: 3
```

Then run:
```bash
docker-compose up -d wallet-api
```

## Generate Secure Keys

```bash
# Generate DACC mnemonic (if you don't have one)
# You can use any BIP39 mnemonic generator
# Example using node:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate WALLET_MASTER_KEY (32+ chars)
openssl rand -hex 32
# Example output: 5a8f3b2c1d9e7f6a4b8c0d2e5f7a9b1c3d5e7f9a0b2c4d6e8f0a1b3c5d7e9f
```

## Verify Integration

After deploying wallet-api:

```bash
# 1. Test wallet-api directly
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"passwordSecretkey": "TestPassword123!@#"}'

# 2. Restart PocketBase to pick up the network change
docker restart pocketbase

# 3. Test via PocketBase Admin UI
# Go to: https://pb.eggoworld.io/_/
# Collections → users → Create new record
# Verify wallet, pin, daccPublickey fields are populated
```

## Troubleshooting

### Wallet API not starting
```bash
docker logs wallet-api
# Check for missing .env variables or build errors
```

### PocketBase can't connect to wallet-api
```bash
# Verify both containers are on same network
docker network inspect pocketbase_network

# Test connectivity from PocketBase container
docker exec -it pocketbase wget -qO- http://wallet-api:3001/health
```

### 400 error when creating user
```bash
# Check PocketBase logs
docker logs pocketbase | grep -i "wallet\|error"

# Check wallet-api logs
docker logs wallet-api | grep -i "POST\|error"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DACC_MNEMONIC` | ✅ | DACC wallet mnemonic phrase |
| `WALLET_MASTER_KEY` | ✅ | Encryption key (min 32 chars) |
| `PORT` | ❌ | Server port (default: 3001) |
| `NODE_ENV` | ❌ | Environment (default: production) |
| `ALLOWED_ORIGINS` | ❌ | CORS allowed origins |

## Security Checklist

- [ ] DACC_MNEMONIC is a secure, randomly generated mnemonic
- [ ] WALLET_MASTER_KEY is at least 32 characters
- [ ] .env file is not committed to git
- [ ] Docker container runs as non-root user (optional)
- [ ] Firewall only allows access from PocketBase container
- [ ] HTTPS enabled via reverse proxy (nginx/traefik)
