---
phase: "21"
plan: "wave1"
subsystem: "breeding"
tags: ["breeding", "ui", "dialog", "hooks", "cooldown"]
dependencies:
  requires: ["use-animal-poll", "feed-dialog-pattern"]
  provides: ["breeding-dialog", "breeding-hook", "animal-card-breed"]
  affects: ["animals-page"]
tech-stack:
  added: ["useBreeding hook", "AnimalSelectionGrid", "BreedingConfirmation", "BreedingDialog"]
  patterns: ["FeedDialog two-step flow", "claymorphism UI", "Material Symbols icons"]
key-files:
  created:
    - apps/web/hooks/use-breeding.ts
    - apps/web/components/breeding/AnimalSelectionGrid.tsx
    - apps/web/components/breeding/BreedingConfirmation.tsx
    - apps/web/components/breeding/BreedingDialog.tsx
  modified:
    - apps/web/hooks/use-animal-poll.ts (added last_bred_at field)
    - apps/web/components/animal-nft/AnimalCard.tsx (added breed button)
    - apps/web/app/animals/page.tsx (integrated BreedingDialog)
decisions:
  - "Reuse FeedDialog two-step pattern (selection → confirmation)"
  - "48-hour cooldown with visual timer indicators"
  - "Breed button only shows when user has 2+ animals"
  - "initialParent1 prop for pre-selecting from action menu"
metrics:
  duration: "30 minutes"
  completed_date: "2026-04-22"
  tasks: 2
  files_created: 4
  files_modified: 3
---

# Phase 21 Wave 1: Breeding Dialog UI & Animal Card Integration

**One-liner:** Complete breeding dialog UI with two-step selection flow and AnimalCard breed button integration

---

## Summary

Wave 1 of Phase 21 implements the complete breeding system UI layer, following the FeedDialog pattern with claymorphism design. Users can now select two parent animals from a grid, review the breeding details, and initiate breeding. The system includes 48-hour cooldown visualization and generation calculation.

---

## What Was Built

### Plan 21-01: Breeding Dialog UI

**useBreeding Hook** (`apps/web/hooks/use-breeding.ts`)
- `breedAnimals()` function with loading/error states
- Cooldown utilities: `calculateCooldownRemaining()`, `formatCooldownRemaining()`, `isOnCooldown()`
- 48-hour cooldown constant (`BREEDING_COOLDOWN_MS`)
- Toast notifications for success/error

**AnimalSelectionGrid** (`apps/web/components/breeding/AnimalSelectionGrid.tsx`)
- 2-column grid of selectable animal cards
- Cooldown timer badges showing remaining time
- Visual selection indicators with checkmarks
- Disabled state for animals on cooldown
- Species/rarity display with color coding
- Empty state when no animals available

**BreedingConfirmation** (`apps/web/components/breeding/BreedingConfirmation.tsx`)
- Side-by-side parent preview cards
- Heart icon connector between parents
- Child generation calculation display
- Breeding fee (5 USDT) and cooldown info
- Back/Confirm action buttons

**BreedingDialog** (`apps/web/components/breeding/BreedingDialog.tsx`)
- Two-step flow: selection → confirmation
- Progress indicator (1/2 → 2/2)
- Pre-selection support via `initialParent1` prop
- Integration with `useBreeding` hook
- Claymorphism dialog styling

### Plan 21-02: Animal Card Action Menu

**AnimalCard Updates** (`apps/web/components/animal-nft/AnimalCard.tsx`)
- Added `onBreed` callback prop
- Added `showBreedButton` prop (conditional display)
- Breed button with Material Symbols `favorite` icon
- Primary styling (bg-primary) to distinguish from Sell button

**Animals Page Integration** (`apps/web/app/animals/page.tsx`)
- Added `BreedingDialog` component
- `handleBreed()` sets initial parent and opens dialog
- `handleBreedingSuccess()` shows toast and refreshes list
- Breed button shown only when `animals.length >= 2`

**AnimalData Interface Extension** (`apps/web/hooks/use-animal-poll.ts`)
- Added `last_bred_at?: string | null` field
- Updated record mapping to include cooldown timestamp

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Reuse FeedDialog pattern | Consistent UX with existing feeding flow |
| 48h cooldown visualization | Users need clear feedback on breeding availability |
| Two-step flow | Prevents accidental breeding, allows review |
| Conditional breed button | Avoids confusion when user has only 1 animal |
| initialParent1 prop | Enables "Breed" action from any animal card |

---

## Files Changed

```
apps/web/
├── hooks/
│   ├── use-breeding.ts                    [NEW - 143 lines]
│   └── use-animal-poll.ts                 [MOD - +2 lines: last_bred_at field]
├── components/
│   ├── breeding/                          [NEW DIRECTORY]
│   │   ├── AnimalSelectionGrid.tsx        [NEW - 192 lines]
│   │   ├── BreedingConfirmation.tsx       [NEW - 188 lines]
│   │   └── BreedingDialog.tsx             [NEW - 235 lines]
│   └── animal-nft/
│       └── AnimalCard.tsx                 [MOD - +11 lines: breed button]
└── app/animals/
    └── page.tsx                           [MOD - +14 lines: dialog integration]
```

---

## Verification

✅ Build passes: `bun run build` successful
✅ All components use claymorphism design system
✅ Material Symbols icons throughout
✅ Cooldown calculation utilities tested
✅ TypeScript types complete

---

## API Contract

The breeding dialog calls `POST /api/v2/breed-animals` with:
```json
{
  "parent1_animal_id": number,
  "parent2_animal_id": number
}
```

Response:
```json
{
  "success": true,
  "data": {
    "breeding_egg_id": string,
    "token_id": number,
    "generation": number,
    "parent1_animal_id": number,
    "parent2_animal_id": number,
    "tx_hash": string,
    "fee_deducted": number
  }
}
```

---

## Next Steps (Wave 2)

- Backend cooldown validation in `18-breed-animals.pb.js`
- Update parent `last_bred_at` timestamp after breeding
- Display breeding eggs in `/eggs` page with badge
- Cooldown timer auto-refresh

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Self-Check: PASSED

- [x] All created files exist
- [x] All commits successful (293022b, 6e98c74)
- [x] Build passes
- [x] No runtime errors
- [x] TypeScript types complete
