# wallet-srv

Wallet API service using dacc-js with Bun and Express.

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Build for production
bun run build
```

## API Endpoints

### Wallet Management

#### Create Wallet
```bash
POST /api/v1/wallet/create
Content-Type: application/json

{
  "passwordSecretkey": "YourSecurePassword123!"
}

Response:
{
  "success": true,
  "data": {
    "address": "0x...",
    "daccPublickey": "daccPublickey_..."
  }
}
```

### Chain-Based Operations

#### Get Native Balance
```bash
GET /api/v1/:chainId/balance-native?address=0x...

Supported Chain IDs:
- 56: BSC
- 97: BSC Testnet
- 1: Ethereum
- 11155111: Sepolia
- 137: Polygon
- 80001: Mumbai
```

### EIP-7702 Account Abstraction

#### Authorize Smart Account
```bash
POST /api/v2/eip7702/authorize
Content-Type: application/json

{
  "smartAccount": "0x...",
  "chainId": 56
}
```

#### Get Status
```bash
GET /api/v2/eip7702/status?address=0x...
```

## Configuration

Create a `.env` file:

```bash
# Server
PORT=3000
NODE_ENV=development

# dacc-js Configuration
MIN_PASSWORD_LENGTH=12
MAX_PASSWORD_LENGTH=120
PUBLIC_ENCRYPTION=false

# CORS
CORS_ORIGIN=*

# Blockchain RPCs (optional)
# INFURA_KEY=your_key_here
# ALCHEMY_KEY=your_key_here
```

## Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f wallet-srv

# Restart
docker-compose restart wallet-srv
```

## Testing

```bash
# Run all tests
bun test

# Run specific test
bun test test/health.test.ts

# Run with coverage
bun test --coverage
```

## Project Structure

```
wallet-srv/
├── src/
│   ├── index.ts                 # Main server
│   └── routes/
│       ├── createWallet.ts      # Wallet creation
│       ├── chainRouter.ts       # Multi-chain API
│       └── eip7702Router.ts     # EIP-7702 endpoints
├── test/
│   ├── health.test.ts
│   ├── wallet-create.test.ts
│   ├── chain/
│   │   └── balance-native.test.ts
│   └── eip7702/
│       └── eip7702.test.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

## License

MIT
