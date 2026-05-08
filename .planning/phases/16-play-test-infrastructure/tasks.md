# Sprint: Phase 16 — Play Feature + Test Infrastructure

## Wave 1: Test Infrastructure Fixes (P1)

### Root cause analysis

Three failure categories:

- **vi.mocked (7 tests)**: Bun's `vi` from `bun:test` lacks `mocked()`. Affects `CommissionBreakdown.test.tsx` (4) and `CreateListingDialog.test.tsx` (3). Fix: replace `vi.mocked(x).mock*()` with direct mock function assignment or wrapper.
- **BuyFlow dialog text (4 tests)**: BuyFlow was rewritten to use PocketBase direct purchase (no MetaMask). Tests check for old Thai approval texts. Fix: update assertions to match new component dialog text.
- **Ambiguous button selector (1 CreateListingDialog test)**: `getByText('Create Listing')` matches multiple elements. Fix: use `getByRole('button', { name: /Create Listing/i })` or `getAllByText()[0]`.

- [ ] T16.01: Fix vi.mocked → CommissionBreakdown.test.tsx
  - Replace `vi.mocked(createClient().collection('').getList).mockImplementation(...)`
  - Pattern: assign `mockGetList` directly in the mock factory
  - Accepts: deps=none

- [ ] T16.02: Fix vi.mocked → CreateListingDialog.test.tsx
  - Replace `vi.mocked(eggNft.getSigner)` and `vi.mocked(marketplace.*)` with direct mock assertions
  - Fix "Found multiple elements with the text: Create Listing" — use `getAllByText()[0]` pattern
  - Accepts: deps=none

- [ ] T16.03: Fix BuyFlow dialog text assertions
  - Remove Thai MetaMask approval text assertions
  - Replace with assertions matching current BuyFlow dialog: "Confirm Purchase", item name, price, Cancel/Confirm buttons
  - Accepts: deps=none

- [ ] T16.04: Verify all 14 tests pass
  - Run `bun test` — expect 0 failures
  - Run `bun test --coverage` — baseline coverage
  - Accepts: deps=T16.01, T16.02, T16.03

## Wave 2: Daily Check-in Backend (P1)

### Collection: `daily_checkins`

New PocketBase collection for tracking daily check-ins:

```
daily_checkins (base collection)
├── user: relation -> users (required, cascade delete)
├── check_in_date: date (required, format: YYYY-MM-DD)
├── streak_count: number (required, default: 1, min: 0)
├── reward_claimed: bool (default: true)
├── food_nft_id: relation -> food_nfts (optional)
├── bonus_type: select (optional, values: ["7_day_streak", "30_day_streak", "none"])
└── bonus_food_ids: json (optional, array of food_nft IDs)
```

Index: `CREATE UNIQUE INDEX idx_daily_checkins_user_date ON daily_checkins (user, check_in_date)`

### Hook: `27-play-checkin.pb.js`

```
POST /api/v2/play/check-in
Auth: required
Body: {}
Logic:
1. Look up today's check-in for user
2. If found -> return cooldown info (time until next check-in)
3. If not found:
   a. Calculate streak: check yesterday's check-in
   b. If yesterday exists -> streak = yesterday.streak + 1
   c. If yesterday missing -> streak = 1 (streak reset)
   d. Create daily_checkins record
   e. Create food_nft record (reward: 1 random food)
   f. If streak == 7 -> bonus 3 food_nfts
   g. If streak == 30 -> bonus 10 food_nfts + update user.badges
   h. Return streak info + reward details

GET /api/v2/play/check-in/status
Auth: required
Body: {}
Logic:
1. Look up today's check-in for user -> return cooldown if exists
2. Also return current streak info
```

- [ ] T16.05: Create `daily_checkins` collection schema (JSON)
  - Write `apps/backend/collections/daily_checkins.json`
  - Accepts: deps=none

- [ ] T16.06: Create `27-play-checkin.pb.js` hook
  - POST /api/v2/play/check-in endpoint
  - GET /api/v2/play/check-in/status endpoint
  - Streak calculation logic
  - Food NFT reward creation (random food_type)
  - 7-day and 30-day streak bonus logic
  - `user.streak_count` and `user.badges` field updates
  - Accepts: deps=T16.05

### User model updates

Add fields to `users`:

- `streak_count: number (default: 0)` — current streak
- `longest_streak: number (default: 0)` — personal best
- `badges: json (default: [])` — array of badge strings like `["daily_champion"]`

- [ ] T16.07: Update users collection schema
  - Add `streak_count`, `longest_streak`, `badges` fields to users collection JSON
  - Accepts: deps=none

## Wave 3: Play Feature Frontend (P1)

### Component: `PlayDialog`

