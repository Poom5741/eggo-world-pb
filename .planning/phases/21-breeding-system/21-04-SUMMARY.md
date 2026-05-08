---
phase: "21"
plan: "04"
subsystem: "breeding"
tags: ["egg-display", "lineage", "ui", "breeding-badge"]
dependencies:
  requires: ["21-03"]
  provides: ["21-05", "21-06"]
  affects: ["egg-card", "egg-data"]
tech-stack:
  added: ["BreedingEggTooltip", "BreedingBadge"]
  patterns: ["conditional rendering", "badge pattern", "lineage display"]
key-files:
  created:
    - apps/web/components/eggs/BreedingEggTooltip.tsx
  modified:
    - apps/web/hooks/use-egg-poll.ts
    - apps/web/components/eggs/egg-card.tsx
decisions:
  - "Breeding eggs displayed in /eggs page with special badge"
  - "Parent info shows animal IDs with pet icons"
  - "Generation badge shows breeding generation (1+)"
  - "Tooltip pattern for detailed lineage info"
metrics:
  duration: "30m"
  completed-date: "2026-04-22"
  tasks-completed: 4
  files-created: 1
  files-modified: 2
---

# Phase 21 Plan 04: Breeding Egg Display Summary

## Overview

Extended egg display system to show breeding-specific information including lineage, generation, and parent details for eggs created through breeding.

## What Was Built

### 1. Extended EggData Interface

- **File**: `apps/web/hooks/use-egg-poll.ts`
- Added `is_breeding_egg?: boolean` - identifies breeding eggs
- Added `parent1_animal_id?: number | null` - first parent
- Added `parent2_animal_id?: number | null` - second parent
- Added `generation?: number` - breeding generation (1+)

### 2. BreedingEggTooltip Component

- **File**: `apps/web/components/eggs/BreedingEggTooltip.tsx`
- Full lineage display with header and icons
- Generation info with monospace font
- Parent info showing animal IDs with pet icons
- Three size variants: sm, md, lg
- Responsive styling with claymorphism theme

### 3. BreedingBadge Component

- **File**: `apps/web/components/eggs/BreedingEggTooltip.tsx` (exported)
- Compact inline display for egg cards
- Shows generation and parent IDs
- Uses tertiary color scheme (purple)
- Favorite icon for visual distinction

### 4. EggCard Updates

- **File**: `apps/web/components/eggs/egg-card.tsx`
- Added breeding badge overlay on egg image
- Shows "Breeding Egg" label with favorite icon
- Displays generation in egg info section
- Integrated BreedingBadge component

## Breeding Egg Fields

| Field               | Type    | Description                                                       |
| ------------------- | ------- | ----------------------------------------------------------------- |
| `is_breeding_egg`   | boolean | True if created through breeding                                  |
| `parent1_animal_id` | number  | First parent animal ID                                            |
| `parent2_animal_id` | number  | Second parent animal ID                                           |
| `generation`        | number  | Breeding generation (1 for first bred, 2+ for multi-generational) |

## UI Patterns

### Badge Pattern

```tsx
{
  egg.is_breeding_egg && (
    <Badge className="bg-tertiary-container">
      <span>favorite</span>
      Breeding Egg
    </Badge>
  )
}
```

### Lineage Display

```tsx
<BreedingBadge egg={egg} />
// Shows: "Gen 1 (#123 × #456)"
```

### Tooltip Pattern

```tsx
<BreedingEggTooltip egg={egg} size="md" />
// Shows full lineage with header, generation, parents
```

## Visual Design

- **Badge**: Tertiary container color (purple), favorite icon
- **Tooltip**: Tertiary container with 50% opacity, rounded corners
- **Parent IDs**: Monospace font with pet icons
- **Generation**: Bold monospace with tertiary color

## Integration Points

- EggCard conditionally renders breeding badge
- BreedingBadge used for compact inline display
- BreedingEggTooltip available for detailed views
- All components use claymorphism design system

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `b34c2c5`: feat(21-04): breeding egg display

## Self-Check: PASSED

- [x] EggData interface extended with breeding fields
- [x] BreedingEggTooltip component created
- [x] BreedingBadge component exported
- [x] EggCard shows breeding badge
- [x] Build passes successfully
- [x] All files committed
