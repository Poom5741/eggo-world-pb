---
phase: 03-frontend-marketplace
plan: 01
subsystem: frontend
tags:
  - hatch-flow
  - contract-integration
  - nft-reveal
  - evm-transaction
dependency_graph:
  requires: []
  provides:
    - "Hatch egg page with blockchain transaction flow"
    - "Animal reveal component with rarity display"
    - "EggNFT contract integration utilities"
  affects:
    - "apps/web/app/dashboard/eggs/[id]/page.tsx (navigation target)"
    - "apps/web/app/dashboard/nfts/page.tsx (claim destination)"
tech_stack:
  added:
    - "ethers v6 (already in use)"
    - "Contract event parsing"
  patterns:
    - "Hydration-safe contract calls"
    - "Transaction receipt event parsing"
    - "Simple reveal UI (no animations per D-08)"
key_files:
  created:
    - path: "apps/web/app/dashboard/eggs/[id]/hatch/page.tsx"
      purpose: "Hatch egg page with transaction processing"
      lines: 318
    - path: "apps/web/components/HatchReveal.tsx"
      purpose: "Animal reveal component showing rarity and species"
      lines: 162
    - path: "apps/web/lib/contracts/eggNft.ts"
      purpose: "EggNFT contract ABI, utilities, and event parsing"
      lines: 88
    - path: "apps/web/hooks/use-is-hydrated.ts"
      purpose: "Hydration check hook for SSR safety"
      lines: 11
  modified: []
decisions:
  - key: "Simple reveal without animations"
    rationale: "Per D-08 in CONTEXT.md, MVP focus on functional flow over visual polish"
    impact: "Faster development, smaller bundle, defers elaborate animations to post-MVP"
  - key: "Contract integration via ethers v6"
    rationale: "Consistent with existing wallet patterns, direct blockchain interaction"
    impact: "Users need MetaMask/wallet extension for hatching"
  - key: "Event parsing from transaction receipt"
    rationale: "Reliable way to get animal data from blockchain after hatch"
    impact: "Requires waiting for transaction confirmation before showing reveal"
  - key: "PocketBase sync via API endpoint"
    rationale: "Backend hooks handle NFT metadata sync, frontend just triggers"
    impact: "Separation of concerns - frontend handles UX, backend handles data sync"
metrics:
  started_at: "2026-04-02T12:36:20.863Z"
  completed_at: "2026-04-02T19:40:00Z"
  duration_minutes: 420
  tasks_completed: 3
  files_created: 4
  files_modified: 0
  lines_added: 579
  commits: 1
---

# Phase 03 Plan 01: Hatch Egg Flow Summary

## One-Liner

Implemented complete hatch egg flow with Ethers v6 contract integration, transaction processing, and simple animal reveal UI showing rarity/species after successful hatching.

## What Was Built

### 1. Hatch Egg Page (`/dashboard/eggs/[id]/hatch`)
- Full transaction flow: connect wallet → validate food count → call hatchEgg → wait for confirmation → show reveal
- Food count validation (requires 10 food items per contract)
- Error handling for common scenarios:
  - User rejected transaction
  - Insufficient gas (BNB)
  - Not enough food (shows clear message to feed first)
  - Already hatched
  - Network errors
- Loading states during transaction processing
- Success state with navigation to animal inventory

### 2. EggNFT Contract Integration (`lib/contracts/eggNft.ts`)
- EGG_NFT_ADDRESS constant (configurable via env var)
- EGG_NFT_ABI with hatchEgg function and EggHatched event
- getSigner() utility for wallet connection
- getEggNftContract() factory function
- parseEggHatchedEvent() for extracting animal data from receipt
- Rarity and Species enums matching Solidity contract
- Helper functions for rarity/species names

### 3. HatchReveal Component
- Simple card-based reveal (no animations per D-08)
- Rarity badge with color coding:
  - Common: Gray
  - Rare: Blue
  - Epic: Purple
  - Legendary: Yellow
- Species display with emoji representation
- Generation number display
- "Claim to Inventory" button navigating to /dashboard/nfts
- Animal NFT token ID display
- "What's Next" guidance for users

### 4. Hydration Hook (`hooks/use-is-hydrated.ts`)
- Reusable hook for SSR safety
- Prevents hydration mismatches
- Used across all client components

## Files Modified/Created

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `apps/web/app/dashboard/eggs/[id]/hatch/page.tsx` | Created | 318 | Hatch egg page with transaction flow |
| `apps/web/components/HatchReveal.tsx` | Created | 162 | Animal reveal component |
| `apps/web/lib/contracts/eggNft.ts` | Created | 88 | Contract integration utilities |
| `apps/web/hooks/use-is-hydrated.ts` | Created | 11 | Hydration check hook |

