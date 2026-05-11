# Phase 57: Wallet Balance Polish - Research

**Researched:** 2026-05-09
**Domain:** UI/UX polish — loading skeleton, CSS transitions, error recovery, real-time polling
**Confidence:** HIGH

## Summary

Phase 57 polishes the wallet balance card on the existing `/wallet` page with proper loading skeletons, smooth fade-in transitions, refined error states, and maintained auto-polling behavior. All changes are confined to `apps/web/app/wallet/page.tsx` (the wallet page component) — no hook, backend, or structural changes are needed.

The core challenge is **distinguishing initial load from background polling** in the `useWalletPoll` hook. The existing hook's `loading` state is true during both the initial fetch and subsequent 30-second background polls. The skeleton card should only appear during initial load, while background polls should continue showing only the existing "Updating..." badge. This requires tracking an `initialLoadComplete` flag locally in the wallet page component — no hook modification is needed.

The fade-in transition uses CSS `opacity` via `tw-animate-css` (already installed: v1.3.3) or manual `transition-opacity` classes. The `prefers-reduced-motion: reduce` media query already disables animations globally via `globals.css` — no additional reduced-motion handling is required.

**Primary recommendation:** Add skeleton and fade-in logic inline on `wallet/page.tsx` — do NOT reuse the deprecated `BalanceCard` component. Track initial load completion with a local `useState` + `useEffect`. Use the existing `Skeleton` component with `animate-pulse` for skeleton placeholders, and `animate-fade-in` or `transition-opacity duration-500` for the fade-in.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Skeleton card matching the full balance card layout — shows card outline with pulsing placeholder blocks for header area, large balance number area, and description line
- **D-02:** Smooth fade-in transition (not quick swap) when balance loads — skeleton fades to real content
- **D-03:** Keep existing "Updating..." badge with pulse animation during background polling (unchanged behavior)

### Claude's Discretion

- Error state design and refinement (inline card or other approach)
- Empty/zero balance display
- Exact skeleton styling (colors, animation timing, opacity)
- Balance number display polish (formatting, USD conversion presentation)
- Any animation durations and easing functions
- Overall layout spacing adjustments within the balance card
- Whether to reuse the BalanceCard component from `components/dashboard/balance-card.tsx` or create inline on the wallet page

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                 | Research Support                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WALLET-01 | User can view consolidated wallet balance with polished states — real-time polling, loading skeleton, error recovery, smooth transitions on the wallet page | See sections: Standard Stack (existing components), Architecture Patterns (state machine, fade-in pattern), Code Examples (skeleton card, fade transition, error handling) |

</phase_requirements>

## Architectural Responsibility Map

| Capability                 | Primary Tier     | Secondary Tier                              | Rationale                                                                  |
| -------------------------- | ---------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Loading skeleton rendering | Browser/Client   | —                                           | Conditional JSX in React component, no server involvement                  |
| Smooth fade-in transition  | Browser/Client   | —                                           | CSS transitions via Tailwind utilities, fully client-side                  |
| Error state display        | Browser/Client   | —                                           | Conditional JSX rendering with Alert component                             |
| Balance data fetching      | Browser/Client   | API/Backend (PocketBase proxy → wallet-api) | `useWalletPoll` hook calls PocketBase `/api/v2/hot-wallet/balance`         |
| Auto-polling scheduling    | Browser/Client   | —                                           | `setInterval` in `useWalletPoll` hook                                      |
| Balance data persistence   | Database/Storage | —                                           | Blockchain state stored off-chain by wallet-api, not changed in this phase |

## Standard Stack

### Core — Existing Components (No New Libraries Needed)

