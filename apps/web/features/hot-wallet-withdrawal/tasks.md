# Sprint: Hot Wallet USDT Withdrawal

## In Progress

- [ ] P0: TASK_001 Add USDT support to CommissionDistribution.sol
  - Accepts: deps=none
  - File: `contracts/src/CommissionDistribution.sol`
  - Estimate: 2h

## To Do

### Phase 1: Smart Contract (P0)

- [ ] P0: TASK_002 Add claimCommissionUSDT() function
  - Accepts: deps=TASK_001
  - File: `contracts/src/CommissionDistribution.sol`
  - Estimate: 1h

- [ ] P0: TASK_003 Create deployment script with USDT address
  - Accepts: deps=TASK_002
  - File: `contracts/script/DeployCommissionDistribution.s.sol`
  - Estimate: 1h

- [ ] P0: TASK_004 Deploy to BSC testnet
  - Accepts: deps=TASK_003
  - Command: `forge script script/DeployCommissionDistribution.s.sol --rpc-url $BSC_TESTNET_RPC --private-key $DEPLOYER_KEY --broadcast --verify`
  - Estimate: 30m

- [ ] P1: TASK_005 Update frontend ABI
  - Accepts: deps=TASK_004
  - File: `apps/web/lib/contracts/commissionDistribution.ts`
  - Estimate: 30m

### Phase 2: PocketBase Backend (P1)

- [ ] P1: TASK_006 Create hot wallet balance hook
  - Accepts: deps=TASK_001
  - File: `apps/backend/pb_hooks/12-check-hot-wallet.pb.js`
  - Estimate: 2h

- [ ] P1: TASK_007 Update withdraw-usdt hook for hot wallet
  - Accepts: deps=TASK_006
  - File: `apps/backend/pb_hooks/09-withdraw-usdt.pb.js`
  - Estimate: 2h

- [ ] P1: TASK_008 Create withdrawals collection
  - Accepts: deps=none
  - File: `apps/backend/collections/withdrawals.json`
  - Estimate: 30m

### Phase 3: Hot Wallet Service (P1)

- [ ] P1: TASK_009 Create wallet-api send USDT endpoint
  - Accepts: deps=none
  - File: `wallet-api/src/routes/sendUSDT.ts`
  - Estimate: 2h

- [ ] P1: TASK_010 Add transaction monitoring
  - Accepts: deps=TASK_009
  - File: `wallet-api/src/services/txMonitor.ts`
  - Estimate: 1h

### Phase 4: Frontend UI (P2)

- [ ] P2: TASK_011 Create withdraw page
  - Accepts: deps=TASK_006
  - File: `apps/web/app/dashboard/withdraw/page.tsx`
  - Estimate: 2h

- [ ] P2: TASK_012 Create withdraw form component
  - Accepts: deps=TASK_011
  - File: `apps/web/components/withdraw-form.tsx`
  - Estimate: 2h

- [ ] P2: TASK_013 Add balance display component
  - Accepts: deps=TASK_006
  - File: `apps/web/components/hot-wallet-balance.tsx`
  - Estimate: 1h

- [ ] P2: TASK_014 Add transaction history
  - Accepts: deps=TASK_008
  - File: `apps/web/components/withdrawal-history.tsx`
  - Estimate: 1h

### Phase 5: Testing & Deploy (P0)

- [ ] P0: TASK_015 Write Foundry tests for claimCommissionUSDT
  - Accepts: deps=TASK_002
  - File: `contracts/test/CommissionDistribution.t.sol`
  - Estimate: 1h

- [ ] P0: TASK_016 Test full flow on testnet
  - Accepts: deps=TASK_004, TASK_008, TASK_014
  - Manual testing checklist
  - Estimate: 2h

- [ ] P0: TASK_017 Deploy to BSC mainnet
  - Accepts: deps=TASK_016
  - Command: `forge script ... --rpc-url $BSC_MAINNET_RPC ...`
  - Estimate: 1h

## Done

## Priority Legend

| Priority | Meaning                      | Timeline |
| -------- | ---------------------------- | -------- |
| P0       | Critical path, blocks others | Do first |
| P1       | Core implementation          | After P0 |
| P2       | UI/UX enhancements           | After P1 |

## Notes

- Follow existing patterns: Thai comments, file naming (`NN-feature.pb.js`)
- Use viem for Web3 interactions (not ethers)
- Test on BSC testnet (97) before mainnet (56)
- Hot wallet private key: store in `.env` (never commit)
