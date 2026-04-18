# Milestone v0.0.7: Security & Quality Fixes

## TL;DR

> **Quick Summary**: Fix critical security issues (mock contract calls → real blockchain), implement missing features (feed/play), and fix failing tests (track-deposit hook).
>
> **Deliverables**:
>
> - Replace 4 mock contract endpoints with real ethers.js calls
> - Implement feed egg feature (frontend + backend + wallet-api)
> - Implement play interaction (pending game design spec)
> - Implement track-deposit hook to fix RED PHASE test
> - Complete deployment guide for contracts
>
> **Estimated Effort**: High (3 waves, ~8 tasks)
> **Parallel Execution**: YES - contract integration can parallelize, features sequential
> **Critical Path**: Contract deployment → Mock replacement → Feed feature → Test fix

---

## Context

### Original Request

Fix all known issues identified in AGENTS.md "REMAINING ISSUES" section, including:

- P0: Mock contract interactions returning fake transaction hashes
- P1: RED PHASE failing test (track-deposit hook)
- P2: Feed and Play features with UI buttons but no functionality

### Interview Summary

**Key Decisions**:

- Contracts: Deploy to BSC testnet first, then mainnet
- Feed: Use existing smart contract `feedEgg()` function
- Play: Implement basic interaction (awaiting game design spec)
- Tests: Must pass before v0.0.7 release

**Research Findings**:

- Contract addresses file missing: `/contract-addresses.json`
- Wallet API already has ethers.js setup
- Feed hook (`16-feed-egg.pb.js`) exists but may need updates
- Track-deposit test explicitly fails until hook implemented

### Metis Review

**Identified Gaps** (addressed in plan):

- Contract deployment prerequisites
- Security review for private key handling
- Backward compatibility with existing wallets
- Test coverage for new features

---

## Work Objectives

### Core Objective

Replace all mock contract interactions with real blockchain calls, implement missing feed/play features, and fix failing tests to achieve production-ready state.

### Concrete Deliverables

1. Contract deployment script and addresses file
2. Real contract calls in wallet-api (4 endpoints)
3. Feed egg feature complete (frontend + backend)
4. Play interaction basic implementation
5. Track-deposit hook implementation
6. All tests passing (no RED PHASE)

### Definition of Done

- [ ] Contracts deployed to BSC testnet
- [ ] `/contract-addresses.json` file exists
- [ ] 4 wallet-api endpoints return real transaction hashes
- [ ] Feed feature works end-to-end
- [ ] Track-deposit test passes
- [ ] `bun test` succeeds with zero failures

### Must Have

- Real contract calls (no mocks)
- Secure private key decryption
- Gas estimation before transactions
- Transaction confirmation waiting
- Error handling with retry logic

### Must NOT Have (Guardrails)

- NO mock data in production code
- NO test deletion to "pass"
- NO skipping security checks
- NO hardcode contract addresses in code (use env/file)

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Bun test, existing test files)
- **Automated tests**: YES (TDD - Red/Green/Refactor)
- **Framework**: Bun test + Jest patterns
- **Agent-Executed QA**: Bash (curl) for APIs, Playwright for UI

### QA Policy

Every task includes agent-executed QA scenarios with:

- **API endpoints**: curl - POST request, assert status + response body
- **Smart contracts**: Verify on BSCScan
- **Frontend features**: Playwright - Navigate, interact, assert DOM

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - contracts):
├── Task 1: Deploy smart contracts to BSC testnet
├── Task 2: Create /contract-addresses.json file
├── Task 3: Add contract ABIs to wallet-api
└── Task 4: Setup RPC provider configuration

Wave 2 (After Wave 1 - contract integration):
├── Task 5: Replace mock mint-egg with real contract call
├── Task 6: Replace mock claim-commission with real contract call
├── Task 7: Replace mock mint-food with real contract call
└── Task 8: Replace mock feed-egg with real contract call

Wave 3 (After Wave 2 - features):
├── Task 9: Implement feed egg frontend handler
├── Task 10: Implement feed egg backend hook
├── Task 11: Implement basic play interaction
└── Task 12: Implement track-deposit hook (fix RED PHASE)

