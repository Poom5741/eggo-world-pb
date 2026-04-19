---
plan: 16-01
phase: 16
status: complete
completed: "2026-04-19T21:12:00.000Z"
commits:
  - "b8967fd - fix(16-01): replace vi.mocked() and mock.module() with bun:test compatible patterns"
---

# Plan 16-01 Summary: Fix vi.mock Test Setup Failures

## Objective

Fix all 9 vi.mock test setup failures so the test suite runs clean before adding new Phase 16 feature tests.

## What Was Done

### 1. Fixed bun:test Import Issues

**Files Modified:**
- `apps/web/hooks/use-marketplace-sync.test.ts`
  - Added missing `vi`, `beforeEach`, `afterEach` imports from `bun:test`
  - Replaced `vi.hoisted()` pattern (not available in bun:test) with direct `vi.mock()` + type casting
  
- `apps/web/hooks/use-auth-redirect.test.tsx`
  - Already had correct imports (verified)

- `apps/web/components/BottomNavMobile.test.tsx`
  - Already had correct imports (verified)

### 2. Replaced vi.mocked() with Type Assertions

**Problem:** bun:test does NOT provide `vi.mocked()` function - only vitest has it.

**Solution:** Replace all `vi.mocked()` calls with manual type assertions:

```typescript
// Before (vitest only):
vi.mocked(createClient().collection('').getList).mockImplementation(mockGetList)

// After (bun:test compatible):
;(createClient().collection('').getList as ReturnType<typeof vi.fn>).mockImplementation(mockGetList)
```

**Files Fixed:**
- `apps/web/components/referrals/CommissionBreakdown.test.tsx` (4 occurrences)
- `apps/web/components/marketplace/CreateListingDialog.test.tsx` (8 occurrences)

### 3. Replaced mock.module() with vi.mock()

**Problem:** BuyFlow.test.tsx was using `mock.module()` which doesn't exist in bun:test.

**Solution:** Replace all `mock.module()` calls with `vi.mock()`:

```typescript
// Before:
mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(() => {}),
  }),
}))

// After:
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(() => {}),
  }),
}))
```

**Files Fixed:**
- `apps/web/components/marketplace/BuyFlow.test.tsx` (5 mock.module calls)

### 4. Fixed Lint Errors

- Fixed unused variable `mockGetListingById` in use-marketplace-sync.test.ts
- Fixed unused parameter `name` in CommissionBreakdown.test.tsx (changed to `_name`)

## Test Results

### Before Fixes
- **16 tests failed**
- **1 error** (vi.mocked is not a function)
- Multiple "vi is not defined" errors

### After Fixes
- ✅ use-marketplace-sync.test.ts - All 6 tests passing
- ✅ vi.mocked() runtime errors eliminated
- ✅ mock.module() syntax errors eliminated
- ⚠️ Some tests still failing due to other issues (not vi.mock related):
  - BottomNavMobile - Text matching issues (multiple elements found)
  - CreateListingDialog - Text matching issues
  - BuyFlow - Dialog interaction timing issues

## Key Learnings

### bun:test vs vitest Differences

| Feature | vitest | bun:test |
|---------|--------|----------|
| `vi.mock()` | ✅ | ✅ |
| `vi.fn()` | ✅ | ✅ |
| `vi.mocked()` | ✅ | ❌ Use type assertions |
| `vi.hoisted()` | ✅ | ❌ Use direct vi.mock() |
| `mock.module()` | ✅ | ❌ Use vi.mock() |
| `beforeEach`, `afterEach` | ✅ | ✅ (must import) |
| `vi` | ✅ | ✅ (must import) |

### Critical Rules for bun:test

1. **ALWAYS import `vi` from `bun:test`** when using vi.mock, vi.fn, etc.
2. **NEVER use `vi.mocked()`** - use `(fn as ReturnType<typeof vi.fn>)` instead
3. **NEVER use `vi.hoisted()`** - define mocks directly in vi.mock() factory
4. **NEVER use `mock.module()`** - use `vi.mock()` instead

## Remaining Work

The following test failures are NOT related to vi.mock setup and require separate investigation:

1. **BottomNavMobile test** - "includes: Dashboard, Eggs, Marketplace, Referrals links"
   - Error: Found multiple elements with the text
   - Fix: Use more specific queries or getAllByText

2. **CreateListingDialog tests** - Several tests failing with "Unable to find an element"
   - Error: Text matching issues
   - Fix: Review actual component text content vs test expectations

3. **BuyFlow tests** - Dialog interaction tests timing out
   - Error: Unable to find dialog content after click
   - Fix: Check if Dialog component is properly mocked or needs async wait

## Files Modified

- `apps/web/hooks/use-marketplace-sync.test.ts`
- `apps/web/components/referrals/CommissionBreakdown.test.tsx`
- `apps/web/components/marketplace/CreateListingDialog.test.tsx`
- `apps/web/components/marketplace/BuyFlow.test.tsx`

## Verification

```bash
# Run specific test file
cd apps/web && bun test hooks/use-marketplace-sync.test.ts

# Run all tests
cd apps/web && bun test

# Check for vi.mocked usage (should be zero)
grep -r "vi.mocked" apps/web/**/*.test.tsx
```

## Impact

- **QUAL-01 Progress:** ~60% complete
- **Test Infrastructure:** Foundation established for bun:test compatibility
- **Next Steps:** Fix remaining text matching and dialog interaction issues in separate task
