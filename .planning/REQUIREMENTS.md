# v0.0.7 Requirements

**Milestone:** Security & Quality  
**Created:** 2026-04-18  
**Status:** In Progress

---

## Milestone v0.0.7 Requirements

### Security (P0 — Blocks Launch)

#### Wallet-API Contract Integration

- [ ] **SEC-01**: User can mint Egg NFT with real blockchain transaction (replaces mock endpoint)
  - Backend calls `EggNFT.mintEgg(egg_id)` with user's decrypted private key
  - Gas estimation with 20% buffer before sending transaction
  - Returns real transaction hash, not mock data
  - Wait for 12+ block confirmations before marking as "confirmed"

- [ ] **SEC-02**: User can claim referral commission with real blockchain transaction
  - Backend calls `CommissionDistribution.claimCommission(user_address)`
  - Validates user has unclaimed commission balance
  - Returns real transaction hash and claimed amount
  - Handles "no commission to claim" gracefully

- [ ] **SEC-03**: User can mint Food NFT with real blockchain transaction
  - Backend calls `FoodNFT.mint(user_address, food_type, quantity)`
  - Validates USDT balance before minting
  - Returns real transaction hash and minted token IDs
  - Handles insufficient balance with clear error message

- [ ] **SEC-04**: User can feed Egg NFT with real blockchain transaction
  - Backend calls `EggNFT.feedEgg(egg_token_id, food_token_ids[])`
  - Validates user owns egg NFT and all food NFTs
  - Validates egg hasn't hatched yet (food_count < 10)
  - Returns real transaction hash and new food_count

#### USDT Deposit Tracking

- [ ] **SEC-05**: System automatically tracks USDT deposits via event polling
  - Poll USDT `Transfer` events every 30 seconds via `eth_getLogs`
  - Filter events where `to` address equals user's wallet address
  - Track `last_polled_block` to prevent re-polling same events
  - Store processed transaction hashes to prevent duplicates

- [ ] **SEC-06**: Deposit requires 12 block confirmations before crediting
  - Wait 12 blocks after transaction included before marking "confirmed"
  - Display "pending" state for deposits with < 12 confirmations
  - Store `block_hash` for each tracked deposit
  - Verify parent hash continuity to detect chain reorgs

- [ ] **SEC-07**: Duplicate deposit attempts are rejected
  - Database unique constraint on `tx_hash` field
  - Idempotency check before creating deposit record
  - Return existing deposit record if reprocessing same tx_hash
  - Log duplicate attempts (potential attack detection)

- [ ] **SEC-08**: User is notified when deposit is confirmed
  - Frontend polling shows pending → confirmed state transition
  - Push notification or in-app alert on confirmation
  - Updated USDT balance displayed immediately
  - Transaction hash links to BSCScan explorer

### Quality (P1 — Technical Debt)

#### Test Infrastructure

- [ ] **QUAL-01**: Fix 9 vi.mock setup failures in test suite
  - Update mock imports to match Vitest syntax
  - Ensure mock factories return correct types
  - Verify all mocks are properly scoped to test files
  - Test suite runs without setup errors

- [ ] **QUAL-02**: Test coverage increases from 70% to 80%+
  - Add unit tests for new wallet-api contract endpoints
  - Add integration tests for track-deposit polling
  - Add component tests for mobile responsive layouts
  - Document uncovered critical paths

#### Mobile Responsive Polish

- [ ] **QUAL-03**: Bottom tab bar replaces hamburger menu on mobile (< 640px)
  - 4-5 primary navigation items visible at all times
  - Active tab highlighted with icon + color change
  - Safe area inset for iPhone notch (`env(safe-area-inset-bottom)`)
  - Smooth fade-in animation on mobile breakpoint

- [ ] **QUAL-04**: All touch targets meet 44×44px minimum (WCAG 2.2)
  - Buttons, links, inputs have minimum 44px height/width
  - Icon-only buttons have invisible padding to reach 44px
  - Test with accessibility audit tool
  - Document exceptions (if any) with rationale

- [ ] **QUAL-05**: Layout tested at 5 breakpoints: 320px, 375px, 768px, 1024px, 1440px
  - Visual regression tests capture each breakpoint
  - No horizontal scroll at any breakpoint
  - Text remains readable (minimum 16px on inputs)
  - Images scale correctly with `max-width: 100%`

- [ ] **QUAL-06**: Inputs prevent iOS zoom on focus
  - All input fields have `font-size: 16px` minimum
  - Use `transform: scale()` if visually smaller size needed
  - Tested on actual iOS device (not just emulation)
  - Document any legacy browser workarounds

### Features (P1/P2)

#### Feed Feature

- [ ] **FEAT-01**: User can tap Feed button on eggs page
  - Button visible only when user owns unbhatched egg with `food_count < 10`
  - Tap opens food NFT picker modal
  - Shows available food NFTs (owned, not consumed)
  - Cancel button closes modal with no action

- [ ] **FEAT-02**: User can select up to 10 food NFTs to feed at once
  - Checkbox selection for multiple food NFTs
  - Counter shows "X/10 food selected"
  - Submit button disabled if 0 food selected
  - Loading state during blockchain transaction

- [ ] **FEAT-03**: User sees feeding progress (X/10 food consumed)
  - Progress bar on egg card shows `food_count / 10`
  - Visual indicator when egg is ready to hatch (10/10)
  - Egg card displays number of food NFTs needed to hatch
  - Hatching animation triggers when `food_count` reaches 10

- [ ] **FEAT-04**: System marks consumed food NFTs as "used" in database
  - `food_nfts.consumed = true` after successful transaction
  - Consumed food NFTs hidden from food picker
  - Database transaction ensures atomic update (egg + food)
  - Rollback on blockchain transaction failure

