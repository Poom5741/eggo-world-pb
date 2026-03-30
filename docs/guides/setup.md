# Development Setup Guide

This guide walks you through setting up the EggoWorld development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** >= 1.0.0 (JavaScript runtime and package manager)
- **Node.js** >= 20.0.0 (for wallet-api)
- **Go** >= 1.21.0 (for PocketBase compilation)
- **Docker** >= 24.0.0 (for containerized services)
- **Docker Compose** >= 2.20.0
- **Foundry** >= 0.2.0 (for smart contract development)
- **Git** >= 2.40.0

### Installation Commands

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Install Go (macOS)
brew install go

# Install Docker (macOS)
brew install --cask docker

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/eggo-pocketbase.git
cd eggo-pocketbase
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd apps/backend
bun install

# Install frontend dependencies
cd ../web
bun install

# Install wallet-api dependencies
cd ../../wallet-api
bun install

# Install contract dependencies
cd ../contracts
bun install
```

## Environment Configuration

### 1. Backend Environment

Create `apps/backend/.env`:

```bash
# PocketBase Configuration
PB_ADMIN_EMAIL=admin@eggoworld.io
PB_ADMIN_PASSWORD=your_secure_password_here

# Wallet Encryption
WALLET_MASTER_KEY=your_master_encryption_key_here

# LINE OAuth
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_REDIRECT_URI=http://localhost:3000/auth/line/callback

# Database
PB_DATA_PATH=./pb_data

# API URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
WALLET_API_URL=http://localhost:3001
```

### 2. Frontend Environment

Create `apps/web/.env.local`:

```bash
# PocketBase Backend
PB_URL=http://localhost:8090

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LINE OAuth
NEXT_PUBLIC_LINE_CHANNEL_ID=your_line_channel_id

# Blockchain
NEXT_PUBLIC_CHAIN_ID=97  # BSC Testnet
NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=0x...
```

### 3. Wallet API Environment

Create `wallet-api/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Wallet Encryption
WALLET_MASTER_KEY=your_master_encryption_key_here

# Blockchain
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
USDT_CONTRACT_ADDRESS=0x...

# Backend
PB_URL=http://localhost:8090
```

## Database Setup

### 1. Initialize PocketBase

```bash
cd apps/backend

# Start PocketBase (will initialize database on first run)
./pocketbase serve
```

### 2. Run Migrations

```bash
# In a new terminal
cd apps/backend

# Run pending migrations
./pocketbase migrate up
```

### 3. Create Admin User

1. Visit http://localhost:8090/_/
2. Click "Create admin account"
3. Enter admin email and password from `.env`

## LINE OAuth Setup

### 1. Create LINE Login Channel

1. Visit [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new provider (if needed)
3. Create a new "LINE Login" channel
4. Configure:
   - **Callback URL**: `http://localhost:3000/auth/line/callback`
   - **Email permission**: Enable
   - **Profile permission**: Enable

### 2. Get Credentials

From your LINE channel settings:
- Copy `Channel ID`
- Copy `Channel Secret`

### 3. Update Environment Variables

Add these to your `.env` files:

```bash
# Backend (apps/backend/.env)
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret

# Frontend (apps/web/.env.local)
NEXT_PUBLIC_LINE_CHANNEL_ID=your_channel_id
```

## Blockchain Setup

### 1. Configure Wallet

For local development, create a test wallet:

```bash
# Install Hardhat (for wallet generation)
npm install -g hardhat

# Generate a test wallet
npx hardhat node
```

Save the generated private key securely.

### 2. Get Testnet BNB

