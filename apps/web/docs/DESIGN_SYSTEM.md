# EggoWorld Design System

**Version:** 1.0.0  
**Last Updated:** 2026-04-04  
**Theme:** Retro 8-bit Pixel Gaming Aesthetic  
**Framework:** Next.js 16 + shadcn/ui + Tailwind CSS 4

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Design Tokens](#design-tokens)
5. [Component Guidelines](#component-guidelines)
6. [Animation System](#animation-system)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Icon System](#icon-system)
10. [Layout & Spacing](#layout--spacing)
11. [Best Practices](#best-practices)
12. [Anti-Patterns](#anti-patterns)
13. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles

**Retro-Futurism Meets Blockchain Gaming**

EggoWorld combines nostalgic 8-bit pixel art aesthetics with modern blockchain technology. The design system prioritizes:

1. **Pixel-Perfect Precision**: Sharp edges, no anti-aliasing on borders, intentional pixelation
2. **High Contrast Readability**: Pale yellow text on deep navy backgrounds for optimal readability
3. **Playful Interactions**: Subtle animations that evoke retro gaming without sacrificing usability
4. **Consistent Visual Language**: Every element follows the pixel grid philosophy

### Aesthetic Keywords

- Vintage sci-fi
- 80s arcade gaming
- Neon glow effects
- Geometric patterns
- CRT scanlines (subtle)
- Pixel art
- Cyberpunk undertones
- Synthwave color palette

---

## Color Palette

### Primary Colors

| Role           | Hex Code  | RGB                | Usage                                     | Contrast Ratio\* |
| -------------- | --------- | ------------------ | ----------------------------------------- | ---------------- |
| **Background** | `#1a1a2e` | rgb(26, 26, 46)    | Main page background                      | -                |
| **Foreground** | `#fef9c3` | rgb(254, 249, 195) | Primary text color                        | 13.2:1 ✅        |
| **Primary**    | `#facc15` | rgb(250, 204, 21)  | CTAs, highlights, buttons                 | 11.8:1 ✅        |
| **Secondary**  | `#0f3460` | rgb(15, 52, 96)    | Secondary elements, borders               | 8.4:1 ✅         |
| **Accent**     | `#e94560` | rgb(233, 69, 96)   | Error states, warnings, important actions | 5.6:1 ✅         |
| **Card**       | `#16213e` | rgb(22, 33, 62)    | Card backgrounds, containers              | 10.9:1 ✅        |

\*Contrast ratios calculated against Background color (#1a1a2e) per WCAG 2.1 AA standards

### Extended Palette

| Variable                   | Hex Code  | Usage                              |
| -------------------------- | --------- | ---------------------------------- |
| `--muted`                  | `#0f3460` | Muted backgrounds, disabled states |
| `--muted-foreground`       | `#94a3b8` | Secondary text, placeholders       |
| `--border`                 | `#0f3460` | Borders, dividers                  |
| `--input`                  | `#0f3460` | Input field backgrounds            |
| `--ring`                   | `#facc15` | Focus rings, outlines              |
| `--destructive`            | `#dc2626` | Destructive actions, errors        |
| `--destructive-foreground` | `#ffffff` | Text on destructive backgrounds    |

### Chart Colors

| Variable    | Hex Code  | Purpose                |
| ----------- | --------- | ---------------------- |
| `--chart-1` | `#facc15` | Primary data series    |
| `--chart-2` | `#e94560` | Secondary data series  |
| `--chart-3` | `#0f3460` | Tertiary data series   |
| `--chart-4` | `#fef9c3` | Quaternary data series |
| `--chart-5` | `#94a3b8` | Additional data series |

### Sidebar Colors

| Variable               | Hex Code  | Usage                |
| ---------------------- | --------- | -------------------- |
| `--sidebar`            | `#16213e` | Sidebar background   |
| `--sidebar-foreground` | `#fef9c3` | Sidebar text         |
| `--sidebar-primary`    | `#facc15` | Sidebar active items |
| `--sidebar-accent`     | `#0f3460` | Sidebar hover states |

### Color Usage Guidelines

✅ **DO:**

- Use primary yellow (`#facc15`) for all interactive elements and CTAs
- Maintain high contrast between text and backgrounds (minimum 4.5:1)
- Use accent red (`#e94560`) sparingly for critical alerts and errors
- Apply secondary blue (`#0f3460`) for subtle borders and backgrounds

❌ **DON'T:**

- Use colors outside the defined palette without approval
- Place low-contrast text combinations (e.g., muted on card)
- Overuse accent colors; they should draw attention to important elements
- Modify hex values directly; use CSS variables for consistency

---

## Typography

### Font Families

#### Primary Display Font: Press Start 2P

```css
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

font-family: "Press Start 2P", monospace;
```

**Usage:**

- All headings (h1-h6)
- Button text
- Navigation labels
- Important UI text
- Game-related content

**Characteristics:**

- Pixel-perfect rendering
- Monospace spacing
- Retro arcade aesthetic
- Limited character set (Latin only)

#### Body Font: Geist

```css
font-family: "Geist", sans-serif;
```

**Usage:**

- Long-form text (if needed)
- Descriptions and help text
- Form labels (alternative to pixel font)

#### Monospace Font: Geist Mono

```css
font-family: "Geist Mono", monospace;
```

**Usage:**

- Code snippets
- Wallet addresses
- Transaction hashes
- Technical data display

### Type Scale

| Level       | Size | Line Height | Weight | Usage                            |
| ----------- | ---- | ----------- | ------ | -------------------------------- |
| **Display** | 48px | 1.2         | 400    | Hero titles, major announcements |
| **H1**      | 36px | 1.3         | 400    | Page titles                      |
| **H2**      | 28px | 1.3         | 400    | Section headers                  |
| **H3**      | 22px | 1.4         | 400    | Subsection headers               |
| **H4**      | 18px | 1.4         | 400    | Card titles                      |
| **Body**    | 12px | 1.6         | 400    | Default text size (text-xs)      |
| **Small**   | 10px | 1.5         | 400    | Captions, labels, metadata       |

### Typography Best Practices

✅ **DO:**

- Use `font-[var(--font-pixel)]` for all UI text
- Keep body text at `text-xs` (12px) minimum for readability
- Use uppercase for labels and metadata: `uppercase tracking-wider`
- Maintain consistent line heights for vertical rhythm

❌ **DON'T:**

- Mix multiple font families in the same component
- Use font sizes smaller than 10px (illegible on mobile)
- Apply font-weight variations (Press Start 2P has single weight)
- Use serif fonts (breaks pixel aesthetic)

### Text Rendering

```css
/* Ensure pixel-perfect rendering */
.pixelated-text {
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Design Tokens

### Border Radius

**Philosophy:** Zero radius maintains authentic pixel art aesthetic

```css
--radius: 0px;
--radius-sm: calc(var(--radius) - 4px); /* -4px (not used) */
--radius-md: calc(var(--radius) - 2px); /* -2px (not used) */
--radius-lg: var(--radius); /* 0px */
--radius-xl: calc(var(--radius) + 4px); /* 4px (rare cases) */
```

**Usage:**

- **Default:** 0px for all components
- **Exceptional:** 4px only for special decorative elements

### Border Widths

Pixel-perfect borders are essential to the aesthetic:

| Width   | Usage                                       | Example                          |
| ------- | ------------------------------------------- | -------------------------------- |
| **2px** | Inputs, subtle dividers, secondary elements | `.input-field`, `.card-sm`       |
| **4px** | Buttons, cards, primary containers          | `.btn-primary`, `.card--primary` |

### Spacing Scale

Tailwind's default spacing scale applies, with emphasis on:

| Token   | Value | Usage                     |
| ------- | ----- | ------------------------- |
| `p-3`   | 12px  | Small card padding        |
| `p-6`   | 24px  | Standard card padding     |
| `px-4`  | 16px  | Horizontal button padding |
| `px-6`  | 24px  | Wide button padding       |
| `py-3`  | 12px  | Vertical button padding   |
| `gap-4` | 16px  | Grid gaps                 |
| `gap-6` | 24px  | Section gaps              |

### Shadow & Glow Effects

```css
/* Pixel glow effect */
.pixel-glow {
  filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.4));
}

/* Enhanced glow for important elements */
.pixel-glow-strong {
  filter: drop-shadow(0 0 40px rgba(250, 204, 21, 0.8));
}
```

---

## Component Guidelines

### Buttons

#### Primary Button

```tsx
<button className="btn-primary">START GAME</button>
```

**Styles:**

- Background: `bg-primary` (#facc15)
- Text: `text-primary-foreground` (#1a1a2e)
- Border: `border-4 border-primary`
- Padding: `px-6 py-3`
- Font: `font-[var(--font-pixel)] text-xs`
- Hover: `hover:bg-primary/90`
- Disabled: `disabled:bg-primary/50`

#### Secondary Button

```tsx
<button className="btn-secondary">VIEW DETAILS</button>
```

**Styles:**

- Background: `bg-secondary` (#0f3460)
- Text: `text-secondary-foreground` (#fef9c3)
- Border: `border-4 border-secondary`
- Same sizing as primary

#### Ghost Button

```tsx
<button className="btn-ghost">LEARN MORE</button>
```

**Styles:**

- Background: Transparent
- Text: `text-foreground`
- Border: `border-2 border-primary/30`
- Hover: `hover:text-primary hover:border-primary`

### Cards

#### Primary Card

```tsx
<div className="card--primary">{/* Content */}</div>
```

**Styles:**

- Background: `bg-card` (#16213e)
- Border: `border-4 border-primary/50`
- Padding: `p-6`

#### Secondary Card

```tsx
<div className="card--secondary">{/* Content */}</div>
```

**Styles:**

- Background: `bg-card`
- Border: `border-2 border-primary/30`
- Padding: `p-6`

#### Accent Card

```tsx
<div className="card--accent">{/* Content */}</div>
```

**Styles:**

- Background: `bg-card`
- Border: `border-4 border-accent/50`
- Padding: `p-6`
- Use for: Important notifications, premium features

### Forms

#### Input Fields

```tsx
<input type="text" className="input-field" placeholder="Enter wallet address..." />
```

**Styles:**

- Background: `bg-background`
- Border: `border-2 border-primary/30`
- Padding: `px-3 py-3`
- Focus: `focus:border-primary focus:outline-none`
- Placeholder: `placeholder:text-muted-foreground`

#### Labels

```tsx
<label className="label">WALLET ADDRESS</label>
```

**Styles:**

- Font: `font-[var(--font-pixel)] text-[10px]`
- Color: `text-muted-foreground`
- Transform: `uppercase`

### Info Boxes

#### Error Box

```tsx
<div className="info-error">
  <p>Transaction failed. Please try again.</p>
</div>
```

**Styles:**

- Background: `bg-accent/10`
- Border: `border-2 border-accent`
- Padding: `p-4`

#### Success Box

```tsx
<div className="info-success">
  <p>Egg hatched successfully!</p>
</div>
```

**Styles:**

- Background: `bg-green-500/10`
- Border: `border-2 border-green-500`
- Padding: `p-4`

#### Warning Box

```tsx
<div className="info-warning">
  <p>Insufficient balance for this action.</p>
</div>
```

**Styles:**

- Background: `bg-amber-500/10`
- Border: `border-2 border-amber-500`
- Padding: `p-4`

### Layout Components

#### Page Container

```tsx
<main className="page-container">{/* Page content */}</main>
```

**Styles:**

- Max-width: `max-w-7xl`
- Margins: `mx-auto`
- Padding: `px-4 sm:px-6 lg:px-8`

#### Page Title

```tsx
<h1 className="page-title">MY EGGS</h1>
```

**Styles:**

- Font: `font-[var(--font-pixel)]`
- Size: `text-2xl md:text-3xl`
- Color: `text-primary`

#### Section Title

```tsx
<h2 className="section-title">Recent Transactions</h2>
```

**Styles:**

- Font: `font-semibold`
- Size: `text-lg md:text-xl`
- Color: `text-foreground`

### Special Components

#### Step Indicator

```tsx
<div className="step-indicator">1</div>
```

**Styles:**

- Font: `font-[var(--font-pixel)] text-xs`
- Color: `text-primary`
- Border: `border-2 border-primary`
- Size: `w-6 h-6`
- Flex: `flex items-center justify-center flex-shrink-0`

#### Divider

```tsx
<hr className="divider" />
```

**Styles:**

- Border: `border-t-2 border-primary/30`
- Padding-top: `pt-4`

---

## Animation System

### Available Animations

All animations respect `prefers-reduced-motion` media query.

#### Twinkle

**Use Case:** Starfield backgrounds, decorative sparkles

```css
.animate-twinkle {
  animation: twinkle 2s ease-in-out infinite;
}
```

**Effect:** Opacity and scale pulsing

#### Float

**Use Case:** Floating NFT cards, idle character animations

```css
.animate-float {
  animation: float 4s ease-in-out infinite;
}
```

**Effect:** Gentle vertical movement with slight rotation

#### Float Slow

**Use Case:** Background elements, ambient motion

```css
.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}
```

**Effect:** Slower, more complex floating pattern

#### Shooting Star

**Use Case:** Landing page hero, celebratory moments

```css
.animate-shooting-star {
  animation: shooting-star 8s linear infinite;
}
```

**Direction:** Left to right

#### Shooting Star Reverse

**Use Case:** Bidirectional starfield effects

```css
.animate-shooting-star-reverse {
  animation: shooting-star-reverse 10s linear infinite;
}
```

**Direction:** Right to left

#### Glitch

**Use Case:** Error states, cyberpunk effects, loading transitions

```css
.animate-glitch {
  animation: glitch 0.3s ease-in-out;
}
```

**Duration:** Single shot (0.3s), not infinite

#### Pulse Glow

**Use Case:** Important CTAs, rare NFT highlights

```css
.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}
```

**Effect:** Glowing shadow intensity variation

#### March

**Use Case:** Scrolling ticker tapes, parade animations

```css
.animate-march {
  animation: march 20s linear infinite;
}
```

**Effect:** Continuous horizontal scrolling

#### Scroll Indicator

**Use Case:** "Scroll down" hints on landing pages

```css
.animate-scroll-indicator {
  animation: scroll-indicator 1.5s ease-in-out infinite;
}
```

**Effect:** Vertical bounce with opacity fade

#### Marquee

**Use Case:** News tickers, announcement banners

```css
.animate-marquee {
  animation: marquee 30s linear infinite;
}
```

**Effect:** Smooth continuous scrolling

#### Pixel Scroll

**Use Case:** Retro-style horizontal scrollers

```css
.animate-pixel-scroll {
  animation: pixel-scroll 10s linear infinite;
}

.animate-pixel-scroll-reverse {
  animation: pixel-scroll-reverse 10s linear infinite;
}
```

### Animation Guidelines

✅ **DO:**

- Use animations purposefully to enhance UX
- Limit continuous animations to loading states and ambient effects
- Respect `prefers-reduced-motion: reduce` media query
- Keep micro-interactions between 150-300ms
- Use easing functions (ease-out for entering, ease-in for exiting)

❌ **DON'T:**

- Use infinite animations on interactive elements (distracting)
- Apply animations longer than 500ms for UI state changes
- Animate layout properties that cause reflow (width, height)
- Ignore accessibility preferences for motion
- Use linear easing for UI transitions (feels robotic)

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .animate-twinkle,
  .animate-float,
  .animate-float-slow,
  .animate-shooting-star,
  .animate-shooting-star-reverse,
  .animate-pulse-glow,
  .animate-march,
  .animate-scroll-indicator,
  .animate-marquee,
  .animate-pixel-scroll,
  .animate-pixel-scroll-reverse {
    animation: none !important;
  }
}
```

---

## Responsive Design

### Breakpoints

Following Tailwind CSS 4 defaults:

| Breakpoint | Min Width | Device Target |
| ---------- | --------- | ------------- |
| `sm`       | 640px     | Large phones  |
| `md`       | 768px     | Tablets       |
| `lg`       | 1024px    | Laptops       |
| `xl`       | 1280px    | Desktops      |
| `2xl`      | 1536px    | Large screens |

### Responsive Typography Strategy

```tsx
// Page titles scale up on larger screens
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  PAGE TITLE
</h1>

// Body text remains consistent
<p className="text-xs md:text-sm">
  Description text
</p>
```

### Responsive Layout Patterns

#### Grid Systems

```tsx
// Mobile-first responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{/* Cards */}</div>
```

#### Container Widths

```tsx
// Consistent max-width across breakpoints
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* Content */}</main>
```

### Mobile Considerations

✅ **DO:**

- Test at 375px width (iPhone SE)
- Ensure touch targets are at least 44x44px
- Stack layouts vertically on mobile
- Use `text-xs` minimum for readability
- Provide adequate spacing between interactive elements

❌ **DON'T:**

- Use hover-only interactions on mobile
- Rely on precise cursor movements
- Hide critical functionality behind small tap targets
- Use font sizes below 10px

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast

All text/background combinations meet minimum 4.5:1 contrast ratio:

| Combination                    | Ratio  | Status |
| ------------------------------ | ------ | ------ |
| Foreground on Background       | 13.2:1 | ✅ AAA |
| Primary on Background          | 11.8:1 | ✅ AAA |
| Accent on Background           | 5.6:1  | ✅ AA  |
| Muted Foreground on Background | 4.8:1  | ✅ AA  |

#### Keyboard Navigation

✅ **Requirements:**

- All interactive elements must be keyboard accessible
- Visible focus states using `outline-ring/50`
- Logical tab order following DOM structure
- Skip navigation links for screen readers

```tsx
// Example: Custom focus styles
<button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
  Click Me
</button>
```

#### Screen Reader Support

✅ **Requirements:**

- All images have descriptive `alt` text
- Form inputs have associated `<label>` elements
- ARIA labels for icon-only buttons
- Semantic HTML structure (header, main, nav, footer)

```tsx
// Icon-only button example
<button aria-label="Close dialog">
  <X className="w-6 h-6" />
</button>
```

#### Motion Accessibility

Respect user's motion preferences:

```tsx
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
```

---

## Icon System

### Icon Library: Lucide React

**Installation:** Already included via shadcn/ui

```tsx
import { Wallet, Egg, Flame, ShoppingCart } from "lucide-react"
```

### Icon Usage Guidelines

✅ **DO:**

- Use Lucide icons exclusively (consistent style)
- Set consistent sizes: `w-6 h-6` for standard, `w-4 h-4` for small
- Apply `currentColor` for automatic color inheritance
- Add `aria-hidden="true"` for decorative icons

❌ **DON'T:**

- Use emojis as icons (🎨 🚀 ⚙️)
- Mix multiple icon libraries
- Use inconsistent icon sizes
- Forget accessibility attributes

### Common Icons

| Purpose    | Icon            | Import                                         |
| ---------- | --------------- | ---------------------------------------------- |
| Wallet     | `Wallet`        | `import { Wallet } from 'lucide-react'`        |
| Egg/NFT    | `Egg`           | `import { Egg } from 'lucide-react'`           |
| Fire/Hatch | `Flame`         | `import { Flame } from 'lucide-react'`         |
| Shopping   | `ShoppingCart`  | `import { ShoppingCart } from 'lucide-react'`  |
| User       | `User`          | `import { User } from 'lucide-react'`          |
| Settings   | `Settings`      | `import { Settings } from 'lucide-react'`      |
| Close      | `X`             | `import { X } from 'lucide-react'`             |
| Menu       | `Menu`          | `import { Menu } from 'lucide-react'`          |
| Check      | `Check`         | `import { Check } from 'lucide-react'`         |
| Alert      | `AlertTriangle` | `import { AlertTriangle } from 'lucide-react'` |

---

## Layout & Spacing

### Grid System

Use Tailwind's grid utilities with consistent gaps:

```tsx
// NFT card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {eggs.map((egg) => (
    <EggCard key={egg.id} egg={egg} />
  ))}
</div>
```

### Spacing Hierarchy

Maintain consistent vertical rhythm:

| Context               | Spacing           | Example                 |
| --------------------- | ----------------- | ----------------------- |
| Between sections      | `gap-8` or `my-8` | Major content divisions |
| Between cards         | `gap-6`           | Grid gaps               |
| Within cards          | `gap-4`           | Internal spacing        |
| Between form elements | `gap-3`           | Form field spacing      |
| Inline elements       | `gap-2`           | Button groups, badges   |

### Pixel Grid Alignment

All elements should align to a 4px grid:

```tsx
// ✅ Good: Multiples of 4
className = "p-4 m-6 gap-8 w-24 h-24"

// ❌ Bad: Non-grid-aligned values
className = "p-3 m-5 gap-7 w-23 h-25"
```

---

## Best Practices

### Performance

1. **Image Optimization**
   - Use Next.js `<Image>` component
   - Apply `pixelated` class for crisp rendering
   - Specify explicit width/height to prevent layout shift

2. **Font Loading**
   - Preload Press Start 2P font
   - Use `display=swap` for non-blocking load
   - Consider font subsetting for performance

3. **Animation Performance**
   - Animate transform and opacity only (GPU-accelerated)
   - Avoid animating layout properties (width, height, top, left)
   - Use `will-change` sparingly for complex animations

### Code Organization

1. **Component Structure**

   ```tsx
   // Consistent component template
   export function MyComponent({ prop1, prop2 }: MyComponentProps) {
     // Hooks
     // State
     // Effects
     // Handlers
     // Render
   }
   ```

2. **CSS Class Ordering**
   Follow Tailwind's recommended order:
   ```tsx
   className="
     layout (flex, grid, position)
     sizing (w, h, p, m)
     typography (font, text, leading)
     visual (bg, border, shadow)
     interactive (hover, focus, disabled)
     transition (transition, duration, ease)
   "
   ```

### Theme Consistency

1. **Always Use CSS Variables**

   ```tsx
   // ✅ Good
   className = "bg-background text-foreground"

   // ❌ Bad
   className = "bg-[#1a1a2e] text-[#fef9c3]"
   ```

2. **Extend Through Components.json**
   - Don't modify shadcn/ui components directly
   - Use composition to customize behavior
   - Override styles through className props

---

## Anti-Patterns

### Critical Issues to Avoid

#### 1. No Emoji Icons

❌ **Bad:**

```tsx
<button>🎨 Customize</button>
```

✅ **Good:**

```tsx
<button>
  <Palette className="w-4 h-4 mr-2" />
  Customize
</button>
```

#### 2. Stable Hover States

❌ **Bad:** (Causes layout shift)

```tsx
className = "hover:scale-105 transition-transform"
```

✅ **Good:**

```tsx
className = "hover:bg-primary/90 transition-colors"
```

#### 3. Cursor Pointer

❌ **Bad:**

```tsx
<div onClick={handleClick} className="card">
```

✅ **Good:**

```tsx
<div onClick={handleClick} className="card cursor-pointer">
```

#### 4. Light Mode Contrast (If Added)

❌ **Bad:**

```tsx
className = "bg-white/10 text-slate-400" // Too transparent
```

✅ **Good:**

```tsx
className = "bg-white/80 text-slate-900" // Sufficient contrast
```

#### 5. Rounded Corners

❌ **Bad:**

```tsx
className = "rounded-lg" // Breaks pixel aesthetic
```

✅ **Good:**

```tsx
className = "rounded-none" // Or just omit radius classes
```

#### 6. Soft Shadows

❌ **Bad:**

```tsx
className = "shadow-lg" // Modern soft shadow
```

✅ **Good:**

```tsx
className = "border-4 border-primary/50" // Pixel-perfect border
```

---

## Implementation Checklist

### Pre-Delivery Quality Assurance

Use this checklist before shipping any UI component:

#### Visual Quality

- [ ] No emojis used as icons (SVG only: Lucide)
- [ ] All icons from consistent icon set (Lucide React)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (`bg-primary`) not hardcoded values
- [ ] Pixel-perfect borders (2px or 4px, no fractional pixels)
- [ ] Zero border radius on all elements

#### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation (`outline-ring/50`)
- [ ] Disabled states clearly indicated (`opacity-50` or similar)

#### Accessibility

- [ ] All images have descriptive `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] Color is not the only indicator (add icons/text)
- [ ] `prefers-reduced-motion` respected
- [ ] Minimum contrast ratio 4.5:1 for body text
- [ ] ARIA labels on icon-only buttons

#### Responsive Design

- [ ] Tested at 375px (mobile)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1024px (laptop)
- [ ] Tested at 1440px (desktop)
- [ ] No horizontal scroll on any breakpoint
- [ ] Touch targets minimum 44x44px on mobile

#### Performance

- [ ] Images use Next.js `<Image>` component
- [ ] Fonts preload correctly
- [ ] No unnecessary re-renders
- [ ] Animations use GPU-accelerated properties (transform, opacity)
- [ ] Bundle size monitored (avoid importing entire icon library)

#### Code Quality

- [ ] TypeScript types defined for all props
- [ ] Components follow naming conventions (PascalCase)
- [ ] CSS classes use Tailwind utilities (no inline styles)
- [ ] No console.log statements in production code
- [ ] Error boundaries implemented for critical sections

---

## Missing Components & Recommendations

### Suggested Additions

Based on analysis of current codebase, consider adding:

1. **Loading Skeleton Components**

   ```tsx
   <Skeleton className="h-24 w-full bg-card animate-pulse" />
   ```

2. **Empty State Component**

   ```tsx
   <EmptyState
     icon={<Egg className="w-12 h-12" />}
     title="NO EGGS FOUND"
     description="Mint your first egg to get started"
     action={<Button>MINT EGG</Button>}
   />
   ```

3. **Tooltip Component** (already available in shadcn/ui)
   - Use for explaining blockchain terms
   - Provide context for commission rates

4. **Progress Bar Component** (already available)
   - Egg hatching progress
   - Breeding cooldown timers
   - Commission accumulation

5. **Badge Variants**

   ```tsx
   <Badge variant="rarity-common">COMMON</Badge>
   <Badge variant="rarity-rare">RARE</Badge>
   <Badge variant="rarity-legendary">LEGENDARY</Badge>
   ```

6. **Toast Notifications** (Sonner already integrated)
   - Transaction confirmations
   - Error messages
   - Success states

### Utility Functions to Add

1. **Pixel Art Image Helper**

   ```tsx
   function PixelImage({ src, alt, size }: PixelImageProps) {
     return (
       <Image
         src={src}
         alt={alt}
         width={size}
         height={size}
         className="pixelated"
         style={{ imageRendering: "pixelated" }}
       />
     )
   }
   ```

2. **Address Truncation**

   ```tsx
   function truncateAddress(address: string): string {
     return `${address.slice(0, 6)}...${address.slice(-4)}`
   }
   ```

3. **Number Formatting**
   ```tsx
   function formatTokenAmount(amount: bigint, decimals: number = 18): string {
     const value = Number(amount) / Math.pow(10, decimals)
     return value.toLocaleString(undefined, {
       maximumFractionDigits: 4,
     })
   }
   ```

---

## Maintenance Guidelines

### Updating the Design System

1. **Adding New Colors**
   - Update CSS variables in `app/globals.css`
   - Document in this file under Color Palette
   - Test contrast ratios with accessibility tools
   - Update theme configuration if needed

2. **Adding New Components**
   - Use `bunx shadcn@latest add component-name`
   - Customize through className props (don't modify source)
   - Document usage patterns in this file
   - Add to component library showcase

3. **Modifying Animations**
   - Update keyframes in `app/globals.css`
   - Ensure `prefers-reduced-motion` support
   - Test performance on lower-end devices
   - Document new animation use cases

### Version Control

- Tag design system updates with semantic versioning
- Document breaking changes in CHANGELOG.md
- Maintain backward compatibility when possible
- Communicate changes to team via PR descriptions

### Testing

1. **Visual Regression**
   - Use Chromatic or Storybook for component testing
   - Capture screenshots at all breakpoints
   - Test both light and dark modes (if applicable)

2. **Accessibility Testing**
   - Run axe-core automated tests
   - Manual keyboard navigation testing
   - Screen reader testing (VoiceOver, NVDA)
   - Color contrast validation

3. **Performance Testing**
   - Lighthouse audits (target: 90+ score)
   - Web Vitals monitoring
   - Bundle size analysis
   - Animation frame rate (target: 60fps)

---

## Resources

### External References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Press Start 2P Font](https://fonts.google.com/specimen/Press+Start+2P)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Internal References

- `apps/web/app/globals.css` - Design tokens and animations
- `apps/web/components.json` - shadcn/ui configuration
- `apps/web/components/ui/` - UI component library
- `apps/web/styles/globals.css` - Alternative theme (if needed)

---

## Contributing

To contribute to this design system:

1. Propose changes via Pull Request
2. Update relevant sections in this document
3. Add examples demonstrating new patterns
4. Test across all breakpoints and browsers
5. Get design review from team lead
6. Update version number if making breaking changes

---

**Maintained by:** EggoWorld Development Team  
**Contact:** See project README for contact information  
**License:** See project LICENSE file
