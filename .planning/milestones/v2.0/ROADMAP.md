# Milestone v2.0 - Contract Interactions & Game Features

## Goal

Replace mock blockchain calls with real contract interactions and implement feed/play game features.

## Phases

### Phase 1: Contract Deployment (P0)

- Deploy smart contracts to BSC testnet/mainnet
- Generate /contract-addresses.json file
- Document deployed contract addresses

### Phase 2: Wallet API Real Contract Calls (P0)

- Implement /api/v1/wallet/mint-egg with ethers.js
- Implement /api/v1/wallet/claim-commission with ethers.js
- Implement /api/v1/wallet/mint-food with ethers.js
- Implement /api/v1/wallet/feed-egg with ethers.js

### Phase 3: Track Deposit Hook (P1)

- Implement 13-track-deposit.pb.js hook
- Add USDT Transfer event polling
- Create deposit records in PocketBase
- Handle duplicate detection

### Phase 4: Feed Feature (P2)

- Frontend: Handle feed button in eggs/page.tsx
- Backend: 16-feed-egg.pb.js hook (already exists, needs completion)
- Wallet API: Replace mock with real feedEgg contract call

### Phase 5: Play Feature (P2)

- Game design spec needed
- Frontend: Handle play button in eggs/page.tsx
- Backend: Create play interaction hook
- Wallet API: Implement play contract call

## Success Criteria

- All endpoints return real transaction hashes
- All tests pass (including RED PHASE)
- Feed/play buttons functional in UI
- No mock data in production code

## Dependencies

- Phase 1 must complete before Phase 2
- Phase 2 must complete before Phase 4-5
- Phase 3 is independent
