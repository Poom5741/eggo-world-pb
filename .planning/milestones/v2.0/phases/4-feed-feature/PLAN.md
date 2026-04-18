# Phase 4: Feed Feature (P2 - Game Feature)

## Goal

Implement feed egg functionality - allow users to feed their eggs with food NFTs.

## Background

UI button exists in `apps/web/app/eggs/page.tsx:89` but does nothing.

## Tasks

- [ ] **Frontend:** Add `handleFeed()` handler in eggs/page.tsx
- [ ] **Frontend:** Wire up feed button to handler
- [ ] **Frontend:** Add food NFT selection UI
- [ ] **Backend:** Complete `16-feed-egg.pb.js` hook
- [ ] **Wallet API:** Replace mock feed-egg with real contract call
- [ ] **Test:** Manual feed flow end-to-end

## Implementation

### Frontend (`apps/web/app/eggs/page.tsx`)

```typescript
const handleFeed = async (eggId: number, foodIds: number[]) => {
  try {
    const signer = await getSigner()
    const contract = getEggNftContract(signer)

    const tx = await contract.feedEgg(eggId, foodIds)
    await tx.wait()

    toast.success("Egg fed successfully!")
    refreshEggData()
  } catch (error) {
    toast.error("Failed to feed egg")
  }
}
```

### Backend Hook (`16-feed-egg.pb.js`)

```javascript
routerAdd("POST", "/api/v2/feed-egg", (e) => {
  const { users } = e.requireAuth()
  const { egg_token_id, food_ids } = e.parseBody()

  // 1. Validate user owns egg NFT
  // 2. Validate user owns food NFTs
  // 3. Call wallet-api to execute transaction
  // 4. Mark food NFTs as consumed
  // 5. Update egg properties (food_count, rarity_bonus)

  e.json(200, {
    success: true,
    data: {
      transaction_hash: tx.hash,
      new_food_count: newCount,
      rarity_bonus: bonus,
    },
  })
})
```

### Wallet API (`wallet-api/server.js:493`)

Replace mock with real `feedEgg` contract call (Phase 2 dependency).

## Dependencies

- Phase 2 (wallet-api real contract calls)
- EggNFT contract must have `feedEgg` function

## Success Criteria

- Feed button functional in UI
- Food NFTs selected and consumed
- Egg food_count updated
- Transaction hash returned and verifiable

## Verification

```bash
# Manual test
# 1. Open /eggs page
# 2. Click feed button on an egg
# 3. Select food NFTs
# 4. Confirm transaction
# 5. Verify egg properties updated
```