Wave FINAL (After ALL - verification):
├── Task F1: Security audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Test suite verification (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks        |
| ---- | ---------- | ------------- |
| 1    | -          | 2,3,4,5,6,7,8 |
| 2    | 1          | 5,6,7,8       |
| 3    | 2          | 5,6,7,8       |
| 4    | 2          | 5,6,7,8       |
| 5    | 2,3,4      | F1-F4         |
| 6    | 2,3,4      | F1-F4         |
| 7    | 2,3,4      | F1-F4         |
| 8    | 2,3,4      | 9,10,F1-F4    |
| 9    | 8          | F1-F4         |
| 10   | 9          | F1-F4         |
| 11   | 8          | F1-F4         |
| 12   | -          | F1-F4         |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → `deep` agents (contract deployment)
- **Wave 2**: 4 tasks → `ultrabrain` + `context7` (contract integration)
- **Wave 3**: 4 tasks → `visual-engineering` + `unspecified-high` (features)
- **FINAL**: 4 tasks → parallel verification

---

## TODOs

- [ ] 1. Deploy smart contracts to BSC testnet

  **What to do**:
  - Deploy EggNFT contract to BSC testnet (chain ID: 97)
  - Deploy FoodNFT contract to BSC testnet
  - Deploy CommissionDistribution contract
  - Deploy Marketplace contract
  - Record all deployed addresses
  - Verify contracts on BSCScan

  **Must NOT do**:
  - NO deployment to mainnet yet (testnet first)
  - NO skipping verification step

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 1 - foundation)
  - **Blocks**: Tasks 2,3,4,5,6,7,8

  **References**:
  - `contracts/script/Deploy.s.sol` - Deployment script
  - `contracts/.env.local` - Deployer private key
  - Foundry documentation for deployment

  **Acceptance Criteria**:
  - [ ] All 4 contracts deployed to BSC testnet
  - [ ] Addresses recorded in `.env` or temp file
  - [ ] Contracts verified on BSCScan
  - [ ] Deployment transaction hashes saved

  **QA Scenarios**:

  ```
  Scenario: Verify contract deployment
    Tool: Bash (curl)
    Steps:
      1. Query BSCScan API for contract code
      2. Assert contract created at address
      3. Assert code verified (green checkmark)
    Evidence: .sisyphus/evidence/task-1-contract-deploy.json
  ```

  **Commit**:
  - Message: `chore(contracts): deploy to BSC testnet`
  - Files: `contracts/.env.local` (addresses only)

---

- [ ] 2. Create /contract-addresses.json file

  **What to do**:
  - Create `/contract-addresses.json` in root
  - Structure:
    ```json
    {
      "chainId": 97,
      "contracts": {
        "eggNft": "0x...",
        "foodNft": "0x...",
        "commissionDistribution": "0x...",
        "marketplace": "0x..."
      }
    }
    ```
  - Add to `.gitignore` (contains real addresses)
  - Create `.env.example` with placeholder

  **Must NOT do**:
  - NO committing real mainnet addresses
  - NO hardcoding in source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocked By**: Task 1
  - **Blocks**: Tasks 5,6,7,8

  **References**:
  - Task 1: Deployment addresses
  - `.env.example` - Pattern for env files

  **Acceptance Criteria**:
  - [ ] File exists at `/contract-addresses.json`
  - [ ] Contains all 4 contract addresses
  - [ ] Chain ID matches deployment (97 for testnet)
  - [ ] File in `.gitignore`

  **QA Scenarios**:

  ```
  Scenario: Contract addresses file structure
    Tool: Bash
    Steps:
      1. Cat /contract-addresses.json
      2. Assert valid JSON
      3. Assert all 4 addresses present with 0x prefix
    Evidence: .sisyphus/evidence/task-2-addresses-file.json
  ```

  **Commit**:
  - Message: `feat(contracts): add contract addresses config`
  - Files: `/contract-addresses.json`, `.gitignore`

---

- [ ] 3. Add contract ABIs to wallet-api

  **What to do**:
  - Create `wallet-api/contracts/abi/` directory
  - Export ABIs from Foundry artifacts:
    - `EggNFT.abi.json`
    - `FoodNFT.abi.json`
    - `CommissionDistribution.abi.json`
    - `Marketplace.abi.json`
  - Load ABIs in `server.js`
  - Define function signatures for each contract

  **Must NOT do**:
  - NO manual ABI writing (export from artifacts)
  - NO ABI modification (use as-is)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocked By**: Task 1
  - **Blocks**: Tasks 5,6,7,8

  **References**:
  - `contracts/out/EggNFT.sol/EggNFT.json` - ABI source
  - `wallet-api/server.js` - Where ABIs used

  **Acceptance Criteria**:
  - [ ] All 4 ABI files exist
  - [ ] ABIs load without errors
  - [ ] Function signatures match contracts
  - [ ] TypeScript types defined (if using TS)

  **QA Scenarios**:

  ```
  Scenario: Load contract ABIs
    Tool: Bash (node)
    Steps:
      1. Start wallet-api
      2. Assert no errors loading ABIs
      3. Verify ABI functions accessible
    Evidence: .sisyphus/evidence/task-3-abi-load.log
  ```

  **Commit**:
  - Message: `feat(wallet-api): add contract ABIs`
  - Files: `wallet-api/contracts/abi/*.json`

