# Phase 16: Play Feature + Test Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19  
**Phase:** 16-play-feature-test-infrastructure  
**Areas discussed:** Play Feature UX & Behavior, Test Infrastructure Strategy, Wallet Balance Modal, Daily Check-in Backend Design

---

## Play Feature UX & Behavior

| Option                               | Description                                                                                               | Selected |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| Play button on egg card              | Shows care tips for unhatched eggs, daily check-in for hatched animals. Consistent with egg page context. | ✓        |
| Dedicated Play page in navigation    | Separate /play page with all eggs/animals listed. More scalable but adds navigation complexity.           |          |
| Play dialog with state-based content | Opens modal showing both options (care tips + check-in). Users choose what they want to do.               |          |

**User's choice:** Play button on egg card (Recommended)  
**Notes:** Consistent with existing egg card patterns, no new navigation needed

---

| Option           | Description                                                                                 | Selected |
| ---------------- | ------------------------------------------------------------------------------------------- | -------- |
| Modal dialog     | Modal/dialog with countdown timer, streak display, and Claim button. Stays on current page. | ✓        |
| Separate page    | Navigate to /play/check-in page. More screen space but breaks user flow.                    |          |
| Inline expansion | Expandable section inline on egg card. Compact but limited space for streak info.           |          |

**User's choice:** Modal dialog (Recommended)  
**Notes:** Reuses existing Dialog component, maintains user context

---

| Option                   | Description                                                                                        | Selected |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------- |
| Dashboard + card display | Big badge on profile/dashboard + streak number on egg/animal card. Visible at a glance.            | ✓        |
| Only in Play dialog      | Only visible when user opens Play dialog. Keeps UI clean but requires action to see.               |          |
| Dedicated streaks page   | Add new Streaks page showing history, milestones, bonuses. Comprehensive but new page to maintain. |          |

**User's choice:** Dashboard + card display (Recommended)  
**Notes:** Maximum visibility motivates consistent check-ins

---

| Option                           | Description                                                                           | Selected |
| -------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Compact with fire emoji          | Format: '14d 🔥' with color intensity based on streak length. Compact and motivating. | ✓        |
| Detailed with milestone progress | Format: '14 day streak' with progress bar to next milestone. More informative.        |          |
| Just the number                  | Simple number badge '14' with tooltip on hover. Minimal but less engaging.            |          |

**User's choice:** Compact with fire emoji (Recommended)  
**Notes:** Gamification element, visually engaging without taking much space

---

## Test Infrastructure Strategy

| Option                             | Description                                                                                              | Selected |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Fix failures first, then add tests | Fix all 9 failures first, verify test suite runs clean, THEN add new tests. Ensures stable foundation.   | ✓        |
| Fix and add tests simultaneously   | Fix failures and add new tests in parallel by file. Faster but riskier if fixes introduce new issues.    |          |
| Only add new tests, defer fixes    | Create new tests for Phase 16 features only, leave pre-existing failures for later. Focuses on new code. |          |

**User's choice:** Fix failures first, then add tests (Recommended)  
**Notes:** Stable foundation before building on top

---

| Option                 | Description                                                                                                          | Selected |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| New Phase 16 features  | Focus on testing new Play feature, check-in logic, and wallet balance modal. Tests what we're building.              | ✓        |
| wallet-api endpoints   | Add tests to wallet-api endpoints from Phase 12 that currently lack coverage. Covers critical blockchain paths.      |          |
| Untested existing code | Test existing hooks (use-auth, use-marketplace-sync) and components that have no tests yet. Broad coverage increase. |          |

**User's choice:** New Phase 16 features (Recommended)  
**Notes:** Coverage increase comes from testing new code being added

---

| Option                               | Description                                                                                               | Selected |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| Mock at module level                 | Mock PocketBase client at import level, mock blockchain endpoints with vi.fn(). Standard Vitest approach. |          |
| Create shared test utilities         | Create test-utils.ts with factory functions for common mocks (pb client, wallet-api, user records).       |          |
| Integration tests for critical paths | Use integration tests with test PocketBase instance for critical flows. More realistic but slower.        | ✓        |

**User's choice:** Integration tests for critical paths  
**Notes:** More confidence in real-world behavior, acceptable performance trade-off

---

| Option                       | Description                                                                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Colocated with source        | Colocate tests with source files (component.test.tsx next to component.tsx). Matches current project pattern. | ✓        |
| Separate **tests** directory | Group all tests in **tests**/ directories. Cleaner separation but harder to navigate.                         |          |

**User's choice:** Colocated with source (Recommended)  
**Notes:** Consistent with existing project conventions

---

| Option                    | Description                                                                                                 | Selected |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Component + hook tests    | Test check-in flow (claim, cooldown, streak), balance modal rendering, and countdown timer. Covers new UI.  | ✓        |
| Backend integration tests | Test PocketBase hook for check-in, database operations, and streak calculation. Covers backend logic.       |          |
| E2E flow tests            | Test full user journey: tap Play → claim reward → see streak update → check balance. End-to-end validation. |          |

