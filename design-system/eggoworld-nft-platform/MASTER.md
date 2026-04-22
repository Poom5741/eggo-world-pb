# EggoWorld Design System

> **Design System Master File** - Global Source of Truth
> 
> **USAGE:** When building a page, first check `design-system/pages/[page-name].md`.
> If page file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** EggoWorld NFT Platform  
**Version:** 2.0 (Claymorphism + Jules Design)  
**Generated:** 2026-04-22  
**Category:** NFT/Web3 Gaming Platform  
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui

---

## 🎨 Design Tokens

### Color System

#### Primary Colors (Jules Design System)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#776300` | Primary actions, links |
| `--color-primary-container` | `#ffd709` | Primary backgrounds, buttons |
| `--color-on-primary` | `#ffffff` | Text on primary |
| `--color-on-primary-container` | `#5b4b00` | Text on primary container |

#### Secondary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-secondary` | `#995200` | Secondary actions |
| `--color-secondary-container` | `#ffc69a` | Secondary backgrounds |
| `--color-on-secondary` | `#ffffff` | Text on secondary |
| `--color-on-secondary-container` | `#6f3a00` | Text on secondary container |

#### Tertiary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-tertiary` | `#00750c` | Success states, growth |
| `--color-tertiary-container` | `#59ee50` | Success backgrounds |
| `--color-on-tertiary` | `#ffffff` | Text on tertiary |
| `--color-on-tertiary-container` | `#005406` | Text on tertiary container |

#### Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface` | `#fffbff` | Card backgrounds |
| `--color-surface-container-low` | `#fffae1` | Low elevation surfaces |
| `--color-surface-container` | `#fef6a5` | Default surfaces |
| `--color-surface-container-high` | `#f9f19b` | High elevation surfaces |
| `--color-surface-container-highest` | `#f3eb91` | Highest elevation |
| `--color-on-surface` | `#3d3905` | Body text |
| `--color-on-surface-variant` | `#6b662f` | Muted text |

#### Error Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-error` | `#be2d06` | Error states |
| `--color-error-container` | `#f95630` | Error backgrounds |
| `--color-on-error` | `#ffffff` | Text on error |

#### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-outline` | `#878248` | Borders, dividers |
| `--color-outline-variant` | `#c2bb7b` | Subtle borders |

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps, icon spacing |
| `--space-sm` | `8px` / `0.5rem` | Small gaps, inline padding |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large section gaps |
| `--space-2xl` | `48px` / `3rem` | Hero padding |
| `--space-3xl` | `64px` / `4rem` | Major section spacing |

### Typography System

#### Font Families

```css
--font-headline: 'Space Grotesk', sans-serif;  /* Headings, display */
--font-body: 'Plus Jakarta Sans', sans-serif;   /* Body text, paragraphs */
--font-label: 'Plus Jakarta Sans', sans-serif;  /* Labels, captions */
--font-pixel: 'Silkscreen', cursive;            /* Pixel-style accents */
```

#### Font Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | `64px` / `4rem` | 900 | 1.1 | Hero headlines |
| H1 | `48px` / `3rem` | 900 | 1.2 | Page titles |
| H2 | `36px` / `2.25rem` | 900 | 1.3 | Section headers |
| H3 | `28px` / `1.75rem` | 800 | 1.3 | Subsections |
| H4 | `22px` / `1.375rem` | 700 | 1.4 | Card titles |
| Body | `16px` / `1rem` | 400 | 1.6 | Body text |
| Label | `14px` / `0.875rem` | 600 | 1.5 | Labels, buttons |
| Caption | `12px` / `0.75rem` | 500 | 1.5 | Small text |

### Shadow System (Claymorphism)

```css
/* Claymorphism Shadows - Volume + Depth */
--shadow-clay-sm: 4px 4px 8px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.1);
--shadow-clay-md: 8px 8px 16px rgba(0,0,0,0.12), inset 4px 4px 8px rgba(255,255,255,0.15);
--shadow-clay-lg: 12px 12px 24px rgba(0,0,0,0.15), inset 6px 6px 12px rgba(255,255,255,0.2);
--shadow-clay-xl: 16px 16px 32px rgba(0,0,0,0.2), inset 8px 8px 16px rgba(255,255,255,0.25);
--shadow-clay-2xl: 20px 20px 40px rgba(0,0,0,0.25), inset 10px 10px 20px rgba(255,255,255,0.3);
```

