# System Architecture

## High-Level Overview

EggoWorld is a **gamified NFT Marketplace** with a 4-level MLM (Multi-Level Marketing) referral system built on BNB SmartChain. The system allows users to purchase and trade NFTs while earning commissions through referral networks.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│                      (Next.js 16 + React 19)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │   Dashboard  │  │  NFT Market  │          │
│  │     Page     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS/WebSocket
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│                       (Nginx Reverse Proxy)                     │
└─────────────┬─────────────────────────────┬────────────────────┘
              │                             │
              ↓                             ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│   Backend Service        │    │   Wallet API Service     │
│   (PocketBase)           │    │   (Express.js)           │
│                          │    │                          │
│  • User Auth             │    │  • Wallet Management    │
│  • Business Logic        │    │  • USDT Balance         │
│  • Database Operations   │    │  • Blockchain Ops       │
│  • Referral Chain        │    │                          │
└────────────┬─────────────┘    └────────────┬─────────────┘
             │                                │
             ↓                                ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│   SQLite Database        │    │   BNB SmartChain         │
│                          │    │                          │
│  • users                 │    │  • USDT (BEP-20)        │
│  • referrals             │    │  • NFT Smart Contracts  │
│  • user_wallets          │    │  • Wallet Addresses      │
└──────────────────────────┘    └──────────────────────────┘
```

## Component Architecture

### 1. Frontend Service (Next.js)

**Location**: `apps/web/`

**Responsibilities**:
- User interface and experience
- Client-side state management
- Form validation and user input
- Real-time updates via PocketBase subscriptions
- SEO and performance optimization

**Key Technologies**:
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui component library
- PocketBase JavaScript SDK
- React Hook Form + Zod

**Deployment**: Vercel/Cloudflare (CDN)

### 2. Backend Service (PocketBase)

**Location**: `apps/backend/`

**Responsibilities**:
- User authentication (Email/Password + LINE OAuth)
- Business logic execution
- Database operations and migrations
- API endpoint handling
- Real-time subscriptions
- File storage (avatars, NFT metadata)

**Key Technologies**:
- PocketBase (Go-based BaaS)
- SQLite database
- Custom JavaScript hooks
- File system storage

**Deployment**: `pb.eggoworld.io` (Docker container)

**Hook Execution Order**:
```
01-create-wallet.pb.js        # Wallet creation
02-get-wallet-balance.pb.js   # Balance checking
03-update-balance.pb.js       # Balance updates
04-transfer-usdt.pb.js        # USDT transfers
05-referral-chain.pb.js       # MLM referral system
06-register-user.pb.js        # User registration
```

### 3. Wallet API Service (Express.js)

**Location**: `wallet-api/`

**Responsibilities**:
- EVM wallet creation and management
- Private key encryption/decryption
- USDT balance checking
- Blockchain transaction preparation
- Wallet address validation

**Key Technologies**:
- Express.js
- ethers.js
- Custom XOR encryption

**Deployment**: Separate container service

### 4. Smart Contracts

**Location**: `contracts/`

**Responsibilities**:
- NFT ownership and transfer
- USDT payment processing
- Commission distribution logic
- Marketplace operations

**Key Technologies**:
- Foundry (Solidity development framework)
- Solidity programming language
- OpenZeppelin contract libraries
- BNB SmartChain

**Deployment**: BSC Testnet/Mainnet

### 5. API Gateway (Nginx)

**Location**: `nginx/`

**Responsibilities**:
- Reverse proxy routing
- SSL/TLS termination
- Rate limiting
- Load balancing
- Static file serving
- CORS management

## Data Flow Architecture

### User Registration Flow

```
User → Frontend (LINE OAuth)
         ↓
      LINE API
         ↓
      Frontend (receives code)
         ↓
      Backend (LINE token exchange)
         ↓
      Wallet API (create EVM wallet)
         ↓
      Backend (save user + encrypt private key)
         ↓
      Backend (build 4-level referral chain)
         ↓
      Database (persist user data)
         ↓
      Frontend (redirect to dashboard)
```

### NFT Purchase Flow

```
User → Frontend (select NFT)
         ↓
      Backend (calculate price + commission)
         ↓
      Backend (determine referral chain)
         ↓
      Wallet API (prepare transaction)
         ↓
      User Wallet (approve USDT spend)
         ↓
      Smart Contract (execute purchase)
         ↓
      Backend (distribute commissions)
         ↓
      Database (update balances + ownership)
         ↓
      Frontend (update UI via subscription)
```

### Commission Distribution Flow

**Original MLM Commission:**
```
NFT Sale → Backend (detect sale)
             ↓
          Backend (calculate total commission)
             ↓
          Backend (lookup 4-level referral chain)
             ↓
          ┌────────┴────────┬────────┬────────┐
          ↓                 ↓        ↓        ↓
       G1 (25%)         G2 (15%)  G3 (10%)  G4 (5%)
          ↓                 ↓        ↓        ↓
       Database      Database  Database  Database
       (update      (update   (update   (update
        balance)     balance)  balance)  balance)
```

**Egg NFT Commission (On-Chain):** ⭐ NEW
```
Egg Mint (25 USDT) → Smart Contract
                        ↓
                  CommissionDistribution
                        ↓
          ┌─────────────┴────────────┬────────┬────────┐
          ↓                          ↓        ↓        ↓
       G1 (20%)                  G2 (10%)  G3 (10%)  G4 (10%)
          ↓                          ↓        ↓        ↓
       On-Chain                  On-Chain  On-Chain  On-Chain
       Claimable                 Claimable Claimable Claimable
          
          └─────────────┬────────────┘
                        ↓
                 CoinStor (4%)
                        ↓
                  Protocol Reserve
