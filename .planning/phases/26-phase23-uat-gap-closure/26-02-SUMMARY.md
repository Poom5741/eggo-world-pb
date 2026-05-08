---
phase: 26-phase23-uat-gap-closure
plan: 02
status: completed
completed: 2026-04-23
---

# Phase 26-02 Summary: Listing Confirmation UX

## Changes Made

Added router redirect after successful listing completion in `apps/web/components/animal-nft/ListAnimalDialog.tsx`.

**Changes:**

1. Added `import { useRouter } from "next/navigation"`
2. Initialized router with `const router = useRouter()` after pb client
3. Modified `handleClose` to check if step was "success" and redirect to `/marketplace`

```typescript
const handleClose = () => {
  const wasSuccess = step === "success"
  // ... existing cleanup ...
  onOpenChange(false)
  if (wasSuccess) {
    router.push("/marketplace")
  }
}
```

## Verification

- ✅ Router import added to component
- ✅ `router.push('/marketplace')` present in handleClose at line 168
- ✅ Acceptance criteria met

---

_Gap Closure for Phase 23 UAT Issue #2_
