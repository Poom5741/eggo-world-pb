# Deposit UI + Account Modal Work Plan

## TL;DR

> **Quick Summary**: Create deposit UI page at `/dashboard/deposit` with auto-detection of on-chain USDT transfers, plus refactor LayoutWithoutNav to use functional Account modal as deposit/withdraw entry point.
>
> **Deliverables**:
> - `apps/web/app/dashboard/deposit/page.tsx` - Deposit page with QR code, polling status, transaction history
> - `apps/web/components/account-modal.tsx` - Account modal component (replaces mock ConnectWallet)
> - `apps/web/components/account-modal.test.tsx` - TDD test file
> - `apps/web/components/LayoutWithoutNav.tsx` - Polished with functional Account button + profile dropdown
> - `apps/backend/pb_hooks/13-track-deposit.pb.js` - Backend hook for deposit detection
> - `apps/backend/pb_hooks/13-track-deposit.test.js` - Backend hook tests
>
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Backend hook (13) → Account modal → Deposit page → Integration

---

## Context

### Original Request
Create frontend deposit UI and polish LayoutWithoutNav mock components (ConnectWallet button + profile icon) into functional Account modal that serves as deposit/withdraw entry point.

### Interview Summary
**Key Discussions**:
- **Deposit scope**: L1-L4 (address display, auto-detection, balance update, history)
- **Network**: 0XL3 Testnet (chain 7117) - NOT BSC Testnet as initially assumed
- **Contract**: CommissionDistribution at `0x3c48926556e766E4564af0E264A9980e7C3a1787` (from 00-config.pb.js)
- **Modal UX**: Click Account button → show wallet address, USDT balance, deposit/withdraw buttons
- **Tests**: TDD (tests first for all components)

**Research Findings** (from Metis + background agents):
- Chain ID: 7117 (0XL3 Testnet) configured in `apps/backend/pb_hooks/00-config.pb.js`
- Contract address: Available via `config.CommissionDistribution`
- Modal pattern: Exists in `apps/web/components/header.tsx:126-188` (account dropdown)
- Test pattern: Bun test with `.test.tsx` colocated, uses `@testing-library/react`
- Withdraw reference: `apps/web/app/dashboard/withdraw/page.tsx` shows exact API pattern

### Metis Review
**Identified Gaps** (all addressed):
- [x] Chain ID corrected: 7117 not 97
- [x] Contract address found in config
- [x] Test pattern discovered
- [x] Modal pattern found in header.tsx
- [x] Guardrails defined (no mainnet, no wallet connection, USDT only)

---

## Work Objectives

### Core Objective
Create complete deposit flow with auto-detection and refactor LayoutWithoutNav to serve as unified deposit/withdraw entry point via Account modal.

### Concrete Deliverables
1. **Account Modal** (`components/account-modal.tsx`)
   - Display user's wallet address (copyable)
   - Show USDT balance (fetched from `/api/v2/hot-wallet/balance`)
   - Deposit button → navigate to `/dashboard/deposit`
   - Withdraw button → navigate to `/dashboard/withdraw`
   - Close on outside click or X button

2. **Deposit Page** (`app/dashboard/deposit/page.tsx`)
   - Display wallet address with QR code
   - Show "Waiting for deposit..." polling status
   - Transaction history table (deposits only)
   - Auto-refresh balance when deposit detected

3. **Backend Hook** (`pb_hooks/13-track-deposit.pb.js`)
   - Poll CommissionDistribution for Transfer events
   - Match transfers TO user's wallet address
   - Update `user_wallets.usdt_balance` atomically
   - Record deposit in `deposits` collection
   - Endpoint: `POST /api/v2/deposit/poll` (called by frontend)

4. **Polished LayoutWithoutNav** (`components/LayoutWithoutNav.tsx`)
   - Replace mock ConnectWallet with functional Account button
   - Profile icon shows dropdown (logout, settings link)
   - Integrate Account modal

5. **Tests** (TDD - write first)
   - `account-modal.test.tsx`: Modal open/close, navigation, balance display
   - `page.test.tsx`: Deposit page rendering, QR code, polling status
   - `13-track-deposit.test.js`: Hook logic, event parsing, balance updates

### Definition of Done
- [ ] All tests pass (`bun test`)
- [ ] Deposit page shows QR code for user's wallet
- [ ] Account modal opens from LayoutWithoutNav, shows balance + buttons
- [ ] Backend hook detects deposits and updates balance
- [ ] Transaction history displays deposit records
- [ ] Manual QA: Send USDT to wallet, see balance update within 2 minutes

