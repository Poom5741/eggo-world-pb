# Sprint: Hot Wallet USDT Withdrawal

In-Progress Tasks
-----------------
- [x] P0: TASK-001 Create OMO workflow files (SPEC.md + tasks.md)

## To Do

### Phase 1: Smart Contract Update

- [ ] P0: TASK-002 Add USDT support to CommissionDistribution.sol (#issue)
  - Add IERC20 import and usdtToken state variable
  - Add claimCommissionUSDT() function
  - Update constructor to accept USDT address
  - Accepts: deps=none
  - Test: forge test --match-contract CommissionDistributionTest

- [ ] P0: TASK-003 Deploy updated CommissionDistribution to BSC testnet (#issue)
  - Update deployment script with USDT testnet address
  - Deploy and verify on BSCScan
  - Update frontend ABI
  - Accepts: deps=TASK-002

### Phase 2: PocketBase Backend

- [ ] P1: TASK-004 Create hot wallet balance hook (#issue)
  - File: apps/backend/pb_hooks/12-check-hot-wallet.pb.js
  - Endpoint: POST /api/v2/hot-wallet/balance
  - Query on-chain CommissionDistribution balance
  - Accepts: deps=TASK-003

- [ ] P1: TASK-005 Update withdraw hook for hot wallet flow (#issue)
  - File: apps/backend/pb_hooks/09-withdraw-usdt.pb.js
  - Check hot wallet balance instead of internal balance
  - Send USDT from system hot wallet
  - Accepts: deps=TASK-004

- [ ] P1: TASK-006 Create withdrawals collection (#issue)
  - Collection: withdrawals
  - Fields: user, amount, tx_hash, status, external_address
  - Accepts: deps=none

### Phase 3: Frontend Withdraw UI

- [ ] P2: TASK-007 Create withdraw page (#issue)
  - File: apps/web/app/dashboard/withdraw/page.tsx
  - Display withdrawable balance
  - Withdraw form (amount, external address)
  - Accepts: deps=TASK-004

- [ ] P2: TASK-008 Add withdraw transaction tracking (#issue)
  - Component: WithdrawalHistory.tsx
  - Query withdrawals collection
  - Display status and tx hash
  - Accepts: deps=TASK-006

### Phase 4: Testing & Deployment

- [ ] P0: TASK-009 Write Foundry tests for claimCommissionUSDT (#issue)
  - File: contracts/test/CommissionDistribution.t.sol
  - Test: claim commission in USDT
  - Test: insufficient balance
  - Accepts: deps=TASK-002

- [ ] P0: TASK-010 Test full flow on BSC testnet (#issue)
  - Mint NFT → earn commission → withdraw USDT
  - Verify end-to-end flow
  - Accepts: deps=TASK-003,TASK-005,TASK-007

- [ ] P0: TASK-011 Deploy to BSC mainnet (#issue)
  - Deploy CommissionDistribution with mainnet USDT
  - Update production env vars
  - Accepts: deps=TASK-010

## Done

(None yet)
