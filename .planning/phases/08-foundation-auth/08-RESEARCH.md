# Phase 8 Research: Material Symbols & Navigation

**Date:** 2026-04-05  
**Researcher:** sonnet  
**Topics:** Material Symbols integration, Responsive navigation breakpoints

---

## 1. Material Symbols Integration for Next.js 16

### Recommended Approach: Google CDN (Not Self-Hosted)

**Why CDN:**

- Google's CDN is highly optimized with global edge caching
- Automatic font subsetting reduces payload (~40KB vs ~300KB self-hosted)
- No build pipeline complexity
- Jules design already uses this pattern successfully

**Implementation Pattern (from Jules design):**

```tsx
// In apps/web/app/layout.tsx <head>
<head>
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    rel="stylesheet"
  />
</head>
```

**CSS Setup (add to apps/web/app/globals.css):**

```css
/* Material Symbols icon font */
.material-symbols-outlined {
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
  font-size: 24px; /* Adjust as needed */
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}

/* Filled variant */
.material-symbols-filled {
  font-variation-settings:
    "FILL" 1,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
```

**Usage in Components:**

```tsx
// Icon usage
<span className="material-symbols-outlined text-4xl text-primary">egg</span>

// With filled variant
<span
  className="material-symbols-outlined text-4xl"
  style={{fontVariationSettings: "'FILL' 1"}}
>
  restaurant
</span>
```

### Accessibility Comparison: Material Symbols vs Lucide

| Aspect            | Material Symbols                            | Lucide Icons               |
| ----------------- | ------------------------------------------- | -------------------------- |
| **SVG vs Font**   | Font ligatures                              | SVG elements               |
| **Screen Reader** | Needs `aria-hidden="true"` + separate label | Built-in `<title>` support |
| **Color Control** | CSS `color` property                        | CSS `fill`/`stroke`        |
| **Size Control**  | `font-size`                                 | `width`/`height`           |
| **Bundle Size**   | ~40KB (CDN, not in bundle)                  | ~8KB per icon tree-shaken  |
| **Customization** | Limited to font-variation-settings          | Full SVG manipulation      |

**Accessibility Pattern:**

```tsx
// Bad - no accessibility
<span className="material-symbols-outlined">settings</span>

// Good - accessible
<span
  className="material-symbols-outlined"
  aria-hidden="true"
>
  settings
</span>
<span className="sr-only">Settings</span>

// Or with tooltip
<button
  aria-label="Settings"
  className="p-2 rounded-full hover:bg-surface-container"
>
  <span className="material-symbols-outlined">settings</span>
</button>
```

**Conclusion:** Material Symbols via CDN is the right choice for this project. Jules design already uses it successfully. Add accessibility attributes during implementation.

---

## 2. Navigation Responsive Breakpoints

### Jules Design Breakpoint Analysis

From `LayoutWrapper.tsx`, `SideNav.tsx`, and `BottomNavMobile.tsx`:

```tsx
// LayoutWrapper.tsx structure
<div className="flex flex-1 pt-20">
  <SideNav />  {/* Desktop only */}
  <main className="flex-1 lg:ml-4 p-4 lg:p-8 pb-32 lg:pb-8">
    {children}
  </main>
</div>
<BottomNavMobile />  {/* Mobile only */}
```

**Breakpoint Logic:**

| Viewport           | TopNav     | SideNav    | BottomNav  | Main Layout                      |
| ------------------ | ---------- | ---------- | ---------- | -------------------------------- |
| < 768px (mobile)   | ✅ Visible | ❌ Hidden  | ✅ Visible | `pb-32` (bottom padding for nav) |
| ≥ 768px (tablet)   | ✅ Visible | ❌ Hidden  | ✅ Visible | `pb-32`                          |
| ≥ 1024px (desktop) | ✅ Visible | ✅ Visible | ❌ Hidden  | `lg:pb-8` + `lg:ml-4`            |

**Key Tailwind Classes:**

```tsx
// SideNav.tsx pattern
<nav className="hidden lg:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64">
  {/* Desktop side navigation */}
</nav>

// BottomNavMobile.tsx pattern
<nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20">
  {/* Mobile bottom navigation */}
</nav>
```

**Why 1024px (lg) for SideNav?**

- SideNav is 256px (w-64) wide — significant screen real estate
- Below 1024px, content area becomes cramped with sidebar
- 768px-1023px is "tablet portrait" — better without sidebar
- Matches Tailwind's `lg` breakpoint (1024px)

**BottomNav Visibility:**

- Visible on mobile (< 1024px via `lg:hidden`)
- Hidden on desktop (≥ 1024px)
- Height: 80px (h-20)
- Uses safe-area-inset-bottom for iOS notch support

### Recommended Breakpoint Strategy

**Adopt Jules breakpoints exactly:**

```css
/* Mobile-first approach */
/* Default: Mobile styles (< 768px) */
/* md: Tablet (768px - 1023px) */
/* lg: Desktop (≥ 1024px) */
```

**Navigation visibility:**

```tsx
// TopNav: Always visible (no breakpoint classes)
<nav className="fixed top-0 w-full z-50">

// SideNav: Desktop only (≥ 1024px)
<nav className="hidden lg:block">

// BottomNav: Mobile/Tablet only (< 1024px)
<nav className="lg:hidden">
```