### Border Radius System

```css
/* Claymorphism Radius */
--radius-clay-sm: 16px;      /* Small buttons, badges */
--radius-clay: 20px;         /* Default cards */
--radius-clay-md: 24px;      /* Medium cards */
--radius-clay-lg: 32px;      /* Large cards */
--radius-clay-xl: 48px;      /* Hero elements */
--radius-clay-full: 9999px;  /* Pills, circles */
```

---

## 🧩 Component Library

### Button Variants

#### Clay Buttons (Primary UI)

```tsx
// Usage: <Button variant="clay" size="clay-md">Click Me</Button>
<Button variant="clay">           // Primary clay button
<Button variant="clay-secondary"> // Secondary clay button
<Button variant="clay-outline">   // Outlined clay button
```

#### Standard Buttons

```tsx
<Button variant="default">   // Primary color
<Button variant="secondary"> // Secondary color
<Button variant="outline">   // Outlined
<Button variant="ghost">     // Transparent hover
<Button variant="destructive"> // Error/danger
```

#### Size Guide

```tsx
size="clay-sm"    // h-8, rounded-clay-sm
size="clay-md"    // h-10, rounded-clay (default)
size="clay-lg"    // h-12, rounded-clay-md
size="clay-xl"    // h-14, rounded-clay-lg
```

### Cards

#### Clay Card

```tsx
<div className="bg-surface rounded-clay shadow-clay-md hover:shadow-clay-lg transition-shadow">
  <CardHeader>Title</CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Actions</CardFooter>
</div>
```

#### Container Cards

```tsx
// Container variants for different elevations
className="bg-surface-container-low rounded-clay-lg p-6"
className="bg-surface-container rounded-clay p-6"
className="bg-surface-container-high rounded-clay-sm p-6"
```

### Inputs

#### Clay Input

```tsx
<Input 
  className="clay-input bg-surface rounded-clay shadow-clay-inset focus:ring-primary"
  placeholder="Enter text..."
/>
```

#### Standard Input

```tsx
<Input 
  className="bg-background border-2 border-primary/30 focus:border-primary"
  placeholder="Email address"
/>
```

### Badges

```tsx
<Badge variant="primary">     // Primary color
<Badge variant="secondary">   // Secondary color
<Badge variant="success">     // Success (green)
<Badge variant="warning">     // Warning (amber)
<Badge variant="error">       // Error (red)
```

### Dialogs

```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent className="rounded-clay-xl shadow-clay-xl">
    <DialogHeader>Title</DialogHeader>
    <DialogDescription>Description</DialogDescription>
    {/* Form content */}
    <DialogFooter>Actions</DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📐 Layout System

### Container

```tsx
// Responsive container with max-width
<div className="max-w-7xl mx-auto px-6">
  {/* Content */}
</div>
```

### Grid System

```tsx
// Responsive grids
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
```

### Section Spacing

```tsx
// Standard section
<section className="py-24 px-6">
  
// Hero section
<section className="py-32 px-6">
  
