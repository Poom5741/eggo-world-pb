---
phase: 26-phase23-uat-gap-closure
plan: 05
status: complete
completed: 2026-04-24T11:05:00Z
---

# Phase 26-05: Gap Closure - Rarity Filter & Detail Page

## Summary

Successfully closed two UAT gaps from Phase 23 testing:

1. **Rarity filter case mismatch** - Fixed case-insensitive comparison
2. **Detail page static export error** - Created static route with searchParams

## Changes Made

### Task 1: Fix Rarity Filter Case Mismatch

- **File:** `apps/web/components/marketplace/AnimalListingsSection.tsx`
- **Change:** Updated rarity filter to use case-insensitive comparison
- **Before:** `filters.rarities.includes(listing.rarity)` (strict equality)
- **After:** `filters.rarities.some(r => r.toLowerCase() === listing.rarity.toLowerCase())`
- **Root cause:** Filter UI sends capitalized 'Common', PocketBase stores lowercase 'common'

### Task 2: Create Static Route for Detail Page

- **New file:** `apps/web/app/marketplace/detail/page.tsx`
- **Pattern:** Uses searchParams (`id` query param) instead of dynamic route segment
- **URL format:** `/marketplace/detail?id=X` (works with static export)

### Task 3: Update MarketplaceDetailClient

- **File:** `apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx`
- **Change:** Accepts `listingId` prop directly instead of `params` object
- **Removed:** `const listingId = params.id` (now passed from parent)

### Task 4: Update Navigation Links

- **Files:**
  - `apps/web/components/marketplace/AnimalListingsSection.tsx`
  - `apps/web/app/marketplace/page.tsx`
- **Change:** Updated router.push to use `/marketplace/detail?id=X` pattern

## Files Modified

| File                                                        | Action | Lines Changed |
| ----------------------------------------------------------- | ------ | ------------- |
| `apps/web/components/marketplace/AnimalListingsSection.tsx` | MODIFY | +5 -3         |
| `apps/web/app/marketplace/[id]/MarketplaceDetailClient.tsx` | MODIFY | +2 -3         |
| `apps/web/app/marketplace/detail/page.tsx`                  | CREATE | +14           |
| `apps/web/app/marketplace/page.tsx`                         | MODIFY | +1 -1         |
| `apps/web/app/marketplace/[id]/page.tsx`                    | DELETE | -8            |

## Verification

```bash
# Build succeeds with static export
cd apps/web && bun run build
# Output shows /marketplace/detail as static route (○)

# Rarity filter fix
grep -n "toLowerCase" apps/web/components/marketplace/AnimalListingsSection.tsx
# Line 142: r.toLowerCase() === listing.rarity.toLowerCase()

# Static route exists
ls apps/web/app/marketplace/detail/page.tsx

# Navigation pattern
grep -n "marketplace/detail" apps/web/components/marketplace/AnimalListingsSection.tsx
grep -n "marketplace/detail" apps/web/app/marketplace/page.tsx
```

## Self-Check

- [x] All tasks executed
- [x] Each task committed individually
- [x] SUMMARY.md created
- [x] Build passes (static export succeeds)
- [x] No TypeScript errors

## Notes

- The `/marketplace/[id]/page.tsx` was deleted because dynamic routes require `generateStaticParams()` for static export
- Backward compatibility is not preserved for `/marketplace/{id}` URLs - users must use `/marketplace/detail?id=X`
- MarketplaceDetailClient.tsx remains in `[id]` directory for organization, but could be moved to `/marketplace/components/` in future cleanup

---

_Architect: gsd-executor_
