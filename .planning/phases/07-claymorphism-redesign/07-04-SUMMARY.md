---
phase: 07
plan: 04
title: "UI Primitives Part 2 - Claymorphism Redesign"
type: implementation
tags:
  - claymorphism
  - ui-components
  - design-system
  - frontend
dependency_graph:
  requires:
    - 07-02 (UI Primitives Part 1 - Foundation)
    - 07-03 (Design Tokens)
  provides:
    - Clay-styled UI primitives (Avatar, Checkbox, Radio, Switch, Select, Dialog)
  affects:
    - All pages using these components
tech_stack:
  added:
    - Claymorphism variants for 6 UI components
    - TypeScript interfaces for variant props
patterns:
  - Hybrid approach (default + clay variants)
  - Consistent variant prop pattern
  - Thai code comments
key_files:
  created: []
  modified:
    - apps/web/components/ui/avatar.tsx
    - apps/web/components/ui/checkbox.tsx
    - apps/web/components/ui/radio-group.tsx
    - apps/web/components/ui/switch.tsx
    - apps/web/components/ui/select.tsx
    - apps/web/components/ui/dialog.tsx
decisions:
  - "Maintained backward compatibility by using variant prop pattern"
  - "Used consistent clay shadow sizes (sm, md, lg, xl) matching component sizes"
  - "Applied rounded-clay-* utilities for consistent corner radius"
  - "Added border-primary/20 for subtle depth enhancement"
metrics:
  duration_minutes: 45
  completed: "2026-04-05"
  components_updated: 6
  commits: 6
---

# Phase 07 Plan 04: UI Primitives Part 2 - Claymorphism Redesign Summary

## One-liner

Implemented claymorphism variants for 6 UI primitives (Avatar, Checkbox, Radio Group, Switch, Select, Dialog) with full backward compatibility using hybrid variant prop pattern.

## Components Updated (6 Total)

### 1. Avatar Component

**File:** `apps/web/components/ui/avatar.tsx`
**Changes:**

- Added `variant` prop: `'default' | 'clay'`
- Added `size` prop: `'sm' | 'md' | 'lg' | 'xl'`
- Clay variant: `rounded-clay-full shadow-clay-md border-2 border-primary/20`
- Size-based shadow scaling (sm → xl)

**Commit:** `f3788df`

### 2. Checkbox Component

**File:** `apps/web/components/ui/checkbox.tsx`
**Changes:**

- Added `variant` prop: `'default' | 'clay'`
- Clay variant: `rounded-clay-sm shadow-clay-sm`
- Enhanced checked state: `data-[state=checked]:shadow-clay-md`
- Border color: `border-primary/20`

**Commit:** `10e8d47`

### 3. Radio Group Component

**File:** `apps/web/components/ui/radio-group.tsx`
**Changes:**

- Added `variant` prop: `'default' | 'clay'`
- Circular clay buttons with `rounded-full`
- Default shadow: `shadow-clay-sm`
- Selected state: `data-[state=checked]:shadow-clay-md`
- Selected background: `data-[state=checked]:bg-primary/10`

**Commit:** `d94fd36`

### 4. Switch Component

**File:** `apps/web/components/ui/switch.tsx`
**Changes:**

- Added `variant` prop: `'default' | 'clay'`
- Pill-shaped track with `shadow-clay-sm`
- Thumb with `shadow-clay-sm`
- Checked state: `data-[state=checked]:shadow-clay-md`
- Smooth transitions: `transition-all`

**Commit:** `39217f4`

### 5. Select Component

**File:** `apps/web/components/ui/select.tsx`
**Changes:**

- Added `variant` prop to `SelectTrigger`, `SelectContent`, `SelectItem`
- Trigger: `rounded-clay shadow-clay-sm focus:shadow-clay-md`
- Content: `rounded-clay-md shadow-clay-lg border-primary/10`
- Items: `rounded-clay-sm hover:shadow-clay-sm`
- Focus state: `focus:bg-primary/10 focus:text-primary`

**Commit:** `4f07570`

### 6. Dialog Component

**File:** `apps/web/components/ui/dialog.tsx`
**Changes:**

- Added `variant` prop to all Dialog components
- Overlay: `bg-black/60 backdrop-blur-sm` (clay variant)
- Content: `rounded-clay-xl shadow-clay-xl bg-clay-volume-lg border-primary/10`
- Header: `pb-4 border-b border-primary/10` (clay variant)
- Footer: `pt-4 border-t border-primary/10` (clay variant)
- Title: `text-xl font-bold text-primary` (clay variant)
- Close button: Enhanced focus ring with primary color

**Commit:** `acf74e8`

## Files Modified

| File              | Lines Added | Lines Removed | Description                        |
| ----------------- | ----------- | ------------- | ---------------------------------- |
| `avatar.tsx`      | 21          | 2             | Added variant + size props         |
| `checkbox.tsx`    | 9           | 2             | Added variant prop                 |
| `radio-group.tsx` | 9           | 2             | Added variant prop                 |
| `switch.tsx`      | 14          | 5             | Added variant prop + thumb styling |
| `select.tsx`      | 29          | 8             | Added variant to 3 sub-components  |
| `dialog.tsx`      | 66          | 15            | Added variant to 6 sub-components  |

## Verification Results

### Build Status

✅ **PASSED** - Build completed successfully

```
✓ Compiled successfully in 2.5s
✓ Generating static pages using 9 workers (17/17) in 239.3ms
```

### Linting

✅ **PASSED** - No errors introduced

### Commits

All 6 atomic commits created successfully:

1. `f3788df` - Avatar component
2. `10e8d47` - Checkbox component
3. `d94fd36` - Radio Group component
4. `39217f4` - Switch component
5. `4f07570` - Select component
6. `acf74e8` - Dialog component

### Backward Compatibility

✅ **VERIFIED** - All existing variants preserved

- Default variants unchanged
- No breaking changes to existing APIs
- Variant props are optional with `'default'` as fallback

### Type Safety

✅ **VERIFIED** - TypeScript types updated

- Interfaces extended for all components
- Proper variant union types
- No type errors

## Design Patterns Applied

### 1. Hybrid Approach

```typescript
variant === "default" && "...default styles..."
variant === "clay" && "...clay styles..."
```

### 2. Consistent Variant Props

All components use the same pattern:

```typescript
interface ComponentProps {
  variant?: "default" | "clay"
}
```

### 3. Shadow Scaling

Component sizes map to appropriate clay shadows:

- Small → `shadow-clay-sm`
- Medium → `shadow-clay-md`
- Large → `shadow-clay-lg`
- Extra Large → `shadow-clay-xl`

### 4. Border Enhancement

Subtle borders for depth:

- `border-primary/20` for main elements
- `border-primary/10` for secondary elements

## Thai Comments

All claymorphism-specific code includes Thai comments:

- `// เพิ่ม clay variant พร้อม circular shadow`
- `// เพิ่ม inner shadow สำหรับ depth`
- `// เพิ่ม enhanced shadow on checked state`

## Ready for Next Plan (07-05: NFT Cards)

All UI primitives are now clay-ready. The foundation is complete for:

- NFT Card components with claymorphism
- Egg cards, Food cards, Animal cards
- Marketplace cards
- Dashboard widgets

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- ✅ All 6 components updated
- ✅ All commits created
- ✅ Build passes
- ✅ Linting passes
- ✅ Backward compatibility maintained
- ✅ Type safety preserved
- ✅ Summary created
