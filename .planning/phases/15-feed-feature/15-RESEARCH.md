# Phase 15: Feed Feature - Research

**Researched:** 2026-04-19  
**Domain:** React UI patterns, mobile-responsive modal grids, blockchain transaction loading states  
**Confidence:** HIGH

## Summary

Phase 15 requires refactoring the existing `FeedDialog` component from a quick-fill auto-select flow to a manual food selection grid inside a modal dialog. The existing codebase already has most building blocks: `FoodCard` with selection state, `use-food-nft` hook with `feedEgg()` and `getUserFoodNfts()`, a reference feed page at `/eggs/[id]/feed/page.tsx` showing the manual selection pattern, and the `EggCard` with a progress bar. The primary work is UI/UX refactoring within the modal, not backend integration.

Key findings:
1. **FeedDialog refactor**: Current implementation uses quick-fill (auto-select 10 items). Needs complete rewrite to show a scrollable 2-column grid of `FoodCard` components with manual selection, counter, and sticky submit button.
2. **State management**: `useState` with an array of selected IDs is sufficient (already proven in `/eggs/[id]/feed/page.tsx`). No need for `useReducer` — the selection logic is simple toggle/filter.
3. **Mobile grid**: The reference page already uses `grid grid-cols-2 gap-clay-lg max-h-[600px] overflow-y-auto` — this pattern works but needs adaptation for modal context with sticky footer.
4. **Ready-to-hatch indicator**: CSS `animate-pulse-glow` keyframe exists in globals.css (line 426-429) — can be applied as a glowing border animation. No new animations needed.
5. **Two competing hooks**: `useEggFeed` (used by FeedDialog) requires exactly 10 items; `use-food-nft.feedEgg()` (used by reference page) accepts 1-10 items. The planner must decide which hook to use — `use-food-nft` matches requirements better.
6. **FoodCard consumed filtering**: Current `FoodCard` shows consumed items with `opacity-50 grayscale`. Per D-08, consumed items should be filtered at the query level (already done by `getUserFoodNfts` with `is_consumed = false`).

**Primary recommendation:** Reuse `use-food-nft` hook (not `useEggFeed`) for the FeedDialog refactor since it supports 1-10 item selection and already filters by `is_consumed = false`. Rewrite FeedDialog content area to match the reference page's grid pattern, adapted for modal with sticky footer.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Food NFT selection UI | Browser / Client | — | Pure client-side state management, no server interaction until submit |
| Food NFT filtering (is_consumed) | Database / Storage | API / Backend | PocketBase query with filter, executed client-side via SDK |
| Feed transaction submission | API / Backend | Browser / Client | Client calls `/api/v2/feed-egg`, backend handles blockchain + DB |
| Egg card progress display | Browser / Client | — | Renders `food_count` from egg data, conditional styling for ready state |
| Ready-to-hatch visual indicator | Browser / Client | — | CSS animation + conditional rendering based on `food_count >= 10` |
| Transaction loading state | Browser / Client | — | UI feedback during async operation, no server-side concern |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 (via Next.js 16) | 19.x | Component state, hooks | Project standard, already installed [VERIFIED: package.json] |
| Tailwind CSS | 4.x | Responsive grid, sticky positioning, claymorphism utilities | Project standard, globals.css has all needed utilities [VERIFIED: codebase] |
| Radix UI Dialog | 2.x | Modal foundation (already used by FeedDialog) | Accessible, composable, already in use [VERIFIED: dialog.tsx] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-progress | 1.x | Progress bar indicator | Already used in EggCard for feeding progress [VERIFIED: egg-card.tsx] |
| class-variance-authority | 0.7.x | Conditional className composition | Already used by Button, Badge components [VERIFIED: button.tsx] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState for selection | useReducer | Overkill for simple toggle/array filter; useState is proven in reference page |
| Radix Dialog | Custom modal | Loses accessibility (focus trap, escape key, ARIA attributes) |
| CSS glow animation | Framer Motion animation | Adds 14KB bundle; existing `animate-pulse-glow` keyframe already in globals.css |

**No new installations needed.** All required libraries are already in the project.

## Architecture Patterns

### System Architecture Diagram