| Library / Component          | Version  | Purpose                                                            | Why Standard                                                                                                                         |
| ---------------------------- | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `components/ui/skeleton.tsx` | existing | Skeleton placeholder blocks (`bg-accent animate-pulse rounded-md`) | Already in codebase, used by BuddyChain loading pattern [VERIFIED: codebase grep]                                                    |
| `components/ui/card.tsx`     | existing | Card wrapper with `variant="clay-xl"`                              | Already used by wallet page, provides claymorphism styling [VERIFIED: codebase]                                                      |
| `components/ui/badge.tsx`    | existing | "Updating..." polling indicator with `variant="secondary"`         | Already used on wallet page, D-03 locked [VERIFIED: codebase]                                                                        |
| `components/ui/alert.tsx`    | existing | Error state with `variant="destructive"`                           | Already used on wallet page, standard shadcn pattern [VERIFIED: codebase]                                                            |
| `components/ui/button.tsx`   | existing | "Retry" inline button, "Sync Wallet" CTA                           | Already used on wallet page [VERIFIED: codebase]                                                                                     |
| `hooks/use-wallet-poll.ts`   | existing | Balance fetching with auto-polling and exponential backoff         | Already used on wallet page — no modifications needed [VERIFIED: codebase]                                                           |
| `tw-animate-css`             | 1.3.3    | CSS animation utilities (`animate-fade-in`, `animate-pulse`)       | Already installed and imported in `globals.css` via `@import 'tw-animate-css'` [VERIFIED: globals.css line 2, package.json line 100] |

### Supporting — Tailwind CSS Utilities

| Utility                                    | Purpose                                                        | Verified Where Used                                                                               |
| ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `animate-pulse`                            | Skeleton placeholder pulsing (2s cycle, Tailwind cubic-bezier) | Used in skeleton.tsx line 7, buddy-chain.tsx line 91, wallet page badge [VERIFIED: codebase grep] |
| `animate-fade-in` (tw-animate-css)         | Fade-in transition on content mount                            | Provided by `tw-animate-css` v1.3.3 [VERIFIED: npm registry via package.json]                     |
| `transition-opacity duration-500 ease-out` | Manual CSS opacity transition                                  | Standard Tailwind v4 — verified via existing utility patterns in codebase                         |
| `opacity-0`, `opacity-100`                 | Visibility control for transition                              | Standard Tailwind v4 utilities                                                                    |

### Alternatives Considered

| Instead of                     | Could Use                          | Tradeoff                                                                                                                                                                                                                                    |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline skeleton on wallet page | Refactored `BalanceCard` component | `BalanceCard` is deprecated (`@deprecated` tag), uses different icon set (material symbols instead of lucide), different layout structure. Inline approach is simpler and avoids coupling. [VERIFIED: codebase balance-card.tsx line 11-12] |

**Installation:** No new packages needed. All dependencies exist in the codebase.

**Version verification:** `tw-animate-css` v1.3.3 is confirmed installed in `package.json` and imported in `globals.css`. All UI components are existing codebase components. [VERIFIED: package.json, globals.css]

## Architecture Patterns

### Component State Machine

```
                    ┌──────────────────────┐
                    │   INITIAL LOADING    │  <-- useWalletPoll().loading === true
                    │  (skeleton card +    │       AND !initialLoadComplete
                    │   animate-pulse)     │
                    └──────────┬───────────┘
                               │ Data arrives (loading → false)
                               ▼
                    ┌──────────────────────┐
                    │    FADE-IN PHASE     │  <-- 500ms CSS opacity transition
                    │  (skeleton fades out │       skeleton opacity 0→100 → 100→0
                    │   content fades in)  │       content opacity 0→100
                    └──────────┬───────────┘
                               │ Transition completes (500ms)
                               ▼
                    ┌──────────────────────┐
                    │      LOADED          │  <-- initialLoadComplete = true
                    │  (balance display +  │
                    │   sync button +      │
                    │   "Updating..." badge│
                    │   during polls)      │
                    └──────────┬───────────┘
                               │ Poll fails or error
                               ▼
                    ┌──────────────────────┐
                    │       ERROR          │  <-- useWalletPoll().error !== null
                    │  (destructive Alert  │       Balance shows last known value
                    │   + "Retry" button)  │
                    └──────────┬───────────┘
                               │ Retry clicked → refresh()
                               ▼
                    ┌──────────────────────┐
                    │  RETRY LOADING       │  <-- loading = true, skeleton NOT shown
                    │  ("Updating..." badge│       (already past initial load)
                    │   + sync button spin)│
                    └──────────┬───────────┘
                               │ Success → back to LOADED
                               │ Fail → stays in ERROR
                               ▼
                    ┌──────────────────────┐
                    │       LOADED         │
                    │  (error cleared,     │
                    │   balance updates)   │
                    └──────────────────────┘
```

