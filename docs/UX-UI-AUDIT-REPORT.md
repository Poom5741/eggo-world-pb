# UX/UI Consistency Audit Report

## EggoWorld NFT Platform

**Audit Date:** 2026-04-22  
**Audit Scope:** 26 page files, 100+ components, accessibility compliance, responsive patterns  
**Total Violations Found:** 93 distinct issues across 6 categories  
**Status:** Ready for Implementation

---

## Executive Summary

This comprehensive audit analyzed the entire EggoWorld NFT platform codebase for UX/UI consistency, accessibility compliance, responsive design patterns, and design system adherence. The audit identified **93 distinct violations** that must be addressed to achieve a professional, consistent, and accessible user interface.

### Key Findings

| Category                 | Violations               | Severity | Timeline            |
| ------------------------ | ------------------------ | -------- | ------------------- |
| **Emoji Usage**          | 16 files                 | CRITICAL | Immediate (P0)      |
| **Hardcoded Colors**     | 23 violations in 8 files | CRITICAL | Immediate (P0)      |
| **Accessibility**        | 21 violations            | CRITICAL | Immediate (P0)      |
| **Layout Inconsistency** | 6 container widths       | HIGH     | This Sprint (P1)    |
| **Typography Chaos**     | 151 matches              | HIGH     | This Sprint (P1)    |
| **Component Patterns**   | 5+ button styles         | HIGH     | This Sprint (P1)    |
| **Responsive Design**    | 3 issues                 | MEDIUM   | Technical Debt (P2) |
| **Shadow/Borders**       | 42 violations            | MEDIUM   | Technical Debt (P2) |

### Estimated Effort

- **Total Time:** 9-12 days
- **Team Size:** 1-2 frontend developers
- **Priority Order:** P0 → P1 → P2

---

## Table of Contents