New dialog component at `apps/web/components/eggs/play-dialog.tsx`:

- Opening states: eligible (claim button), cooldown (24h countdown, streak info)
- Eligible state: "Day X streak!" banner, "Claim Daily Reward" button
- Cooldown state: "Come back in HH:MM:SS" timer, current streak count
- Shows reward preview: "1 Food NFT" with food type
- Streak bonus preview at 7 and 30 days

### Hook: `use-daily-checkin.ts`

New hook at `apps/web/hooks/use-daily-checkin.ts`:

- `checkIn()` — calls POST /api/v2/play/check-in
- `getStatus()` — calls GET /api/v2/play/check-in/status
- Returns: `{ canClaim, cooldownMs, streakCount, lastCheckIn, reward, bonus }`
- Countdown timer logic for cooldown display

### Integration

- Wire `handlePlayEgg` in `apps/web/app/eggs/page.tsx` to open PlayDialog
- Wire play button in `EggCard` and `FeaturedEggHero`

- [ ] T16.08: Create `use-daily-checkin.ts` hook
  - Uses PocketBase API calls through `/api/v2/play/check-in`
  - Handles auth, error states, countdown timer
  - Accepts: deps=T16.06

- [ ] T16.09: Create `PlayDialog` component
  - Two states: eligible / cooldown
  - Countdown timer display
  - Streak info and bonus preview
  - Toast notifications on claim
  - Accepts: deps=T16.08

- [ ] T16.10: Wire play button in eggs page
  - Update `apps/web/app/eggs/page.tsx` handlePlayEgg
  - Import and render PlayDialog
  - Refresh egg data on successful claim
  - Accepts: deps=T16.09

## Wave 4: Balance Detail Breakdown (P2)

### Hook: `use-wallet-poll.ts` updates

Extend the balance response to capture:

- `total_earned`, `total_spent`, `total_withdrawn` from the hook response
- Add exponential backoff (already partially implemented — verify correctness)

### Component: `BalanceCard` updates

Add accordion/collapsible section below main balance:

- Expandable detail section: "Withdrawable", "Total Earned", "Total Spent", "Total Withdrawn"
- Last 10 transactions list (from `transactions` collection)

### Component: `BalanceDetail` (new)

New component for the breakdown section:

```
BalanceDetail
├── Summary row: 4 stat boxes
│   ├── Withdrawable: X USDT
│   ├── Total Earned: X USDT
│   ├── Total Spent: X USDT
│   └── Total Withdrawn: X USDT
└── Transaction history (last 10)
    ├── Each: icon, type, timestamp, amount
    └── Empty state: "No transactions yet"
```

- [ ] T16.11: Extend `use-wallet-poll.ts` with balance details
  - Add `total_earned`, `total_spent`, `total_withdrawn` to WalletBalance interface
  - Parse from hook response
  - Verify exponential backoff is correct (30s → 60s → 120s → 240s → 300s max)
  - Accepts: deps=none

- [ ] T16.12: Create `BalanceDetail` component
  - 4 stat boxes for balance breakdown
  - Transaction history list (last 10 from transactions collection)
  - Accepts: deps=T16.11

- [ ] T16.13: Integrate BalanceDetail into BalanceCard
  - Add collapsible section below main balance
  - Accepts: deps=T16.12

## Wave 5: Coverage & Quality (P1)

### New test files

Add tests for newly created components/hooks and untested existing components:

- `use-daily-checkin.test.ts` — mock PocketBase, test claim flow, cooldown, streak calculation
- `play-dialog.test.tsx` — render states (eligible/cooldown), button click
- `balance-detail.test.tsx` — render breakdown, transaction list
- `featured-egg-hero.test.tsx` — existing untested component
- `feed-dialog.test.tsx` — existing untested component

### Coverage target

Current baseline: ~70% line, 264 pass / 14 fail / 1 error
Target: 80%+ line, 290+ pass / 0 fail

- [ ] T16.14: Write tests for PlayDialog + use-daily-checkin
  - Min 4 tests covering: eligible state, cooldown state, claim success, claim error
  - Accepts: deps=T16.08, T16.09

- [ ] T16.15: Write tests for BalanceDetail
  - Min 3 tests covering: render values, transaction list, empty state
  - Accepts: deps=T16.12

- [ ] T16.16: Write tests for featured-egg-hero and feed-dialog
  - Min 2 tests each covering render + interactions
  - Accepts: deps=none

- [ ] T16.17: Verify coverage >= 80%
  - Run `bun test --coverage`
  - Run `bun test` — 0 failures
  - Accepts: deps=T16.14, T16.15, T16.16

## Done (Future)

- [ ] Milestone: v0.0.7 Security & Quality complete