**Total:** 4 files created, 579 lines added

## Deviations from Plan

### None - Plan Executed Exactly as Written

All three tasks completed successfully:
- ✅ Task 1: Create hatch egg page structure
- ✅ Task 2: Implement hatch transaction and contract integration
- ✅ Task 3: Build simple reveal UI component

No auto-fixes or architectural changes needed. Plan was well-specified and aligned with existing patterns from mint page.

## Authentication Gates

None encountered. All blockchain interactions use standard Ethers v6 patterns already in place.

## Success Criteria Verification

- ✅ Hatch page accessible at `/dashboard/eggs/[id]/hatch`
- ✅ Page shows error if egg has < 10 food items (validation check)
- ✅ Hatch button calls contract.hatchEgg(eggId)
- ✅ Transaction waits for confirmation with tx.wait()
- ✅ Reveal shows animal rarity with correct color coding
- ✅ Reveal shows species name and generation
- ✅ Claim button navigates to /dashboard/nfts
- ✅ All error states handled with user-friendly messages

## Contract Integration Details

### EggHatched Event
```solidity
event EggHatched(
  uint256 indexed egg_id,
  uint256 indexed animal_id,
  uint8 rarity,
  uint8 species
)
```

Parsed from transaction receipt to extract:
- Animal token ID
- Rarity (0-3 enum)
- Species (0-11 enum)

### Transaction Flow
1. Get signer from window.ethereum (MetaMask)
2. Create Contract instance with ABI and address
3. Call hatchEgg(eggId) → returns transaction
4. Wait for confirmation with tx.wait()
5. Parse EggHatched event from receipt logs
6. Show reveal with animal data
7. (Optional) Sync to PocketBase via API

## Known Stubs

None. All functionality is wired and functional.

## Dependencies on Other Phases

**Phase 01 (Smart Contracts):**
- ✅ EggNFT.sol contract deployed with hatchEgg function
- ✅ EggHatched event properly emitted
- ✅ AnimalNFT contract referenced for minting

**Phase 02 (Backend Integration):**
- ⏳ PocketBase sync endpoint (`/api/v2/sync-hatched-egg`) should be implemented
- ⏳ Backend hook to listen for EggHatched events and update `egg_nfts` collection
- ⏳ Animal NFT metadata sync to `animal_nfts` collection

**Current State:**
- Frontend can hatch eggs and show animal data from blockchain
- Backend sync is optional for MVP (can work with blockchain-only data)
- Recommended: implement backend sync for better UX (PocketBase queries faster than blockchain)

## Testing Recommendations

### Component Tests
```typescript
// HatchReveal.test.tsx
test('shows correct rarity color for legendary', () => {
  render(<HatchReveal animal={{ animalId: 1, rarity: 3, species: 9, generation: 0 }} onClaim={() => {}} />)
  expect(screen.getByText('LEGENDARY')).toHaveClass('bg-yellow-500')
})

test('shows claim button', () => {
  const onClaim = vi.fn()
  render(<HatchReveal animal={{...}} onClaim={onClaim} />)
  expect(screen.getByText('CLAIM TO INVENTORY')).toBeInTheDocument()
})
```

### Integration Tests
```typescript
// hatch-flow.test.tsx
test('complete hatch flow', async () => {
  render(<HatchEggPage eggId={123} />)
  await userEvent.click(screen.getByText('HATCH EGG'))
  await waitFor(() => {
    expect(screen.getByText('LEGENDARY')).toBeInTheDocument()
  })
})
```

## Next Steps (Phase 03 Plan 02)

Based on research (03-RESEARCH.md), recommended next plan:

**Plan 02: My Wallet Page**
- Create useWalletPoll hook for auto-polling balance
- Build wallet page with USDT balance display
- Implement withdraw form
- Add transaction history

**Priority:** HIGH (completes core MVP with earnings visibility)

## Commit History

```
e89ec42 feat(03-01): implement hatch egg flow with contract integration
```

## Self-Check: PASSED

- ✅ All 4 files created and verified
- ✅ Hatch page: 318 lines (>80 minimum)
- ✅ HatchReveal: 162 lines (>50 minimum)
- ✅ eggNft.ts: 88 lines with ABI and utilities
- ✅ useIsHydrated hook: 11 lines
- ✅ Commit hash recorded: e89ec42
- ✅ All acceptance criteria met
- ✅ No stubs or placeholder code
- ✅ Error handling complete
- ✅ Hydration safety implemented