**User's choice:** Component + hook tests (Recommended)  
**Notes:** Fast feedback, covers UI logic without full E2E complexity

---

| Option               | Description                                                                                        | Selected |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| After each fix batch | Run bun test --coverage after each wave of fixes. Quick feedback loop during development.          | ✓        |
| Only at end of phase | Run coverage once at the end to measure final result. Faster development but risk of missing gaps. |          |

**User's choice:** After each fix batch (Recommended)  
**Notes:** Continuous validation prevents coverage regressions

---

## Wallet Balance Modal

| Option              | Description                                                                                              | Selected |
| ------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Tap balance display | Tap the balance number in header/dashboard to open modal. Natural interaction, no new UI element needed. | ✓        |
| Dedicated button    | Separate 'View Details' button next to balance. More explicit but adds UI clutter.                       |          |
| Inline expansion    | Balance always shows expanded view with breakdown inline. No modal but takes more screen space.          |          |

**User's choice:** Tap balance display (Recommended)  
**Notes:** Intuitive interaction pattern, no additional UI chrome

---

| Option                                    | Description                                                                               | Selected |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Full breakdown + transactions             | Show USDT balance, pending deposits, NFT value, and transaction list. Comprehensive view. | ✓        |
| Balance + recent transactions only        | Just USDT balance and last 5 transactions. Simpler but less informative.                  |          |
| Tabbed view (Balance / History / Pending) | Separate tabs: Overview, Transactions, Pending. Organized but requires more taps.         |          |

**User's choice:** Full breakdown + transactions (Recommended)  
**Notes:** Single view shows everything users care about

---

| Option                             | Description                                                                                 | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| 10 transactions with BSCScan links | Last 10 transactions with type icon, amount, status badge, timestamp. Clickable to BSCScan. | ✓        |
| Full history with infinite scroll  | All transactions with virtual scrolling for performance. Complete history but complex UI.   |          |
| Summary with link to BSCScan       | Last 5 transactions + 'View All' link opens BSCScan in new tab. Simple delegation.          |          |

**User's choice:** 10 transactions with BSCScan links (Recommended)  
**Notes:** Good balance of information density and UI simplicity

---

## Daily Check-in Backend Design

| Option                        | Description                                                                                                           | Selected |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Extend user_stats collection  | Add check_in_streak, last_check_in, check_in_count fields to user_stats collection. Simple, follows existing pattern. | ✓        |
| New daily_checkins collection | Create separate daily_checkins collection with one record per check-in. Better for analytics but more complex.        |          |
| Add to users collection       | Store in user profile directly (check_in_streak, last_check_in_at). Minimal but mixes concerns.                       |          |

**User's choice:** Extend user_stats collection (Recommended)  
**Notes:** Follows existing data model pattern, keeps user data organized

---

| Option                     | Description                                                                                                        | Selected |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| PocketBase hook            | Create 17-claim-checkin.pb.js hook that validates cooldown, awards food NFT, updates streak. Follows hook pattern. | ✓        |
| Wallet-API endpoint        | Add /api/v2/check-in endpoint to wallet-api. Centralizes logic but adds service dependency.                        |          |
| Direct PocketBase RPC call | Frontend calls PocketBase API directly with RPC. Simpler but less validation.                                      |          |

**User's choice:** PocketBase hook (Recommended)  
**Notes:** Consistent with existing backend architecture, proper validation layer

---

| Option                       | Description                                                                                    | Selected |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Mint Food NFT via wallet-api | Mint 1 Food NFT to user's wallet via wallet-api. Real blockchain transaction, matches economy. | ✓        |
| Database-only food credit    | Just increment food_count in database. Fast but doesn't match real NFT economy.                |          |
| Transfer from hot wallet     | Transfer from platform hot wallet to user. More realistic but requires hot wallet management.  |          |

**User's choice:** Mint Food NFT via wallet-api (Recommended)  
**Notes:** Maintains economy integrity, real NFT creation

---

| Option                        | Description                                                                                              | Selected |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| 7d=2 food, 30d=5 food + badge | 7-day: 2 Food NFTs, 30-day: 5 Food NFTs + special badge. Motivates consistency without breaking economy. | ✓        |
| 7d=3 food, 30d=10 food        | 7-day: 3 Food NFTs, 30-day: 10 Food NFTs. Generous rewards for engagement.                               |          |
| No bonus, just daily 1 food   | No bonus rewards, just 1 Food NFT daily. Simple economy, no special cases.                               |          |

**User's choice:** 7d=2 food, 30d=5 food + badge (Recommended)  
**Notes:** Balanced rewards that motivate without inflating economy

---

## Claude's Discretion

- Exact visual style for Play button icon and placement on egg card
- Color scheme and animation for streak counter fire emoji
- Modal animation timing and entrance/exit transitions
- Exact layout of transaction history items in balance modal
- Error message wording for check-in cooldown violations

## Deferred Ideas

None — discussion stayed within phase scope