### Must Have
- L1: Wallet address display with QR code
- L2: On-chain deposit detection (polling)
- L3: Automatic balance update
- L4: Deposit transaction history
- Functional Account modal in LayoutWithoutNav
- All components have passing tests

### Must NOT Have (Guardrails)
- NO BSC Testnet or mainnet (0XL3 only)
- NO wallet connection (MetaMask, WalletConnect, etc.)
- NO multi-token support (USDT only)
- NO deposit notifications/toasts
- NO manual deposit confirmation
- NO KYC/AML checks
- NO deposit limits

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Bun test configured)
- **Automated tests**: TDD (tests written before implementation)
- **Framework**: Bun test + @testing-library/react
- **TDD Workflow**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/`.

- **Frontend**: Playwright (navigate, click, assert DOM, screenshot)
- **Backend**: Bash (curl API endpoints, assert response)
- **Hooks**: Bun test (run test suite, verify pass)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - TDD Setup):
├── Task 1: Create account-modal.test.tsx (failing tests)
├── Task 2: Create deposit page.test.tsx (failing tests)
├── Task 3: Create 13-track-deposit.test.js (failing tests)
└── Task 4: Create deposits collection schema

Wave 2 (Core Implementation - Max Parallel):
├── Task 5: Implement account-modal.tsx (pass tests)
├── Task 6: Implement deposit page.tsx (pass tests)
├── Task 7: Implement 13-track-deposit.pb.js (pass tests)
└── Task 8: Polish LayoutWithoutNav.tsx

Wave 3 (Integration):
├── Task 9: Wire Account modal to LayoutWithoutNav
├── Task 10: Wire deposit detection to deposit page
├── Task 11: Add transaction history query
└── Task 12: Integration testing

Wave FINAL (4 Parallel Reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 4 → Task 7 → Task 10 → Task 12 → F1-F4
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1-3 | - | 5-7 |
| 4 | - | 7 |
| 5 | 1 | 9 |
| 6 | 2 | 10 |
| 7 | 3, 4 | 10 |
| 8 | - | 9 |
| 9 | 5, 8 | 12 |
| 10 | 6, 7 | 12 |
| 11 | 7 | 12 |
| 12 | 9, 10, 11 | F1-F4 |

---

## TODOs

- [x] 1. Create Account Modal Component Tests (TDD - RED phase)

  **What to do**:
  - Create `apps/web/components/account-modal.test.tsx`
  - Write failing tests for:
    - Modal renders with wallet address and balance
    - Deposit button navigates to `/dashboard/deposit`
    - Withdraw button navigates to `/dashboard/withdraw`
    - Close button and outside click close modal
    - Balance displays with correct formatting
    - Copy wallet address button works
  - Mock PocketBase client and balance API

  **Must NOT do**:
  - Do NOT implement the component yet (TDD - tests first)
  - Do NOT add real API calls (use mocks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `Bun` (for bun test)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (TDD Setup)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:
  - Pattern: `apps/web/app/dashboard/withdraw/page.tsx` - shows balance fetching pattern
  - Pattern: `apps/web/components/header.tsx:126-188` - shows wallet display pattern
  - Config: `apps/backend/pb_hooks/00-config.pb.js:66` - CommissionDistribution address
  - Test: Follow bun test pattern from AGENTS.md

  **Acceptance Criteria**:
  - [ ] Test file exists: `apps/web/components/account-modal.test.tsx`
  - [ ] `bun test apps/web/components/account-modal.test.tsx` shows failing tests (RED phase)
  - [ ] Tests cover: rendering, navigation, close behavior, copy function

  **QA Scenarios**:
  ```
  Scenario: Account modal tests exist and fail (RED phase)
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: bun test apps/web/components/account-modal.test.tsx
      2. Check: Tests execute and show failures (expected - RED phase)
    Expected Result: Test suite runs, individual tests fail with expected assertions
    Evidence: .sisyphus/evidence/task-1-red-phase.txt
  ```

  **Commit**: YES
  - Message: `test(deposit): add TDD tests for account modal`
  - Files: `apps/web/components/account-modal.test.tsx`
  - Pre-commit: `bun test apps/web/components/account-modal.test.tsx -- expect failures`

- [x] 2. Create Deposit Page Tests (TDD - RED phase)

  **What to do**:
  - Create `apps/web/app/dashboard/deposit/page.test.tsx`
  - Write failing tests for:
    - Page renders with wallet address and QR code
    - Shows "Waiting for deposit" polling status
    - Transaction history table displays deposits
    - Balance updates when new deposit detected
    - Error handling for failed API calls
  - Mock QR code component and polling API

  **Must NOT do**:
  - Do NOT implement the page yet (TDD - tests first)
  - Do NOT add real blockchain calls

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `Bun`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (TDD Setup)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - Pattern: `apps/web/app/dashboard/withdraw/page.tsx` - full page structure reference
  - Pattern: `apps/web/app/page.tsx` - shows hydration check pattern
  - Config: Chain 7117 (0XL3 Testnet) from `00-config.pb.js:57`

  **Acceptance Criteria**:
  - [ ] Test file exists: `apps/web/app/dashboard/deposit/page.test.tsx`
  - [ ] `bun test apps/web/app/dashboard/deposit/page.test.tsx` shows failing tests
  - [ ] Tests cover: QR display, polling status, history table, error states

  **QA Scenarios**:
  ```
  Scenario: Deposit page tests exist and fail (RED phase)
    Tool: Bash
    Steps:
      1. Run: bun test apps/web/app/dashboard/deposit/page.test.tsx
      2. Check: Tests run and fail (expected)
    Expected Result: Test failures for QR, polling, history components
    Evidence: .sisyphus/evidence/task-2-red-phase.txt
  ```

  **Commit**: Group with Task 1

- [x] 3. Create Deposit Tracking Hook Tests (TDD - RED phase)

  **What to do**:
  - Create `apps/backend/pb_hooks/13-track-deposit.test.js`
  - Write failing tests for:
    - Hook polls CommissionDistribution for Transfer events
    - Correctly parses event data (from, to, amount)
    - Updates user_wallets.usdt_balance atomically
    - Creates deposit record in deposits collection
    - Handles duplicate transactions (idempotency)
    - Returns correct response format

  **Must NOT do**:
  - Do NOT implement the hook yet (TDD - tests first)
  - Do NOT use real RPC calls in tests (mock)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `Bun`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (TDD Setup)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:
  - Pattern: `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` - hook structure
  - Pattern: `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` - API endpoint pattern
  - Config: Contract address at `00-config.pb.js:66`, Chain 7117 at line 57
  - USDT: `00-config.pb.js:65` - MockUSDT address for event filtering

  **Acceptance Criteria**:
  - [ ] Test file exists: `apps/backend/pb_hooks/13-track-deposit.test.js`
  - [ ] `bun test apps/backend/pb_hooks/13-track-deposit.test.js` shows failing tests
  - [ ] Tests cover: event parsing, balance update, deposit record, idempotency

  **QA Scenarios**:
  ```
  Scenario: Backend hook tests exist and fail (RED phase)
    Tool: Bash
    Steps:
      1. Run: bun test apps/backend/pb_hooks/13-track-deposit.test.js
      2. Check: Tests run and fail (expected)
    Expected Result: Failures for polling logic, event parsing, balance updates
    Evidence: .sisyphus/evidence/task-3-red-phase.txt
  ```

  **Commit**: Group with Task 1-2

- [x] 4. Create Deposits Collection Schema

  **What to do**:
  - Create `apps/backend/collections/deposits.json`
  - Define schema:
    - `user`: relation to users collection
    - `amount`: number (USDT amount)
    - `tx_hash`: text (blockchain transaction hash)
    - `from_address`: text (sender address)
    - `status`: select (pending, confirmed, failed)
    - `confirmed_at`: datetime
    - `created`: datetime (auto)
    - `updated`: datetime (auto)
  - Add indexes on `user` and `tx_hash` (unique)

  **Must NOT do**:
  - Do NOT add migration yet (will be auto-generated)
  - Do NOT add collection rules yet (handled in hook)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1-3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 7 (needs collection to exist)
  - **Blocked By**: None

  **References**:
  - Pattern: Look at existing collection JSON files in `apps/backend/collections/`
  - Example: `users.json` for field structure

  **Acceptance Criteria**:
  - [ ] Collection schema exists: `apps/backend/collections/deposits.json`
  - [ ] Schema has all required fields with correct types
  - [ ] Indexes defined for performance

  **QA Scenarios**:
  ```
  Scenario: Deposits collection schema is valid
    Tool: Bash
    Steps:
      1. Check: cat apps/backend/collections/deposits.json | jq '.schema'
      2. Verify: Fields include user, amount, tx_hash, status, timestamps
    Expected Result: Valid JSON with complete schema
    Evidence: .sisyphus/evidence/task-4-schema.json
  ```

  **Commit**: Group with Wave 1

- [ ] 5. Implement Account Modal Component (GREEN phase)

  **What to do**:
  - Create `apps/web/components/account-modal.tsx`
  - Implement based on failing tests from Task 1:
    - Dialog component from shadcn/ui
    - Display wallet address (copyable with button)
    - Fetch and display USDT balance from `/api/v2/hot-wallet/balance`
    - Deposit button → `router.push('/dashboard/deposit')`
    - Withdraw button → `router.push('/dashboard/withdraw')`
    - Close on X button, outside click, or ESC key
    - Pixel-art styling (clay variant) matching project theme
  - Make all tests from Task 1 pass (GREEN phase)

  **Must NOT do**:
  - Do NOT add extra features beyond what's tested
  - Do NOT break existing header.tsx functionality

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-design`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6-8)
  - **Parallel Group**: Wave 2 (Implementation)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1 (tests)

  **References**:
  - Pattern: `apps/web/components/header.tsx:126-188` - account dropdown (exact pattern to copy)
  - UI: Use shadcn/ui Dialog, Button components
  - API: `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` - balance endpoint
  - Style: Pixel-art theme (clay variant) matching existing components

  **Acceptance Criteria**:
  - [ ] Component exists: `apps/web/components/account-modal.tsx`
  - [ ] `bun test apps/web/components/account-modal.test.tsx` → PASS (all tests)
  - [ ] Component uses shadcn/ui Dialog
  - [ ] Shows wallet address with copy button
  - [ ] Shows USDT balance (fetched from API)
  - [ ] Has Deposit and Withdraw navigation buttons
  - [ ] Matches pixel-art styling

  **QA Scenarios**:
  ```
  Scenario: Account modal renders and functions correctly
    Tool: Bash + Playwright
    Steps:
      1. Run: bun test apps/web/components/account-modal.test.tsx
      2. Verify: All tests PASS
      3. Build: bun run build (check for TypeScript errors)
    Expected Result: 0 test failures, build succeeds
    Evidence: .sisyphus/evidence/task-5-green-phase.txt
  ```

  **Commit**: YES
  - Message: `feat(deposit): implement account modal component`
  - Files: `apps/web/components/account-modal.tsx`, `apps/web/components/account-modal.test.tsx`
  - Pre-commit: `bun test apps/web/components/account-modal.test.tsx`