For BSC Testnet:
1. Visit [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Request testnet BNB

### 3. Get Testnet USDT

1. Visit [BSC Testnet USDT Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Request testnet USDT (BEP-20)

## Running Services

### Development Mode (All Services)

Open multiple terminal windows:

```bash
# Terminal 1: Backend
cd apps/backend
./pocketbase serve

# Terminal 2: Frontend
cd apps/web
bun run dev

# Terminal 3: Wallet API
cd wallet-api
bun run dev

# Terminal 4: (Optional) Nginx for production-like setup
cd nginx
docker-compose up
```

### Individual Services

#### Backend Only

```bash
cd apps/backend
./pocketbase serve
```

Access: http://localhost:8090

#### Frontend Only

```bash
cd apps/web
bun run dev
```

Access: http://localhost:3000

#### Wallet API Only

```bash
cd wallet-api
bun run dev
```

Access: http://localhost:3001

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:8090/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Check Frontend

Visit http://localhost:3000 - you should see the landing page.

### 3. Check Wallet API

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 4. Test LINE OAuth

1. Visit http://localhost:3000/auth/login
2. Click "Sign up with LINE"
3. Complete LINE OAuth flow
4. Verify user is created in backend admin panel

## Common Issues & Solutions

### Issue: PocketBase Won't Start

**Symptom**: `Error: listen tcp :8090: bind: address already in use`

**Solution**: Find and kill the process using port 8090:
```bash
# macOS/Linux
lsof -ti:8090 | xargs kill -9

# Or use a different port
PB_PORT=8091 ./pocketbase serve
```

### Issue: Frontend Can't Connect to Backend

**Symptom**: `NetworkError: Failed to fetch`

**Solution**: Verify backend is running and check `PB_URL`:
```bash
# Check backend is running
curl http://localhost:8090/api/health

# Check .env.local
cat apps/web/.env.local | grep PB_URL
```

### Issue: LINE OAuth Fails

**Symptom**: OAuth redirect error or invalid callback

**Solution**:
1. Verify LINE channel configuration
2. Check callback URL matches exactly
3. Ensure environment variables are set
4. Check LINE Developers Console for errors

### Issue: Wallet Creation Fails

**Symptom**: `Error: Failed to create wallet`

**Solution**:
1. Verify `WALLET_MASTER_KEY` is set in both backend and wallet-api
2. Check wallet-api is running
3. Verify blockchain RPC URL is accessible

### Issue: Database Migrations Fail

**Symptom**: `Error: Migration failed`

**Solution**:
```bash
# Check current migration status
./pocketbase migrate status

# Rollback if needed
./pocketbase migrate down

# Re-run migrations
./pocketbase migrate up
```

## Development Tools

### PocketBase Admin UI

Access: http://localhost:8090/_/

Features:
- View and edit database records
- Manage users and collections
- View logs
- Configure settings

### Foundry Commands

```bash
cd contracts

# Run tests
forge test

# Compile contracts
forge build

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url $BSC_RPC_URL --broadcast

# Verify contract
forge verify-contract <contract-address> ContractName --chain-id 97
```

### Bun Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Run production build
bun run start
```

## IDE Setup

### VS Code Extensions

Recommended extensions:
- **PocketBase Helper** - Syntax highlighting for PB hooks
- **Solidity** - Solidity language support
- **TypeScript** - TypeScript language support
- **ESLint** - Linting support
- **Prettier** - Code formatting

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "solidity.compileUsingRemoteVersion": "v0.8.20",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Production Deployment

### Backend Deployment

```bash
# Build PocketBase
cd apps/backend
go build

# Run with production config
PB_ENCRYPTION_KEY=your_key ./pocketbase serve --production
```

### Frontend Deployment

```bash
# Build Next.js app
cd apps/web
bun run build

# Start production server
bun run start
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Next Steps

1. **Read the documentation**: Check `/docs/` for detailed guides
2. **Review the codebase**: Explore the module structure
3. **Run tests**: Ensure everything is working
4. **Make your first change**: Start with a small feature or bug fix
5. **Join the community**: Connect with other developers

## Getting Help

- **Documentation**: Check `/docs/` directory
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions
- **Team**: Contact the development team

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] All prerequisites are installed
- [ ] Environment variables are configured
- [ ] Database migrations are run
- [ ] All services are running
- [ ] No port conflicts (8090, 3000, 3001)
- [ ] LINE OAuth is configured
- [ ] Wallet API is accessible
- [ ] Blockchain RPC is reachable
- [ ] You've checked the logs
- [ ] You've tried restarting services

## Related Documentation
- `/docs/00-architecture.md` - System architecture
- `/docs/01-domain-model.md` - Domain model
- `/docs/guides/testing.md` - Testing guide
- `/CLAUDE.md` - AI context file