```
User taps "Manage Egg" on EggCard
        │
        ▼
┌─────────────────────────────────┐
│  FeedDialog (modal opens)       │
│  ┌───────────────────────────┐  │
│  │ Header: "Feed Egg #X"     │  │
│  ├───────────────────────────┤  │
│  │ Scrollable Grid (2-col)   │  │
│  │ ┌──────┐ ┌──────┐         │  │
│  │ │Food  │ │Food  │         │  │
│  │ │Card  │ │Card  │  ...    │  │
│  │ └──────┘ └──────┘         │  │
│  │ ┌──────┐ ┌──────┐         │  │
│  │ │Food  │ │Food  │         │  │
│  │ └──────┘ └──────┘         │  │
│  ├───────────────────────────┤  │
│  │ Counter: "X/10 selected"  │  │
│  ├───────────────────────────┤  │
│  │ [Feed Button] (sticky)    │  │ ← Disabled if 0 selected
│  └───────────────────────────┘  │
└─────────────────────────────────┘
        │ User taps "Feed"
        ▼
┌─────────────────────────────────────┐
│  use-food-nft.feedEgg()             │
│  POST /api/v2/feed-egg              │
│  { egg_token_id, food_ids[] }       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Backend (16-feed-egg.pb.js)        │
│  1. Validate ownership              │
│  2. Call blockchain                 │
│  3. Update egg.food_count           │
│  4. Mark food.is_consumed = true    │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  onSuccess() → refresh egg list     │
│  Dialog closes                      │
│  EggCard shows updated progress     │
└─────────────────────────────────────┘
```

### Recommended Project Structure
No new files needed. Changes are confined to existing files:
```
components/eggs/
├── feed-dialog.tsx        # REWRITE: manual selection grid (was quick-fill)
├── egg-card.tsx           # MODIFY: add ready-to-hatch indicator
└── hatch-animation.tsx    # NO CHANGES (already complete)

components/food-nft/
└── FoodCard.tsx           # NO CHANGES (reuse with is_consumed filter)

hooks/
├── use-food-nft.ts        # NO CHANGES (already has feedEgg + getUserFoodNfts)
└── use-egg-feed.ts        # CONSIDER DEPRECATION (requires exactly 10 items)
```

### Pattern 1: Manual Multi-Select Grid with Counter
**What:** Scrollable 2-column grid of selectable cards with a counter and sticky submit button
**When to use:** Modal-based selection where user picks 1-N items from a list
**Example:**
```tsx
// Source: /apps/web/app/eggs/[id]/feed/page.tsx (reference pattern)
const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])

const handleSelectFood = (foodId: number) => {
  setSelectedFoodIds(prev =>
    prev.includes(foodId)
      ? prev.filter(id => id !== foodId)
      : [...prev, foodId]
  )
}

// In modal:
<div className="grid grid-cols-2 gap-clay-lg max-h-[60vh] overflow-y-auto p-2">
  {foodItems.map((food) => (
    <FoodCard
      key={food.food_id}
      food={food}
      selected={selectedFoodIds.includes(food.food_id)}
      onSelect={handleSelectFood}
    />
  ))}
</div>

// Sticky footer:
<div className="sticky bottom-0 bg-background p-4 border-t">
  <p className="text-sm text-muted-foreground mb-2">
    {selectedFoodIds.length}/10 food selected
  </p>
  <Button
    onClick={handleFeed}
    disabled={loading || selectedFoodIds.length === 0}
    variant="clay"
    size="clay-lg"
    className="w-full min-h-[44px]" // WCAG 2.2 touch target
  >
    {loading ? 'Feeding...' : `Feed ${selectedFoodIds.length} item(s)`}
  </Button>
</div>
```

### Pattern 2: Ready-to-Hatch Visual Indicator
**What:** Glowing border animation + badge on EggCard when `food_count >= 10`
**When to use:** Conditional visual feedback when a threshold is reached
**Example:**
```tsx
// Source: /apps/web/app/globals.css (line 426-429, 554-556)
// Existing keyframe:
// @keyframes pulse-glow {
//   0%, 100% { filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.4)); }
//   50% { filter: drop-shadow(0 0 40px rgba(250, 204, 21, 0.8)); }
// }
// .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

// In EggCard:
<div className={cn(
  "bg-surface-container-lowest p-6 rounded-xl clay-card",
  "hover:-translate-y-2 transition-transform duration-300",
  egg.food_count >= 10 && !egg.is_hatched && "animate-pulse-glow ring-2 ring-warning"
)}>
  {/* ... existing content ... */}
  
  {/* Progress text */}
  <span>
    {egg.food_count >= 10
      ? "Ready to hatch! 🎉"
      : `${egg.food_count}/10 food — ${10 - egg.food_count} more to hatch`
    }
  </span>
</div>
```