// Compact section
<section className="py-16 px-6">
```

---

## 🎭 Design Guidelines

### Claymorphism Principles

1. **Volume**: Use inner shadows to create 3D volume effect
2. **Depth**: Outer shadows for elevation and separation
3. **Softness**: Large border radius (16px+) for friendly feel
4. **Lighting**: Highlights from top-left, shadows bottom-right

### Color Usage

1. **Primary Actions**: Use `primary-container` with `on-primary` text
2. **Secondary Actions**: Use `secondary-container` with `on-secondary` text
3. **Success States**: Use `tertiary-container` for positive feedback
4. **Surfaces**: Layer surface containers for depth hierarchy
5. **Text**: Always use `on-surface` or `on-surface-variant` for contrast

### Typography Hierarchy

1. **Headlines**: Space Grotesk, 900 weight for impact
2. **Body**: Plus Jakarta Sans, 400-600 weight for readability
3. **Accents**: Silkscreen for pixel-style game elements
4. **Minimum Size**: 16px for body, 14px for labels

### Accessibility

1. **Touch Targets**: Minimum 44×44px for all interactive elements
2. **Contrast Ratio**: 4.5:1 minimum for text (WCAG AA)
3. **Focus States**: Visible focus rings on all interactive elements
4. **Reduced Motion**: Respect `prefers-reduced-motion` preference

---

## 🚫 Anti-Patterns

### NEVER DO

- ❌ **Emojis as icons** — Use Lucide React icons
- ❌ **Missing cursor:pointer** — All clickable must have pointer cursor
- ❌ **Layout-shifting hovers** — Use opacity/color, not scale transforms
- ❌ **Low contrast text** — Minimum 4.5:1 contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus rings must be visible
- ❌ **Horizontal scroll** — Test at 375px width
- ❌ **Content behind nav** — Account for fixed header height
- ❌ **Translucent in light mode** — Use higher opacity backgrounds
- ❌ **Suppress TypeScript errors** — Fix types properly

### Common Mistakes

```tsx
// ❌ WRONG: Emoji as icon
<div>🎨 Collect Art</div>

// ✅ CORRECT: Lucide icon
<div><Palette className="w-5 h-5" /> Collect Art</div>

// ❌ WRONG: No cursor pointer on clickable
<div onClick={handleClick} className="hover:bg-primary">
  
// ✅ CORRECT: Add cursor-pointer
<div onClick={handleClick} className="hover:bg-primary cursor-pointer">

// ❌ WRONG: Instant hover state
<div className="hover:bg-primary">

// ✅ CORRECT: Smooth transition
<div className="hover:bg-primary transition-colors duration-200">

// ❌ WRONG: Low contrast text
<p className="text-slate-400">  // Too light in light mode

// ✅ CORRECT: Sufficient contrast
<p className="text-slate-600">  // Readable
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Device | Layout Change |
|------------|-------|--------|---------------|
| Mobile | 375px | iPhone Mini | Single column |
| Mobile Large | 428px | iPhone Max | Single column |
| Tablet | 768px | iPad Portrait | 2 columns |
| Desktop | 1024px | Laptop | Sidebar visible |
| Large Desktop | 1440px | Desktop | Max container width |

### Responsive Utilities

```tsx
// Hide/show based on screen size
className="hidden lg:block"  // Desktop only
className="block lg:hidden"  // Mobile only

// Responsive spacing
className="p-4 md:p-6 lg:p-8"

// Responsive text
className="text-lg md:text-xl lg:text-2xl"

// Responsive grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

---

## 🎨 Animation Guidelines

### Standard Transitions

```css
/* Button hover */
transition-all duration-200 ease-in-out

/* Card hover */
transition-shadow duration-300 ease-out

/* Fade in */
transition-opacity duration-300 ease-in
```

### Custom Animations

```css
/* Float animation (eggs, NFTs) */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Pulse glow */
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.4)); }
  50% { filter: drop-shadow(0 0 40px rgba(250, 204, 21, 0.8)); }
}
```

---

## 🧪 Testing Checklist

### Visual Quality

- [ ] No emojis used as icons
- [ ] Consistent icon set (Lucide React)
- [ ] Hover states don't cause layout shift
- [ ] Smooth transitions (150-300ms)
- [ ] Use theme colors directly (not var() wrappers)

### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear feedback
- [ ] Focus states visible for keyboard navigation
- [ ] Touch targets minimum 44×44px

### Light/Dark Mode

- [ ] Light mode text has 4.5:1 contrast
- [ ] Glass elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout

- [ ] Floating elements have proper spacing
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color not sole indicator
- [ ] `prefers-reduced-motion` respected

---

## 📚 Component Examples

### Egg Card Example

```tsx
<div className="bg-surface rounded-clay-xl shadow-clay-lg overflow-hidden group cursor-pointer">
  <div className="relative aspect-square">
    <img 
      src={eggImage} 
      alt={eggName}
      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
    />
    <Badge className="absolute top-4 right-4">{rarity}</Badge>
  </div>
  <div className="p-6 space-y-4">
    <h3 className="font-headline font-black text-xl">{eggName}</h3>
    <div className="flex justify-between items-center">
      <span className="font-bold text-2xl">{price} ETH</span>
      <Button variant="clay" size="clay-sm">Buy Now</Button>
    </div>
  </div>
