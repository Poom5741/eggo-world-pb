# Phase 3: Track Deposit Hook (P1 - Quality)

## Goal

Implement track-deposit hook to pass RED PHASE tests and track USDT deposits.

## Background

Test file `13-track-deposit.test.js` explicitly states:

```javascript
console.log("Status: RED PHASE - Tests will fail until hook is implemented")
```

## Tasks

- [ ] Implement `13-track-deposit.pb.js` hook
- [ ] Add USDT Transfer event polling
- [ ] Track deposit amounts and timestamps
- [ ] Create deposit records in PocketBase
- [ ] Handle duplicate transaction detection
- [ ] Add deposit confirmation events
- [ ] Run tests: `bun test 13-track-deposit.test.js`

## Implementation Requirements

```javascript
routerAdd("POST", "/api/v2/track-deposit", (e) => {
  const { users } = e.requireAuth()
  const { transaction_hash } = e.parseBody()

  // 1. Verify transaction on blockchain
  // 2. Check if already tracked (prevent duplicates)
  // 3. Create deposit record
  // 4. Update user balance if needed

  e.json(200, {
    success: true,
    data: {
      deposit_id: record.id,
      amount: amount,
      confirmed: true,
    },
  })
})
```

## Dependencies

- None (independent of contract phases)

## Files to Create

- `apps/backend/pb_hooks/13-track-deposit.pb.js`

## Verification

```bash
# Run tests
bun test apps/backend/pb_hooks/13-track-deposit.test.js

# Expected: All tests pass (RED PHASE status removed)
```
