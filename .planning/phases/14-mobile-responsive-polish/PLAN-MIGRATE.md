# Plan: Migrate 3 Pages from header.tsx to LayoutWithoutNav

**Requires:** QUAL-03
**Risk:** Medium (3 pages, each has unique layout)
**Estimate:** 25 min

## Overview

Replace `<Header />` + manual `<main>` wrapper with `<LayoutWithoutNav>` in 3 pages that still use the old `header.tsx`. This gives them SideNav (desktop), BottomNavMobile (mobile), and consistent layout.

After migration, `header.tsx` is no longer imported anywhere and can be marked for deletion.

## Step 1: Migrate wallet/page.tsx

**File:** `apps/web/app/wallet/page.tsx`

**Before (lines 61-65):**

```tsx
return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
```

**After:**

```tsx
return (
  <LayoutWithoutNav>
    <div className="space-y-6">
```

**Changes:**

1. Remove `import { Header } from '@/components/header'` (line 9)
2. Add `import LayoutWithoutNav from '@/components/LayoutWithoutNav'`
3. Replace `<div className="min-h-screen bg-background"><Header />\n<main className="pt-20 pb-12"><div className="container mx-auto px-4 max-w-4xl space-y-6">` with `<LayoutWithoutNav>\n<div className="space-y-6">`
4. Close wrappers: replace `</div></main></div>` at end with `</div></LayoutWithoutNav>`
5. Keep full content between the wrapper divs intact

## Step 2: Migrate eggs/[id]/hatch/page.tsx

**File:** `apps/web/app/eggs/[id]/hatch/page.tsx`

**Before (lines 192-197):**

```tsx
return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
```

**After:**

```tsx
return (
  <LayoutWithoutNav>
    <div className="space-y-8">
```

**Changes:**

1. Remove `import { Header } from '@/components/header'` (line 14)
2. Add `import LayoutWithoutNav from '@/components/LayoutWithoutNav'`
3. Replace outer wrapper same pattern as Step 1
4. Close wrappers: `</div></div></main></div>` → `</div></LayoutWithoutNav>`

## Step 3: Migrate dashboard/commissions/page.tsx

**File:** `apps/web/app/dashboard/commissions/page.tsx`

**Before (lines 196-202):**

```tsx
return (
  <div className="min-h-screen bg-background">
    <Header />

    <main className="pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-8">
```

**After:**

```tsx
return (
  <LayoutWithoutNav>
    <div className="space-y-8">
```

**Changes:**

1. Remove `import { Header } from '@/components/header'` (line 13)
2. Add `import LayoutWithoutNav from '@/components/LayoutWithoutNav'`
3. Same wrapper replacement pattern
4. Close wrappers: `</div></div></main></div>` → `</div></LayoutWithoutNav>`

**Note:** This file uses `cn(` on line 467 in the `commission-history` section but does NOT import `cn`. Add `import { cn } from '@/lib/utils'` at top.

## Step 4: Clean up header.tsx

After all 3 pages are migrated:

1. Verify no remaining imports: `grep -r "from '@/components/header'" apps/web/`
2. If zero results, rename `header.tsx` to `_header.tsx` (soft-delete) to prevent future use

## Verification

```bash
bun run build  # Check for import errors
# Manual: open /wallet, /eggs/1/hatch, /dashboard/commissions
# Verify: SideNav visible on desktop, BottomNav visible on mobile
# Verify: no "pt-20 pb-12" top padding (LayoutWithoutNav handles this)
```