- [ ] 6. Implement Deposit Page (GREEN phase)

  **What to do**:
  - Create `apps/web/app/dashboard/deposit/page.tsx`
  - Implement based on failing tests from Task 2:
    - Wallet address display with QR code
    - QR code generated for CommissionDistribution address
    - Polling status indicator ("Waiting for deposit...")
    - Transaction history table
    - Auto-poll `/api/v2/deposit/poll` endpoint
    - Handle loading, error, success states
    - Pixel-art styling
  - Make all tests from Task 2 pass (GREEN phase)

  **Must NOT do**:
  - Do NOT add manual deposit confirmation (auto only)
  - Do NOT support tokens other than USDT

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-design`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 7-8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Task 2 (tests)

  **References**:
  - Pattern: `apps/web/app/dashboard/withdraw/page.tsx` - exact structure to follow
  - Pattern: `apps/web/app/page.tsx` - hydration check pattern
  - QR: Use qrcode.react library
  - API: New endpoint `/api/v2/deposit/poll` (Task 7)

  **Acceptance Criteria**:
  - [ ] Page exists: `apps/web/app/dashboard/deposit/page.tsx`
  - [ ] `bun test apps/web/app/dashboard/deposit/page.test.tsx` → PASS
  - [ ] Shows wallet address and QR code
  - [ ] Shows polling status indicator
  - [ ] Displays transaction history
  - [ ] Handles auth redirects (like withdraw page)
  - [ ] Matches pixel-art styling

  **QA Scenarios**:
  ```
  Scenario: Deposit page renders and polls correctly
    Tool: Bash + Playwright
    Steps:
      1. Run: bun test apps/web/app/dashboard/deposit/page.test.tsx
      2. Verify: All tests PASS
      3. Build: bun run build
    Expected Result: Tests pass, no TypeScript errors
    Evidence: .sisyphus/evidence/task-6-green-phase.txt
  ```

  **Commit**: Group with Task 5

- [ ] 7. Implement Deposit Tracking Backend Hook (GREEN phase)

  **What to do**:
  - Create `apps/backend/pb_hooks/13-track-deposit.pb.js`
  - Implement based on failing tests from Task 3:
    - Endpoint: `POST /api/v2/deposit/poll`
    - Poll CommissionDistribution contract for Transfer events
    - Filter: Transfer TO user's wallet address
    - Parse event: from, to, amount, tx_hash
    - Update `user_wallets.usdt_balance` (atomic)
    - Create record in `deposits` collection
    - Handle duplicates (check tx_hash exists)
    - Return: `{ success: true, data: { deposits: [...], new_balance: ... } }`
  - Make all tests from Task 3 pass (GREEN phase)

  **Must NOT do**:
  - Do NOT use mainnet RPC (use 0XL3 testnet only)
  - Do NOT expose private keys or sensitive data
  - Do NOT allow balance decreases (deposits only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5-6, 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10 (frontend needs endpoint)
  - **Blocked By**: Tasks 3 (tests), 4 (collection schema)

  **References**:
  - Pattern: `apps/backend/pb_hooks/09-withdraw-usdt.pb.js` - hook structure and auth
  - Pattern: `apps/backend/pb_hooks/12-hot-wallet-balance.pb.js` - API endpoint pattern
  - Config: `00-config.pb.js:66` - CommissionDistribution address
  - Config: `00-config.pb.js:65` - MockUSDT address (for event filtering)
  - Config: `00-config.pb.js:57` - Chain 7117 (0XL3 Testnet)

  **Acceptance Criteria**:
  - [ ] Hook exists: `apps/backend/pb_hooks/13-track-deposit.pb.js`
  - [ ] `bun test apps/backend/pb_hooks/13-track-deposit.test.js` → PASS
  - [ ] Endpoint `POST /api/v2/deposit/poll` registered
  - [ ] Polls CommissionDistribution for Transfer events
  - [ ] Updates balance atomically
  - [ ] Creates deposit records
  - [ ] Handles idempotency (no duplicates)
  - [ ] Requires authentication (`$apis.requireAuth(e)`)

  **QA Scenarios**:
  ```
  Scenario: Deposit hook detects and processes transfers
    Tool: Bash
    Preconditions: PocketBase running locally
    Steps:
      1. Start: make backend (local PocketBase)
      2. Test: bun test apps/backend/pb_hooks/13-track-deposit.test.js
      3. Verify: All tests PASS
      4. Check: Endpoint registered in logs
    Expected Result: Tests pass, endpoint accessible
    Evidence: .sisyphus/evidence/task-7-green-phase.txt
  
  Scenario: API endpoint responds correctly
    Tool: Bash (curl)
    Steps:
      1. Get auth token from logged-in session
      2. curl -X POST http://localhost:8090/api/v2/deposit/poll \\
         -H "Authorization: Bearer $TOKEN" \\
         -H "Content-Type: application/json" \\
         -d '{"user_address":"0x..."}'
      3. Verify: Response has success, data.deposits, data.new_balance
    Expected Result: 200 OK with correct JSON structure
    Evidence: .sisyphus/evidence/task-7-api-test.json
  ```

  **Commit**: Group with Tasks 5-6

- [ ] 8. Polish LayoutWithoutNav Component

  **What to do**:
  - Update `apps/web/components/LayoutWithoutNav.tsx`
  - Replace mock ConnectWallet button with Account button:
    - Import AccountModal component (Task 5)
    - Add state for modal open/close
    - Account button shows user avatar + wallet truncated
    - Click opens AccountModal
  - Make profile icon functional:
    - Show dropdown on click: logout, settings
    - Follow header.tsx dropdown pattern (lines 155-187)
  - Keep SideNav and BottomNavMobile unchanged

  **Must NOT do**:
  - Do NOT remove SideNav or BottomNavMobile
  - Do NOT change overall layout structure
  - Do NOT break existing pages using this layout

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5-7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9 (needs LayoutWithoutNav changes)
  - **Blocked By**: None

  **References**:
  - Pattern: `apps/web/components/header.tsx:126-188` - account dropdown pattern
  - Current: `apps/web/components/LayoutWithoutNav.tsx` - existing structure
  - Component: AccountModal (Task 5)

  **Acceptance Criteria**:
  - [ ] LayoutWithoutNav imports and uses AccountModal
  - [ ] Account button replaces mock ConnectWallet
  - [ ] Profile icon shows functional dropdown
  - [ ] Existing pages still render correctly
  - [ ] Pixel-art styling maintained

  **QA Scenarios**:
  ```
  Scenario: LayoutWithoutNav renders with functional Account button
    Tool: Playwright
    Steps:
      1. Navigate to /dashboard/withdraw (uses LayoutWithoutNav)
      2. Verify: Account button visible (not "Connect Wallet")
      3. Click: Account button
      4. Verify: AccountModal opens with wallet address
      5. Click: Profile icon
      6. Verify: Dropdown with logout appears
    Expected Result: Both buttons functional, modal works
    Evidence: .sisyphus/evidence/task-8-layout.png
  ```

  **Commit**: Group with Tasks 5-7

- [ ] 9. Wire Account Modal to LayoutWithoutNav

  **What to do**:
  - Ensure LayoutWithoutNav properly integrates AccountModal
  - Pass required props: user, wallet address, balance
  - Handle modal state (open/close) in LayoutWithoutNav
  - Ensure navigation works: Deposit → `/dashboard/deposit`, Withdraw → `/dashboard/withdraw`
  - Test integration manually

  **Must NOT do**:
  - Do NOT change AccountModal API (use as implemented)
  - Do NOT add new features (just wiring)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Tasks 5, 8)
  - **Parallel Group**: Wave 3 (Integration)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5 (AccountModal), 8 (LayoutWithoutNav polish)

  **References**:
  - Component: `apps/web/components/account-modal.tsx` (Task 5)
  - Layout: `apps/web/components/LayoutWithoutNav.tsx` (Task 8)
  - Pattern: Props passing from header.tsx

  **Acceptance Criteria**:
  - [ ] AccountModal opens from LayoutWithoutNav
  - [ ] Correct user data passed to modal
  - [ ] Deposit button navigates to /dashboard/deposit
  - [ ] Withdraw button navigates to /dashboard/withdraw
  - [ ] Manual QA passes

  **QA Scenarios**:
  ```
  Scenario: Account modal integration works end-to-end
    Tool: Playwright
    Steps:
      1. Navigate to /dashboard/withdraw
      2. Click: Account button in header
      3. Verify: Modal opens with correct wallet address
      4. Click: Deposit button
      5. Verify: Navigated to /dashboard/deposit
      6. Click: Account button
      7. Click: Withdraw button
      8. Verify: Navigated to /dashboard/withdraw
    Expected Result: Navigation works correctly
    Evidence: .sisyphus/evidence/task-9-integration.png
  ```

  **Commit**: Group with Wave 3

- [ ] 10. Wire Deposit Detection to Deposit Page

  **What to do**:
  - Update deposit page to poll `/api/v2/deposit/poll` endpoint
  - Add polling interval (e.g., every 30 seconds)
  - Update UI when new deposits detected:
    - Show success message
    - Update balance display
    - Refresh transaction history
  - Handle polling errors gracefully

  **Must NOT do**:
  - Do NOT poll too frequently (respect rate limits)
  - Do NOT break if backend endpoint not ready

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 9, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 6 (deposit page), 7 (backend hook)

  **References**:
  - Page: `apps/web/app/dashboard/deposit/page.tsx` (Task 6)
  - Hook: `apps/backend/pb_hooks/13-track-deposit.pb.js` (Task 7)
  - Pattern: Polling from withdraw page

  **Acceptance Criteria**:
  - [ ] Deposit page polls `/api/v2/deposit/poll` every 30s
  - [ ] Shows "Checking for deposits..." during poll
  - [ ] Updates balance when new deposit found
  - [ ] Adds new deposit to history table
  - [ ] Handles errors gracefully

  **QA Scenarios**:
  ```
  Scenario: Deposit polling works end-to-end
    Tool: Playwright + manual
    Steps:
      1. Open /dashboard/deposit
      2. Verify: Polling starts (network tab shows requests)
      3. Trigger: Send test USDT to wallet address
      4. Wait: Up to 60 seconds for detection
      5. Verify: Balance updates, deposit appears in history
    Expected Result: Auto-detection works
    Evidence: .sisyphus/evidence/task-10-polling.png
  
  Scenario: Error handling works
    Tool: Bash (simulate error)
    Steps:
      1. Stop backend
      2. Open /dashboard/deposit
      3. Verify: Shows error message (not crash)
      4. Start backend
      5. Verify: Recovers and resumes polling
    Expected Result: Graceful degradation
    Evidence: .sisyphus/evidence/task-10-error.png
  ```

  **Commit**: Group with Wave 3

- [ ] 11. Add Transaction History Query

  **What to do**:
  - Update deposit page to fetch transaction history
  - Query `deposits` collection for current user
  - Display in table: date, amount, tx_hash (link to explorer), status
  - Sort by created DESC (newest first)
  - Add pagination if needed (>10 deposits)

  **Must NOT do**:
  - Do NOT show other users' deposits
  - Do NOT allow editing/deleting deposits

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 7 (backend hook creates records)

  **References**:
  - Page: `apps/web/app/dashboard/deposit/page.tsx` (Task 6)
  - Collection: `apps/backend/collections/deposits.json` (Task 4)
  - Pattern: Data fetching from withdraw page

  **Acceptance Criteria**:
  - [ ] Deposit page queries deposits collection
  - [ ] Shows table with date, amount, tx_hash, status
  - [ ] Tx hash links to 0XL3 explorer
  - [ ] Sorted newest first
  - [ ] Only shows current user's deposits

  **QA Scenarios**:
  ```
  Scenario: Transaction history displays correctly
    Tool: Playwright
    Steps:
      1. Open /dashboard/deposit
      2. Verify: History table visible
      3. Check: Columns are Date, Amount, Tx Hash, Status
      4. Click: Tx Hash link
      5. Verify: Opens explorer in new tab
    Expected Result: Table renders with correct data
    Evidence: .sisyphus/evidence/task-11-history.png
  ```

  **Commit**: Group with Wave 3

- [ ] 12. Integration Testing

  **What to do**:
  - Run full test suite: `bun test`
  - Verify all tests pass
  - Test complete user flow:
    1. Login
    2. Open Account modal from LayoutWithoutNav
    3. Navigate to Deposit
    4. See QR code and address
    5. Send USDT to address
    6. Wait for auto-detection
    7. Verify balance update
    8. Check history
  - Fix any integration issues
  - Update tests if needed

  **Must NOT do**:
  - Do NOT skip failing tests
  - Do NOT commit with broken build

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration)
  - **Parallel Group**: Wave 3 (last task)
  - **Blocks**: F1-F4 (Final Verification)
  - **Blocked By**: Tasks 9, 10, 11

  **References**:
  - All previous tasks
  - Test files from Tasks 1-3

  **Acceptance Criteria**:
  - [ ] All tests pass: `bun test`
  - [ ] Build succeeds: `bun run build`
  - [ ] Manual end-to-end test passes
  - [ ] No TypeScript errors
  - [ ] No console errors

  **QA Scenarios**:
  ```
  Scenario: Full integration test
    Tool: Bash + Playwright
    Steps:
      1. Run: bun test (all tests)
      2. Verify: 0 failures
      3. Run: bun run build
      4. Verify: Build succeeds
      5. Manual: Complete end-to-end flow
    Expected Result: Everything works together
    Evidence: .sisyphus/evidence/task-12-full-test.txt
  ```

  **Commit**: YES
  - Message: `feat(deposit): complete integration and testing`
  - Files: All modified files
  - Pre-commit: `bun test && bun run build`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present results to user for explicit "okay".

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `bun test`. Review all changed files for: `as any`, empty catches, console.log, unused imports. Check AI slop patterns.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Save evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 mapping. Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **W1**: `test(deposit): add TDD tests for account modal, deposit page, hook`
- **W2**: `feat(deposit): implement account modal, deposit page, backend hook`
- **W3**: `feat(deposit): integrate components, add transaction history`
- **Final**: `feat(deposit): complete deposit flow with auto-detection`

---

## Success Criteria

### Verification Commands
```bash
# Tests pass
bun test

# TypeScript compiles
cd apps/web && tsc --noEmit

# Frontend builds
bun run build

# API endpoints respond
curl -X POST https://pb.eggoworld.io/api/v2/deposit/poll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_address":"0x..."}'
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Manual QA completed with evidence
- [ ] User explicitly approved ("okay")