### Anti-Patterns to Avoid
- **Don't use `useEggFeed` hook**: It requires exactly 10 items (line 38: `if (foodIds.length !== 10)`), but requirements (FEAT-02) allow 1-10 items. Use `use-food-nft.feedEgg()` instead.
- **Don't show consumed foods**: Per D-08, filter by `is_consumed = false` at query level. Don't render them with grayed-out styling — this confuses users about why they can't select them.
- **Don't navigate to `/eggs/[id]/feed`**: The eggs page already opens FeedDialog via `handleManageEgg`. Don't change this to page navigation — keep it modal-based.
- **Don't use Lucide icons**: Project uses Material Symbols. The reference feed page imports `Loader2, Egg, CheckCircle` from lucide-react — these should be replaced with Material Symbols in the modal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select state | Custom selection logic | `useState<number[]>` with toggle/filter | Already proven in reference page; simple enough that useReducer adds complexity |
| Modal dialog | Custom overlay + portal | Radix UI Dialog (`@/components/ui/dialog`) | Handles focus trap, escape key, ARIA, scroll lock — 195 lines of battle-tested code |
| Progress bar | Custom div with width | `@radix-ui/react-progress` (`<Progress>`) | Already used in EggCard; accessible, animates smoothly |
| CSS glow animation | Custom @keyframes | Existing `animate-pulse-glow` in globals.css | Already defined at line 426-429; reusing avoids CSS duplication |
| Food NFT query | Manual fetch + filter | `use-food-nft.getUserFoodNfts(userId)` | Already filters by `is_consumed = false`; handles errors |
| Loading state | Custom spinner component | Button with `disabled` + text change ("Feeding...") | Pattern already used in FeedDialog, HatchRevealModal, reference page |
| Touch target compliance | Manual padding calculations | `min-h-[44px]` on all interactive elements | WCAG 2.2 requirement from Phase 14; simple, verifiable |

**Key insight:** This phase is almost entirely a refactor of existing code. The reference page at `/eggs/[id]/feed/page.tsx` already implements the manual selection pattern — the work is extracting that pattern into the modal context and adapting it for mobile with a sticky footer.

## Common Pitfalls

### Pitfall 1: Hook Mismatch (useEggFeed vs use-food-nft)
**What goes wrong:** FeedDialog currently uses `useEggFeed` which requires exactly 10 items. Requirements say 1-10 items.
**Why it happens:** Two different hooks exist with different validation logic. `useEggFeed` was built for quick-fill (always 10). `use-food-nft.feedEgg()` was built for manual selection (1-10).
**How to avoid:** Use `use-food-nft.feedEgg()` in the refactored FeedDialog. Consider deprecating `useEggFeed` or updating its validation.
**Warning signs:** Submit button disabled when user selects 5 items; error "Must feed exactly 10 food items" on submit.

### Pitfall 2: Modal Height Overflow on Mobile
**What goes wrong:** Grid content overflows viewport on small screens, submit button pushed off-screen.
**Why it happens:** Modal content doesn't have max-height constraint; grid doesn't scroll independently.
**How to avoid:** Use `max-h-[60vh]` or `max-h-[calc(100vh-200px)]` on grid container with `overflow-y-auto`. Keep counter and button in sticky footer outside scrollable area.
**Warning signs:** On 320px screen, can't see submit button without scrolling entire modal.

### Pitfall 3: Lucide Icons in Claymorphism UI
**What goes wrong:** Reference feed page imports `Loader2, Egg, CheckCircle` from lucide-react, but project uses Material Symbols.
**Why it happens:** Reference page was built earlier, before Material Symbols migration (Phase 12-14).
**How to avoid:** Replace all Lucide icons with `<span className="material-symbols-outlined">icon_name</span>`. Use `sync` (spinning) for loading, `egg` for egg icon, `check_circle` for success.
**Warning signs:** Mixed icon styles in UI; bundle includes unused lucide-react.