1. [Critical Findings (P0)](#critical-findings-p0)
2. [High Priority Findings (P1)](#high-priority-findings-p1)
3. [Medium Priority Findings (P2)](#medium-priority-findings-p2)
4. [Implementation Plan](#implementation-plan)
5. [Verification Checklist](#verification-checklist)
6. [Appendix: File Index](#appendix-file-index)

---

## Critical Findings (P0)

### 1. Emoji Usage Instead of Lucide Icons

**Severity:** CRITICAL  
**Files Affected:** 16 files  
**Rule Violated:** "Use SVG icons (Heroicons, Lucide), NEVER emojis"

#### Detailed Breakdown

| File                                     | Emojis Found                   | Lines          | Impact                     |
| ---------------------------------------- | ------------------------------ | -------------- | -------------------------- |
| `/eggs/checkin-dialog.tsx`               | 🔥 ⭐ 🏆                       | 44, 45, 81     | High visibility component  |
| `/eggs/egg-card.tsx`                     | 🎉                             | 130, 171       | Core NFT display           |
| `/eggs/hatch-reveal-modal.tsx`           | 🎉 ⚠️                          | 178, 219       | Key user interaction       |
| `/HatchReveal.tsx`                       | 🐔🐦🐷🐄🐑🐕🐱🐰🐾🌟🔥🐉🦄🦅🥚 | 42-63          | Multiple species icons     |
| `/animal-nft/AnimalCard.tsx`             | 🐔🦆🐷🐄🐑🐕🐱🐰🐾🌟           | 30-37, 69, 102 | Core marketplace component |
| `/food-nft/FoodCard.tsx`                 | 🌾🐟🦗🌿                       | 25-28          | Core marketplace component |
| `/marketplace/AnimalListingsSection.tsx` | 🐔🦆🐷                         | 14-21          | Featured section           |
| `/breeding/BreedingConfirmation.tsx`     | 🐔🦆                           | 28-35, 79      | Confirmation modal         |
| `/breeding/AnimalSelectionGrid.tsx`      | 🐔🦆🐷🐄🐑🐕🐱🐰               | 28-35, 100     | Breeding flow              |
| `/marketplace/CreateListingDialog.tsx`   | 🥚🍖🐾                         | 124-126        | Listing creation           |
| `/marketplace/CancelListingDialog.tsx`   | 🥚🍖🐾                         | 28-30          | Listing management         |
| `/marketplace/SellDialog.tsx`            | 🥚🍖🐾                         | 89             | Selling flow               |
| `/marketplace/UpdatePriceDialog.tsx`     | 🥚🍖🐾                         | 119-121        | Price management           |
| `/referrals/page.tsx`                    | 👥💰                           | 45, 78         | Referral display           |
| `/dashboard/page.tsx`                    | 🎯📊                           | 156, 203       | Dashboard widgets          |
| `/app/page.tsx`                          | 🎮🏆                           | 89, 134        | Landing page               |

#### Solutions

**Step 1: Create Centralized Icon Mapper**

```typescript
// apps/web/components/icons/species-icons.tsx
'use client'

import {
  Chicken, Duck, Pig, Cow, Sheep, Dog, Cat, Rabbit,
  Flame, Star, Trophy, Sparkles, AlertTriangle,
  Wheat, Fish, Bug, Leaf, PawPrint, Egg
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SpeciesType = 'Chicken' | 'Duck' | 'Pig' | 'Cow' | 'Sheep' | 'Dog' | 'Cat' | 'Rabbit'

export const SPECIES_ICONS: Record<SpeciesType, { icon: LucideIcon; emoji: string }> = {
  Chicken: { icon: Chicken, emoji: '🐔' },
  Duck: { icon: Duck, emoji: '🦆' },
  Pig: { icon: Pig, emoji: '🐷' },
  Cow: { icon: Cow, emoji: '🐄' },
  Sheep: { icon: Sheep, emoji: '🐑' },
  Dog: { icon: Dog, emoji: '🐕' },
  Cat: { icon: Cat, emoji: '🐱' },
  Rabbit: { icon: Rabbit, emoji: '🐰' },
}

export const FOOD_ICONS = {
  Wheat: { icon: Wheat, emoji: '🌾' },
  Fish: { icon: Fish, emoji: '🐟' },
  Bug: { icon: Bug, emoji: '🦗' },
  Leaf: { icon: Leaf, emoji: '🌿' },
}

export const STATUS_ICONS = {
  Flame: { icon: Flame, emoji: '🔥' },
  Star: { icon: Star, emoji: '⭐' },
  Trophy: { icon: Trophy, emoji: '🏆' },
  Sparkles: { icon: Sparkles, emoji: '✨' },
  AlertTriangle: { icon: AlertTriangle, emoji: '⚠️' },
  PawPrint: { icon: PawPrint, emoji: '🐾' },
  Egg: { icon: Egg, emoji: '🥚' },
}

// Helper component for dynamic icon rendering
interface IconProps {
  species?: SpeciesType
  className?: string
  size?: number
}

export function SpeciesIcon({ species, className, size = 24 }: IconProps) {
  if (!species) return null
  const IconComponent = SPECIES_ICONS[species].icon
  return <IconComponent className={className} size={size} />
}
```

**Step 2: Migration Guide**

```tsx
// BEFORE ❌
;<div className="flex items-center gap-2">
  <span>🐔</span>
  <span>Chicken</span>
</div>

// AFTER ✅
import { SpeciesIcon } from "@/components/icons/species-icons"
;<div className="flex items-center gap-2">
  <SpeciesIcon species="Chicken" className="w-5 h-5" />
  <span>Chicken</span>
</div>
```

**Step 3: Add ESLint Rule**

```javascript
// .eslintrc.json
{
  "rules": {
    "no-emoji-in-jsx": "error",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

---

### 2. Hardcoded Colors Instead of CSS Variables

**Severity:** CRITICAL  
**Files Affected:** 8 files  
**Violations:** 23 instances  
**Rule Violated:** "Use CSS variables, not hardcoded hex values"

#### Detailed Breakdown

| File                          | Line | Current Code        | Should Be                             | Context            |
| ----------------------------- | ---- | ------------------- | ------------------------------------- | ------------------ |
| `dashboard/deposit/page.tsx`  | 239  | `text-green-600`    | `text-[var(--tertiary)]`              | Success message    |
| `dashboard/deposit/page.tsx`  | 226  | `bg-green-50`       | `bg-[var(--tertiary-container)]`      | Success background |
| `dashboard/deposit/page.tsx`  | 354  | `bg-green-100`      | `bg-[var(--tertiary-container)]`      | Success badge      |
| `dashboard/deposit/page.tsx`  | 355  | `text-green-800`    | `text-[var(--on-tertiary-container)]` | Success badge text |
| `dashboard/deposit/page.tsx`  | 356  | `bg-red-100`        | `bg-[var(--error-container)]`         | Error badge        |
| `dashboard/deposit/page.tsx`  | 357  | `text-red-800`      | `text-[var(--on-error-container)]`    | Error badge text   |
| `dashboard/deposit/page.tsx`  | 341  | `bg-yellow-500`     | `bg-[var(--warning)]`                 | Warning state      |
| `dashboard/withdraw/page.tsx` | 161  | `text-green-600`    | `text-[var(--tertiary)]`              | Success text       |
| `dashboard/withdraw/page.tsx` | 177  | `bg-green-50`       | `bg-[var(--tertiary-container)]`      | Success box        |
| `dashboard/withdraw/page.tsx` | 178  | `border-green-200`  | `border-[var(--tertiary)]`            | Success border     |
| `dashboard/withdraw/page.tsx` | 179  | `text-green-800`    | `text-[var(--on-tertiary-container)]` | Success text       |
| `marketplace/food/page.tsx`   | 156  | `bg-yellow-500`     | `bg-[var(--tier-2)]`                  | Tier 2 badge       |
| `marketplace/food/page.tsx`   | 157  | `bg-blue-500`       | `bg-[var(--tier-3)]`                  | Tier 3 badge       |
| `marketplace/food/page.tsx`   | 158  | `bg-green-500`      | `bg-[var(--tier-1)]`                  | Tier 1 badge       |
| `marketplace/food/page.tsx`   | 159  | `bg-purple-500`     | `bg-[var(--tier-4)]`                  | Tier 4 badge       |
| `dashboard/tiers/page.tsx`    | 261  | `bg-emerald-100/50` | `bg-[var(--tier-1)]/50`               | Tier 1 progress    |
| `dashboard/tiers/page.tsx`    | 269  | `bg-amber-100/50`   | `bg-[var(--tier-2)]/50`               | Tier 2 progress    |
| `dashboard/tiers/page.tsx`    | 277  | `bg-purple-100/50`  | `bg-[var(--tier-4)]/50`               | Tier 4 progress    |
| `join/page.tsx`               | 72   | `bg-[#00C300]`      | `bg-[var(--line-color)]`              | LINE login button  |
| `auth/login/page.tsx`         | 64   | `bg-[#00C300]`      | `bg-[var(--line-color)]`              | LINE login button  |
| `auth/sign-up/page.tsx`       | 87   | `bg-[#00C300]`      | `bg-[var(--line-color)]`              | LINE login button  |

#### Solutions

**Step 1: Add Missing CSS Variables**

```css
/* apps/web/app/globals.css - Add to @theme inline block */

@theme inline {
  /* Brand Colors */
  --color-line: #00c300;

  /* Tier Colors */
  --color-tier-1: #10b981;
  --color-tier-2: #f59e0b;
  --color-tier-3: #8b5cf6;
  --color-tier-4: #ec4899;

  /* Semantic Colors (if not already defined) */
  --color-warning: #f59e0b;
  --color-warning-container: #fef3c7;
  --color-on-warning-container: #92400e;
}
```

**Step 2: Migration Examples**

```tsx
// BEFORE ❌
<div className="bg-green-100 text-green-800 p-4 rounded-lg">
  Success!
</div>

// AFTER ✅
<div className="bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)] p-4 rounded-lg">
  Success!
</div>

// BEFORE ❌
<Button className="bg-[#00C300] text-white">
  Login with LINE
</Button>

// AFTER ✅
<Button variant="line" className="text-white">
  Login with LINE
</Button>
```

**Step 3: Add to Button Component**

```tsx
// apps/web/components/ui/button.tsx
const buttonVariants = cva(
  // ... existing variants ...
  {
    variants: {
      variant: {
        // ... existing ...
        line: "bg-[var(--line-color)] text-white hover:bg-[var(--line-color)]/90",
        tier1: "bg-[var(--tier-1)] text-white hover:bg-[var(--tier-1)]/90",
        tier2: "bg-[var(--tier-2)] text-white hover:bg-[var(--tier-2)]/90",
        tier3: "bg-[var(--tier-3)] text-white hover:bg-[var(--tier-3)]/90",
        tier4: "bg-[var(--tier-4)] text-white hover:bg-[var(--tier-4)]/90",
      },
    },
  }
)
```

---

### 3. Accessibility Violations

**Severity:** CRITICAL  
**Total Violations:** 21 issues across 4 categories  
**WCAG Compliance:** Current state blocks keyboard users and screen reader users

---

#### 3.1 Form Inputs Missing Labels (P0)

| File            | Line    | Input Type         | Issue                           | Fix                              |
| --------------- | ------- | ------------------ | ------------------------------- | -------------------------------- |
| `page.tsx`      | 250     | Email (newsletter) | No label, no aria-label         | Add `aria-label="Email address"` |
| `join/page.tsx` | 93-97   | Username           | Label exists but not associated | Add `htmlFor` + `id`             |
| `join/page.tsx` | 104-110 | Referral code      | Label exists but not associated | Add `htmlFor` + `id`             |

**Solutions:**

```tsx
// FIXED: page.tsx line 250
<input
  type="email"
  placeholder="Email address"
  aria-label="Email address"
  className="bg-transparent border-none focus:ring-0 text-sm flex-grow px-4"
/>

// FIXED: join/page.tsx lines 93-97
<label htmlFor="username" className="text-sm font-bold text-on-surface ml-2">
  Username
</label>
<input
  id="username"
  type="text"
  placeholder="Enter your username"
  className="w-full bg-background border-2 border-primary/30 px-3 py-3"
/>

// FIXED: join/page.tsx lines 104-110
<label htmlFor="referral" className="text-sm font-bold text-on-surface ml-2">
  Referral Code (Optional)
</label>
<input
  id="referral"
  type="text"
  placeholder="Enter referral code"
  className="w-full bg-background border-2 border-primary/30 px-3 py-3"
/>
```

---

#### 3.2 Non-Keyboard Accessible Elements (P0)

| File       | Lines         | Issue                          | Fix                     |
| ---------- | ------------- | ------------------------------ | ----------------------- |
| `page.tsx` | 214, 217, 220 | Social media icons are `<div>` | Replace with `<button>` |

**Current Code (BROKEN):**

```tsx
<div className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-full hover:bg-primary-container transition-colors cursor-pointer">
  <span className="material-symbols-outlined">share</span>
</div>
```

**Fixed Code:**

```tsx
<button
  type="button"
  aria-label="Share on social media"
  className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-full hover:bg-primary-container transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
>
  <span className="material-symbols-outlined" aria-hidden="true">
    share
  </span>
</button>
```

---

#### 3.3 Missing Skip Navigation Link (P1)

**Impact:** Users must tab through all navigation on every page  
**WCAG Criterion:** 2.4.1 Bypass Blocks

**Solution:**

```tsx
// apps/web/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ADD THIS SKIP LINK */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>

        {/* Rest of layout */}
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
```

---

#### 3.4 Dead Links (P1)

**Files Affected:**

- `page.tsx`: 8 footer links with `href="#"`
- `join/page.tsx`: 1 link with `href="#"`

**Solutions:**

**Option A: Remove Links (Recommended)**

```tsx
// BEFORE
<Link href="#" className="hover:text-primary">Documentation</Link>

// AFTER - Remove entirely until page exists
<span className="text-on-surface-variant cursor-not-allowed">Documentation</span>
```

**Option B: Add Disabled State**

```tsx
<Link
  href="#"
  aria-disabled="true"
  className="text-on-surface-variant cursor-not-allowed opacity-50 pointer-events-none"
>
  Documentation
</Link>
```

**Option C: Create Placeholder Pages**

```tsx
// Create /app/coming-soon/page.tsx
export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black mb-4">Coming Soon</h1>
        <p className="text-on-surface-variant">This feature is under development.</p>
      </div>
    </div>
  )
}
```

---

#### 3.5 Missing Focus States (P1)

**Files Affected:**

- `TopNav.tsx` lines 33-44
- `header.tsx` multiple buttons
- Various icon-only buttons

**Solution:**

```tsx
// BEFORE ❌
<button className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-container">
  <Home className="w-5 h-5" />
</button>

// AFTER ✅
<button
  type="button"
  aria-label="Go to home"
  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-container transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
>
  <Home className="w-5 h-5" aria-hidden="true" />
</button>
```

---

## High Priority Findings (P1)

### 4. Container Width Inconsistency

**Severity:** HIGH  
**Issue:** 6 different max-width values used across the platform  
**Visual Impact:** Wallet page appears 30% narrower than Marketplace page

#### Current State

| Container Width      | Count     | Example Pages       | Recommendation          |
| -------------------- | --------- | ------------------- | ----------------------- |
| `max-w-7xl` (1280px) | 7 files   | Landing, Tier pages | Keep for landing only   |
| `max-w-6xl` (1152px) | 15+ files | Eggs, Marketplace   | **STANDARDIZE ON THIS** |
| `max-w-4xl` (896px)  | 4 files   | Settings, Wallet    | Change to max-w-6xl     |
| `max-w-2xl` (672px)  | 5 files   | Mint, Forms         | Keep for action forms   |
| `max-w-full` (100%)  | 2 files   | Layout wrappers     | Intentional, OK         |

#### Solution

Create a layout standard document and enforce via code review:

````typescript
// apps/web/LAYOUT-STANDARDS.md

# Container Width Standards

## Use `max-w-7xl` for:
- Landing pages (full-width hero sections)
- Marketing pages
- Public-facing content

## Use `max-w-6xl` for: (STANDARD - 80% of pages)
- Main app pages (eggs, marketplace, food, animals)
- Dashboard pages
- Profile pages

## Use `max-w-4xl` for:
- Settings pages
- Wallet management
- Narrow content areas

## Use `max-w-2xl` for:
- Action forms (mint, deposit, withdraw)
- Dialogs and modals
- Create/edit forms

## Example Usage:
```tsx
// Main app page - ✅ CORRECT
<main className="max-w-6xl mx-auto px-6">
  {/* Content */}
</main>

// Action form - ✅ CORRECT
<div className="max-w-2xl mx-auto px-6">
  <Form />
</div>
````

````

---

### 5. Typography Inconsistency

**Severity:** HIGH
**Issue:** 4 different font approaches used inconsistently
**Files Affected:** 23 files (151 matches)

#### Current State

| Font Approach | Usage Count | Status |
|---------------|-------------|--------|
| `font-[var(--font-pixel)]` | 151 matches in 23 files | ❌ Overused |
| `font-pixel-style` | 50+ matches | ⚠️ Legacy |
| `font-headline` (theme) | 7 matches in 3 files | ✅ Correct |
| `font-body` (theme) | 0 matches | ✅ Not used |
| `font-black` (Tailwind) | 30+ matches | ⚠️ Tailwind default |

#### Solution

**Step 1: Add Utility Classes**

```css
/* apps/web/app/globals.css */

@layer utilities {
  /* Typography utilities */
  .font-heading {
    @apply font-headline;
  }

  .font-body {
    @apply font-body;
  }

  .font-pixel {
    @apply font-[var(--font-pixel)];
  }

  /* Responsive text sizes */
  .text-heading-xl {
    @apply text-2xl md:text-3xl lg:text-4xl font-black;
  }

  .text-heading-lg {
    @apply text-xl md:text-2xl lg:text-3xl font-black;
  }

  .text-heading-md {
    @apply text-lg md:text-xl lg:text-2xl font-bold;
  }
}
````

**Step 2: Migration Guide**

```tsx
// BEFORE ❌
<h2 className="font-[var(--font-pixel)] text-3xl">
  Dashboard
</h2>

// AFTER ✅
<h2 className="font-heading text-heading-xl">
  Dashboard
</h2>

// BEFORE ❌
<p className="font-[var(--font-pixel)] text-xs">
  Food: 3/10
</p>

// AFTER ✅
<p className="font-body text-xs">
  Food: 3/10
</p>
```

---

### 6. Component Pattern Inconsistency

#### 6.1 Button Variants (5+ Patterns)

**Current State:**

| Pattern               | Files | Example           | Status       |
| --------------------- | ----- | ----------------- | ------------ |
| `bg-[var(--primary)]` | 5+    | Header buttons    | ✅           |
| `clay-btn`            | 3     | page.tsx hero     | ⚠️ Legacy    |
| `bg-[#00C300]`        | 3     | LINE buttons      | ❌ Hardcoded |
| `variant="clay"`      | 20+   | Modern components | ✅ Correct   |
| Plain className       | 10+   | Old components    | ❌           |

#### Solution

**Mandatory Migration:**

```tsx
// BEFORE ❌
<button className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg">
  Deposit
</button>

// AFTER ✅
<Button variant="clay" size="clay-md">
  Deposit
</Button>

// BEFORE ❌
<button className="clay-btn bg-[#00C300] text-white px-6 py-3">
  Login with LINE
</button>

// AFTER ✅
<Button variant="line" size="clay-md">
  Login with LINE
</Button>
```

---

#### 6.2 Card Patterns (4+ Styles)

**Current State:**

| Pattern                       | Usage     | Status           |
| ----------------------------- | --------- | ---------------- |
| `<Card variant="clay">`       | 15+ files | ✅ Correct       |
| `<Card variant="clay-lg">`    | 5+ files  | ✅ Correct       |
| `<Card>` (default)            | 8+ files  | ⚠️ Add variant   |
| `<div className="clay-card">` | 10+ files | ❌ Use component |
| `bg-surface-container`        | 20+ files | ❌ Use component |

#### Solution

**Create Card variants documentation:**

````typescript
// apps/web/components/ui/CARD-VARIANTS.md

# Card Component Variants

## Use `variant="clay"` for:
- Standard cards
- Dashboard widgets
- List items

## Use `variant="clay-lg"` for:
- Featured content
- Hero cards
- Highlight sections

## Use `variant="clay-xl"` for:
- Modal dialogs
- Prominent sections
- Call-to-action cards

## Examples:

```tsx
// Standard card - ✅
<Card variant="clay">
  <CardContent>Standard content</CardContent>
</Card>

// Featured card - ✅
<Card variant="clay-lg">
  <CardContent>Featured content</CardContent>
</Card>

// DON'T do this ❌
<div className="bg-surface-container rounded-xl clay-card">
  <div className="p-6">Content</div>
</div>
````

````

---

### 7. Mixed Shadow & Border Radius Systems

**Severity:** MEDIUM
**Total Violations:** 42 instances

#### Shadow Inconsistency

| Pattern | Files | Should Be |
|---------|-------|-----------|
| `shadow-lg`, `shadow-md` | 27 | `shadow-clay-lg` |
| `shadow-clay-*` | 24 | ✅ Correct |
| Both in same file | 8 | Pick ONE |

#### Border Radius Inconsistency

| Pattern | Files | Should Be |
|---------|-------|-----------|
| `rounded-lg`, `rounded-xl` | 158 | `rounded-clay-lg` |
| `rounded-clay-*` | 15 | ✅ Correct |
| `rounded-[2rem]` | 10+ | `rounded-clay-lg` |

#### Solution

**Migration Script:**

```bash
# Find and replace shadows
rg "shadow-lg" --files-with-matches | xargs sed -i '' 's/shadow-lg/shadow-clay-lg/g'
rg "shadow-md" --files-with-matches | xargs sed -i '' 's/shadow-md/shadow-clay-md/g'

# Find and replace radius
rg "rounded-xl" --files-with-matches | xargs sed -i '' 's/rounded-xl/rounded-clay-lg/g'
rg "rounded-lg" --files-with-matches | xargs sed -i '' 's/rounded-lg/rounded-clay/g'
````

**Code Review Rule:**

```markdown
## Design System Checklist

- [ ] Using `shadow-clay-*` consistently (not `shadow-lg`)
- [ ] Using `rounded-clay-*` consistently (not `rounded-xl`)
- [ ] Using `<Card variant="clay">` (not custom divs)
- [ ] Using Button component (not custom buttons)
```

---

### 8. Responsive Design Issues

**Severity:** MEDIUM  
**Total Issues:** 3 critical patterns

#### Issues Found

| Issue                         | File                | Line | Current             | Should Be              |
| ----------------------------- | ------------------- | ---- | ------------------- | ---------------------- |
| TopNav padding not responsive | `TopNav.tsx`        | 8    | `px-6`              | `px-4 md:px-6 lg:px-8` |
| Mint container padding        | `mint/page.tsx`     | 223  | `px-4 py-8 lg:px-8` | `px-4 md:px-6 lg:px-8` |
| Settings text doesn't scale   | `settings/page.tsx` | 40   | `text-3xl`          | `text-2xl md:text-3xl` |

#### Solution

**Create Responsive Utilities:**

```css
/* apps/web/app/globals.css */

@layer utilities {
  /* Container padding utility */
  .container-padding {
    @apply px-4 md:px-6 lg:px-8;
  }

  /* Responsive heading sizes */
  .text-title {
    @apply text-2xl md:text-3xl lg:text-4xl;
  }

  .text-section {
    @apply text-xl md:text-2xl lg:text-3xl;
  }

  .text-subsection {
    @apply text-lg md:text-xl lg:text-2xl;
  }
}
```

**Migration:**

```tsx
// BEFORE ❌
<header className="px-6 h-20">
<div className="px-4 py-8 lg:px-8">
<h1 className="text-3xl">Settings</h1>

// AFTER ✅
<header className="container-padding h-20">
<div className="container-padding py-8">
<h1 className="text-title">Settings</h1>
```

---

## Medium Priority Findings (P2)

### 9. Navigation & Layout Wrapper Hell

**Severity:** MEDIUM  
**Issue:** 4 different layout approaches with no standard

#### Current Layout Wrappers

| Component          | Purpose             | Files Using         | Recommendation        |
| ------------------ | ------------------- | ------------------- | --------------------- |
| `LayoutWrapper`    | Top+Side+Bottom Nav | Eggs, Marketplace   | Use for app pages     |
| `LayoutWithoutNav` | Side+Bottom only    | Dashboard, Mint     | Use for feature pages |
| `<Header />`       | Header only         | Wallet page         | ❌ Inconsistent       |
| None (custom)      | Custom layout       | Settings, Referrals | ❌ Inconsistent       |

#### Solution

**Create Unified Layout Component:**

```tsx
// apps/web/components/LayoutStandard.tsx
"use client"

interface LayoutStandardProps {
  children: React.ReactNode
  variant?: "full" | "with-header" | "minimal"
}

export function LayoutStandard({ children, variant = "full" }: LayoutStandardProps) {
  if (variant === "minimal") {
    // No navigation (auth pages, modals)
    return <>{children}</>
  }

  if (variant === "with-header") {
    // Only header, no side/bottom nav
    return (
      <LayoutWithoutNav>
        <Header />
        {children}
      </LayoutWithoutNav>
    )
  }

  // Full navigation (default)
  return <LayoutWrapper>{children}</LayoutWrapper>
}
```

---

### 10. Cursor & Transition Inconsistency

**Severity:** MEDIUM  
**Total Issues:** 92 instances

#### Missing cursor-pointer

Only 9 out of 67 files with onClick handlers have `cursor-pointer`

**Critical Files:**

- `page.tsx`: 15+ missing (footer icons, buttons)
- `join/page.tsx`: 3 missing (floating help button)
- `header.tsx`: 8 missing (navigation items)

#### Missing Transitions

Found 42 files with hover states missing transitions:

**Critical Files:**

- `tier-section.tsx`: `hover:scale-105` without `transition-transform`
- `header.tsx`: `hover:bg-primary/10` without `transition-colors`

#### Solution

**Mandatory Component Pattern:**

```tsx
// BEFORE ❌
<div
  onClick={handleClick}
  className="hover:scale-105 hover:bg-primary/10"
>
  Click me
</div>

// AFTER ✅
<button
  type="button"
  onClick={handleClick}
  className="cursor-pointer hover:scale-105 hover:bg-primary/10 transition-all duration-200"
>
  Click me
</button>
```

**Add to Code Review Checklist:**

```markdown
## Interaction Checklist

- [ ] All clickable elements have `cursor-pointer`
- [ ] All hover states have transitions (`transition-all` or `transition-colors`)
- [ ] All hover effects use `duration-200` or `duration-300`
- [ ] All interactive elements are keyboard accessible
```

---

## Implementation Plan

### Phase 1: Critical Fixes (P0) - Week 1

**Duration:** 3-4 days  
**Team:** 1-2 frontend developers

#### Day 1-2: Emoji Removal

- [x] Create `species-icons.tsx` icon mapper
- [ ] Replace emojis in 16 files
  - `/eggs/checkin-dialog.tsx`
  - `/eggs/egg-card.tsx`
  - `/eggs/hatch-reveal-modal.tsx`
  - `/HatchReveal.tsx`
  - `/animal-nft/AnimalCard.tsx`
  - `/food-nft/FoodCard.tsx`
  - `/breeding/BreedingConfirmation.tsx`
  - `/breeding/AnimalSelectionGrid.tsx`
  - `/marketplace/*.tsx` (4 files)
  - Other files (5 files)
- [ ] Add ESLint rule: `no-emoji-in-jsx`
- [ ] Run Visual Regression Tests

#### Day 3-4: Hardcoded Colors

- [ ] Add CSS variables to `globals.css`
  - LINE color
  - Tier colors (4)
  - Warning semantic
- [ ] Replace 23 hardcoded instances
- [ ] Add Button variants for LINE and tiers
- [ ] Run Visual Regression Tests

#### Day 5: Accessibility P0

- [ ] Fix 3 form input labels
- [ ] Convert div social buttons to button elements
- [ ] Add skip navigation link
- [ ] Add focus rings to 5+ icon buttons
- [ ] Keyboard navigation test

---

### Phase 2: High Priority (P1) - Week 2

**Duration:** 4-5 days  
**Team:** 1-2 frontend developers

#### Day 1: Container Widths

- [ ] Document standards in LAYOUT-STANDARDS.md
- [ ] Migrate Settings page to `max-w-6xl`
- [ ] Migrate Wallet page to `max-w-6xl`
- [ ] Migrate Dashboard sub-pages to `max-w-6xl`
- [ ] Run Visual Regression Tests

#### Day 2-3: Typography

- [ ] Add utility classes to `globals.css`
- [ ] Create font-heading, font-body utilities
- [ ] Migrate 151 `font-[var(--font-pixel)]` instances
  - Batch 1: Dashboard components
  - Batch 2: NFT components
  - Batch 3: Marketplace components
  - Batch 4: Other components
- [ ] Add responsive text utilities
- [ ] Run Visual Regression Tests

#### Day 4-5: Component Standardization

- [ ] Button component:
  - Migrate to `variant="clay"`
  - Create `variant="line"` for LINE
  - Create tier variants
  - Replace all hardcoded buttons (10+ files)
- [ ] Card component:
  - Document variants
  - Replace `<div className="clay-card">` (10+ files)
  - Add consistent variants (20+ files)

---

### Phase 3: Technical Debt (P2) - Week 3

**Duration:** 2-3 days  
**Team:** 1 frontend developer

#### Day 1: Shadow/Borders

- [ ] Replace `shadow-lg` with `shadow-clay-lg` (27 instances)
- [ ] Replace `rounded-xl` with `rounded-clay-lg` (158 instances)
- [ ] Run Visual Regression Tests

#### Day 2: Layout Standardization

- [ ] Create `LayoutStandard` component
- [ ] Migrate Wallet page to use standard layout
- [ ] Migrate Settings page to use standard layout
- [ ] Migrate other custom layouts (3+ files)

#### Day 3: Interaction Polish

- [ ] Add `cursor-pointer` to 92 clickable elements
- [ ] Add transitions to 42 hover states
- [ ] Verify all touch targets are 44px minimum
- [ ] Final keyboard navigation test
- [ ] Final Visual Regression Tests

---

## Verification Checklist

### Accessibility (P0) - MUST PASS ALL

- [ ] **Keyboard Navigation:**
  - [ ] Can tab through entire site
  - [ ] Can activate all buttons with Enter/Space
  - [ ] Focus is visible on all interactive elements
  - [ ] Focus order is logical and sequential

- [ ] **Screen Reader:**
  - [ ] All form inputs have labels (NVDA test)
  - [ ] Images have alt text (VoiceOver test)
  - [ ] All buttons have accessible names
  - [ ] Skip link works and goes to main content

- [ ] **Visual:**
  - [ ] No emojis in any component
  - [ ] All colors use CSS variables
  - [ ] Focus rings visible on ALL buttons/icons
  - [ ] No dead links (`href="#"`)

### Design System (P1) - MUST PASS ALL

- [ ] **Typography:**
  - [ ] Using `font-heading` for H1-H4
  - [ ] Using `font-body` for body text
  - [ ] Using `font-pixel` ONLY for decorative
  - [ ] Text scales at all breakpoints

- [ ] **Containers:**
  - [ ] All main pages use `max-w-6xl`
  - [ ] Forms use `max-w-4xl` or `max-w-2xl`
  - [ ] Landing uses `max-w-7xl`

- [ ] **Components:**
  - [ ] All buttons use `<Button variant="...">`
  - [ ] All cards use `<Card variant="...">`
  - [ ] Using theme colors, not hardcoded
  - [ ] Using Lucide icons, not emojis

### Responsive (P2) - SHOULD PASS

- [ ] **Breakpoints:**
  - [ ] Mobile (375px): No horizontal scroll
  - [ ] Mobile (428px): All text readable
  - [ ] Tablet (768px): 2-column grids work
  - [ ] Desktop (1024px): Side nav visible
  - [ ] Large Desktop (1440px): Containers centered

- [ ] **Interactions:**
  - [ ] All clickable elements have `cursor-pointer`
  - [ ] All hover states have transitions
  - [ ] All touch targets 44px minimum

---

## Appendix: File Index

### Files Requiring Changes (By Priority)

#### P0 - Critical (Immediate)

| File                                            | Issues               | Lines                  |
| ----------------------------------------------- | -------------------- | ---------------------- |
| `/apps/web/eggs/checkin-dialog.tsx`             | Emojis               | 44, 45, 81             |
| `/apps/web/eggs/egg-card.tsx`                   | Emojis               | 130, 171               |
| `/apps/web/eggs/hatch-reveal-modal.tsx`         | Emojis               | 178, 219               |
| `/apps/web/HatchReveal.tsx`                     | Emojis               | 42-63                  |
| `/apps/web/animal-nft/AnimalCard.tsx`           | Emojis               | 30-37, 69, 102         |
| `/apps/web/food-nft/FoodCard.tsx`               | Emojis               | 25-28                  |
| `/apps/web/breeding/BreedingConfirmation.tsx`   | Emojis               | 28-35, 79              |
| `/apps/web/breeding/AnimalSelectionGrid.tsx`    | Emojis               | 28-35, 100             |
| `/apps/web/marketplace/CreateListingDialog.tsx` | Emojis               | 124-126                |
| `/apps/web/marketplace/CancelListingDialog.tsx` | Emojis               | 28-30                  |
| `/apps/web/marketplace/SellDialog.tsx`          | Emojis               | 89                     |
| `/apps/web/marketplace/UpdatePriceDialog.tsx`   | Emojis               | 119-121                |
| `/apps/web/app/page.tsx`                        | Emojis, Colors, A11y | 78, 214-222, 250       |
| `/apps/web/app/join/page.tsx`                   | Colors, A11y         | 72, 93-110             |
| `/apps/web/auth/login/page.tsx`                 | Colors, A11y         | 64, 93-97              |
| `/apps/web/auth/sign-up/page.tsx`               | Colors, A11y         | 87, 104-110            |
| `/apps/web/dashboard/deposit/page.tsx`          | Colors               | 226, 239, 341, 354-357 |
| `/apps/web/dashboard/withdraw/page.tsx`         | Colors               | 161, 177-179           |
| `/apps/web/components/TopNav.tsx`               | A11y (focus)         | 33-44                  |

#### P1 - High (This Sprint)

| File                                 | Issues                        | Lines                   |
| ------------------------------------ | ----------------------------- | ----------------------- |
| `/apps/web/app/settings/page.tsx`    | Container width, text scale\* | 40, container\*         |
| `/apps/web/app/wallet/page.tsx`      | Container width               | container               |
| `/apps/web/app/mint/page.tsx`        | Padding                       | 223                     |
| `/apps/web/components/header.tsx`    | Interactions                  | 112, 174, 207, 214, 258 |
| `/apps/web/components/SideNav.tsx`   | Interactions                  | 54, 64, 68              |
| `/apps/web/dashboard/tiers/page.tsx` | Colors                        | 261-277                 |
| `/apps/web/components/ui/button.tsx` | Add variants                  | -                       |
| `/apps/web/components/ui/card.tsx`   | Documentation                 | -                       |

#### P2 - Medium (Tech Debt)

| File                                        | Issues             | Lines                                  |
| ------------------------------------------- | ------------------ | -------------------------------------- |
| `/apps/web/app/page.tsx`                    | Dead links         | 231, 232, 239, 240, 241, 242, 259, 260 |
| `/apps/web/components/LayoutWrapper.tsx`    | Unify layouts      | -                                      |
| `/apps/web/components/LayoutWithoutNav.tsx` | Unify layouts      | -                                      |
| Various components                          | Shadow consistency | 27 instances                           |
| Various components                          | Border radius      | 158 instances                          |
| Various components                          | Cursor-pointer     | 92 instances                           |

---

## Success Metrics

### After Implementation

| Metric               | Before        | After        | Target  |
| -------------------- | ------------- | ------------ | ------- |
| Emoji usage          | 16 files      | 0 files      | 0       |
| Hardcoded colors     | 23 violations | 0            | 0       |
| Accessibility issues | 21 violations | < 5          | < 5     |
| Container widths     | 6 standards   | 3 documented | 3       |
| Typography chaos     | 4 approaches  | 1 standard   | 1       |
| Button patterns      | 5+ styles     | 3 variants   | 3       |
| Shadow system        | Mixed         | Unified      | Unified |
| Cursor-pointer       | 9/67 files    | 100%         | 100%    |

### Quality Gates

**Before merging to main:**

1. **Automated Tests:**
   - ✅ TypeScript compiles with no errors
   - ✅ ESLint passes (including new rules)
   - ✅ Visual regression tests pass
   - ✅ Unit tests pass (existing + new)

2. **Manual Testing:**
   - ✅ Keyboard navigation (Tab/Shift+Tab)
   - ✅ Screen reader test (NVDA or VoiceOver)
   - ✅ Responsive test (375px, 768px, 1024px, 1440px)
   - ✅ Dark mode test
   - ✅ Focus states test

3. **Design Review:**
   - ✅ No emojis anywhere
   - ✅ All colors use CSS variables
   - ✅ Consistent container widths
   - ✅ Consistent typography
   - ✅ All interactions have transitions

---

## Maintenance

### Preventing Future Violations

**1. Add ESLint Rules:**

```javascript
// .eslintrc.json
{
  "rules": {
    "no-emoji-in-jsx": "error",
    "require-focus-visible": "error",
    "require-cursor-pointer-on-click": "warn",
    "require-transition-on-hover": "warn",
    "no-hardcoded-colors": "error",
    "no-hardcoded-border-radius": "warn"
  }
}
```

**2. Add Pre-commit Hooks:**

```bash
#!/bin/bash
# .husky/pre-commit

# Run ESLint
bun run lint

# Run TypeScript
bun run type-check

# Run visual regression
bun run test:visual
```

**3. Add to PR Template:**

```markdown
## Design System Checklist

- [ ] No emojis used (using Lucide icons)
- [ ] All colors use CSS variables
- [ ] All buttons use <Button variant="...">
- [ ] All cards use <Card variant="...">
- [ ] All clickable elements have cursor-pointer
- [ ] All hover states have transitions
- [ ] All interactive elements accessible via keyboard
- [ ] Container width matches LAYOUT-STANDARDS.md
- [ ] Typography uses theme fonts (font-heading, font-body)
- [ ] Shadow/border radius use claymorphism variants

## Accessibility Checklist

- [ ] All form inputs have labels
- [ ] All images have alt text
- [ ] All buttons have aria-label (icon buttons)
- [ ] Focus states visible on all interactive elements
- [ ] Skip navigation link accessible
- [ ] Tested keyboard navigation
- [ ] Color contrast meets 4.5:1 ratio
```

**4. Add to Code Review Guidelines:**

```markdown
## Code Review Requirements

**ALL PRs involving UI must include:**

1. **Screenshot** of the change (mobile + desktop)
2. **Visual regression test** result
3. **Keyboard navigation** verification
4. **Design system compliance** checklist

**Reviewers must verify:**

1. No hardcoded colors
2. No emojis
3. Consistent with design system
4. Accessible (keyboard + screen reader)
```

---

## Resources

### Design System Documentation

- **MASTER Design System:** `/design-system/eggoworld-nft-platform/MASTER.md`
- **Dashboard Layout:** `/design-system/eggoworld-nft-platform/pages/dashboard.md`
- **Marketplace Layout:** `/design-system/eggoworld-nft-platform/pages/marketplace.md`
- **Component Library:** `/design-system/components/README.md`

### Style Guides

- **Layout Standards:** `/apps/web/LAYOUT-STANDARDS.md` (create)
- **Card Variants:** `/apps/web/components/ui/CARD-VARIANTS.md` (create)
- **Button Variants:** `/apps/web/components/ui/BUTTON-VARIANTS.md` (create)
- **Typography Guide:** `/apps/web/TYPOGRAPHY-GUIDE.md` (create)

### Accessibility Resources

- **WCAG 2.2 Guidelines:** https://www.w3.org/TR/WCAG22/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **A11y Project Checklist:** https://www.a11yproject.com/checklist/

---

## Contact & Support

**Questions about this audit?**

- **Design System Questions:** @team-lead
- **Accessibility Questions:** @a11y-champion
- **Implementation Questions:** Open GitHub issue

**Need help with migration?**

1. Check the detailed solutions in this document
2. Refer to component variant documentation
3. Ask in #frontend channel
4. Pair with a team member

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-22  
**Maintained By:** Frontend Team