---

- [ ] 4. Setup RPC provider configuration

  **What to do**:
  - Add `RPC_URL` to `.env.example`:
    ```bash
    RPC_URL=https://bsc-testnet.publicnode.com
    ```
  - Configure ethers.js provider in `server.js`
  - Add fallback RPC URLs (3 providers for redundancy)
  - Test provider connection

  **Must NOT do**:
  - NO hardcoded RPC URLs in production code
  - NO single point of failure (use fallbacks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Blocked By**: Task 2
  - **Blocks**: Tasks 5,6,7,8

  **References**:
  - `wallet-api/server.js` - Provider setup location
  - ethers.js documentation - Provider configuration

  **Acceptance Criteria**:
  - [ ] `RPC_URL` in `.env.example`
  - [ ] Provider configured in server.js
  - [ ] Fallback providers defined
  - [ ] Connection test succeeds

  **QA Scenarios**:

  ```
  Scenario: RPC provider connection
    Tool: Bash (curl)
    Steps:
      1. Call wallet-api health endpoint
      2. Assert RPC_URL configured
      3. Assert provider connected
    Evidence: .sisyphus/evidence/task-4-rpc-connection.json
  ```

  **Commit**:
  - Message: `feat(wallet-api): configure RPC provider`
  - Files: `wallet-api/server.js`, `wallet-api/.env.example`

---

- [ ] 5. Replace mock mint-egg with real contract call

  **What to do**:
  - Locate mock at `wallet-api/server.js:388`
  - Implement real contract call:
    1. Decrypt private key using `decryptPrivateKey()`
    2. Create ethers.js signer
    3. Connect to EggNFT contract
    4. Call `mintEgg(egg_id)` function
    5. Wait for transaction confirmation
    6. Return real transaction hash and token ID
  - Add gas estimation
  - Add retry logic (3 attempts)

  **Must NOT do**:
  - NO mock data (remove all fake hashes)
  - NO skipping decryption step
  - NO ignoring gas estimation

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: ["context7"]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 2,3,4
  - **Blocks**: FINAL verification

  **References**:
  - Task 3: Contract ABIs
  - Task 4: RPC provider
  - `wallet-api/server.js` - Mock location
  - `resources/pkbase-wallet/pkbase/pb_hooks/06-write-contract-hook.pb.js` - Reference

  **Acceptance Criteria**:
  - [ ] `mintEgg()` function implemented
  - [ ] Returns real transaction hash (not mock)
  - [ ] Token ID fetched from contract
  - [ ] Gas estimation works
  - [ ] Retry logic handles failures
  - [ ] No more TODO comments

  **QA Scenarios**:

  ```
  Scenario: Mint egg with real contract
    Tool: Bash (curl)
    Steps:
      1. POST /api/v1/wallet/mint-egg with user_address, egg_id
      2. Assert 200 OK
      3. Assert transaction_hash is valid (0x..., 66 chars)
      4. Verify on BSCScan: https://testnet.bscscan.com/tx/HASH
    Evidence: .sisyphus/evidence/task-5-mint-egg-curl.json
  ```

  **Commit**:
  - Message: `feat(wallet-api): implement real mint-egg contract call`
  - Files: `wallet-api/server.js`

---

- [ ] 6. Replace mock claim-commission with real contract call

  **What to do**:
  - Locate mock at `wallet-api/server.js:422`
  - Implement real contract call:
    1. Decrypt private key
    2. Create signer
    3. Connect to CommissionDistribution contract
    4. Call `claimCommission(user_address)` function
    5. Wait for confirmation
    6. Return real transaction hash and amount claimed
  - Add gas estimation
  - Add retry logic

  **Must NOT do**:
  - NO mock data
  - NO skipping claim amount calculation

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: ["context7"]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 2,3,4
  - **Blocks**: FINAL verification

  **References**:
  - Task 5: mint-egg implementation pattern
  - `contracts/src/CommissionDistribution.sol` - Contract functions

  **Acceptance Criteria**:
  - [ ] `claimCommission()` function implemented
  - [ ] Returns real transaction hash
  - [ ] Amount claimed returned correctly
  - [ ] Gas estimation works
  - [ ] Retry logic handles failures

  **QA Scenarios**:

  ```
  Scenario: Claim commission with real contract
    Tool: Bash (curl)
    Steps:
      1. POST /api/v1/wallet/claim-commission with user_address
      2. Assert 200 OK
      3. Assert transaction_hash valid
      4. Assert amount_claimed > 0
    Evidence: .sisyphus/evidence/task-6-claim-commission.json
  ```

  **Commit**:
  - Message: `feat(wallet-api): implement real claim-commission`
  - Files: `wallet-api/server.js`

---

- [ ] 7. Replace mock mint-food with real contract call

  **What to do**:
  - Locate mock at `wallet-api/server.js:457`
  - Implement real contract call:
    1. Decrypt private key
    2. Create signer
    3. Connect to FoodNFT contract
    4. Call `mintFood(quantity)` function
    5. Wait for confirmation
    6. Return real transaction hash and token IDs array
  - Add gas estimation
  - Add retry logic

  **Must NOT do**:
  - NO mock data
  - NO hardcoding quantity limits

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: ["context7"]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 2,3,4
  - **Blocks**: FINAL verification

  **References**:
  - Task 5: mint-egg implementation pattern
  - `contracts/src/FoodNFT.sol` - Contract functions

  **Acceptance Criteria**:
  - [ ] `mintFood()` function implemented
  - [ ] Returns real transaction hash
  - [ ] Token IDs array returned
  - [ ] Gas estimation works

  **QA Scenarios**:

  ```
  Scenario: Mint food with real contract
    Tool: Bash (curl)
    Steps:
      1. POST /api/v1/wallet/mint-food with user_address, quantity
      2. Assert 200 OK
      3. Assert transaction_hash valid
      4. Assert token_ids array not empty
    Evidence: .sisyphus/evidence/task-7-mint-food.json
  ```

  **Commit**:
  - Message: `feat(wallet-api): implement real mint-food`
  - Files: `wallet-api/server.js`

---

- [ ] 8. Replace mock feed-egg with real contract call

  **What to do**:
  - Locate mock at `wallet-api/server.js:493`
  - Implement real contract call:
    1. Decrypt private key
    2. Create signer
    3. Connect to EggNFT contract
    4. Call `feedEgg(egg_id, food_ids[])` function
    5. Wait for confirmation
    6. Return real transaction hash and new food count
  - Add gas estimation
  - Add retry logic
  - Validate user owns both egg and food NFTs

  **Must NOT do**:
  - NO mock data
  - NO skipping ownership validation

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: ["context7"]

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 2)
  - **Blocked By**: Tasks 2,3,4
  - **Blocks**: Tasks 9,10, FINAL verification

  **References**:
  - Task 5: mint-egg implementation pattern
  - `contracts/src/EggNFT.sol` - `feedEgg()` function
  - `apps/web/app/eggs/page.tsx:89` - UI button location

  **Acceptance Criteria**:
  - [ ] `feedEgg()` function implemented
  - [ ] Returns real transaction hash
  - [ ] New food count returned
  - [ ] Ownership validated
  - [ ] Gas estimation works

  **QA Scenarios**:

  ```
  Scenario: Feed egg with real contract
    Tool: Bash (curl)
    Steps:
      1. POST /api/v1/wallet/feed-egg with user_address, egg_id, food_ids
      2. Assert 200 OK
      3. Assert transaction_hash valid
      4. Assert new_food_count > old_food_count
    Evidence: .sisyphus/evidence/task-8-feed-egg.json
  ```

  **Commit**:
  - Message: `feat(wallet-api): implement real feed-egg`
  - Files: `wallet-api/server.js`