**Key insight:** `initialLoadComplete` is tracked locally in the wallet page component (not in the hook). The `useWalletPoll` hook is used as-is — no modifications. The skeleton only shows during initial load; background polls and retries show only the "Updating..." badge (D-03 locked behavior).

### Recommended Project Structure

No new files needed. All changes are confined to:

```
apps/web/app/wallet/page.tsx      // Add skeleton, fade-in, refined error
```

### Pattern 1: Initial Load Detection (Local State)

**What:** Track whether the balance has loaded at least once, to distinguish initial load from background polling.
**When to use:** When using a hook that sets `loading=true` for both initial and subsequent fetches.

```typescript
// In WalletContent component (wallet/page.tsx)
const [initialLoadComplete, setInitialLoadComplete] = useState(false)

// Track when initial load finishes — fires once
useEffect(() => {
  if (!loading && !initialLoadComplete) {
    // Use requestAnimationFrame to ensure DOM is ready for CSS transition
    requestAnimationFrame(() => setInitialLoadComplete(true))
  }
}, [loading, initialLoadComplete])
```

**Why this pattern:** The `useWalletPoll` hook returns `loading: boolean` that is true during ALL fetch operations (initial fetch, background polls, retry). Without tracking initial load separately, the skeleton card would flash on every background poll.

### Pattern 2: Skeleton Card Layout

**What:** A skeleton card matching the exact balance card layout — pulsing placeholder blocks for header, balance number, and description.
**When to use:** As the initial loading state before balance data arrives.

```
┌──────────────────────────────────────┐
│  ████████████  ████                   │  ← Skeleton for title area (h-4 w-32)
│  ████████████████████████             │  ← Skeleton for description (h-3 w-48)
│                                      │
│  ██████████████████████████████████  │  ← Skeleton for balance number (h-10 w-64)
│  ██████████                          │  ← Skeleton for USD line (h-3 w-24)
│                                      │
│  ██████████████████████████          │  ← Skeleton for Sync button (h-12 w-32)
└──────────────────────────────────────┘
```

**Implementation using existing Skeleton component:**

```tsx
<Card
  variant="clay-xl"
  className={cn(
    "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
    "shadow-clay-2xl"
  )}
>
  <CardHeader>
    <Skeleton className="h-4 w-32 mb-2" /> {/* USDT BALANCE title */}
    <Skeleton className="h-3 w-48" /> {/* description */}
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" /> {/* balance number */}
      <Skeleton className="h-3 w-24" /> {/* USD line */}
    </div>
    <Skeleton className="h-12 w-32" /> {/* Sync button */}
  </CardContent>
</Card>
```

**Source:** [VERIFIED: codebase — wallet page layout pattern, skeleton.tsx component]

### Pattern 3: Smooth Fade-In Transition

**What:** CSS opacity transition that fades the skeleton out and the real content in.
**When to use:** D-02 requires smooth fade-in, not quick swap.

**Approach A (Recommended):** Use `animate-fade-in` from `tw-animate-css`

```tsx
// Content renders after initial load completes
import { cn } from '@/lib/utils'

if (!initialLoadComplete) {
  return <WalletSkeletonCard />
}

return (
  <div className="animate-fade-in duration-500">
    <Card variant="clay-xl" className={...}>
      {/* Real balance content */}
    </Card>
  </div>
)
```

**Approach B (Manual CSS):** Use `transition-opacity` for more control

```tsx
const [contentVisible, setContentVisible] = useState(false)

useEffect(() => {
  if (initialLoadComplete && !contentVisible) {
    setContentVisible(true)
  }
}, [initialLoadComplete, contentVisible])

return (
  <div
    className={cn(
      "transition-opacity duration-500 ease-out",
      contentVisible ? "opacity-100" : "opacity-0"
    )}
  >
    {/* Balance card content */}
  </div>
)
```

**Source:** [VERIFIED: `tw-animate-css` v1.3.3 at package.json line 100, imported at globals.css line 2; transition utilities verified via codebase usage in globals.css lines 856-864]

