# Architecture Decision Records (ADRs)

This document records significant architectural decisions made for the EggoWorld project. Each decision has a unique identifier, title, status, date, and rationale.

## ADR-001: Use PocketBase as Backend Framework

**Status**: Accepted
**Date**: 2024-01-01
**Deciders**: Development Team

### Context
We needed a backend solution that could:
- Handle user authentication and authorization
- Provide a database with real-time subscriptions
- Be easy to deploy and maintain
- Support custom business logic
- Scale to our initial user base

### Decision
We chose **PocketBase** as our backend framework over alternatives like Firebase, Supabase, or custom Node.js/Go servers.

### Rationale
**Pros**:
- **Self-contained**: Single binary, no external dependencies
- **Built-in auth**: Email/password and OAuth support out of the box
- **Real-time subscriptions**: Built-in WebSocket support
- **Easy deployment**: Single Docker container
- **JavaScript hooks**: Business logic in familiar JS/TS
- **Cost effective**: No vendor lock-in or recurring costs
- **Fast development**: Built-in admin UI for debugging

**Cons**:
- **Smaller ecosystem**: Fewer plugins/integrations than Firebase
- **Single server**: Not distributed by default (can be load-balanced)
- **SQLite default**: May need PostgreSQL migration at scale

### Alternatives Considered
1. **Firebase**: Rejected due to cost and vendor lock-in
2. **Supabase**: Rejected due to complexity and over-engineering for our needs
3. **Custom Node.js**: Rejected due to development time and maintenance burden
4. **Custom Go**: Rejected due to longer development cycle

### Consequences
- **Positive**: Fast development, easy deployment, low operational overhead
- **Negative**: May need to migrate to PostgreSQL if we outgrow SQLite
- **Mitigation**: Design schema with PostgreSQL migration in mind

---

## ADR-002: Implement 4-Level MLM Referral System

**Status**: Accepted
**Date**: 2024-01-05
**Deciders**: Development Team

### Context
We needed to implement a referral marketing system that:
- Incentivizes user referrals
- Rewards multiple levels of referrers
- Aligns with MLM best practices
- Prevents fraud and abuse

### Decision
We implemented a **4-level MLM referral system** with commission distribution:
- G1 (direct referrer): 25%
- G2 (2nd level): 15%
- G3 (3rd level): 10%
- G4 (4th level): 5%
- Platform: 45%

### Rationale
**Pros**:
- **Deep incentives**: Rewards referrers up to 4 levels deep
- **Sustainable**: Platform retains 45% for operations
- **Motivational**: Higher rewards for direct referrals
- **Standard**: Follows industry MLM practices
- **Prevents gaming**: Fixed depth prevents infinite chains

**Cons**:
- **Complexity**: More complex than simple referral systems
- **Database overhead**: Requires storing 4-level chains
- **Calculation complexity**: Commission distribution requires careful logic

### Alternatives Considered
1. **2-level system**: Rejected as not incentivizing enough
2. **Unlimited depth**: Rejected due to complexity and fraud risk
3. **Fixed bounty**: Rejected as less motivational than recurring commissions
4. **Tiered percentages**: Rejected due to added complexity

### Consequences
- **Positive**: Strong viral growth potential
- **Negative**: More complex logic and database queries
- **Mitigation**: Well-tested referral chain building logic

---

## ADR-003: Use Next.js 16 with App Router

**Status**: Accepted
**Date**: 2024-01-10
**Deciders**: Development Team

### Context
We needed a frontend framework that:
- Provides excellent SEO
- Supports modern React patterns
- Has great developer experience
- Optimizes performance automatically
- Integrates well with PocketBase

### Decision
We chose **Next.js 16 with App Router** over other React frameworks.

### Rationale
**Pros**:
- **App Router**: Modern React patterns with Server Components
- **SEO**: Built-in SSR and SSG for search optimization
- **Performance**: Automatic code splitting and optimization
- **Developer Experience**: Excellent TypeScript support
- **Ecosystem**: Large community and plugin ecosystem
- **Vercel Integration**: Seamless deployment

**Cons**:
- **Learning curve**: App Router is newer and different from Pages Router
- **Rapid changes**: Next.js evolves quickly
- **Opinionated**: Requires following Next.js conventions

### Alternatives Considered
1. **Create React App**: Rejected due to lack of SSR and poor performance
2. **Vite + React**: Rejected due to manual SSR configuration
3. **Remix**: Rejected due to smaller ecosystem and learning curve
4. **Pages Router**: Rejected in favor of modern App Router

### Consequences
- **Positive**: Fast development, great performance, excellent SEO
- **Negative**: Team must learn App Router patterns
- **Mitigation**: Comprehensive documentation and examples

---

## ADR-004: Deploy on BNB SmartChain (BSC)

**Status**: Accepted
**Date**: 2024-01-15
**Deciders**: Development Team

### Context
We needed a blockchain network that:
- Supports USDT (BEP-20)
- Has low transaction fees
- Fast confirmation times
- EVM compatibility for familiar tooling
- Good ecosystem support