---

- [ ] 9. Implement feed egg frontend handler

  **What to do**:
  - Locate TODO at `apps/web/app/eggs/page.tsx:89`
  - Implement `handleFeed()` function:
    1. Get signer from wallet
    2. Connect to EggNFT contract
    3. Call `feedEgg(eggId, foodIds)`
    4. Wait for transaction confirmation
    5. Show success toast
    6. Refresh egg data
  - Add error handling
  - Add loading state
  - Claymorphism styling for feed dialog

  **Must NOT do**:
  - NO leaving TODO comment
  - NO skipping transaction confirmation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 3)
  - **Blocked By**: Task 8
  - **Blocks**: FINAL verification

  **References**:
  - Task 8: wallet-api feed-egg endpoint
  - `apps/web/app/eggs/page.tsx` - UI location
  - `apps/web/lib/contracts/egg.ts` - Contract interaction pattern

  **Acceptance Criteria**:
  - [ ] `handleFeed()` function implemented
  - [ Feed dialog renders with claymorphism
  - [ ] Transaction confirmation waits
  - [ ] Success toast displays
  - [ ] Egg data refreshes
  - [ ] Error handling works

  **QA Scenarios**:

  ```
  Scenario: Feed egg from UI
    Tool: Playwright
    Steps:
      1. Navigate to /eggs
      2. Click "Feed" button on owned egg
      3. Select food items in dialog
      4. Confirm transaction
      5. Assert success toast
      6. Assert egg food_count increased
    Evidence: .sisyphus/evidence/task-9-feed-ui.png
  ```

  **Commit**:
  - Message: `feat(feed): implement frontend feed handler`
  - Files: `apps/web/app/eggs/page.tsx`

---

- [ ] 10. Implement feed egg backend hook

  **What to do**:
  - Create/update `apps/backend/pb_hooks/16-feed-egg.pb.js`
  - Hook logic:
    1. Require authentication (`$apis.requireAuth(e)`)
    2. Parse body: egg_token_id, food_ids
    3. Validate user owns egg NFT (query PocketBase)
    4. Validate user owns food NFTs
    5. Mark food NFTs as consumed
    6. Call wallet-api to execute transaction
    7. Update egg properties (food_count, rarity_bonus)
    8. Return transaction hash and new stats
  - Handle errors gracefully

  **Must NOT do**:
  - NO skipping ownership validation
  - NO consuming food before transaction confirmed

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 3)
  - **Blocked By**: Task 9
  - **Blocks**: FINAL verification

  **References**:
  - Task 9: Frontend handler
  - Task 8: wallet-api endpoint
  - `resources/mvp-foodcourt/pb_hooks/16-feed-egg.pb.js` - Reference implementation

  **Acceptance Criteria**:
  - [ ] Hook requires authentication
  - [ ] Ownership validated
  - [ ] Food marked consumed after confirmation
  - [ ] Egg stats updated
  - [ ] Returns transaction hash

  **QA Scenarios**:

  ```
  Scenario: Feed egg backend flow
    Tool: Bash (curl)
    Steps:
      1. Get auth token
      2. POST /api/v2/feed-egg with egg_token_id, food_ids
      3. Assert 200 OK
      4. Assert transaction_hash returned
      5. Query PocketBase: assert food consumed
      6. Query PocketBase: assert egg food_count increased
    Evidence: .sisyphus/evidence/task-10-feed-backend.json
  ```

  **Commit**:
  - Message: `feat(feed): implement backend feed hook`
  - Files: `apps/backend/pb_hooks/16-feed-egg.pb.js`

