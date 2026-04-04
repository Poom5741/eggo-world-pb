# Design System Migration Guide

**How to align existing components with EggoWorld Design System**

---

## Overview

This guide helps you audit and update existing components to match the EggoWorld Design System standards. Follow these steps systematically to ensure consistency across the codebase.

---

## Step 1: Audit Current Components

### Run This Search

```bash
# Find hardcoded colors
grep -r "bg-\[#\|text-\[#" apps/web/components --include="*.tsx"

# Find rounded corners (should be 0)
grep -r "rounded-lg\|rounded-md\|rounded-xl" apps/web/components --include="*.tsx"

# Find soft shadows (should use borders)
grep -r "shadow-lg\|shadow-xl\|shadow-2xl" apps/web/components --include="*.tsx"

# Find emoji icons
grep -r "🎨\|🚀\|⚙️\|💼\|🔥" apps/web/components --include="*.tsx"

# Find missing cursor-pointer on clickable divs
grep -r "onClick.*className" apps/web/components --include="*.tsx" | grep -v "cursor-pointer"
```

### Create Issue List

Document findings in a spreadsheet or issue tracker:

- Component name
- Issue type (color, radius, shadow, icon, etc.)
- Priority (High/Medium/Low)
- Status (Pending/In Progress/Done)

---

## Step 2: Fix Critical Issues (High Priority)

### Issue 1: Replace Hardcoded Colors

❌ **Before:**

```tsx
<div className="bg-[#1a1a2e] text-[#fef9c3]">Content</div>
```

✅ **After:**

```tsx
<div className="bg-background text-foreground">Content</div>
```

**Script to find all instances:**

```bash
grep -rn "bg-\[#\|text-\[#\|border-\[#" apps/web --include="*.tsx" --include="*.css"
```

### Issue 2: Remove Rounded Corners

❌ **Before:**

```tsx
<Card className="rounded-lg">
<Button className="rounded-md">
<div className="rounded-xl">
```

✅ **After:**

```tsx
<Card className="rounded-none"> {/* Or just remove the class */}
<Button className="rounded-none">
<div> {/* No radius class needed */}
```

**Exception:** If you must use radius, only use `rounded-sm` (4px max)

### Issue 3: Replace Soft Shadows with Borders

❌ **Before:**

```tsx
<div className="shadow-lg bg-white">
<Card className="shadow-md">
```

✅ **After:**

```tsx
<div className="border-4 border-primary/50 bg-card">
<Card className="card--primary">
```

### Issue 4: Replace Emoji Icons with Lucide

❌ **Before:**

```tsx
<button>🎨 Customize</button>
<div>🔥 Hot Deal</div>
<span>💰 Balance: 1.5 BNB</span>
```

✅ **After:**

```tsx
import { Palette, Flame, Wallet } from 'lucide-react';

<button>
  <Palette className="w-4 h-4 mr-2 inline" />
  Customize
</button>

<div className="flex items-center gap-2">
  <Flame className="w-4 h-4 text-accent" />
  <span>Hot Deal</span>
</div>

<span className="flex items-center gap-2">
  <Wallet className="w-4 h-4" />
  Balance: 1.5 BNB
</span>
```

**Common emoji replacements:**

| Emoji | Lucide Icon   | Import                                         |
| ----- | ------------- | ---------------------------------------------- |
| 🎨    | Palette       | `import { Palette } from 'lucide-react'`       |
| 🚀    | Rocket        | `import { Rocket } from 'lucide-react'`        |
| ⚙️    | Settings      | `import { Settings } from 'lucide-react'`      |
| 💼    | Briefcase     | `import { Briefcase } from 'lucide-react'`     |
| 🔥    | Flame         | `import { Flame } from 'lucide-react'`         |
| 💰    | Wallet        | `import { Wallet } from 'lucide-react'`        |
| ✅    | Check         | `import { Check } from 'lucide-react'`         |
| ❌    | X             | `import { X } from 'lucide-react'`             |
| ⚠️    | AlertTriangle | `import { AlertTriangle } from 'lucide-react'` |
| 👤    | User          | `import { User } from 'lucide-react'`          |

### Issue 5: Add cursor-pointer to Clickable Elements

❌ **Before:**

```tsx
<div onClick={handleClick} className="card p-6">
  Clickable card
</div>

<Card onClick={handleSelect}>
  Another clickable card
</Card>
```

✅ **After:**