```

## Database Schema Architecture

### Users Collection
```json
{
  "id": "record_id",
  "email": "user@example.com",
  "walletAddress": "0x...",
  "lineUserId": "U...",
  "referrerId": "referrer_record_id",
  "usdtBalance": 100.50,
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z"
}
```

### Referrals Collection
```json
{
  "id": "record_id",
  "referrerId": "referrer_record_id",
  "refereeId": "new_user_record_id",
  "level": 1,
  "g1": "g1_record_id",
  "g2": "g2_record_id",
  "g3": "g3_record_id",
  "g4": "g4_record_id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### User Wallets Collection
```json
{
  "id": "record_id",
  "userId": "user_record_id",
  "walletAddress": "0x...",
  "encryptedPrivateKey": "encrypted_hex",
  "usdtBalance": 100.50,
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

## Security Architecture

### Authentication Layer
- **Primary**: Email/Password via PocketBase
- **Social**: LINE OAuth integration
- **Session**: JWT tokens managed by PocketBase

### Data Encryption
- **Wallet Private Keys**: XOR encryption with master key
- **Transit**: TLS/SSL for all API communications
- **At Rest**: SQLite database file permissions

### API Security
- **Rate Limiting**: Nginx-level limits
- **CORS**: Configured for frontend domain
- **Input Validation**: Zod schemas on frontend, PocketBase validators on backend
- **Authorization**: Role-based access control

### Blockchain Security
- **Wallet Keys**: Encrypted at rest, never logged
- **Transaction Signing**: Client-side signature requests
- **Contract Audits**: Professional audit before mainnet deployment

## Scalability Architecture

### Horizontal Scaling
- **Frontend**: CDN (Vercel/Cloudflare) auto-scales
- **Backend**: PocketBase can be load-balanced
- **Wallet API**: Stateless, can run multiple instances

### Vertical Scaling
- **Database**: SQLite → PostgreSQL migration path
- **Caching**: Redis for session and rate limiting
- **CDN**: Static assets cached globally

### Performance Optimization
- **Frontend**: Code splitting, lazy loading, ISR
- **Backend**: Database indexing, query optimization
- **Blockchain**: Batch operations when possible

## Deployment Architecture

### Development Environment
```bash
Frontend:  localhost:3000
Backend:   localhost:8090
Wallet API: localhost:3001
```

### Production Environment
```
Frontend:  app.eggoworld.io (Vercel)
Backend:   pb.eggoworld.io (Docker)
Wallet API: api.eggoworld.io/wallet (Docker)
Contracts: BSC Mainnet
```

### Infrastructure
- **Frontend Hosting**: Vercel/Cloudflare
- **Backend Hosting**: Docker containers on cloud VPS
- **Database**: Managed SQLite (migration path to PostgreSQL)
- **Blockchain**: BNB SmartChain
- **CDN**: Cloudflare for static assets
- **Monitoring**: Application logs + Vercel Analytics

## Technology Rationale

### Why PocketBase?
- Lightweight, self-contained backend
- Built-in authentication and database
- Easy to deploy and maintain
- Real-time subscriptions out of the box
- Perfect for small to medium projects

### Why Next.js?
- Server-side rendering for SEO
- App Router for modern React patterns
- Built-in optimization and caching
- Excellent developer experience
- Strong TypeScript support

### Why BNB SmartChain?
- Low transaction fees
- Fast confirmations
- EVM compatibility (familiar tooling)
- USDT (BEP-20) liquidity
- Growing ecosystem

### Why Foundry?
- Fastest testing framework
- Excellent developer tooling
- Solidity-native
- Gas profiling and optimization
- Modern替代 to Hardhat

## Monitoring and Observability

### Logging
- **Backend**: PocketBase application logs
- **Frontend**: Vercel Analytics + console
- **Wallet API**: Express middleware logging

### Metrics
- **Performance**: Page load times, API response times
- **Business**: NFT sales, referral signups, commission amounts
- **Errors**: Error rates, exception tracking

### Health Checks
- **Backend**: `/api/health` endpoint
- **Wallet API**: `/health` endpoint
- **Database**: Connection status monitoring

## Disaster Recovery

### Backups
- **Database**: Daily automated backups
- **Wallet Keys**: Encrypted backups with master key
- **Smart Contracts**: Verified source code on BSCScan

### Recovery Procedures
1. Restore database from backup
2. Redeploy containers from Docker images
3. Verify wallet encryption keys
4. Test critical user flows

## Future Architecture Considerations

### Potential Improvements
- **Database**: Migrate to PostgreSQL for better scalability
- **Caching**: Add Redis layer for session management
- **Message Queue**: RabbitMQ/Redis for async operations
- **Microservices**: Further service decomposition
- **CDN**: More aggressive caching strategies

### Migration Path
The current architecture is designed to scale gradually:
1. SQLite → PostgreSQL (when read/write load increases)
2. Single backend → Load-balanced backends (when user count grows)
3. Simple auth → OAuth providers (expand beyond LINE)
4. Single chain → Multi-chain support (expand beyond BSC)