---

- [ ] 11. Implement basic play interaction

  **What to do**:
  - Locate TODO at `apps/web/app/eggs/page.tsx:95`
  - Implement `handlePlay()` function:
    1. Get signer from wallet
    2. Connect to EggNFT contract
    3. Call `playWithEgg(eggId)` function (or similar)
    4. Wait for transaction confirmation
    5. Show success toast
  - Add error handling
  - Add loading state
  - Claymorphism styling for play dialog
  - **IF game design spec missing**: Implement basic interaction with TODO for enhancement

  **Must NOT do**:
  - NO leaving button non-functional
  - NO complex minigame (MVP: basic interaction)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 3)
  - **Blocked By**: Task 8 (contract calls)
  - **Blocks**: FINAL verification

  **References**:
  - Task 9: Feed handler pattern
  - `apps/web/app/eggs/page.tsx:95` - UI location
  - `contracts/src/EggNFT.sol` - Check for play function

  **Acceptance Criteria**:
  - [ ] `handlePlay()` function implemented
  - [ ] Play dialog renders
  - [ ] Transaction confirmation works
  - [ ] Success toast displays
  - [ ] TODO added for game design enhancement

  **QA Scenarios**:

  ```
  Scenario: Play interaction from UI
    Tool: Playwright
    Steps:
      1. Navigate to /eggs
      2. Click "Play" button
      3. Assert play dialog opens
      4. Confirm interaction
      5. Assert success toast
    Evidence: .sisyphus/evidence/task-11-play-ui.png
  ```

  **Commit**:
  - Message: `feat(play): add basic play interaction`
  - Files: `apps/web/app/eggs/page.tsx`