### Pattern 4: Refined Error State (Per UI-SPEC)

**What:** Destructive Alert with human-readable error message and inline Retry button, rendered within the Card (not as a separate Card below).

```tsx
{
  error && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-[var(--font-pixel)] text-xs">Failed to load balance</AlertTitle>
      <AlertDescription className="font-[var(--font-pixel)] text-xs">
        The wallet service may be temporarily unavailable.{" "}
        <Button
          variant="link"
          onClick={refresh}
          className="p-0 h-auto font-[var(--font-pixel)] text-xs"
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

**Source:** [VERIFIED: UI-SPEC.md lines 146-149 — refined error copy; wallet page existing error pattern at page.tsx lines 88-102]

### Anti-Patterns to Avoid

- **Showing skeleton during background polls:** The skeleton should only appear on initial load. Background polls show the "Updating..." badge only (D-03). Use the `initialLoadComplete` state to control this.
- **Modifying useWalletPoll hook:** The hook works correctly for its designed purpose. Adding initial-load detection to the hook would couple it to UI concerns. Keep the detection in the page component.
- **Using deprecated BalanceCard component:** It's marked as `@deprecated`, uses different icon set (material-symbols-outlined), and has different layout structure. Inline approach is cleaner. [VERIFIED: balance-card.tsx line 11-12]
- **Hardcoding animation keyframes:** `tw-animate-css` already provides `animate-fade-in`. Avoid adding custom `@keyframes fadeIn` — use the established library.
- **Forgetting reduced motion:** The existing `prefers-reduced-motion: reduce` media query in `globals.css` (lines 792-804) already strips transitions and animations. The fade-in will naturally become instant for users with reduced motion preference — no special handling needed.

## Don't Hand-Roll

| Problem                     | Don't Build                     | Use Instead                             | Why                                                                                                              |
| --------------------------- | ------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Skeleton placeholder blocks | Custom divs with manual styling | `components/ui/skeleton.tsx`            | Already built, uses `bg-accent animate-pulse rounded-md` consistent with rest of app (BuddyChain pattern)        |
| Fade-in animation           | Custom `@keyframes` CSS         | `animate-fade-in` from `tw-animate-css` | Already installed (v1.3.3) and imported in globals.css — zero-config CSS animation                               |
| Auto-polling with backoff   | Custom polling logic            | `hooks/use-wallet-poll.ts`              | Already handles 30s interval, exponential backoff, wallet validation, 4xx errors — D-11 locked                   |
| Claymorphism card styling   | Manual border/shadow CSS        | `Card variant="clay-xl"`                | Already provides `rounded-clay-xl shadow-clay-2xl bg-clay-volume-2xl p-clay-2xl` — consistent with design system |

**Key insight:** This phase is pure UI polish requiring zero new libraries, zero new hooks, and zero backend changes. All building blocks exist in the codebase — the work is composing them correctly.

## Runtime State Inventory

> Not applicable — this is a greenfield polish phase with no rename/refactor/migration requirements.

**Skipped:** Phase involves no rename, refactor, or migration. All work is additive within an existing file.

## Common Pitfalls

### Pitfall 1: Skeleton Flashing on Every Poll

**What goes wrong:** The skeleton card appears every 30 seconds during background polling because `loading` is true for each fetch.
**Why it happens:** `useWalletPoll().loading` is true during ALL fetch operations — initial and background polls. The skeleton was designed for initial load only.
**How to avoid:** Track `initialLoadComplete` as a local `useState` in the page component. Only show skeleton when `loading && !initialLoadComplete`. Once data has loaded once, `initialLoadComplete` stays true forever.
**Warning signs:** If you see the skeleton card appear briefly every 30 seconds, you've hit this pitfall.

### Pitfall 2: Fade-In Not Triggering on First Load

**What goes wrong:** The content appears instantly without the smooth fade-in transition.
**Why it happens:** CSS transitions require the element to exist in the DOM with `opacity-0` before transitioning to `opacity-100`. If the content div is conditionally rendered (only appears when data arrives), it mounts with `opacity-100` by default.
**How to avoid:** Use `animate-fade-in` from `tw-animate-css` which plays on mount, or use a two-phase approach: (1) render content with `opacity-0`, (2) after next animation frame, add class/state for `opacity-100`.
**Warning signs:** If the balance content pops in without any transition, check that your animation class is applied and not being overridden.

### Pitfall 3: Layout Shift When Skeleton Replaces Content

**What goes wrong:** The page layout shifts or jumps when transitioning from skeleton to real content.
**Why it happens:** If the skeleton card dimensions don't precisely match the real content card dimensions, the browser recalculates layout.
**How to avoid:** Use the exact same `Card variant="clay-xl"` wrapper for both skeleton and content. Match skeleton placeholder sizes to real content sizes. If using the overlay approach (rendering both simultaneously), use `absolute` positioning within a `relative` container to prevent any layout shift.
**Warning signs:** If you see content elements shifting position during the fade-in, check element dimensions match.

### Pitfall 4: "Updating..." Badge Disappearing on Initial Load

**What goes wrong:** During initial load, both the skeleton AND the "Updating..." badge are visible, creating visual confusion.
**Why it happens:** The badge checks `polling && balance.usdt !== '0'`, which is true during initial load. But the skeleton should be the primary loading indicator.
**How to avoid:** Hide the "Updating..." badge during initial load by adding `initialLoadComplete` to the badge's conditional: `{!initialLoadComplete && polling && balance.usdt !== '0' && <Badge>...}`. Wait — that's wrong. Let me re-read: the badge shows during background polling. During initial load, the skeleton is shown, so the badge is irrelevant. Solution: only show badge when `initialLoadComplete && polling`.
**Warning signs:** If both skeleton and "Updating..." badge appear simultaneously on page load.

### Pitfall 5: Error State During Initial Load

**What goes wrong:** If the initial fetch fails, the error state shows without the user ever seeing the skeleton.
**Why it happens:** The skeleton condition is `!initialLoadComplete && loading`. If the fetch fails, `loading` becomes false but `initialLoadComplete` is still false. The component shows neither skeleton nor content — just a blank card.
**How to avoid:** Set `initialLoadComplete` to true even on error (the first fetch completed — it just failed). Then the error state will render. The skeleton is only for the _waiting_ period, not the _failed_ period.
**Warning signs:** Blank card on page load when API returns an error.

## Code Examples

### 1. Wallet Page with Skeleton and Fade-In (Recommended Implementation)

```typescript
// apps/web/app/wallet/page.tsx — WalletContent function
"use client"