### Pitfall 4: Hydration Mismatch with PocketBase Auth
**What goes wrong:** Accessing `pb.authStore.record` during server-side render causes hydration mismatch.
**Why it happens:** PocketBase auth is client-side only; SSR has no auth context.
**How to avoid:** Use `useIsHydrated()` hook (already imported in reference page) before accessing auth. Pattern from eggs/page.tsx: `const user = isHydrated ? pb.authStore.record : null`.
**Warning signs:** Hydration mismatch error in console; "Cannot read property 'id' of null" on page load.

### Pitfall 5: Food Card Selection State Not Updating
**What goes wrong:** Tapping a FoodCard doesn't visually update its selected state.
**Why it happens:** `selected` prop passed to FoodCard but FoodCard's checkbox `onCheckedChange` calls `onSelect(food.food_id)` — the parent must manage the selected array.
**How to avoid:** Ensure parent component maintains `selectedFoodIds` state and passes `selected={selectedFoodIds.includes(food.food_id)}` to each FoodCard. The reference page already does this correctly.
**Warning signs:** Checkbox toggles visually but counter doesn't update; selected IDs array stays empty.

## Code Examples

### Complete FeedDialog Refactor Pattern
```tsx
// Source: Adapted from /apps/web/app/eggs/[id]/feed/page.tsx + /apps/web/components/eggs/feed-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FoodCard, FoodType } from '@/components/food-nft/FoodCard'
import { useFoodNft } from '@/hooks/use-food-nft'
import { createClient } from '@/lib/pocketbase/client'
import { EggData } from '@/hooks/use-egg-poll'

interface FeedDialogProps {
  egg: EggData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FeedDialog({ egg, open, onOpenChange, onSuccess }: FeedDialogProps) {
  const { feedEgg, loading, getUserFoodNfts } = useFoodNft()
  const [selectedFoodIds, setSelectedFoodIds] = useState<number[]>([])
  const [foodItems, setFoodItems] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)

  // Fetch available food when dialog opens
  useEffect(() => {
    if (!open) return
    const loadFood = async () => {
      setFetching(true)
      const pb = createClient()
      const user = pb.authStore.record
      if (user) {
        const foods = await getUserFoodNfts(user.id)
        setFoodItems(foods)
      }
      setFetching(false)
    }
    loadFood()
  }, [open, getUserFoodNfts])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFoodIds([])
      setFoodItems([])
    }
  }, [open])

  const handleSelectFood = (foodId: number) => {
    setSelectedFoodIds(prev =>
      prev.includes(foodId)
        ? prev.filter(id => id !== foodId)
        : prev.length < 10
          ? [...prev, foodId]
          : prev // Prevent selecting more than 10
    )
  }

  const handleFeed = async () => {
    if (selectedFoodIds.length === 0) return
    const result = await feedEgg(egg.egg_id, selectedFoodIds) // Note: may need egg.token_id
    if (result) {
      onSuccess()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="clay" className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader variant="clay">
          <DialogTitle variant="clay">Feed Egg #{egg.egg_id}</DialogTitle>
          <DialogDescription variant="clay">
            Select 1-10 food items to feed your egg
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
              <p className="text-sm text-muted-foreground mt-2">Loading food inventory...</p>
            </div>
          ) : foodItems.length === 0 ? (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">restaurant</span>
              <p className="text-sm text-muted-foreground mt-2">No food available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-clay-lg p-2">
              {foodItems.map((food) => (
                <FoodCard
                  key={food.food_id}
                  food={{
                    food_id: food.food_id,
                    token_id: food.token_id,
                    food_type: food.food_type as FoodType,
                    is_consumed: food.is_consumed,
                    minted_at: food.minted_at,
                  }}
                  selected={selectedFoodIds.includes(food.food_id)}
                  onSelect={handleSelectFood}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer with counter and button */}
        <DialogFooter variant="clay" className="flex-col gap-3">
          <p className="text-sm font-bold text-center">
            {selectedFoodIds.length}/10 food selected
          </p>
          <Button
            onClick={handleFeed}
            disabled={loading || selectedFoodIds.length === 0}
            variant="clay"
            size="clay-lg"
            className="w-full min-h-[44px]"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Feeding...
              </>
            ) : (
              `Feed ${selectedFoodIds.length} item${selectedFoodIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### EggCard Ready-to-Hatch Indicator
```tsx
// Source: /apps/web/components/eggs/egg-card.tsx (modification)
// Add to the card container:
<div className={cn(
  "bg-surface-container-lowest p-6 rounded-xl clay-card",
  "hover:-translate-y-2 transition-transform duration-300",
  // Ready-to-hatch glow
  egg.food_count >= 10 && !egg.is_hatched && "animate-pulse-glow ring-2 ring-warning"
)}>

// Modify progress text:
<div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
  <span>FEEDING PROGRESS</span>
  <span>
    {egg.food_count >= 10 && !egg.is_hatched
      ? "Ready to hatch! 🎉"
      : `${egg.food_count}/10 food — ${10 - egg.food_count} more to hatch`
    }
  </span>
</div>

// Add sparkle icon when ready (next to food count badge):
{egg.food_count >= 10 && !egg.is_hatched && (
  <span className="material-symbols-outlined text-warning animate-twinkle" style={{ fontVariationSettings: "'FILL' 1" }}>
    sparkle
  </span>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Quick-fill auto-select 10 items | Manual selection 1-10 items | Phase 15 decision (D-01 to D-04) | User has control over which foods to use |
| Page navigation to `/eggs/[id]/feed` | Modal dialog (FeedDialog) | Phase 15 decision | Faster UX, no page transition, maintains context |
| `useEggFeed` hook (exactly 10) | `use-food-nft.feedEgg()` (1-10) | Phase 15 refactor | Supports partial feeding, matches blockchain contract |
| Consumed foods shown grayed out | Consumed foods filtered from query | Phase 15 decision (D-08) | Cleaner UI, no confusion about unavailable items |
| No ready-to-hatch indicator | `animate-pulse-glow` + sparkle icon | Phase 15 addition (D-05 to D-07) | Visual excitement, encourages hatching action |

**Deprecated/outdated:**
- `useEggFeed` hook: Requires exactly 10 items, doesn't match requirements. Consider deprecation or updating validation to accept 1-10.
- Quick-fill pattern in FeedDialog: Replaced by manual selection. The `handleQuickFill` function and `confirmed` state should be removed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `use-food-nft.feedEgg()` accepts 1-10 items (not exactly 10) | Code Examples, Pitfall 1 | If it also requires exactly 10, the manual selection UI is misleading — user must be forced to select exactly 10 |
| A2 | `egg.egg_id` and `egg.token_id` are interchangeable for feedEgg call | Code Examples | If they're different, the wrong ID could be sent to the API, causing transaction failure |
| A3 | `getUserFoodNfts()` returns items with `is_consumed = false` by default | Standard Stack | If not, consumed items would appear in picker, violating D-08 |
| A4 | `animate-pulse-glow` class is available in globals.css | Pattern 2 | If removed or renamed, ready-to-hatch indicator won't animate |

## Open Questions

1. **Which ID to pass to feedEgg: `egg.egg_id` or `egg.token_id`?**
   - What we know: `useEggFeed` uses `eggId` (passed as first param), reference page uses `egg.token_id`, EggCard uses `egg.egg_id` for display
   - What's unclear: Whether `egg_id` (database ID) and `token_id` (blockchain token ID) are the same value
   - Recommendation: Use `egg.token_id` for blockchain calls (matches reference page), use `egg.egg_id` for display. Planner should verify by checking the backend hook's expected parameter.

2. **Should `useEggFeed` hook be deprecated or updated?**
   - What we know: `useEggFeed` requires exactly 10 items; `use-food-nft.feedEgg()` accepts any number
   - What's unclear: Whether other components depend on `useEggFeed`'s exactly-10 behavior
   - Recommendation: For Phase 15, use `use-food-nft` in FeedDialog. Flag `useEggFeed` for review in Phase 16 (test infrastructure).

3. **Should the FeedDialog fetch food items on every open, or cache them?**
   - What we know: Reference page fetches once on mount; FeedDialog currently fetches on quick-fill
   - What's unclear: Whether food inventory changes frequently enough to warrant refetching
   - Recommendation: Fetch on every dialog open (simple, ensures freshness). Cache optimization can be done in a future phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js 16 | App framework | ✓ | 16.x | — |
| Bun runtime | Build/dev server | ✓ | — | — |
| PocketBase | Food NFT query, feed API | ✓ | — | — |
| ethers.js | Blockchain transaction (via backend) | ✓ | 6.x | — |
| Radix UI Dialog | Modal component | ✓ | 2.x | — |

**No missing dependencies.** All required tools are already installed and used in the project.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `bun test --run apps/web/components/eggs/feed-dialog.test.tsx` |
| Full suite command | `bun test --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-01 | Feed button opens food picker modal | Component | `bun test --run -t "FeedDialog opens"` | ❌ Wave 0 |
| FEAT-02 | Select 1-10 foods, counter shows "X/10", submit disabled at 0 | Component | `bun test --run -t "FeedDialog selection"` | ❌ Wave 0 |
| FEAT-03 | Egg card shows ready-to-hatch indicator at 10/10 | Component | `bun test --run -t "EggCard ready to hatch"` | ❌ Wave 0 |
| FEAT-04 | Consumed foods hidden from picker | Integration | `bun test --run -t "consumed foods hidden"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `bun test --run apps/web/components/eggs/feed-dialog.test.tsx` (if exists)
- **Per wave merge:** `bun test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/web/components/eggs/feed-dialog.test.tsx` — covers FEAT-01, FEAT-02
- [ ] `apps/web/components/eggs/egg-card.test.tsx` — covers FEAT-03 (extend existing if exists)
- [ ] Mock for `use-food-nft` hook — needed for FeedDialog tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Already handled by middleware (Phase 11) |
| V3 Session Management | No | Already handled by PocketBase auth |
| V4 Access Control | Yes | Backend validates egg/food ownership (16-feed-egg.pb.js) |
| V5 Input Validation | Yes | Client validates 1-10 items; backend validates ownership + hatching status |
| V6 Cryptography | No | Blockchain transaction handled by wallet-api (Phase 12) |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Feeding someone else's egg | Tampering | Backend validates `owner` matches authenticated user (16-feed-egg.pb.js) |
| Feeding already-consumed food | Tampering | Backend validates `is_consumed = false`; frontend filters by same |
| Feeding hatched egg | Tampering | Backend validates `food_count < 10`; frontend hides feed button when hatched |
| Double-submit transaction | Repudiation | Backend uses blockchain tx hash as idempotency key |

## Sources

### Primary (HIGH confidence)
- **Codebase files** (verified by read_file):
  - `/apps/web/components/eggs/feed-dialog.tsx` — Current FeedDialog implementation (quick-fill)
  - `/apps/web/components/eggs/egg-card.tsx` — Current EggCard with progress bar
  - `/apps/web/components/food-nft/FoodCard.tsx` — FoodCard with selection state
  - `/apps/web/hooks/use-food-nft.ts` — Hook with feedEgg() and getUserFoodNfts()
  - `/apps/web/hooks/use-egg-feed.ts` — Hook requiring exactly 10 items
  - `/apps/web/app/eggs/[id]/feed/page.tsx` — Reference manual selection pattern
  - `/apps/web/app/globals.css` (line 426-429, 554-556) — `animate-pulse-glow` keyframe
  - `/apps/web/components/ui/dialog.tsx` — Radix Dialog with clay variants
  - `/apps/web/components/ui/button.tsx` — Button with clay variants and sizes
  - `/apps/web/components/ui/progress.tsx` — Radix Progress component
  - `/apps/web/components/eggs/hatch-reveal-modal.tsx` — Hatch modal pattern
  - `/apps/web/app/eggs/page.tsx` — Eggs page with FeedDialog integration

### Secondary (MEDIUM confidence)
- **CONTEXT.md** decisions D-01 to D-14 — User decisions for this phase (verified by read_file)
- **REQUIREMENTS.md** FEAT-01 to FEAT-04 — Phase requirements (verified by read_file)

### Tertiary (LOW confidence)
- `egg.egg_id` vs `egg.token_id` equivalence — needs verification against PocketBase schema
- `useEggFeed` hook usage by other components — grep found 6 references, all in feed-dialog.tsx (HIGH confidence after grep)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in codebase via read_file
- Architecture: HIGH — patterns verified from existing reference page and component files
- Pitfalls: HIGH — derived from actual code analysis (hook mismatch, icon imports, hydration)

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable UI patterns, 30 days)