```tsx
<div
  onClick={handleClick}
  className="card p-6 cursor-pointer hover:bg-card/80 transition-colors"
>
  Clickable card
</div>

<Card
  onClick={handleSelect}
  className="cursor-pointer hover:bg-card/80 transition-colors"
>
  Another clickable card
</Card>
```

---

## Step 3: Standardize Component Patterns (Medium Priority)

### Pattern 1: Update All Buttons

❌ **Before:**

```tsx
<Button variant="default">
  Submit
</Button>

<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Custom Button
</button>
```

✅ **After:**

```tsx
// Use design system button classes
<button className="btn-primary">
  SUBMIT
</button>

<button className="btn-secondary">
  CANCEL
</button>

<button className="btn-ghost">
  LEARN MORE
</button>

// Or customize shadcn/ui Button
<Button className="font-[var(--font-pixel)] text-xs border-4 border-primary/50 hover:border-primary h-12 px-6">
  CUSTOM
</Button>
```

**Migration script:**

```tsx
// Create a wrapper component for gradual migration
import { Button as ShadcnButton } from "@/components/ui/button"

export function Button({ variant = "primary", children, ...props }: ButtonProps) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  }

  return (
    <button className={variants[variant]} {...props}>
      {children}
    </button>
  )
}
```

### Pattern 2: Standardize Cards

❌ **Before:**

```tsx
<div className="bg-white rounded-lg shadow p-6">
  Card content
</div>

<Card className="bg-gray-100">
  Another card
</Card>
```

✅ **After:**

```tsx
// Primary card (featured content)
<div className="card--primary">
  Card content
</div>

// Secondary card (standard content)
<div className="card--secondary">
  Card content
</div>

// Accent card (warnings, premium)
<div className="card--accent">
  Card content
</div>

// Or use shadcn/ui Card with design system classes
<Card className="card--primary">
  <CardHeader>
    <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="font-[var(--font-pixel)] text-xs text-foreground">
      Content
    </p>
  </CardContent>
</Card>
```

### Pattern 3: Update Form Inputs

❌ **Before:**

```tsx
<input
  type="text"
  className="border border-gray-300 rounded px-3 py-2"
/>

<Input className="bg-white" />
```

✅ **After:**

```tsx
<input
  type="text"
  className="input-field"
  placeholder="Enter value..."
/>

// Or with shadcn/ui
<Input className="input-field" placeholder="Enter value..." />

// With label
<div className="space-y-2">
  <Label className="label">FIELD LABEL</Label>
  <Input className="input-field" />
</div>
```

### Pattern 4: Typography Consistency

❌ **Before:**

```tsx
<h1 className="text-3xl font-bold">Title</h1>
<p className="text-sm text-gray-600">Description</p>
<span className="text-xs uppercase">Label</span>
```

✅ **After:**

```tsx
<h1 className="page-title">TITLE</h1>

<p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
  Description
</p>

<span className="label">LABEL</span>
```

**Typography mapping:**

| Old Pattern             | New Pattern                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `text-3xl font-bold`    | `page-title` or `font-[var(--font-pixel)] text-3xl text-primary`                  |
| `text-xl font-semibold` | `section-title` or `font-[var(--font-pixel)] text-xl text-foreground`             |
| `text-sm text-gray-600` | `font-[var(--font-pixel)] text-xs text-muted-foreground`                          |
| `text-xs uppercase`     | `label` or `font-[var(--font-pixel)] text-[10px] text-muted-foreground uppercase` |

---

## Step 4: Enhance Accessibility (High Priority)

### Add ARIA Labels

❌ **Before:**

```tsx
<button onClick={closeModal}>
  <X className="w-6 h-6" />
</button>

<img src="/egg.png" />
```

✅ **After:**

```tsx
<button onClick={closeModal} aria-label="Close modal">
  <X className="w-6 h-6" />
</button>

<Image src="/egg.png" alt="Pixel egg NFT" width={64} height={64} />
```

### Add Focus States

❌ **Before:**

```tsx
<button className="btn-primary">
  Click Me
</button>

<a href="/dashboard" className="text-primary">
  Dashboard
</a>
```

✅ **After:**

```tsx
<button className="btn-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
  Click Me
</button>

<a
  href="/dashboard"
  className="text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
>
  Dashboard
</a>
```

**Note:** The global `outline-ring/50` style in `globals.css` should handle most cases, but verify with keyboard navigation testing.

