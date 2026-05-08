---
phase: 26-phase23-uat-gap-closure
plan: 03
status: completed
completed: 2026-04-23
---

# Phase 26-03 Summary: Duplicate Listing Prevention

## Changes Made

### Backend (`apps/backend/pb_hooks/23-list-animal.pb.js`)

Added validation check before creating listing to prevent duplicates:

```javascript
// Check for existing active listing for this animal
var existingListing = $app.findFirstRecordByData(
  "resale_listings",
  "animal_id",
  parseInt(animal_id)
)

if (existingListing && existingListing.get("status") === "active") {
  return e.json(400, {
    success: false,
    error: {
      message: "This animal already has an active listing. Cancel the existing listing first.",
      code: "ALREADY_LISTED",
      existing_listing_id: existingListing.id,
    },
  })
}
```

**Inserted after:** Ownership check (line 76)  
**Before:** Cooldown check (original line 78)

### Frontend (`apps/web/components/animal-nft/ListAnimalDialog.tsx`)

Added dual-layer validation with UI feedback:

1. **State additions:**
   - `hasActiveListing` - tracks if animal already has active listing
   - `checkingListing` - loading state during check

2. **useEffect hook** fetches existing listings on dialog open and checks for active status

3. **"Continue to Confirmation" button modifications:**
   - Added `disabled={!price || parseFloat(price) <= 0 || hasActiveListing || checkingListing}`
   - Dynamic text: "Already Listed" / "Checking..." / "Continue to Confirmation"

4. **Error message display** when `hasActiveListing` is true

## Verification

- ✅ Backend returns `ALREADY_LISTED` error code (confirmed via grep)
- ✅ Frontend has `hasActiveListing` state (4 references found)
- ✅ Button disabled logic includes both validation flags
- ✅ Acceptance criteria met

---

_Gap Closure for Phase 23 UAT Issue #3_
