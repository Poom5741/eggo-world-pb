# Plan: iOS Zoom Fix & Global Responsive Polish

**Requires:** QUAL-05, QUAL-06
**Risk:** Low
**Estimate:** 10 min

## Step 1: iOS Input Zoom Prevention

Add rule to `apps/web/app/globals.css` (end of file, line 782+):

```css
@screen md {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
}
```

**Why:** iOS Safari zooms into inputs when font-size < 16px. This affects all form fields site-wide.

**Alternative (if Tailwind 4 `@screen` not available):**

```css
@media screen and (max-width: 768px) {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
}
```

## Step 2: Responsive Check — LayoutWithoutNav Padding

`LayoutWithoutNav.tsx` uses `pb-32` for bottom padding on mobile to clear the bottom nav. Verify this is sufficient:

- BottomNavMobile is `h-24` (96px) + `pb-[env(safe-area-inset-bottom)]`
- `pb-32` = 128px — should clear fine, but test at 320px width to confirm no content is hidden behind the nav

**If content still hidden:** Change `pb-32` to `pb-36` or use `min-h-[calc(100vh-7rem)]` on `<main>`.

## Step 3: Touch Target Audit (WCAG 2.2 2.5.8)

Search for all interactive elements in `Components/` and verify 44×44px minimum:

| Component           | Element      | Current Size           | Status                |
| ------------------- | ------------ | ---------------------- | --------------------- |
| BottomNavMobile.tsx | Nav links    | `py-2` (~8px padding)  | **Fixed in PLAN-NAV** |
| SideNav.tsx         | Nav links    | `py-3` (~12px padding) | Needs check           |
| TopNav.tsx          | Icon buttons | `p-2` (~8px padding)   | Needs check           |

**Fix SideNav links** if needed: Add `min-h-[44px]` to the `<a>` elements rendered by `AuthLink`.

**Fix TopNav icon buttons** if needed: Change `p-2` to `p-3 min-w-[44px] min-h-[44px]`.

## Step 4: Horizontal Scroll Check at 320px

For each page wrapped in `LayoutWithoutNav`, verify content at 320px width:

- `apps/web/app/dashboard/page.tsx` (primary)
- `apps/web/app/eggs/page.tsx`
- `apps/web/app/marketplace/page.tsx`
- `apps/web/app/wallet/page.tsx` (post-migration)
- `apps/web/app/eggs/[id]/hatch/page.tsx` (post-migration)
- `apps/web/app/dashboard/commissions/page.tsx` (post-migration)

**Common causes of horizontal scroll:**

- `grid-cols-4` without `md:grid-cols-2 sm:grid-cols-1` fallback
- Fixed-width containers (`w-72`, `w-96`)
- `px-4` on outer elements is fine (gives 16px gutter)

## Step 5: 5-Breakpoint Test Checklist

| Breakpoint | Width  | Test                                                          |
| ---------- | ------ | ------------------------------------------------------------- |
| Mobile S   | 320px  | Bottom nav visible, no horizontal scroll, touch targets ≥44px |
| Mobile M   | 375px  | iPhone SE size, same checks                                   |
| Tablet     | 768px  | iPad portrait, bottom nav hidden? (lg: breakpoint check)      |
| Desktop S  | 1024px | SideNav visible, bottom nav hidden                            |
| Desktop L  | 1440px | Full layout, no stretching issues                             |

**Note:** `BottomNavMobile` uses `lg:hidden` — on ≥1024px it hides and `SideNav` shows. Confirm this works at 768px (tablet shows bottom nav, which is correct for mobile-first).

## Verification

```bash
# Open browser DevTools, test at 320px, 375px, 768px, 1024px, 1440px
# Check: input fields don't zoom on iOS (touch simulation)
# Check: no horizontal scrollbar at any breakpoint
```
