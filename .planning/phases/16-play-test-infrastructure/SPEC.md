# Phase 16: Play Feature + Test Infrastructure

## Problem

Two problems remain before v0.0.7 milestone is complete:

1. **Play button is a no-op** — `handlePlayEgg` on eggs page logs to console only. Users expect meaningful interaction.
2. **14 test failures** — `vi.mocked` is not available in Bun's test runner, breaking 7 tests. BuyFlow dialog text mismatches. Test coverage is 70% (target: 80%+).
3. **Balance display is minimal** — No breakdown of earned/spent/withdrawn, no transaction history.

## Success Criteria

- Play button opens daily check-in dialog with 24h cooldown timer
- Claim gives 1 Food NFT (database record, off-chain)
- Streak tracking with 7-day (3 bonus) and 30-day (10 bonus + badge) rewards
- All 14 test failures fixed
- Test coverage at 80%+
- Balance card shows detail breakdown (withdrawable, earned, spent, withdrawn)
- Balance auto-refresh uses exponential backoff (30s -> 300s max)
- Last 10 transactions displayed under balance

## Out of Scope

- Mini-game mechanics (deferred to v0.0.8)
- Blockchain transactions for daily check-in
- Complex animations for play interaction

## Acceptance Test

1. Open eggs page, click PLAY on any egg -> daily check-in dialog appears
2. Dialog shows 24h countdown if already checked in today, or "Claim Reward" if eligible
3. Claiming adds 1 Food NFT to user's inventory, increments streak counter
4. After 7 consecutive days -> bonus 3 Food NFTs
5. After 30 consecutive days -> bonus 10 Food NFTs + "Daily Champion" badge
6. Missing a day resets streak to 0
7. `bun test` passes with 0 failures
8. `bun test --coverage` shows 80%+ line coverage
9. Balance card shows: withdrawable, total earned, total spent, total withdrawn
10. Balance card lists last 10 transactions
