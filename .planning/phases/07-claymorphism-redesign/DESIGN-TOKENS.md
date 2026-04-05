# Claymorphism Design Tokens Specification

**Project:** EggoWorld NFT Marketplace
**Version:** 1.0.0
**Created:** 2026-04-05
**Target Files:** `apps/web/app/globals.css`, `apps/web/components/ui/*`

---

## Table of Contents

1. [Overview](#overview)
2. [Shadow System](#shadow-system)
3. [Border Radius Scale](#border-radius-scale)
4. [Color Palette Extensions](#color-palette-extensions)
5. [Spacing for Depth](#spacing-for-depth)
6. [Tailwind Integration Plan](#tailwind-integration-plan)
7. [Implementation Examples](#implementation-examples)
8. [Migration Strategy](#migration-strategy)

---

## Overview

This document defines the complete design token system for implementing **claymorphism** in the EggoWorld project. Claymorphism is a 3D design style that combines neumorphism's soft shadows with skeuomorphism's depth, creating elements that appear to float above the surface with rounded, clay-like appearance.

### Current State

- **Current radius:** `0px` (pixel art aesthetic)
- **Current shadows:** Minimal, border-focused
- **Current colors:** Dark navy theme with yellow accents

### Target State

- **Claymorphism radius:** `16px` to `40px` scale
- **Claymorphism shadows:** Dual-layer (outer + inner shadows)
- **Extended colors:** Pastel variants for highlights and depth

---

## Shadow System

The claymorphism shadow system uses **dual-layer shadows**: outer shadows for elevation and inner shadows for volume/depth.

### CSS Variable Definitions

Add these to `apps/web/app/globals.css` in both `:root` and `.dark` selectors:

```css
/* ============================================
   CLAYMORPHISM SHADOW TOKENS
   Format: --clay-{size}-outer and --clay-{size}-inner
   ============================================ */

/* CLAY-SM: Small elements (badges, chips, tags) */
--clay-sm-outer: 2px 2px 4px rgba(0, 0, 0, 0.15), -2px -2px 4px rgba(255, 255, 255, 0.05);
--clay-sm-inner:
  inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.05);
--clay-sm: var(--clay-sm-outer), var(--clay-sm-inner);

/* CLAY-MD: Buttons, standard cards, input fields */
--clay-md-outer: 4px 4px 8px rgba(0, 0, 0, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.08);
--clay-md-inner:
  inset 2px 2px 4px rgba(0, 0, 0, 0.12), inset -2px -2px 4px rgba(255, 255, 255, 0.08);
--clay-md: var(--clay-md-outer), var(--clay-md-inner);

/* CLAY-LG: Large cards, modals, dropdowns */
--clay-lg-outer: 6px 6px 12px rgba(0, 0, 0, 0.25), -6px -6px 12px rgba(255, 255, 255, 0.1);
--clay-lg-inner:
  inset 3px 3px 6px rgba(0, 0, 0, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.1);
--clay-lg: var(--clay-lg-outer), var(--clay-lg-inner);

/* CLAY-XL: Hero sections, featured NFTs, modals */
--clay-xl-outer: 8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.12);
--clay-xl-inner:
  inset 4px 4px 8px rgba(0, 0, 0, 0.18), inset -4px -4px 8px rgba(255, 255, 255, 0.12);
--clay-xl: var(--clay-xl-outer), var(--clay-xl-inner);

/* CLAY-2XL: Maximum depth, floating elements, hero cards */
--clay-2xl-outer: 12px 12px 24px rgba(0, 0, 0, 0.35), -12px -12px 24px rgba(255, 255, 255, 0.15);
--clay-2xl-inner:
  inset 6px 6px 12px rgba(0, 0, 0, 0.2), inset -6px -6px 12px rgba(255, 255, 255, 0.15);
--clay-2xl: var(--clay-2xl-outer), var(--clay-2xl-inner);
```

### Dark Mode Shadow Variants

For `.dark` selector in `globals.css`:

```css
/* DARK MODE CLAYMORPHISM SHADOWS */
/* Dark mode requires adjusted opacity for visibility on dark backgrounds */

--clay-sm-outer: 3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.03);
--clay-sm-inner:
  inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.03);
--clay-sm: var(--clay-sm-outer), var(--clay-sm-inner);

--clay-md-outer: 5px 5px 10px rgba(0, 0, 0, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.05);
--clay-md-inner:
  inset 3px 3px 6px rgba(0, 0, 0, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.05);
--clay-md: var(--clay-md-outer), var(--clay-md-inner);

--clay-lg-outer: 8px 8px 16px rgba(0, 0, 0, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.08);
--clay-lg-inner:
  inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.08);
--clay-lg: var(--clay-lg-outer), var(--clay-lg-inner);

--clay-xl-outer: 10px 10px 20px rgba(0, 0, 0, 0.7), -10px -10px 20px rgba(255, 255, 255, 0.1);
--clay-xl-inner:
  inset 5px 5px 10px rgba(0, 0, 0, 0.6), inset -5px -5px 10px rgba(255, 255, 255, 0.1);
--clay-xl: var(--clay-xl-outer), var(--clay-xl-inner);

--clay-2xl-outer: 14px 14px 28px rgba(0, 0, 0, 0.8), -14px -14px 28px rgba(255, 255, 255, 0.12);
--clay-2xl-inner:
  inset 7px 7px 14px rgba(0, 0, 0, 0.7), inset -7px -7px 14px rgba(255, 255, 255, 0.12);
--clay-2xl: var(--clay-2xl-outer), var(--clay-2xl-inner);
```

### Tailwind Config Format

Add to the `@theme inline` block in `globals.css`:

```css
@theme inline {
  /* ... existing theme ... */

  /* Claymorphism Shadow Extensions */
  --shadow-clay-sm: var(--clay-sm);
  --shadow-clay-md: var(--clay-md);
  --shadow-clay-lg: var(--clay-lg);
  --shadow-clay-xl: var(--clay-xl);
  --shadow-clay-2xl: var(--clay-2xl);

  /* Individual shadow components for layering */
  --shadow-clay-sm-outer: var(--clay-sm-outer);
  --shadow-clay-sm-inner: var(--clay-sm-inner);
  --shadow-clay-md-outer: var(--clay-md-outer);
  --shadow-clay-md-inner: var(--clay-md-inner);
  --shadow-clay-lg-outer: var(--clay-lg-outer);
  --shadow-clay-lg-inner: var(--clay-lg-inner);
  --shadow-clay-xl-outer: var(--clay-xl-outer);
  --shadow-clay-xl-inner: var(--clay-xl-inner);
  --shadow-clay-2xl-outer: var(--clay-2xl-outer);
  --shadow-clay-2xl-inner: var(--clay-2xl-inner);
}
```

### Usage Guide

| Token      | Element Size     | When to Use                                          |
| ---------- | ---------------- | ---------------------------------------------------- |
| `clay-sm`  | < 48px height    | Badges, chips, tags, small icons, toggle switches    |
| `clay-md`  | 48-64px height   | Buttons, input fields, standard cards, avatars       |
| `clay-lg`  | 64-128px height  | Large cards, dropdown menus, dialog content          |
| `clay-xl`  | 128-256px height | Hero sections, featured NFT cards, modal dialogs     |
| `clay-2xl` | > 256px height   | Floating action buttons, hero images, showcase cards |

---

## Border Radius Scale

Claymorphism requires generous border radius values to create the soft, rounded clay-like appearance.

### CSS Variable Definitions

Add to `apps/web/app/globals.css` in both `:root` and `.dark` selectors:

```css
/* ============================================
   CLAYMORPHISM BORDER RADIUS TOKENS
   Replaces current --radius: 0px system
   ============================================ */

/* CLAY-ROUNDED-SM: 16px - Small elements */
--clay-rounded-sm: 16px;

/* CLAY-ROUNDED: 20px - Standard elements */
--clay-rounded: 20px;

/* CLAY-ROUNDED-MD: 24px - Cards and panels */
--clay-rounded-md: 24px;

/* CLAY-ROUNDED-LG: 32px - Featured elements */
--clay-rounded-lg: 32px;

/* CLAY-ROUNDED-XL: 40px - Hero sections */
--clay-rounded-xl: 40px;

/* CLAY-ROUNDED-FULL: 9999px - Pills and circles */
--clay-rounded-full: 9999px;
```

### Tailwind Config Extension

Add to the `@theme inline` block in `globals.css`:

```css
@theme inline {
  /* ... existing theme ... */

  /* Claymorphism Border Radius */
  --radius-clay-sm: var(--clay-rounded-sm);
  --radius-clay: var(--clay-rounded);
  --radius-clay-md: var(--clay-rounded-md);
  --radius-clay-lg: var(--clay-rounded-lg);
  --radius-clay-xl: var(--clay-rounded-xl);
  --radius-clay-full: var(--clay-rounded-full);
}
```

### When to Use Each Value

| Token               | Value  | Element Type                        | Size Context          |
| ------------------- | ------ | ----------------------------------- | --------------------- |
| `clay-rounded-sm`   | 16px   | Badges, chips, small buttons, icons | Elements < 40px       |
| `clay-rounded`      | 20px   | Standard buttons, inputs, tags      | Elements 40-60px      |
| `clay-rounded-md`   | 24px   | Cards, panels, dialogs              | Elements 60-120px     |
| `clay-rounded-lg`   | 32px   | Featured cards, NFT displays        | Elements 120-200px    |
| `clay-rounded-xl`   | 40px   | Hero sections, modals               | Elements > 200px      |
| `clay-rounded-full` | 9999px | Pills, circles, avatars             | Any size (full round) |

### Relationship to Element Size

```
Element Height    →    Recommended Radius
─────────────────────────────────────────
< 32px            →    clay-rounded-sm (16px)
32-48px           →    clay-rounded (20px)
48-80px           →    clay-rounded-md (24px)
80-160px          →    clay-rounded-lg (32px)
> 160px           →    clay-rounded-xl (40px)
Pills/Circles     →    clay-rounded-full (9999px)
```

### Migration from Current 0px System

Current usage in `globals.css`:

```css
--radius: 0px;
--radius-sm: calc(var(--radius) - 4px); /* -4px */
--radius-md: calc(var(--radius) - 2px); /* -2px */
--radius-lg: var(--radius); /* 0px */
--radius-xl: calc(var(--radius) + 4px); /* 4px */
```

Replace with claymorphism-compatible values:

```css
--radius: var(--clay-rounded); /* 20px base */
--radius-sm: var(--clay-rounded-sm); /* 16px */
--radius-md: var(--clay-rounded); /* 20px */
--radius-lg: var(--clay-rounded-md); /* 24px */
--radius-xl: var(--clay-rounded-lg); /* 32px */
```

---

## Color Palette Extensions

Claymorphism requires extended color palettes with lighter tints for highlights and darker shades for depth simulation.

### Current EggoWorld Colors

```css
/* Existing colors from globals.css */
--background: #1a1a2e; /* Navy dark */
--foreground: #fef9c3; /* Pale yellow */
--card: #16213e; /* Dark blue card */
--primary: #facc15; /* Bright yellow */
--secondary: #0f3460; /* Deep blue */
--accent: #e94560; /* Red accent */
```

### Extended Color Palette for Claymorphism

Add to `apps/web/app/globals.css` in both `:root` and `.dark` selectors:

```css
/* ============================================
   CLAYMORPHISM COLOR EXTENSIONS
   Pastel variants for highlights and depth
   ============================================ */

/* PRIMARY YELLOW (#facc15) EXTENSIONS */
--clay-primary-50: #fefce8; /* Lightest highlight */
--clay-primary-100: #fef9c3; /* Light highlight */
--clay-primary-200: #fde047; /* Soft yellow */
--clay-primary-300: #facc15; /* Base primary */
--clay-primary-400: #eab308; /* Dark yellow */
--clay-primary-highlight: rgba(254, 249, 195, 0.3); /* Inner shadow highlight */
--clay-primary-shadow: rgba(234, 179, 8, 0.4); /* Inner shadow depth */

/* SECONDARY BLUE (#0f3460) EXTENSIONS */
--clay-secondary-50: #e0e7ff; /* Lightest highlight */
--clay-secondary-100: #c7d2fe; /* Light highlight */
--clay-secondary-200: #a5b4fc; /* Soft blue */
--clay-secondary-300: #0f3460; /* Base secondary */
--clay-secondary-400: #1e293b; /* Dark blue */
--clay-secondary-highlight: rgba(199, 210, 254, 0.2); /* Inner shadow highlight */
--clay-secondary-shadow: rgba(30, 41, 59, 0.5); /* Inner shadow depth */

/* CARD BLUE (#16213e) EXTENSIONS */
--clay-card-50: #1e293b; /* Lighter card surface */
--clay-card-100: #16213e; /* Base card */
--clay-card-200: #0f3460; /* Darker card */
--clay-card-highlight: rgba(255, 255, 255, 0.08); /* Inner highlight */
--clay-card-shadow: rgba(0, 0, 0, 0.3); /* Inner depth */

/* BACKGROUND NAVY (#1a1a2e) EXTENSIONS */
--clay-bg-50: #2d2d44; /* Lighter background */
--clay-bg-100: #1a1a2e; /* Base background */
--clay-bg-200: #0f0f1a; /* Darker background */
--clay-bg-highlight: rgba(255, 255, 255, 0.05); /* Surface highlight */
--clay-bg-shadow: rgba(0, 0, 0, 0.4); /* Surface depth */

/* ACCENT RED (#e94560) EXTENSIONS */
--clay-accent-50: #ffe4e6; /* Lightest accent */
--clay-accent-100: #fecdd3; /* Light accent */
--clay-accent-200: #fb7185; /* Soft red */
--clay-accent-300: #e94560; /* Base accent */
--clay-accent-400: #be123c; /* Dark red */
--clay-accent-highlight: rgba(254, 205, 211, 0.25); /* Inner highlight */
--clay-accent-shadow: rgba(190, 18, 60, 0.4); /* Inner depth */

/* DESTRUCTIVE RED (#dc2626) EXTENSIONS */
--clay-destructive-50: #fee2e2;
--clay-destructive-100: #fecaca;
--clay-destructive-200: #f87171;
--clay-destructive-300: #dc2626;
--clay-destructive-400: #991b1b;
--clay-destructive-highlight: rgba(254, 202, 202, 0.25);
--clay-destructive-shadow: rgba(153, 27, 27, 0.4);
```

### Gradient Color Stops for Volume

Add these gradient utilities for claymorphism volume effects:

```css
/* ============================================
   CLAYMORPHISM GRADIENTS FOR VOLUME
   Use for creating 3D surface effects
   ============================================ */

/* Top-left to bottom-right light gradient */
--gradient-clay-light: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.15) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.1) 100%
);

/* Highlight overlay for raised effect */
--gradient-clay-highlight: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.2) 0%,
  transparent 40%,
  transparent 60%,
  rgba(0, 0, 0, 0.15) 100%
);

/* Subtle surface sheen */
--gradient-clay-sheen: linear-gradient(
  45deg,
  transparent 40%,
  rgba(255, 255, 255, 0.05) 50%,
  transparent 60%
);

/* Clay surface base gradient */
--gradient-clay-surface: linear-gradient(
  145deg,
  rgba(255, 255, 255, 0.08) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.12) 100%
);
```

### Tailwind Color Extensions

Add to the `@theme inline` block:

```css
@theme inline {
  /* ... existing theme ... */

  /* Claymorphism Color Extensions */
  --color-clay-primary-highlight: var(--clay-primary-highlight);
  --color-clay-primary-shadow: var(--clay-primary-shadow);
  --color-clay-secondary-highlight: var(--clay-secondary-highlight);
  --color-clay-secondary-shadow: var(--clay-secondary-shadow);
  --color-clay-card-highlight: var(--clay-card-highlight);
  --color-clay-card-shadow: var(--clay-card-shadow);
  --color-clay-bg-highlight: var(--clay-bg-highlight);
  --color-clay-bg-shadow: var(--clay-bg-shadow);
}
```

---

## Spacing for Depth

Claymorphism requires increased padding and spacing to accommodate the puffy, 3D appearance.

### CSS Variable Definitions

Add to `apps/web/app/globals.css`:

```css
/* ============================================
   CLAYMORPHISM SPACING TOKENS
   Increased padding for puffy appearance
   ============================================ */

/* Padding increases for claymorphism */
--clay-padding-sm: 0.75rem; /* 12px - Small elements */
--clay-padding-md: 1rem; /* 16px - Standard buttons */
--clay-padding-lg: 1.5rem; /* 24px - Cards */
--clay-padding-xl: 2rem; /* 32px - Large cards */
--clay-padding-2xl: 3rem; /* 48px - Hero sections */

/* Gap values for claymorphism layouts */
--clay-gap-sm: 0.5rem; /* 8px - Tight spacing */
--clay-gap-md: 1rem; /* 16px - Standard spacing */
--clay-gap-lg: 1.5rem; /* 24px - Comfortable spacing */
--clay-gap-xl: 2rem; /* 32px - Wide spacing */

/* Margin adjustments for shadow space */
--clay-margin-sm: 0.5rem; /* 8px - Small shadow clearance */
--clay-margin-md: 1rem; /* 16px - Standard clearance */
--clay-margin-lg: 1.5rem; /* 24px - Large shadow clearance */
--clay-margin-xl: 2rem; /* 32px - Maximum clearance */
```

### Tailwind Config Extension

Add to the `@theme inline` block:

```css
@theme inline {
  /* ... existing theme ... */

  /* Claymorphism Spacing */
  --spacing-clay-sm: var(--clay-padding-sm);
  --spacing-clay-md: var(--clay-padding-md);
  --spacing-clay-lg: var(--clay-padding-lg);
  --spacing-clay-xl: var(--clay-padding-xl);
  --spacing-clay-2xl: var(--clay-padding-2xl);
}
```

### Relationship Between Shadow Intensity and Spacing

```
Shadow Token    →    Additional Padding    →    Additional Margin
─────────────────────────────────────────────────────────────────
clay-sm         →    +4px padding          →    +4px margin
clay-md         →    +8px padding          →    +8px margin
clay-lg         →    +12px padding         →    +12px margin
clay-xl         →    +16px padding         →    +16px margin
clay-2xl        →    +24px padding         →    +24px margin
```

### Component-Specific Spacing Guidelines

```css
/* Button padding for claymorphism */
.btn-clay {
  padding: var(--clay-padding-md) calc(var(--clay-padding-md) * 2);
  /* Minimum 16px vertical, 32px horizontal */
}

/* Card padding for claymorphism */
.card-clay {
  padding: var(--clay-padding-lg);
  /* Minimum 24px all sides */
}

/* Input field padding for claymorphism */
.input-clay {
  padding: var(--clay-padding-md) var(--clay-padding-lg);
  /* Minimum 16px vertical, 24px horizontal */
}
```

---

## Tailwind Integration Plan

### Complete Configuration Snippets

Add the following to `apps/web/app/globals.css` in the `@theme inline` block:

```css
@theme inline {
  /* ============================================
     EXISTING THEME (keep these)
     ============================================ */
  --font-sans: var(--font-geist), "Geist", "Geist Fallback";
  --font-mono: "Geist Mono", "Geist Mono Fallback";
  --font-pixel: var(--font-pixel), "Press Start 2P", monospace;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  /* ... rest of existing colors ... */

  /* ============================================
     CLAYMORPHISM EXTENSIONS (add these)
     ============================================ */

  /* Border Radius Scale */
  --radius-clay-sm: 16px;
  --radius-clay: 20px;
  --radius-clay-md: 24px;
  --radius-clay-lg: 32px;
  --radius-clay-xl: 40px;
  --radius-clay-full: 9999px;

  /* Shadow System */
  --shadow-clay-sm: var(--clay-sm);
  --shadow-clay-md: var(--clay-md);
  --shadow-clay-lg: var(--clay-lg);
  --shadow-clay-xl: var(--clay-xl);
  --shadow-clay-2xl: var(--clay-2xl);

  /* Extended Colors */
  --color-clay-primary-highlight: var(--clay-primary-highlight);
  --color-clay-primary-shadow: var(--clay-primary-shadow);
  --color-clay-card-highlight: var(--clay-card-highlight);
  --color-clay-card-shadow: var(--clay-card-shadow);

  /* Spacing */
  --spacing-clay-sm: 12px;
  --spacing-clay-md: 16px;
  --spacing-clay-lg: 24px;
  --spacing-clay-xl: 32px;
  --spacing-clay-2xl: 48px;
}
```

### CSS Variables vs Direct Values

**RECOMMENDATION:** Use CSS variables for theming support.

**Why CSS Variables:**

1. **Dark mode support:** Automatic theme switching
2. **Runtime customization:** Can adjust via JavaScript
3. **Consistency:** Single source of truth
4. **Performance:** Browser-cached, no build step needed

**Implementation in globals.css:**

```css
:root {
  /* Define all claymorphism tokens here */
  --clay-sm-outer: 2px 2px 4px rgba(0, 0, 0, 0.15), -2px -2px 4px rgba(255, 255, 255, 0.05);
  /* ... etc */
}

.dark {
  /* Override for dark mode */
  --clay-sm-outer: 3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.03);
  /* ... etc */
}
```

### Migration Strategy from Current 0px Radius

**Phase 1: Add new tokens (non-breaking)**

```css
/* Add claymorphism tokens alongside existing */
--clay-rounded-sm: 16px;
--clay-rounded: 20px;
/* ... etc */
```

**Phase 2: Update standard radius tokens**

```css
/* Replace current 0px system */
--radius: var(--clay-rounded); /* Was: 0px */
--radius-sm: var(--clay-rounded-sm); /* Was: calc(var(--radius) - 4px) */
--radius-md: var(--clay-rounded); /* Was: calc(var(--radius) - 2px) */
--radius-lg: var(--clay-rounded-md); /* Was: var(--radius) */
--radius-xl: var(--clay-rounded-lg); /* Was: calc(var(--radius) + 4px) */
```

**Phase 3: Update component classes**

```css
/* Update existing component classes in globals.css */
.card {
  @apply bg-card rounded-clay-md shadow-clay-lg; /* Was: rounded-xl */
}

.btn-primary {
  @apply rounded-clay shadow-clay-md; /* Was: no radius/shadow */
}
```

### Layering with Existing Design Tokens

The claymorphism tokens should **complement**, not replace, existing tokens:

```css
/* Keep existing color tokens */
--color-primary: var(--primary);

/* Add claymorphism-specific variants */
--color-clay-primary-highlight: var(--clay-primary-highlight);
--color-clay-primary-shadow: var(--clay-primary-shadow);

/* Usage example */
.clay-button {
  background-color: var(--primary);
  box-shadow: var(--clay-md);
  border-radius: var(--clay-rounded);
}
```

### Dark Mode Support

All claymorphism tokens must have dark mode variants:

```css
:root {
  /* Light mode defaults */
  --clay-md-outer: 4px 4px 8px rgba(0, 0, 0, 0.2), -4px -4px 8px rgba(255, 255, 255, 0.08);
}

.dark {
  /* Dark mode overrides */
  --clay-md-outer: 5px 5px 10px rgba(0, 0, 0, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.05);
}
```

---

## Implementation Examples

### Button Component (apps/web/components/ui/button.tsx)

Update the `buttonVariants` cva to include claymorphism variants:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-clay-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // NEW: Claymorphism variants
        clay: "bg-primary text-primary-foreground shadow-clay-md hover:shadow-clay-lg active:shadow-clay-sm",
        "clay-secondary":
          "bg-secondary text-secondary-foreground shadow-clay-md hover:shadow-clay-lg",
        "clay-outline":
          "bg-background shadow-clay-md hover:shadow-clay-lg border border-primary/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        // NEW: Claymorphism sizes with appropriate radius
        "clay-sm": "h-8 rounded-clay-sm px-4",
        "clay-md": "h-10 rounded-clay px-6",
        "clay-lg": "h-12 rounded-clay-md px-8",
        "clay-xl": "h-14 rounded-clay-lg px-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**Usage:**

```tsx
// Standard claymorphism button
<Button variant="clay" size="clay-md">
  Buy NFT
</Button>

// Secondary clay button
<Button variant="clay-secondary" size="clay-lg">
  View Collection
</Button>

// Small clay button
<Button variant="clay" size="clay-sm">
  Claim
</Button>
```

### Card Component (apps/web/components/ui/card.tsx)

Update card component with claymorphism variants:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "clay" | "clay-lg" | "clay-xl"
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 py-6",
        variant === "default" && "rounded-xl border shadow-sm",
        variant === "clay" && "rounded-clay-md shadow-clay-lg",
        variant === "clay-lg" && "rounded-clay-lg shadow-clay-xl",
        variant === "clay-xl" && "rounded-clay-xl shadow-clay-2xl",
        "bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
```

**Usage:**

```tsx
// Standard clay card
<Card variant="clay">
  <CardHeader>
    <CardTitle>NFT Collection</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Featured NFT card with extra depth
<Card variant="clay-lg">
  {/* Featured content */}
</Card>

// Hero card with maximum depth
<Card variant="clay-xl">
  {/* Hero content */}
</Card>
```

### Input Field Example

```tsx
// apps/web/components/ui/input.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full bg-background text-foreground",
          "rounded-clay px-4 py-3",
          "shadow-clay-sm focus:shadow-clay-md",
          "border border-primary/20 focus:border-primary",
          "transition-shadow duration-200",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Usage:**

```tsx
<Input placeholder="Enter wallet address" />
```

### Badge/Chip Example

```tsx
// apps/web/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-clay-sm px-3 py-1 text-xs font-medium transition-shadow",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-clay-sm",
        secondary: "bg-secondary text-secondary-foreground shadow-clay-sm",
        outline: "border border-primary/20 shadow-clay-sm",
        ghost: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

### NFT Card Example (Complete Component)

```tsx
// apps/web/components/nft-card.tsx
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface NFTCardProps {
  name: string
  price: string
  image: string
  rarity: "common" | "rare" | "legendary"
}

export function NFTCard({ name, price, image, rarity }: NFTCardProps) {
  return (
    <Card variant="clay-lg" className="overflow-hidden">
      {/* NFT Image with clay border */}
      <div className="relative rounded-clay-lg overflow-hidden shadow-clay-md">
        <img src={image} alt={name} className="w-full h-48 object-cover" />
        {/* Rarity badge with clay effect */}
        <Badge variant="default" className="absolute top-3 right-3 shadow-clay-sm">
          {rarity.toUpperCase()}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-muted-foreground text-sm">Price: {price} USDT</p>
        </div>

        {/* Action button */}
        <Button variant="clay" size="clay-md" className="w-full">
          Purchase
        </Button>
      </div>
    </Card>
  )
}
```

---

## Quick Reference

### Token Cheat Sheet

```css
/* Shadows */
shadow-clay-sm   → Badges, chips
shadow-clay-md   → Buttons, inputs
shadow-clay-lg   → Cards, panels
shadow-clay-xl   → Modals, heroes
shadow-clay-2xl  → Maximum depth

/* Radius */
rounded-clay-sm  → 16px (small)
rounded-clay     → 20px (standard)
rounded-clay-md  → 24px (cards)
rounded-clay-lg  → 32px (featured)
rounded-clay-xl  → 40px (hero)
rounded-clay-full → 9999px (pills)

/* Spacing */
clay-padding-sm  → 12px
clay-padding-md  → 16px
clay-padding-lg  → 24px
clay-padding-xl  → 32px
```

### File Modification Checklist

- [ ] `apps/web/app/globals.css` - Add all CSS variables and theme extensions
- [ ] `apps/web/components/ui/button.tsx` - Add clay variants
- [ ] `apps/web/components/ui/card.tsx` - Add clay variants
- [ ] `apps/web/components/ui/input.tsx` - Update with clay styles
- [ ] `apps/web/components/ui/badge.tsx` - Add clay shadows

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-05
**Maintained By:** EggoWorld Design System Team