---

- [ ] 12. Implement track-deposit hook (fix RED PHASE)

  **What to do**:
  - Locate failing test: `apps/backend/pb_hooks/13-track-deposit.test.js:703`
  - Implement hook `apps/backend/pb_hooks/13-track-deposit.pb.js`:
    1. Require authentication
    2. Parse transaction_hash from body
    3. Verify transaction on blockchain (USDT Transfer event)
    4. Check if already tracked (prevent duplicates)
    5. Create deposit record in PocketBase
    6. Update user balance if needed
    7. Return deposit_id, amount, confirmed status
  - Hook must poll USDT Transfer events
  - Track deposit amounts and timestamps
  - Handle duplicate transaction detection

  **Must NOT do**:
  - NO leaving "RED PHASE" comment
  - NO deleting test to make it pass
  - NO skipping duplicate detection

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 3)
  - **Blocked By**: None (independent)
  - **Blocks**: FINAL verification

  **References**:
  - `apps/backend/pb_hooks/13-track-deposit.test.js` - Test requirements
  - `resources/mvp-foodcourt/pb_hooks/` - Hook patterns
  - USDT contract ABI - Transfer event signature

  **Acceptance Criteria**:
  - [ ] Hook requires authentication
  - [ ] Transaction verified on blockchain
  - [ ] Duplicates detected and rejected
  - [ ] Deposit record created in PocketBase
  - [ ] User balance updated
  - [ ] Test passes (no RED PHASE)

  **QA Scenarios**:

  ```
  Scenario: Track deposit succeeds
    Tool: Bash (curl)
    Steps:
      1. Get auth token
      2. POST /api/v2/track-deposit with transaction_hash
      3. Assert 200 OK
      4. Assert deposit_id returned
      5. Assert amount correct
      6. Query PocketBase: assert deposit record exists

  Scenario: Duplicate deposit rejected
    Tool: Bash (curl)
    Steps:
      1. Submit same transaction_hash twice
      2. Assert second request fails with "already tracked"
    Evidence: .sisyphus/evidence/task-12-track-deposit.json
  ```

  **Commit**:
  - Message: `feat(deposit): implement track-deposit hook`
  - Files: `apps/backend/pb_hooks/13-track-deposit.pb.js`

---

## Final Verification Wave

- [ ] F1. **Security Audit** — `oracle`
      Review all contract interactions. Verify private keys never logged, always decrypted securely. Check gas estimation before sends. Verify no mocks remain.
      Output: `Security [PASS/FAIL] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + linter + `bun test`. Review for AI slop, excessive comments, generic names. Check wallet-api changes.
      Output: `Build [PASS/FAIL] | Tests [N/N] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
      Execute all QA scenarios: mint-egg, claim-commission, mint-food, feed-egg, track-deposit. Verify all transactions on BSCScan.
      Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Test Suite Verification** — `deep`
      Run all tests. Ensure RED PHASE eliminated. Check test coverage for new features.
      Output: `Tests [N/N pass] | Red Phase [YES/NO] | VERDICT`

---

## Commit Strategy

- Wave 1 commits: Tasks 1-4 (contracts)
- Wave 2 commits: Tasks 5-8 (contract integration)
- Wave 3 commits: Tasks 9-12 (features)
- Final verification commits: F1-F4

---

## Success Criteria

### Verification Commands

```bash
# Wallet API tests
cd wallet-api && bun test              # All tests pass

# Backend tests
cd apps/backend && bun test            # No RED PHASE

# Build succeeds
cd apps/web && bun run build           # Zero errors

# Contract verification
curl -X POST http://localhost:3001/api/v1/wallet/mint-egg \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x...","egg_id":1}'
# Expected: Real transaction hash, verify on BSCScan
```

### Final Checklist

- [ ] All contracts deployed and verified
- [ ] `/contract-addresses.json` exists
- [ ] 4 wallet-api endpoints return real data
- [ ] NO mock data in production code
- [ ] Feed feature works end-to-end
- [ ] Play interaction functional
- [ ] Track-deposit test passes (no RED PHASE)
- [ ] All tests pass
- [ ] Build succeeds

---

_Milestone: v0.0.7 Security & Quality Fixes_
_Generated: 2026-04-18_