#### Play Feature

- [ ] **FEAT-05**: User can tap Play button on eggs page
  - Button visible for all egg NFTs (hatched or not)
  - Different action based on egg state:
    - Unhatched egg: "Play" shows egg care tips
    - Hatched animal: "Play" triggers daily check-in

- [ ] **FEAT-06**: User can claim daily check-in reward (1 Food NFT)
  - Off-chain database call (no blockchain transaction)
  - Cooldown: 24 hours between claims
  - Reward credited directly to user's wallet (database only)
  - Shows "Next check-in in: HH:MM:SS" countdown timer

- [ ] **FEAT-07**: System tracks daily check-in streak
  - `user_stats.check_in_streak` field in database
  - Bonus rewards at 7-day, 30-day milestones
  - Streak resets if user misses a day
  - Display current streak on profile/dashboard

#### Wallet Balance Display

- [ ] **FEAT-08**: USDT balance refreshes every 30 seconds (exponential backoff)
  - Initial poll at 30s interval
  - If unchanged, double interval (60s, 120s, 300s max)
  - Reset to 30s on any balance change
  - Manual refresh button triggers immediate poll

- [ ] **FEAT-09**: User can tap balance to see detailed breakdown
  - Shows: USDT balance, pending deposits, locked in NFTs
  - Clickable transaction history (last 10 transactions)
  - Each transaction shows: type, amount, status, timestamp
  - Link to BSCScan for full history

---

## Deferred to Future Milestone

### Out of Scope for v0.0.7

- ❌ **PLAY-01**: Complex play mini-game mechanics — Deferred to v0.0.8 (needs game design spec)
  - _Rationale: Scope unclear, would delay v0.0.7 launch_

- ❌ **MOBILE-01**: Tablet-optimized landscape layout — Deferred to v0.0.8
  - _Rationale: Low priority, most users on mobile or desktop_

- ❌ **GESTURE-01**: Swipe-to-refresh on egg list — Deferred to v0.0.8
  - _Rationale: Existing 30s polling already refreshes data_

- ❌ **BATCH-01**: Batch feed multiple eggs at once — Deferred to v0.0.8
  - _Rationale: Complexity not justified for v0.0.7 MVP_

- ❌ **DARK-01**: Dark mode toggle — Deferred to v0.0.8
  - _Rationale: Single theme sufficient for security-focused milestone_

---

## Traceability

### Phase Mapping

| Phase | Requirements                                                  | Status      |
| ----- | ------------------------------------------------------------- | ----------- |
| 12    | SEC-01, SEC-02, SEC-03, SEC-04                                | Not started |
| 13    | SEC-05, SEC-06, SEC-07, SEC-08                                | Not started |
| 14    | QUAL-03, QUAL-04, QUAL-05, QUAL-06                            | Not started |
| 15    | FEAT-01, FEAT-02, FEAT-03, FEAT-04                            | Not started |
| 16    | QUAL-01, QUAL-02, FEAT-05, FEAT-06, FEAT-07, FEAT-08, FEAT-09 | Not started |

**Coverage:** 16/16 requirements mapped ✓

### Requirement Detail

| Req ID  | Phase | Category | Priority | Status      |
| ------- | ----- | -------- | -------- | ----------- |
| SEC-01  | 12    | Security | P0       | Not started |
| SEC-02  | 12    | Security | P0       | Not started |
| SEC-03  | 12    | Security | P0       | Not started |
| SEC-04  | 12    | Security | P0       | Not started |
| SEC-05  | 13    | Security | P0       | Not started |
| SEC-06  | 13    | Security | P0       | Not started |
| SEC-07  | 13    | Security | P0       | Not started |
| SEC-08  | 13    | Security | P0       | Not started |
| QUAL-01 | 16    | Quality  | P1       | Not started |
| QUAL-02 | 16    | Quality  | P1       | Not started |
| QUAL-03 | 14    | Quality  | P1       | Not started |
| QUAL-04 | 14    | Quality  | P1       | Not started |
| QUAL-05 | 14    | Quality  | P1       | Not started |
| QUAL-06 | 14    | Quality  | P1       | Not started |
| FEAT-01 | 15    | Features | P1       | Not started |
| FEAT-02 | 15    | Features | P1       | Not started |
| FEAT-03 | 15    | Features | P1       | Not started |
| FEAT-04 | 15    | Features | P1       | Not started |
| FEAT-05 | 16    | Features | P2       | Not started |
| FEAT-06 | 16    | Features | P2       | Not started |
| FEAT-07 | 16    | Features | P2       | Not started |
| FEAT-08 | 16    | Features | P2       | Not started |
| FEAT-09 | 16    | Features | P2       | Not started |

**To MILESTONES.md:** _Populated by gsd-complete-milestone_

---

## Notes

### REQ-ID Format

`[CATEGORY]-[NUMBER]` where:

- **SEC** = Security (P0, blocks launch)
- **QUAL** = Quality (P1, technical debt)
- **FEAT** = Features (P1/P2, user-facing)

### Priority Legend

- **P0**: Blocks launch — must be implemented and tested
- **P1**: High priority — should be in milestone, defer only if blocked
- **P2**: Nice to have — defer if time constrained

### Research References

- `.planning/research/STACK.md` — Library recommendations, versions
- `.planning/research/FEATURES.md` — Industry patterns, table stakes
- `.planning/research/ARCHITECTURE.md` — Integration points, build order
- `.planning/research/PITFALLS.md` — Common mistakes, prevention strategies
- `.planning/research/SUMMARY.md` — Synthesized findings, phase recommendations

---

_Last updated: 2026-04-18 — Initial requirements draft_