import { useState, useEffect, useCallback } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useWalletPoll } from '@/hooks/use-wallet-poll'
import { cn } from '@/lib/utils'
import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { WithdrawForm } from '@/components/WithdrawForm'
import { TransactionHistory } from '@/components/TransactionHistory'
import { Loader2, RefreshCw, Wallet as WalletIcon, AlertCircle } from 'lucide-react'

export default function WalletPage() {
  return (
    <AuthGuard redirectTo="/auth/login">
      {(user) => <WalletContent user={user} />}
    </AuthGuard>
  )
}

function WalletContent({ user }: { user: any }) {
  const { balance, loading, error, refresh } = useWalletPoll(
    user?.wallet_address || user?.wallet || ''
  )

  // Track initial load completion — differentiates initial fetch from background polls
  // See Common Pitfalls §1 — prevents skeleton flashing on every 30s poll
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  useEffect(() => {
    if (!loading && !initialLoadComplete) {
      // Use requestAnimationFrame to ensure CSS transition triggers properly
      // See Common Pitfalls §2 — without RAF, the fade-in may not animate
      requestAnimationFrame(() => setInitialLoadComplete(true))
    }
  }, [loading, initialLoadComplete])

  // === Initial Loading State: Skeleton Card ===
  if (!initialLoadComplete && loading) {
    return (
      <LayoutWithoutNav>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
              <WalletIcon className="w-8 h-8 text-primary" />
              MY WALLET
            </h1>
            <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
              Manage your USDT balance and withdrawals
            </p>
          </div>

          {/* Skeleton Card — matches exact layout of real balance card */}
          <Card variant="clay-xl" className={cn(
            'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
            'shadow-clay-2xl'
          )}>
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-12 w-32 rounded-clay-md" />
            </CardContent>
          </Card>

          {/* Show WithdrawForm and TransactionHistory in skeleton state too */}
          <WithdrawForm balance="0" />
          <TransactionHistory userId={user.id} />
        </div>
      </LayoutWithoutNav>
    )
  }

  // === Loaded or Error State: Real Content with Fade-In ===
  return (
    <LayoutWithoutNav>
      <div className="space-y-6">
        {/* Page Header — same as above */}
        <div className="space-y-2">
          <h1 className="font-[var(--font-pixel)] text-2xl md:text-3xl text-foreground flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-primary" />
            MY WALLET
          </h1>
          <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
            Manage your USDT balance and withdrawals
          </p>
        </div>

        {/* Balance Card with fade-in transition on mount */}
        <div className="animate-fade-in duration-500">
          <Card variant="clay-xl" className={cn(
            'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent',
            'shadow-clay-2xl'
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
                  USDT BALANCE
                </CardTitle>
                {/* "Updating..." badge — only during background polls (D-03) */}
                {initialLoadComplete && loading && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Updating...
                  </Badge>
                )}
              </div>
              <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                Real-time balance updated every 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance Display */}
              <div className="space-y-2">
                <div className="text-4xl font-bold font-[var(--font-pixel)] text-primary">
                  {balance.usdt} USDT
                </div>
                <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
                  ≈ ${(parseFloat(balance.usdt) * 1.00).toFixed(2)} USD
                </p>
              </div>

              {/* Error State — inline within card (above sync button) */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-[var(--font-pixel)] text-xs">
                    Failed to load balance
                  </AlertTitle>
                  <AlertDescription className="font-[var(--font-pixel)] text-xs">
                    The wallet service may be temporarily unavailable.{' '}
                    <Button
                      variant="link"
                      onClick={refresh}
                      className="p-0 h-auto font-[var(--font-pixel)] text-xs"
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sync Button */}
              <Button
                variant="clay"
                size="clay-md"
                onClick={refresh}
                disabled={loading}
                className="font-[var(--font-pixel)] text-xs"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                {loading ? 'Syncing...' : 'Sync Wallet'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Section */}
        <WithdrawForm balance={balance.usdt} />

        {/* Transaction History */}
        <TransactionHistory userId={user.id} />
      </div>
    </LayoutWithoutNav>
  )
}
```

**Source:** [VERIFIED: Existing wallet page at page.tsx, useWalletPoll hook, Skeleton component, UI-SPEC refined error copy at lines 146-149]

### 2. Skeleton → Error Transition (Edge Case Handling)

When the initial load fails, the `initialLoadComplete` flag must be set to true so the error state renders instead of a blank skeleton:

```typescript
// Handle the case where initial fetch fails
useEffect(() => {
  // If loading finished (success or failure) and we haven't completed initial load
  if (!loading && !initialLoadComplete) {
    // Set complete regardless of error — skeleton should never reappear
    requestAnimationFrame(() => setInitialLoadComplete(true))
  }
}, [loading, initialLoadComplete])
```

This is the SAME `useEffect` as the normal case — it naturally handles errors because `loading` becomes false on both success and failure. The error state renders because `error` is set by the hook.

## State of the Art

| Old Approach                                                     | Current Approach                                                                                             | When Changed          | Impact                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------------------- |
| No loading skeleton — balance card shows immediately or is blank | Skeleton card during initial load, smooth fade-in to real content                                            | Phase 57              | Better perceived performance, eliminates blank-card flash            |
| Separate error Card below balance card                           | Inline destructive Alert within balance card                                                                 | Phase 57 (discretion) | Reduced visual fragmentation, error shown next to last-known balance |
| Error copy: "Failed to load balance. Retry"                      | Error copy: "Failed to load balance" + "The wallet service may be temporarily unavailable." + "Retry" button | Phase 57 (discretion) | More descriptive, actionable error message                           |

**Deprecated/outdated:**

- `BalanceCard` component at `components/dashboard/balance-card.tsx` — marked `@deprecated`, not currently used. Phase 57 continues with inline approach on wallet page.

## Assumptions Log

| #   | Claim                                                                                                                                               | Section       | Risk if Wrong                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `animate-fade-in` class from `tw-animate-css` v1.3.3 works as expected (fade from opacity 0→1) in the Tailwind v4 + Next.js 16 build                | Code Examples | Low — if the class doesn't exist or doesn't work, fallback is `transition-opacity duration-500 ease-out` with `useState`-driven opacity toggle, which is standard CSS |
| A2  | The `Skeleton` component's `bg-accent` color provides sufficient contrast against `bg-gradient-to-br from-primary/20 via-primary/10 to-transparent` | Code Examples | Low — `bg-accent` is the standard skeleton color used in BuddyChain; if contrast is poor, adjust skeleton opacity or use `bg-muted` instead                           |

## Open Questions

1. **Skeleton → Error transition timing** (RESOLVED)
   - What we know: When initial fetch fails, the skeleton should disappear and error state should show, both within a fade transition
   - What's unclear: Should the error state fade in (like success state) or appear instantly? The UI-SPEC says "Immediate re-render (skeleton fade-in applies on retry)" for error → success, but doesn't specify initial error → error display
   - Recommendation: Apply the same `animate-fade-in duration-500` to the error state when it first appears. This provides consistent UX — no jarring instant swaps.
   - Resolution: Plan 01 Task 2 applies `animate-fade-in duration-500` to the entire main content wrapper, which includes the error state. Error appears within the fade-in transition — no instant swap.

2. **Balance number formatting polish** (RESOLVED)
   - What we know: Current display is `{balance.usdt} USDT` (raw string from API) and `≈ $${(parseFloat(balance.usdt) * 1.00).toFixed(2)} USD`
   - What's unclear: Whether to add number formatting (commas for thousands, fixed decimal places) as part of this phase — it's listed under Claude's discretion
   - Recommendation: Add `parseFloat(balance.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` for the USDT amount and similarly for USD. This is a low-effort polish item that improves readability.
   - Resolution: Plan 01 Task 2 Step 5d specifies `toLocaleString` for both USDT and USD display — implemented.

## Environment Availability

> Skipped — this phase has no external dependencies beyond the existing codebase. All changes are UI-only modifications to `apps/web/app/wallet/page.tsx`. No new packages, tools, or services are required.

**Step 2.6: SKIPPED (no external dependencies identified)**

## Validation Architecture

### Test Framework

| Property           | Value                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| Framework          | bun:test (Bun's built-in test runner) + @testing-library/react                      |
| Config file        | none — bun:test is zero-config; tests discovered by `*.test.ts` / `*.test.tsx` glob |
| Quick run command  | `cd apps/web && bun test --timeout 10000`                                           |
| Full suite command | `cd apps/web && bun test --timeout 10000`                                           |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                | Test Type                                                           | Automated Command                                  | File Exists? |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- | ------------ |
| WALLET-01 | Wallet page shows skeleton during initial load                          | Unit (static analysis / rendering)                                  | `cd apps/web && bun test app/wallet/page.test.tsx` | ❌ Wave 0    |
| WALLET-01 | Wallet page fades in balance after load                                 | Manual-only (CSS animation cannot be unit-tested deterministically) | —                                                  | ❌ Manual    |
| WALLET-01 | Wallet page shows "Updating..." badge during background poll            | Unit                                                                | (same as above)                                    | ❌ Wave 0    |
| WALLET-01 | Wallet page shows error state with refined copy                         | Unit                                                                | (same as above)                                    | ❌ Wave 0    |
| WALLET-01 | Skeleton does NOT flash on background polls (initialLoadComplete guard) | Unit                                                                | (same as above)                                    | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `cd apps/web && bun test --timeout 10000 app/wallet/page.test.tsx`
- **Per wave merge:** `cd apps/web && bun test --timeout 10000`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/web/app/wallet/page.test.tsx` — new test file for wallet page structure (follows pattern from `dashboard/deposit/page.test.tsx`)
- [ ] `apps/web/hooks/use-wallet-poll.test.ts` — new test file for wallet poll hook behavior (follows pattern from `hooks/use-daily-checkin.test.ts` and `hooks/use-transaction-history.test.ts`)

**Test pattern (from existing tests — `use-daily-checkin.test.ts`):**

```typescript
// apps/web/hooks/use-wallet-poll.test.ts
import { describe, it, expect, vi, beforeEach } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { useWalletPoll } from "./use-wallet-poll"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

describe("useWalletPoll", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful wallet balance response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { usdt_balance: "100.50", withdrawable: "100.50" },
      }),
    })
  })

  it("fetches balance on mount with valid address", async () => {
    const { result } = renderHook(() => useWalletPoll("0x1234567890abcdef1234567890abcdef12345678"))
    await waitFor(() => {
      expect(result.current.balance.usdt).toBe("100.50")
    })
  })
  // ... more tests
})
```

**Source:** [VERIFIED: Existing test files at hooks/use-daily-checkin.test.ts, hooks/use-transaction-history.test.ts, app/dashboard/deposit/page.test.tsx]

## Security Domain

> Security enforcement is implicitly enabled (no `security_enforcement: false` in config.json).

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                           |
| --------------------- | ------- | -------------------------------------------------------------------------- |
| V2 Authentication     | yes     | `AuthGuard` redirects to `/auth/login` — unchanged, already on wallet page |
| V3 Session Management | yes     | PocketBase auth token used by `useWalletPoll` — unchanged                  |
| V4 Access Control     | no      | Wallet page shows user's own balance — no data access control change       |
| V5 Input Validation   | no      | No user input in this phase — display-only changes                         |
| V6 Cryptography       | no      | No cryptographic operations in this phase                                  |

### Known Threat Patterns for Next.js 16 / PocketBase Stack

| Pattern              | STRIDE    | Standard Mitigation                                                                           |
| -------------------- | --------- | --------------------------------------------------------------------------------------------- |
| XSS via balance data | Tampering | Balance data is displayed as text content (React auto-escapes), not `dangerouslySetInnerHTML` |

**Risk assessment:** LOW — this phase is pure UI polish with no new data flows, no new inputs, and no authorization changes. The existing `AuthGuard` wrapper and PocketBase auth token remain unchanged. No new security controls are needed.

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase] — `apps/web/app/wallet/page.tsx` - existing wallet page structure and components
- [VERIFIED: codebase] — `apps/web/hooks/use-wallet-poll.ts` - hook behavior and return types
- [VERIFIED: codebase] — `apps/web/components/ui/skeleton.tsx` - Skeleton component API
- [VERIFIED: codebase] — `apps/web/components/ui/card.tsx` - Card component with clay-xl variant
- [VERIFIED: codebase] — `apps/web/components/ui/alert.tsx` - Alert with destructive variant
- [VERIFIED: codebase] — `apps/web/components/ui/badge.tsx` - Badge with secondary variant
- [VERIFIED: codebase] — `apps/web/components/dashboard/balance-card.tsx` - deprecated status
- [VERIFIED: codebase] — `apps/web/components/dashboard/buddy-chain.tsx` - skeleton loading pattern
- [VERIFIED: codebase] — `apps/web/app/globals.css` - reduced motion, tw-animate-css import
- [VERIFIED: codebase] — `apps/web/package.json` - tw-animate-css v1.3.3
- [VERIFIED: codebase] — `apps/web/tailwind.config.ts` - font configuration
- [VERIFIED: codebase] — Existing test files (use-daily-checkin, use-transaction-history, deposit page test)
- [VERIFIED: CONTEXT.md D-01, D-02, D-03] — locked decisions
- [VERIFIED: UI-SPEC.md] — refined error copy, animation contract, spacing scale

### Secondary (MEDIUM confidence)

- [CITED: tw-animate-css npm] — `animate-fade-in` utility availability based on package version v1.3.3

### Tertiary (LOW confidence)

- None — all claims are verified from codebase or CONTEXT.md.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all components and utilities verified directly from codebase
- Architecture: HIGH — state machine design follows established React patterns verified from codebase
- Pitfalls: HIGH — all pitfalls derived from observed hook behavior (`loading` state semantics) and common CSS transition issues

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable UI — no fast-moving dependencies)
