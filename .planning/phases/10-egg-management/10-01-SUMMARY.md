---
phase: 10-egg-management
plan: 01
subsystem: frontend-egg-display
tags:
  - egg-nft
  - polling
  - claymorphism
  - responsive-grid
dependency_graph:
  requires:
    - Phase 9: Dashboard & Wallet (polling pattern)
    - Phase 8: Foundation & Auth (hydration hooks)
  provides:
    - Egg display foundation for Phase 10 Plans 02-04
    - Reusable egg components for marketplace integration
  affects:
    - apps/web/app/eggs/page.tsx
    - apps/web/components/eggs/
tech_stack:
  added:
    - useEggPoll hook (auto-polling pattern)
    - EggCard component (claymorphism)
    - FeaturedEggHero component
  patterns:
    - Reuse useWalletPoll pattern for egg NFTs
    - PocketBase collection queries with filter/sort
    - Responsive grid layout (3-col desktop, 1-col mobile)
key_files:
  created:
    - apps/web/hooks/use-egg-poll.ts
    - apps/web/components/eggs/egg-card.tsx
    - apps/web/components/eggs/featured-egg-hero.tsx
    - apps/web/app/eggs/page.tsx
  modified: []
decisions:
  - Used PocketBase egg_nfts collection with filter `owner = wallet && is_hatched = false`
  - Sorted eggs by `-food_count` to show eggs closest to hatching first
  - Featured egg hero displays first egg (highest food_count)
  - Grid shows remaining eggs in responsive layout
  - Implemented auth guard redirecting to /auth/login
  - Added loading skeleton and empty state
metrics:
  duration: ~4 minutes
  completed: "2026-04-05T13:49:26Z"
  tasks_completed: 3
  files_created: 4
  commits: 3
---

# Phase 10 Plan 01: Egg Display Foundation Summary

## One-Liner

Built egg NFT display foundation with auto-polling hook (30s interval), featured egg hero showcasing egg closest to hatching, and responsive egg card grid with feeding progress bars (X/10) using claymorphism design.

## What Was Built

### Task 1: useEggPoll Hook (`apps/web/hooks/use-egg-poll.ts`)

Created auto-polling hook adapted from useWalletPoll pattern:
- Fetches user's Egg NFTs from PocketBase `egg_nfts` collection
- Filters by owner wallet address and unhatched status
- Sorts by `-food_count` (eggs closest to hatching first)
- Polls every 30 seconds (configurable via `intervalMs` parameter)
- Returns eggs array, loading state, error, and refresh function
- Includes Thai comments explaining polling logic

**Key Features:**
- `EggData` interface with id, egg_id, food_count, is_hatched, token_id, minted_at, rarity_seed, element_type, owner
- `UseEggPollReturn` type for consistent return shape
- useCallback for fetchEggs to prevent stale closures
- Cleanup interval on unmount

### Task 2: EggCard Component (`apps/web/components/eggs/egg-card.tsx`)

Created reusable egg card component following Jules design exactly:
- Claymorphism styling with `clay-card` className
- Egg image display (128px height, centered)
- Egg name (#ID), rarity badge, element type
- Progress bar showing feeding progress (X/10 food items)
- "Manage Egg" button with onClick handler
- Hover animation (`hover:-translate-y-2 transition-transform duration-300`)
- Rarity logic: Common (<60), Rare (60-84), Epic (85-96), Legendary (≥97)

**Design Compliance:**
- Matches `resources/eggo-world-uxui-jules/src/app/eggs/page.tsx` lines 78-159
- Uses Progress component from ui/progress
- Uses Badge component from ui/badge
- Thai comments throughout

### Task 3: FeaturedEggHero & Eggs Page

**FeaturedEggHero Component (`apps/web/components/eggs/featured-egg-hero.tsx`):**
- Large hero section highlighting egg closest to hatching
- Grid layout (lg:grid-cols-2) with egg image and details
- Egg image in rounded frame with Legendary badge (rotated 12deg)
- Egg name (text-4xl font-pixel-style), element badge
- Large progress bar with percentage
- "FEED ME" and "PLAY" buttons with Material Symbols icons
- Eggo's tip box with emoji

**Eggs Page (`apps/web/app/eggs/page.tsx`):**
- LayoutWrapper with TopNav, SideNav, BottomNav
- Auth guard: redirects to /auth/login if not authenticated
- Hydration safety with useIsHydrated hook
- Loading skeleton with animated placeholders
- Empty state with "Get Your First Egg" CTA
- Page header with "My Egg Inventory" title
- FeaturedEggHero at top (eggs[0] from sorted query)
- Responsive grid: md:grid-cols-2, lg:grid-cols-3, gap-8
- Maps remaining eggs (eggs.slice(1)) to EggCard components

## Files Created/Modified

**Created (4 files):**
1. `apps/web/hooks/use-egg-poll.ts` - Auto-polling hook (98 lines)
2. `apps/web/components/eggs/egg-card.tsx` - Egg card component (123 lines)
3. `apps/web/components/eggs/featured-egg-hero.tsx` - Hero section (142 lines)
4. `apps/web/app/eggs/page.tsx` - Main eggs page (211 lines)

**Modified:** None

## Links to Components

- **useEggPoll Hook:** `apps/web/hooks/use-egg-poll.ts`
- **EggCard:** `apps/web/components/eggs/egg-card.tsx`
- **FeaturedEggHero:** `apps/web/components/eggs/featured-egg-hero.tsx`
- **Eggs Page:** `apps/web/app/eggs/page.tsx`

## Testing Notes

**Build Verification:**
```bash
cd apps/web && bun run build
```
Result: ✓ Build successful, no errors

**Manual Testing Checklist:**
1. Visit `/eggs` while authenticated → should see egg inventory
2. Visit `/eggs` while not authenticated → should redirect to `/auth/login`
3. Check responsive layout:
   - Desktop (lg): 3 columns + featured hero
   - Tablet (md): 2 columns
   - Mobile: 1 column
4. Verify polling:
   - Open page, wait 30 seconds → should see data refresh
   - Check network tab for PocketBase requests
5. Test empty state:
   - User with no eggs → should see "No Eggs Yet" message
   - CTA button should link to `/mint`

**Integration Points:**
- PocketBase `egg_nfts` collection must exist with fields: id, egg_id, food_count, is_hatched, token_id, minted_at, rarity_seed, element_type, owner
- Wallet address must be populated on user record
- LayoutWrapper provides navigation context

## Requirements Covered

- ✅ **EGG-01:** My Eggs page lists all user's Egg NFTs with status badges
- ✅ **EGG-02:** Egg card displays feeding progress bar showing X/10 food items collected

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functionality wired correctly. Future plans will add:
- Feed flow (Plan 02)
- Hatch flow (Plan 03)
- Egg management detail page (Plan 04)

## Commits

1. `d835b83`: feat(10-01): create useEggPoll hook for auto-polling egg NFTs
2. `12454cf`: feat(10-01): create EggCard component with claymorphism styling
3. `27c5b72`: feat(10-01): create FeaturedEggHero and eggs page layout

## Self-Check

**Files Exist:**
- ✓ apps/web/hooks/use-egg-poll.ts
- ✓ apps/web/components/eggs/egg-card.tsx
- ✓ apps/web/components/eggs/featured-egg-hero.tsx
- ✓ apps/web/app/eggs/page.tsx

**Commits Exist:**
- ✓ d835b83
- ✓ 12454cf
- ✓ 27c5b72

**Build Status:**
- ✓ No errors
- ✓ No warnings

**Self-Check: PASSED**