### Ensure Color Contrast

Test all text/background combinations:

```tsx
// ✅ Good contrast (13.2:1)
<p className="text-foreground">Readable text</p>

// ✅ Good contrast (11.8:1)
<p className="text-primary">Also readable</p>

// ⚠️ Check contrast (4.8:1) - acceptable but monitor
<p className="text-muted-foreground">Secondary text</p>

// ❌ Bad contrast - never do this
<p className="text-muted-foreground bg-card">Hard to read!</p>
```

**Tool:** Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Step 5: Optimize Animations (Medium Priority)

### Add Reduced Motion Support

❌ **Before:**

```tsx
<div className="animate-float">Floating element</div>
```

✅ **After:**

```tsx
// CSS automatically handles this via @media query
// But for JS-controlled animations:
import { useEffect, useState } from "react"

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return reducedMotion
}

// Usage
const reducedMotion = useReducedMotion()
;<div className={reducedMotion ? "" : "animate-float"}>Floating element</div>
```

### Fix Animation Timing

❌ **Before:**

```tsx
// Too slow
<div className="transition-all duration-1000">

// Robotic linear motion
<div className="transition-all duration-300 linear">
```

✅ **After:**

```tsx
// Responsive micro-interactions (150-300ms)
<div className="transition-all duration-200 ease-out">

// Entering animations
<div className="transition-all duration-300 ease-out">

// Exiting animations
<div className="transition-all duration-200 ease-in">
```

---

## Step 6: Responsive Design Audit (Low Priority)

### Test at All Breakpoints

Create a checklist for each page:

```markdown
## [Page Name] Responsive Testing

- [ ] 375px (iPhone SE) - No horizontal scroll, touch targets ≥44px
- [ ] 768px (iPad) - Grid adjusts properly
- [ ] 1024px (Laptop) - Layout looks balanced
- [ ] 1440px (Desktop) - Max-width container centered
- [ ] Keyboard navigation works at all sizes
- [ ] Images scale correctly
```

### Fix Common Responsive Issues

**Issue: Text too small on mobile**

❌ **Before:**

```tsx
<h1 className="text-xl">Title</h1>
```

✅ **After:**

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

**Issue: Grid doesn't adapt**

❌ **Before:**

```tsx
<div className="grid grid-cols-3 gap-4">
```

✅ **After:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Issue: Padding too large on mobile**

❌ **Before:**

```tsx
<main className="px-8 py-12">
```

✅ **After:**

```tsx
<main className="px-4 py-6 md:px-8 md:py-12">
```

---

## Step 7: Performance Optimization (Low Priority)

### Optimize Images

❌ **Before:**

```tsx
<img src="/egg.png" alt="Egg" />
```

✅ **After:**

```tsx
import Image from "next/image"

;<Image
  src="/egg.png"
  alt="Egg"
  width={64}
  height={64}
  className="pixelated"
  style={{ imageRendering: "pixelated" }}
/>
```

### Lazy Load Components

For heavy components (charts, maps):

```tsx
import dynamic from "next/dynamic"

const ChartComponent = dynamic(() => import("@/components/Chart"), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
})
```

---

## Step 8: Documentation Updates

### Update Component Stories

If using Storybook, update stories to reflect design system:

```tsx
// Button.stories.tsx
export const Primary = {
  args: {
    className: "btn-primary",
    children: "MINT EGG",
  },
}

export const Secondary = {
  args: {
    className: "btn-secondary",
    children: "CANCEL",
  },
}
```

### Add JSDoc Comments

````tsx
/**
 * Primary action button following EggoWorld design system
 *
 * @example
 * ```tsx
 * <button className="btn-primary">MINT EGG</button>
 * ```
 */
export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <button className="btn-primary" {...props}>
      {children}
    </button>
  )
}
````

---

## Automated Migration Scripts

### Script 1: Find and Replace Hardcoded Colors

Create `scripts/migrate-colors.js`:

