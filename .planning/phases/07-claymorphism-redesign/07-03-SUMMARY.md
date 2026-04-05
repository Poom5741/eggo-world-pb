---
phase: 07-claymorphism-redesign
plan: 07-03
title: "UI Primitives Part 1 - Core UI Components"
type: implementation
tags:
  - claymorphism
  - ui-components
  - design-system
  - frontend
dependency_graph:
  requires:
    - 07-01 (Foundation - Design Tokens)
  provides:
    - Claymorphism-styled UI components
    - Backward compatible variants
  affects:
    - All pages using Button, Card, Badge, Input, Label, Spinner
tech_stack:
  added:
    - Claymorphism shadow utilities (shadow-clay-sm through shadow-clay-2xl)
    - Claymorphism radius utilities (rounded-clay-sm through rounded-clay-full)
    - Claymorphism volume gradients (bg-clay-volume-sm through bg-clay-volume-2xl)
    - Claymorphism padding utilities (p-clay-sm through p-clay-2xl)
  patterns:
    - Variant prop pattern for backward compatibility
    - CVA (Class Variance Authority) for component variants
    - Thai comments for claymorphism features
key_files:
  created: []
  modified:
    - apps/web/components/ui/button.tsx
    - apps/web/components/ui/card.tsx
    - apps/web/components/ui/badge.tsx
    - apps/web/components/ui/input.tsx
    - apps/web/components/ui/label.tsx
    - apps/web/components/ui/spinner.tsx
    - apps/web/app/globals.css
decisions:
  - "Used variant prop pattern instead of separate components for claymorphism styles"
  - "Maintained all existing variants for backward compatibility"
  - "Added clay-specific size variants (clay-sm, clay-md, clay-lg, clay-xl) for buttons"
  - "Implemented dual-layer shadow system (outer + inner) for volume effect"
  - "Added gradient backgrounds (bg-clay-volume-*) for enhanced 3D appearance"
metrics:
  duration: "15 minutes"
  completed: "2026-04-05"
  commits: 7
  files_modified: 7
---

# Phase 07 Plan 03: UI Primitives Part 1 Summary

## One-Liner

Implemented claymorphism variants for 6 core UI components (Button, Card, Badge, Input, Label, Spinner) with full backward compatibility using variant prop pattern.

## Components Updated (6 Total)

### 1. Button Component ✅

**File:** `apps/web/components/ui/button.tsx`

**Variants Added:**

- `clay`: Primary clay button with shadow-clay-md, hover:shadow-clay-lg
- `clay-secondary`: Secondary clay button with shadow layering
- `clay-outline`: Outlined clay button with border

**Sizes Added:**

- `clay-sm`: 16px radius, h-8 (small badges, chips)
- `clay-md`: 20px radius, h-10 (standard buttons)
- `clay-lg`: 24px radius, h-12 (large CTAs)
- `clay-xl`: 32px radius, h-14 (hero buttons)

**Key Features:**

- Shadow transitions on hover/active states
- Preserves all existing variants (default, destructive, outline, secondary, ghost, link)
- Thai comments for claymorphism features

**Commit:** `ab199fa`

---

### 2. Card Component ✅

**File:** `apps/web/components/ui/card.tsx`

**Variants Added:**

- `clay`: Standard clay card with shadow-clay-lg, bg-clay-volume-md, p-clay-lg
- `clay-lg`: Large clay card with shadow-clay-xl, bg-clay-volume-lg, p-clay-xl
- `clay-xl`: Extra large clay card with shadow-clay-2xl, bg-clay-volume-2xl, p-clay-2xl

**Key Features:**

- Clay shadow layering for depth
- Gradient backgrounds for volume effect
- Increased padding for puffy appearance
- Preserves existing default card style

**Commit:** `900136d`

---

### 3. Badge Component ✅

**File:** `apps/web/components/ui/badge.tsx`

**Variants Added:**

- `clay`: Pill-shaped badge with shadow-clay-sm

**Key Features:**

- Rounded-clay-full for pill shape
- Small shadow (shadow-clay-sm) for subtle depth
- Compact padding (px-3 py-1)
- Preserves all existing variants (default, secondary, destructive, outline)

**Commit:** `5662b33`

---

### 4. Input Component ✅

**File:** `apps/web/components/ui/input.tsx`

**Variants Added:**

- `clay`: Clay-styled input with inner shadow

**Key Features:**

- Inner shadow (shadow-clay-sm) for depth
- Enhanced shadow on focus (shadow-clay-md)
- Rounded clay style (rounded-clay)
- Smooth shadow transitions
- Border color transitions (primary/20 → primary)
- Preserves existing default input style

