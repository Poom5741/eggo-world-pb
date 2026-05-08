# Phase 16: Play Feature + Test Infrastructure - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Depends on:** Phase 12 ✅ (Complete)

<domain>
## Phase Boundary

**This phase delivers:** Daily check-in reward system, balance display improvements, and test infrastructure fixes.

**Scope:**

- Play button → daily check-in interface (24h cooldown)
- Claim 1 Food NFT reward per day (off-chain, database only)
- Streak tracking with 7-day and 30-day bonus rewards
- USDT balance auto-refresh with exponential backoff (30s → 300s max)
- Balance detail breakdown with transaction history
- Fix 9 vi.mock test failures
- Increase test coverage from 70% to 80%+

**Out of scope:**

- Complex mini-game mechanics (deferred to v0.0.8)
- Feed feature (Phase 15 — done)

</domain>

<decisions>
## Implementation Decisions

### Play Button: Daily check-in

Play button on eggs page opens daily check-in UI. Shows 24h countdown timer.
Claim gives 1 Food NFT (database record, no blockchain tx).
Streak counter tracks consecutive days.

### Phase Structure: Single phase

Test infrastructure fixes + Play feature run together.
Plans will have test fixes as early wave, play feature as later wave.

### Reward System: Off-chain (database only)

No blockchain transaction for daily check-in. Food NFT added to user's inventory in PocketBase directly. Cooldown tracked via `last_check_in` timestamp.

### Streak Bonuses

- 7 consecutive days: Bonus 3 Food NFTs
- 30 consecutive days: Bonus 10 Food NFTs + special badge
- Streak resets if a day is missed

</decisions>

<requirements>
## Requirements

- **QUAL-01**: Fix 9 vi.mock test failures
- **QUAL-02**: 80%+ test coverage
- **FEAT-05**: Play button on eggs page
- **FEAT-06**: Daily check-in (24h cooldown, 1 Food NFT reward)
- **FEAT-07**: Streak tracking (7-day, 30-day bonuses)
- **FEAT-08**: Balance auto-refresh (30s exponential backoff)
- **FEAT-09**: Balance detail breakdown with transaction history