```javascript
const fs = require("fs")
const path = require("path")
const glob = require("glob")

const colorMap = {
  "#1a1a2e": "background",
  "#fef9c3": "foreground",
  "#facc15": "primary",
  "#0f3460": "secondary",
  "#e94560": "accent",
  "#16213e": "card",
  "#94a3b8": "muted-foreground",
}

function migrateColors(filePath) {
  let content = fs.readFileSync(filePath, "utf8")
  let modified = false

  Object.entries(colorMap).forEach(([hex, varName]) => {
    // Match bg-[#hex], text-[#hex], border-[#hex]
    const patterns = [
      new RegExp(`bg-\\[${hex}\\]`, "g"),
      new RegExp(`text-\\[${hex}\\]`, "g"),
      new RegExp(`border-\\[${hex}\\]`, "g"),
    ]

    patterns.forEach((pattern, idx) => {
      const prefixes = ["bg", "text", "border"]
      if (pattern.test(content)) {
        content = content.replace(pattern, `${prefixes[idx]}-${varName}`)
        modified = true
      }
    })
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`✓ Updated: ${filePath}`)
  }
}

// Run on all TSX files
glob("apps/web/components/**/*.tsx", (err, files) => {
  files.forEach(migrateColors)
})
```

Run with:

```bash
node scripts/migrate-colors.js
```

### Script 2: Check for Anti-Patterns

Create `scripts/check-design-system.js`:

```javascript
const fs = require("fs")
const glob = require("glob")

const antiPatterns = [
  {
    pattern: /rounded-(lg|md|xl|2xl|3xl)/g,
    message: "Avoid rounded corners - use pixel aesthetic",
  },
  {
    pattern: /shadow-(lg|xl|2xl)/g,
    message: "Use borders instead of soft shadows",
  },
  {
    pattern: /[🎨🚀⚙️💼🔥💰✅❌⚠️👤]/g,
    message: "Use Lucide icons instead of emojis",
  },
  {
    pattern: /bg-\[#[0-9a-fA-F]{6}\]/g,
    message: "Use CSS variables instead of hardcoded colors",
  },
]

console.log("🔍 Scanning for design system anti-patterns...\n")

glob("apps/web/components/**/*.tsx", (err, files) => {
  let issuesFound = 0

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8")

    antiPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(pattern)
      if (matches) {
        console.log(`❌ ${file}`)
        console.log(`   ${message}`)
        console.log(`   Found: ${matches.length} instance(s)\n`)
        issuesFound += matches.length
      }
    })
  })

  if (issuesFound === 0) {
    console.log("✅ No anti-patterns found! Great job!")
  } else {
    console.log(`\n⚠️  Total issues: ${issuesFound}`)
    console.log("Fix these issues to comply with the design system.")
  }
})
```

Run with:

```bash
node scripts/check-design-system.js
```

---

## Verification Checklist

After migration, verify each component:

### Visual Quality

- [ ] No hardcoded colors (all use CSS variables)
- [ ] No rounded corners (or max 4px)
- [ ] No soft shadows (using borders instead)
- [ ] No emoji icons (using Lucide)
- [ ] Pixel-perfect borders (2px or 4px)

### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide visual feedback
- [ ] Focus states visible for keyboard navigation
- [ ] Disabled states clearly indicated

### Accessibility

- [ ] All images have `alt` text
- [ ] Form inputs have `<label>` elements
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] `prefers-reduced-motion` respected

### Responsive

- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥44px on mobile
- [ ] Text remains readable at all sizes

### Performance

- [ ] Images use Next.js `<Image>` component
- [ ] No unnecessary re-renders
- [ ] Animations use GPU-accelerated properties
- [ ] Bundle size monitored

---

## Rollout Strategy

### Phase 1: Critical Fixes (Week 1)

- Replace hardcoded colors
- Remove rounded corners
- Replace emoji icons
- Add cursor-pointer to clickable elements

### Phase 2: Component Standardization (Week 2)

- Update all buttons to use design system classes
- Standardize card patterns
- Update form inputs
- Fix typography consistency

### Phase 3: Accessibility & Polish (Week 3)

- Add ARIA labels
- Ensure focus states
- Test color contrast
- Add reduced motion support

### Phase 4: Testing & Documentation (Week 4)

- Responsive testing at all breakpoints
- Performance optimization
- Update component documentation
- Create Storybook stories

---

## Getting Help

- **Design questions:** See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Quick reference:** See [DESIGN_SYSTEM_QUICK_REF.md](./DESIGN_SYSTEM_QUICK_REF.md)
- **Examples:** See [DESIGN_SYSTEM_SHOWCASE.md](./DESIGN_SYSTEM_SHOWCASE.md)
- **Team support:** Post questions in #design-system Slack channel

---

**Last Updated:** 2026-04-04  
**Version:** 1.0.0