**Commit:** `8d0a7d0`

---

### 5. Label Component ✅

**File:** `apps/web/components/ui/label.tsx`

**Variants Added:**

- `clay`: Label with bottom padding for clay input spacing

**Key Features:**

- Added pb-2 padding for clay variant
- Ensures proper spacing with clay inputs
- Preserves existing default label style

**Commit:** `394e99c`

---

### 6. Spinner Component ✅

**File:** `apps/web/components/ui/spinner.tsx`

**Variants Added:**

- `clay`: Spinner with claymorphism container

**Sizes Added:**

- `sm`: size-4 (16px)
- `md`: size-6 (24px)
- `lg`: size-8 (32px)

**Key Features:**

- Circular clay container (rounded-clay-full)
- Shadow backdrop (shadow-clay-md)
- Gradient background (bg-clay-volume-sm)
- Centered spinner icon
- Preserves existing default spinner

**Commit:** `8a5f2c7`

---

## Utility Classes Added

**File:** `apps/web/app/globals.css`

**Gradient Utilities:**

- `.bg-clay-volume-2xl`: Maximum volume gradient for hero cards

**Padding Utilities:**

- `.p-clay-2xl`: 48px padding (updated from 40px)

**Existing Utilities Used:**

- `.shadow-clay-sm` through `.shadow-clay-2xl`
- `.rounded-clay-sm` through `.rounded-clay-full`
- `.bg-clay-volume-sm` through `.bg-clay-volume-lg`
- `.p-clay-sm` through `.p-clay-xl`

**Commit:** `ee0b382`

---

## Verification Results

### Build Status ✅

```bash
bun run build
✓ Compiled successfully in 2.3s
✓ Generating static pages using 9 workers (17/17) in 223.6ms
```

### Component Rendering ✅

All components render without errors:

- [x] Button: All variants (default, destructive, outline, secondary, ghost, link, clay, clay-secondary, clay-outline)
- [x] Card: All variants (default, clay, clay-lg, clay-xl)
- [x] Badge: All variants (default, secondary, destructive, outline, clay)
- [x] Input: Both variants (default, clay)
- [x] Label: Both variants (default, clay)
- [x] Spinner: Both variants (default, clay) with all sizes

### TypeScript Types ✅

- [x] Button: VariantProps updated with new variants and sizes
- [x] Card: Variant prop type union extended
- [x] Badge: VariantProps extended with clay
- [x] Input: Variant prop type added
- [x] Label: Variant prop type added
- [x] Spinner: New SpinnerProps interface with variant and size

### Backward Compatibility ✅

- [x] All existing variants preserved
- [x] Default variants unchanged
- [x] No breaking changes to prop interfaces
- [x] Existing component usage continues to work

### Code Quality ✅

- [x] Follows existing component patterns
- [x] Uses cn() utility for class merging
- [x] Thai comments for claymorphism features
- [x] Consistent naming conventions
- [x] Linting passes (lint-staged, bun run lint)

---

## Commits Summary

| Commit    | Component | Message                                               |
| --------- | --------- | ----------------------------------------------------- |
| `ab199fa` | Button    | Add claymorphism variants to Button component         |
| `900136d` | Card      | Add claymorphism variant to Card component            |
| `5662b33` | Badge     | Add claymorphism variant to Badge component           |
| `8d0a7d0` | Input     | Add claymorphism styling to Input component           |
| `394e99c` | Label     | Update Label component for claymorphism compatibility |
| `8a5f2c7` | Spinner   | Add claymorphism container to Spinner component       |
| `ee0b382` | Globals   | Add claymorphism utility classes                      |

**Total:** 7 atomic commits

---

## Deviations from Plan

**None** - Plan executed exactly as written.

All 6 components updated with claymorphism variants while maintaining full backward compatibility.

---

## Known Stubs

**None** - All components are fully functional with no stubs.

---

## Threat Flags

**None** - No security-relevant surface introduced.

---

## Ready for Next Plan

✅ **Phase 07 Plan 04: UI Primitives Part 2** can proceed.

**Remaining Components to Redesign:**

- Avatar
- Checkbox
- Radio
- Switch
- Select
- Dialog
- Toast/Notification
- Progress bars
- Tabs
- Accordion

**Foundation Ready:**

- Design tokens in globals.css ✅
- Core components updated ✅
- Build system validated ✅
- Backward compatibility maintained ✅

---

**Self-Check: PASSED**

- [x] All 6 components modified and committed
- [x] 7 commits created with proper messages
- [x] Build passes without errors
- [x] TypeScript types updated
- [x] Linting passes
- [x] Backward compatibility maintained
- [x] SUMMARY.md created