</div>
```

### Food Card Example

```tsx
<div className="bg-surface-container-high rounded-clay p-6 shadow-clay-md">
  <img src={foodImage} alt={foodName} className="w-full h-40 object-contain mb-4" />
  <h3 className="font-headline font-black text-lg">{foodName}</h3>
  <p className="text-on-surface-variant text-sm mt-2">{effect}</p>
  <div className="mt-4 flex justify-between items-center">
    <span className="font-bold">{price} ETH</span>
    <Button variant="clay" size="clay-sm">Buy</Button>
  </div>
</div>
```

### Dashboard Card Example

```tsx
<div className="bg-surface-container rounded-clay-lg p-6 shadow-clay-md">
  <div className="flex items-center gap-4 mb-4">
    <div className="w-12 h-12 bg-primary-container rounded-clay-full flex items-center justify-center">
      <Wallet className="w-6 h-6 text-on-primary" />
    </div>
    <div>
      <h4 className="font-headline font-bold text-lg">Total Balance</h4>
      <p className="text-on-surface-variant text-sm">Updated just now</p>
    </div>
  </div>
  <div className="text-3xl font-black font-headline">{balance} USDT</div>
</div>
```

---

## 🔧 Utilities

### Claymorphism Classes

```css
.clay-card          // Standard clay card shadow
.clay-card-inset    // Inset clay shadow
.clay-btn           // Clay button shadow
.clay-input         // Clay input field
.clay-inset         // Deep inset effect
.glass-panel        // Glassmorphism panel
```

### Spacing Classes

```css
.p-clay-sm          // 12px padding
.p-clay             // 16px padding
.p-clay-md          // 20px padding
.p-clay-lg          // 24px padding
.p-clay-xl          // 32px padding

.gap-clay-sm        // 12px gap
.gap-clay           // 16px gap
.gap-clay-lg        // 24px gap
```

### Shadow Classes

```css
.shadow-clay-sm     // Small clay shadow
.shadow-clay-md     // Medium clay shadow
.shadow-clay-lg     // Large clay shadow
.shadow-clay-xl     // Extra large clay shadow
.shadow-clay-2xl    // Largest clay shadow
```

### Radius Classes

```css
.rounded-clay-sm    // 16px radius
.rounded-clay       // 20px radius
.rounded-clay-md    // 24px radius
.rounded-clay-lg    // 32px radius
.rounded-clay-xl    // 48px radius
.rounded-clay-full  // Full circle
```

---

## 🎯 Performance Optimizations

### Shadow Optimization

```css
/* Hardware acceleration for clay shadows */
[class*="shadow-clay-"] {
  will-change: box-shadow;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Reduce shadow complexity on mobile */
@media (max-width: 768px) {
  .shadow-clay-2xl {
    box-shadow: var(--shadow-clay-lg) !important;
  }
}
```

### Animation Optimization

```css
/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .clay-button,
  .clay-card,
  [class*="shadow-clay-"] {
    transition: none !important;
  }
  
  .animate-float {
    animation: none;
  }
}
```

---

## 📝 Changelog

### v2.0 (2026-04-22)
- ✅ Complete claymorphism shadow system
- ✅ Jules Design color tokens integrated
- ✅ Comprehensive component library
- ✅ Mobile-first responsive guidelines
- ✅ Accessibility standards (WCAG 2.2)
- ✅ Performance optimizations

### v1.0 (2026-03-29)
- Initial design system
- Basic color tokens
- Standard component set

---

## 🤝 Contributing

When adding new components:

1. Follow existing token system
2. Support light/dark mode
3. Ensure accessibility compliance
4. Test at all breakpoints
5. Update this documentation

For questions or clarifications, refer to:
- Component examples in `apps/web/components/`
- Page implementations in `apps/web/app/`
- Reference designs in `resources/eggo-world-uxui-jules/`