### Decision
We chose **BNB SmartChain (BSC)** as our blockchain network.

### Rationale
**Pros**:
- **Low fees**: Significantly cheaper than Ethereum mainnet
- **Fast confirmations**: ~3 second block times
- **USDT support**: Native USDT (BEP-20) with good liquidity
- **EVM compatible**: Use familiar Ethereum tools
- **Growing ecosystem**: Active community and DApp ecosystem
- **Stable**: Mature network with good track record

**Cons**:
- **Centralization**: More centralized than Ethereum
- **Binance dependency**: Tied to Binance ecosystem
- **Smaller ecosystem**: Fewer developers than Ethereum

### Alternatives Considered
1. **Ethereum**: Rejected due to high gas fees
2. **Polygon**: Rejected due to less USDT liquidity
3. **Arbitrum**: Rejected due to complexity and smaller ecosystem
4. **Base**: Rejected due to being newer and less proven

### Consequences
- **Positive**: Low-cost transactions, fast confirmations
- **Negative**: Centralization concerns, Binance dependency
- **Mitigation**: Can migrate to other EVM chains if needed

---

## ADR-005: Use Foundry for Smart Contract Development

**Status**: Accepted
**Date**: 2024-01-20
**Deciders**: Development Team

### Context
We needed a smart contract development framework that:
- Supports Solidity
- Has fast testing and compilation
- Provides good debugging tools
- Has gas profiling capabilities
- Is actively maintained

### Decision
We chose **Foundry** over Hardhat for smart contract development.

### Rationale
**Pros**:
- **Speed**: Written in Rust, extremely fast
- **Testing**: Solidity-based testing, more intuitive
- **Gas profiling**: Built-in gas optimization tools
- **Tooling**: Forge, Cast, Anvil are excellent developer tools
- **Modern**: Active development and modern design
- **TypeScript support**: Good TS integration

**Cons**:
- **Newer**: Smaller community than Hardhat
- **Learning curve**: Different patterns from Hardhat
- **Documentation**: Less extensive than Hardhat

### Alternatives Considered
1. **Hardhat**: Rejected due to slower performance
2. **Truffle**: Rejected due to being outdated
3. **Brownie**: Rejected due to Python preference for Go/JS team

### Consequences
- **Positive**: Fast development, excellent tooling
- **Negative**: Learning curve for team familiar with Hardhat
- **Mitigation**: Comprehensive Foundry documentation and examples

---

## ADR-006: Implement LINE OAuth Integration

**Status**: Accepted
**Date**: 2024-01-25
**Deciders**: Development Team

### Context
We needed a social authentication provider that:
- Is popular in our target market (Thailand/Asia)
- Provides user profile data
- Is easy to integrate
- Has good security

### Decision
We chose **LINE OAuth** as our social authentication provider.

### Rationale
**Pros**:
- **Market fit**: LINE is dominant in Thailand/Asia
- **User experience**: Familiar and trusted by users
- **Profile data**: Access to display name and avatar
- **Security**: OAuth 2.0 protocol is secure
- **Conversion**: Reduces friction in signup flow

**Cons**:
- **Regional**: Limited to LINE users
- **Dependency**: Dependent on LINE platform
- **Data access**: Limited profile data compared to other providers

### Alternatives Considered
1. **Google OAuth**: Rejected as less popular in target market
2. **Facebook OAuth**: Rejected due to declining popularity
3. **Multiple providers**: Rejected due to complexity

### Consequences
- **Positive**: Higher conversion rates in target market
- **Negative**: Limited to LINE users
- **Mitigation**: Still offer email/password signup

---

## ADR-007: Use XOR Encryption for Wallet Keys

**Status**: Accepted
**Date**: 2024-02-01
**Deciders**: Development Team

### Status Update (2024-02-15)**: Under Review

This decision is currently being reconsidered. XOR encryption may not provide sufficient security for production use. We are evaluating AES-256-GCM as a more secure alternative.

### Context
We needed to encrypt wallet private keys at rest with:
- Simplicity of implementation
- Adequate security for MVP
- Easy decryption for transactions
- Performance efficiency

### Decision
We initially chose **XOR encryption** for wallet private keys.

### Rationale (Original Decision)
**Pros**:
- **Simple**: Easy to implement correctly
- **Fast**: Minimal performance overhead
- **Reversible**: Easy to decrypt when needed
- **No dependencies**: Built-in JavaScript

**Cons**:
- **Weak security**: XOR is not cryptographically secure
- **Pattern vulnerability**: Vulnerable to pattern analysis
- **Not production-ready**: Not suitable for production use

### Alternatives Considered
1. **AES-256-GCM**: Initially rejected due to complexity
2. **Key derivation functions**: Not considered initially
3. **External KMS**: Rejected due to cost and complexity

### Consequences
- **Positive**: Fast initial development
- **Negative**: Security concerns for production
- **Current Action**: Evaluating migration to AES-256-GCM

### Updated Recommendation
We should migrate to **AES-256-GCM** encryption:
- Industry standard for encryption
- Provides authenticated encryption
- Still relatively fast
- Available in Node.js crypto module