**Main content padding adjustment:**

```tsx
<main className="
  pt-20           {/* TopNav height */}
  pb-32           {/* BottomNav space on mobile */}
  lg:pb-8         {/* No bottom nav on desktop */}
  lg:ml-4         {/* SideNav spacing on desktop */}
">
```

---

## 3. Integration with Existing Codebase

### Font Migration Strategy

**Current (apps/web/app/layout.tsx):**

```tsx
import { Press_Start_2P, Geist } from "next/font/google"
```

**Target (hybrid approach per Decision D-01):**

```tsx
import {
  Press_Start_2P,
  Geist,
  Space_Grotesk,
  Plus_Jakarta_Sans,
  Silkscreen,
} from "next/font/google"

// Keep Press_Start_2P for pixel text
// Keep Geist for body text
// Add Space_Grotesk for headlines (Jules design)
// Add Plus_Jakarta_Sans for body (Jules design)
// Add Silkscreen for special UI (Jules design)
```

**Preserve existing:**

- Vercel Analytics
- Metadata structure
- HTML structure

**Add from Jules:**

- Material Symbols CDN link
- Additional fonts (space-grotesk, plus-jakarta-sans, silkscreen)
- Design token CSS variables

### globals.css Merge Strategy

**Current apps/web/app/globals.css:**

- Already has claymorphism tokens ✓
- Already has Material Symbols CSS ✓
- Already has design tokens ✓

**Action needed:**

- Merge Jules' color palette into existing tokens
- Add missing claymorphism utility classes
- Verify all Material Symbols variations are covered

---

## 4. Common Pitfalls to Avoid

### Material Symbols Pitfalls

**❌ Don't:**

```tsx
// Wrong - missing accessibility
<span className="material-symbols-outlined">home</span>

// Wrong - inline styles for everything
<span style={{fontSize: '24px', color: 'blue'}}>home</span>

// Wrong - using as button without aria-label
<button><span className="material-symbols-outlined">settings</span></button>
```

**✅ Do:**

```tsx
// Good - with accessibility
<span className="material-symbols-outlined" aria-hidden="true">home</span>
<span className="sr-only">Home</span>

// Good - using Tailwind classes
<span className="material-symbols-outlined text-2xl text-primary">home</span>

// Good - button with aria-label
<button aria-label="Settings">
  <span className="material-symbols-outlined">settings</span>
</button>
```

### Navigation Pitfalls

**❌ Don't:**

```tsx
// Wrong - hardcoded z-index conflicts
<nav className="fixed top-0 z-10">  {/* Might be below modals */}

// Wrong - missing safe area for iOS
<nav className="fixed bottom-0 h-20">  {/* Overlaps notch */}

// Wrong - no pt-20 for TopNav height
<main className="pt-0">  {/* Content hidden behind TopNav */}
```

**✅ Do:**

```tsx
// Good - consistent z-index
<nav className="fixed top-0 z-50">

// Good - iOS safe area
<nav className="fixed bottom-0 h-20 pb-safe">

// Good - TopNav offset
<main className="pt-20">  {/* Matches TopNav h-20 */}
```

---

## 5. Testing Strategy (TDD)

### Test File Locations (per Decision D-05)

```
apps/web/
├── app/
│   ├── page.test.tsx              # Landing page tests
│   ├── join/
│   │   └── page.test.tsx          # Join page tests
│   └── auth/
│       └── callback/
│           └── page.test.tsx      # Auth callback tests
└── components/
    ├── LayoutWrapper.test.tsx     # Layout structure tests
    ├── TopNav.test.tsx            # Navigation tests
    ├── SideNav.test.tsx           # Navigation tests
    └── BottomNavMobile.test.tsx   # Navigation tests
```

### Test Pattern (colocated, Bun test)

```tsx
// components/TopNav.test.tsx
import { describe, it, expect } from "bun:test"
import { render, screen } from "@testing-library/react"
import TopNav from "./TopNav"

describe("TopNav", () => {
  it("renders EggoWorld logo", () => {
    render(<TopNav />)
    expect(screen.getByText("EggoWorld")).toBeInTheDocument()
  })

  it("displays navigation links", () => {
    render(<TopNav />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Marketplace")).toBeInTheDocument()
  })
})
```

---

## 6. Implementation Order

Based on dependency analysis:

**Wave 1 (Foundation):**

1. Update layout.tsx with Material Symbols + fonts
2. Update globals.css with Jules design tokens
3. Create LayoutWrapper component

**Wave 2 (Navigation):** 4. Create TopNav component 5. Create SideNav component  
6. Create BottomNavMobile component

**Wave 3 (Pages):** 7. Create landing page (page.tsx) 8. Create join page (/join/page.tsx) 9. Update auth callback handler

**Wave 4 (Verification):** 10. E2E test: Landing → Join → OAuth → Dashboard

---

## References

- **Jules Design Source:** `resources/eggo-world-uxui-jules/src/`
- **Material Symbols Docs:** https://fonts.google.com/icons
- **Tailwind Breakpoints:** https://tailwindcss.com/docs/responsive-design
- **Existing Tests:** `apps/web/app/**/*.test.tsx`

---

**Research Complete:** 2026-04-05  
**Next:** Planner creates task breakdown based on these findings
