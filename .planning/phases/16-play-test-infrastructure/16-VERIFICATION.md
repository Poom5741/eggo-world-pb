# Phase 16: Play Feature + Test Infrastructure — Verification

## Pre-Flight Checks

```bash
# 1. Verify all context files exist
ls -la .planning/phases/16-play-test-infrastructure/

# 2. Verify current test baseline
cd apps/web && bun test 2>&1 | tail -5
# Expected: "264 pass, 14 fail, 1 error"
```

## Wave 1: Test Infrastructure Fixes

```bash
cd apps/web && bun test 2>&1 | grep -E '(pass|fail|error)$'
# Expected: "278 tests across 27 files" with 0 fail

cd apps/web && bun test --coverage 2>&1 | tail -5
# Baseline: ~70%, confirm no regressions
```

## Wave 2: Daily Check-in Backend

```bash
# 1. Check collections exist
ls -la apps/backend/collections/daily_checkins.json
# Expected: file exists

# 2. Check hook exists
ls -la apps/backend/pb_hooks/27-play-checkin.pb.js
# Expected: file exists

# 3. Test check-in status endpoint
TOKEN=$(curl -s -X POST http://localhost:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"test@test.com","password":"test123"}' | jq -r '.token')

curl -s http://localhost:8090/api/v2/play/check-in/status \
  -H "Authorization: Bearer $TOKEN" | jq '.data.can_claim'
# Expected: true

# 4. Test check-in claim
curl -s -X POST http://localhost:8090/api/v2/play/check-in \
  -H "Authorization: Bearer $TOKEN" | jq '.data.streak'
# Expected: 1

# 5. Test cooldown
curl -s -X POST http://localhost:8090/api/v2/play/check-in \
  -H "Authorization: Bearer $TOKEN" | jq '.data.cooldown_until'
# Expected: non-null timestamp (cooldown active)
```

## Wave 3: Play Feature Frontend

```bash
# 1. Verify components compile
cd apps/web && bun run build 2>&1 | grep -E '(Error|error)'
# Expected: no errors (may have warnings)

# 2. Check new files exist
ls -la apps/web/hooks/use-daily-checkin.ts
ls -la apps/web/components/eggs/play-dialog.tsx
# Expected: both exist
```

## Wave 4: Balance Detail

```bash
# 1. Check new component exists
ls -la apps/web/components/dashboard/balance-detail.tsx
# Expected: file exists

# 2. Check use-wallet-poll updated
grep 'totalEarned' apps/web/hooks/use-wallet-poll.ts
# Expected: interface includes totalEarned, totalSpent, totalWithdrawn
```

## Wave 5: Coverage

```bash
cd apps/web && bun test 2>&1 | tail -5
# Expected: 0 failures

cd apps/web && bun test --coverage 2>&1 | grep -E '^(All files|[|])'
# Expected: >= 80% line coverage
```

## Final Sign-off Checklist

- [ ] All 14 test failures fixed
- [ ] `bun test` passes with 0 failures
- [ ] Test coverage >= 80%
- [ ] Play button opens daily check-in dialog
- [ ] 24h cooldown timer displays correctly
- [ ] Claim gives 1 Food NFT (off-chain)
- [ ] Streak tracking works (7-day / 30-day bonuses)
- [ ] Balance card shows detail breakdown
- [ ] Balance card shows last 10 transactions
- [ ] Balance auto-refresh has exponential backoff
- [ ] v0.0.7 milestone complete
