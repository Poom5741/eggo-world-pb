# Design System Quick Reference

**EggoWorld NFT Game - Retro 8-bit Pixel Gaming Aesthetic**

---

## Color Palette (Quick Access)

```css
/* Primary Colors */
--background: #1a1a2e;      /* Deep navy */
--foreground: #fef9c3;      /* Pale yellow */
--primary: #facc15;         /* Golden yellow (CTAs) */
--secondary: #0f3460;       /* Dark blue */
--accent: #e94560;          /* Coral red (alerts) */
--card: #16213e;            /* Medium navy */

/* Usage */
bg-background text-foreground    /* Default page */
bg-primary text-primary-foreground  /* Buttons */
bg-card border-4 border-primary/50  /* Cards */
```

## Typography (Copy-Paste Ready)

```tsx
// Headings
className = "font-[var(--font-pixel)] text-2xl md:text-3xl text-primary"

// Body Text
className = "font-[var(--font-pixel)] text-xs text-foreground"

// Labels
className = "font-[var(--font-pixel)] text-[10px] text-muted-foreground uppercase"

// Wallet Addresses
className = "font-mono text-xs text-muted-foreground"
```

## Component Classes

### Buttons

```tsx
// Primary
<button className="btn-primary">ACTION</button>

// Secondary
<button className="btn-secondary">CANCEL</button>

// Ghost
<button className="btn-ghost">LEARN MORE</button>
```

### Cards

```tsx
// Primary Card
<div className="card--primary">Content</div>

// Secondary Card
<div className="card--secondary">Content</div>

// Accent Card (Important)
<div className="card--accent">Content</div>
```

### Forms

```tsx
// Input
<input className="input-field" placeholder="Enter address..." />

// Label
<label className="label">WALLET ADDRESS</label>
```

### Info Boxes

```tsx
// Error
<div className="info-error">Error message</div>

// Success
<div className="info-success">Success message</div>

// Warning
<div className="info-warning">Warning message</div>
```

## Common Patterns

### Page Layout

```tsx
<main className="page-container">
  <h1 className="page-title">PAGE TITLE</h1>
  <h2 className="section-title">Section Header</h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{/* Cards */}</div>
</main>
```

### NFT Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map((item) => (
    <div key={item.id} className="card--primary cursor-pointer hover:bg-card/80 transition-colors">
      {/* Card Content */}
    </div>
  ))}
</div>
```

### Form Group

```tsx
<div className="space-y-3">
  <label className="label">LABEL TEXT</label>
  <input className="input-field" type="text" />
  <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">Helper text</p>
</div>
```

## Animations

```tsx
// Floating elements
className = "animate-float"

// Twinkling stars
className = "animate-twinkle"

// Glitch effect (errors)
className = "animate-glitch"

// Pulse glow (important CTAs)
className = "animate-pulse-glow"

// Shooting stars (hero)
className = "animate-shooting-star"

// Marquee (tickers)
className = "animate-marquee"
```

## Spacing Cheat Sheet

```tsx
// Padding
p-3   // 12px - Small cards
p-6   // 24px - Standard cards

// Margins
m-4   // 16px - Between elements
m-6   // 24px - Between sections

// Gaps
gap-4 // 16px - Grid gaps
gap-6 // 24px - Section gaps

// Button padding
px-6 py-3  // Standard buttons
px-4 py-2  // Small buttons
```

## Border Widths

```tsx
border - 2 // Inputs, subtle elements
border - 4 // Buttons, cards, primary elements
```

## Responsive Breakpoints

```tsx
// Mobile-first approach
className="
  text-xs           // Mobile (default)
  sm:text-sm        // 640px+
  md:text-base      // 768px+
  lg:text-lg        // 1024px+
  xl:text-xl        // 1280px+
"

// Grid columns
className="
  grid-cols-1       // Mobile
  sm:grid-cols-2    // Tablet
  lg:grid-cols-3    // Laptop
  xl:grid-cols-4    // Desktop
"
```

## Accessibility Checklist

- [ ] `cursor-pointer` on clickable elements
- [ ] `alt` text on images
- [ ] `<label>` for form inputs
- [ ] Focus rings visible (`outline-ring/50`)
- [ ] Contrast ratio ≥ 4.5:1
- [ ] `prefers-reduced-motion` respected
- [ ] ARIA labels on icon buttons

## Anti-Patterns (Never Do)

❌ No emojis as icons  
❌ No rounded corners (`rounded-lg`)  
❌ No soft shadows (`shadow-lg`)  
❌ No hardcoded colors (`bg-[#1a1a2e]`)  
❌ No scale transforms on hover (layout shift)  
❌ No missing `cursor-pointer` on interactive elements

## Icon Usage

```tsx
import { Wallet, Egg, Flame } from 'lucide-react';

// Standard size
<Wallet className="w-6 h-6" />

// Small size
<Egg className="w-4 h-4" />

// With accessibility
<button aria-label="Open wallet">
  <Wallet className="w-6 h-6" />
</button>
```

## Pixel Art Images

```tsx
import Image from "next/image"

;<Image
  src="/egg.png"
  alt="Pixel egg"
  width={64}
  height={64}
  className="pixelated"
  style={{ imageRendering: "pixelated" }}
/>
```

## Quick Start Template

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function MyComponent() {
  return (
    <main className="page-container">
      <h1 className="page-title">MY PAGE</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="card--primary">
          <h2 className="section-title mb-4">Section 1</h2>
          <p className="font-[var(--font-pixel)] text-xs text-foreground">Content here</p>
          <Button className="btn-primary mt-4">ACTION</Button>
        </Card>
      </div>
    </main>
  )
}
```

---

**Full Documentation:** See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)  
**Last Updated:** 2026-04-04
