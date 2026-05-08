# Plan: Update NAV_ITEMS & WCAG Touch Targets

**Requires:** QUAL-03, QUAL-04
**Risk:** Low
**Estimate:** 15 min

## Step 1: Update NAV_ITEMS in SideNav.tsx

Replace `NAV_ITEMS` array (line 11-17 in `apps/web/components/SideNav.tsx`):

**Current:**

```ts
{ icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
{ icon: 'egg',      label: 'Eggs',      href: '/eggs' },
{ icon: 'pets',     label: 'Animals',   href: '/animals' },
{ icon: 'storefront', label: 'Marketplace', href: '/marketplace' },
{ icon: 'group_add',   label: 'Referrals',  href: '/referrals' },
```

**New:**

```ts
{ icon: 'dashboard',            label: 'Dashboard', href: '/dashboard' },
{ icon: 'egg',                  label: 'Eggs',      href: '/eggs' },
{ icon: 'storefront',           label: 'Market',    href: '/marketplace' },
{ icon: 'account_balance_wallet', label: 'Wallet',  href: '/wallet' },
{ icon: 'person',               label: 'Profile',   href: '/settings' },
```

**Rationale:**

- Wallet (`/wallet`) and Profile (`/settings`) replace Animals, Marketplace, Referrals
- Market keeps `/marketplace` URL (no /market page exists)
- Profile points to `/settings` (no `/profile` page exists yet)
- BottomNavMobile imports NAV_ITEMS from this file — change propagates automatically

## Step 2: Add WCAG 2.2 Touch Targets to BottomNavMobile.tsx

Apply `min-h-[44px] min-w-[44px]` to each nav link. Add active route highlighting.

**File:** `apps/web/components/BottomNavMobile.tsx`

**Changes:**

1. Import `usePathname` from `next/navigation`
2. Add `active` class logic: compare `item.href` to current pathname
3. Add `min-w-[44px] min-h-[44px]` to each `<Link>` (WCAG 2.2 2.5.8)
4. Keep existing `active-side-nav` class pattern for active state

**Target markup pattern for nav links:**

```tsx
<Link
  key={item.href}
  href={item.href}
  className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-2 transition-colors ${
    isActive
      ? 'text-[var(--primary)] opacity-100'
      : 'text-[var(--on-surface)] opacity-40 hover:opacity-100 hover:text-[var(--primary)]'
  }`}
>
```

**Verification:** Run existing tests: `bun test components/BottomNavMobile.test.tsx` and `bun test components/SideNav.test.tsx` — both should pass without changes (they check for `.material-symbols-outlined` which still exists).

## Step 3: Update SideNav.test.tsx icon references

If tests assert on specific icon text content ("pets", "group_add", etc.), update assertions to match new icons ("account_balance_wallet", "person").

**File:** `apps/web/components/SideNav.test.tsx`

## Verification

```bash
bun test components/SideNav.test.tsx
bun test components/BottomNavMobile.test.tsx
# Manual: open browser, check bottom nav renders 5 items with correct icons and labels
```