---

## ADR-008: Separate Wallet API Service

**Status**: Accepted
**Date**: 2024-02-05
**Deciders**: Development Team

### Context
We needed to decide whether to integrate wallet operations into PocketBase or create a separate service.

### Decision
We created a **separate Express.js wallet API service** for wallet operations.

### Rationale
**Pros**:
- **Separation of concerns**: Wallet logic separate from business logic
- **Security**: Isolates sensitive operations
- **Scalability**: Can scale wallet service independently
- **Technology flexibility**: Use different tools (ethers.js)
- **Testing**: Easier to test in isolation

**Cons**:
- **Complexity**: More services to deploy and maintain
- **Network overhead**: Additional HTTP calls
- **Consistency**: Need to ensure data consistency across services

### Alternatives Considered
1. **Integrate into PocketBase**: Rejected due to coupling concerns
2. **Use external service**: Rejected due to cost and dependency
3. **Serverless functions**: Rejected due to cold starts and complexity

### Consequences
- **Positive**: Clean separation, better security
- **Negative**: More complex deployment
- **Mitigation**: Docker compose for local development

---

## ADR-009: Use Bun as Package Manager

**Status**: Accepted
**Date**: 2024-02-10
**Deciders**: Development Team

### Context
We needed a package manager and runtime that:
- Is fast and efficient
- Supports npm ecosystem
- Has good TypeScript support
- Is actively developed

### Decision
We chose **Bun** as our package manager and JavaScript runtime.

### Rationale
**Pros**:
- **Performance**: Significantly faster than npm/yarn
- **Compatibility**: Drop-in replacement for npm
- **All-in-one**: Package manager, test runner, bundler
- **TypeScript**: Native TypeScript support
- **Modern**: Active development and modern design

**Cons**:
- **Newer**: Less mature than npm/yarn
- **Ecosystem**: Smaller ecosystem and community
- **Compatibility**: Some packages may not work

### Alternatives Considered
1. **npm**: Rejected due to slow performance
2. **yarn**: Rejected due to complexity and slower than Bun
3. **pnpm**: Rejected due to disk space concerns

### Consequences
- **Positive**: Faster installs and builds
- **Negative**: Newer tool with smaller ecosystem
- **Mitigation**: Can fall back to npm if needed

---

## ADR-010: Implement NFT Gamification Loop

**Status**: Accepted
**Date**: 2024-02-15
**Deciders**: Development Team

### Context
We needed a game mechanic that:
- Encourages repeat purchases
- Creates engagement and retention
- Is simple to understand
- Integrates with MLM system

### Decision
We implemented an **Egg → Food → Animal NFT game loop**:
1. Buy Egg NFT ($25) → Get 2 free Food NFTs
2. Buy more Food NFTs ($0.50 each)
3. Collect 10 Food NFTs
4. Hatch Egg into Animal NFT

### Rationale
**Pros**:
- **Engaging**: Creates collection and completion motivation
- **Revenue**: Drives additional purchases (Food NFTs)
- **Simple**: Easy to understand mechanics
- **Integration**: Works with MLM commissions
- **Gamification**: Adds fun and progress elements

**Cons**:
- **Complexity**: More complex than simple NFT sales
- **Inventory management**: Need to track NFT types
- **Balancing**: Need to balance economics

### Alternatives Considered
1. **Simple NFT sales**: Rejected as less engaging
2. **Random gacha**: Rejected due to gambling concerns
3. **Breeding mechanics**: Rejected due to complexity
4. **Staking rewards**: Rejected due to complexity

### Consequences
- **Positive**: Higher engagement and revenue potential
- **Negative**: More complex game logic
- **Mitigation**: Thorough testing of game mechanics

---

## Future Decisions

### Pending Decisions
1. **Database Migration**: When to migrate from SQLite to PostgreSQL
2. **Scaling Strategy**: When to implement load balancing
3. **NFT Marketplace**: Whether to implement P2P marketplace
4. **Mobile App**: Whether to build native mobile apps
5. **Multi-chain**: Whether to expand to other blockchains

### Decisions Under Review
1. **Wallet Encryption**: Reconsidering XOR vs AES-256-GCM
2. **Commission Structure**: Whether to adjust percentages
3. **NFT Types**: Whether to add more NFT varieties

### Propose a New Decision
To propose a new ADR, create a document in `/docs/adrs/` with:
- Unique identifier (ADR-011, ADR-012, etc.)
- Clear context and problem statement
- Decision and rationale
- Alternatives considered
- Consequences

## Decision Review Process

### When to Review
- Every 6 months for Accepted decisions
- When new information emerges
- Before major architecture changes
- When pain points are identified

### How to Review
1. Read the original ADR
2. Assess current validity
3. Consider new alternatives
4. Update status: Accepted, Deprecated, Superseded
5. Add status update with reasoning

### Status Values
- **Proposed**: Under consideration
- **Accepted**: Currently implemented
- **Deprecated**: No longer recommended but still in use
- **Superseded**: Replaced by a newer decision
- **Rejected**: Not adopted
