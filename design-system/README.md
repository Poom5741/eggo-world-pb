# EggoWorld Design System

> **Complete design system with claymorphism components, Jules Design tokens, and reusable UI library**

## 📦 What's Included

This design system provides:

- **Design Tokens** - Complete color, typography, spacing, and shadow system
- **Reusable Components** - 20+ pre-built components with claymorphism styling
- **Page Templates** - Dashboard, marketplace, and NFT page layouts
- **Documentation** - Comprehensive guides and usage examples

## 🚀 Quick Start

### 1. Use Existing Components

All components are ready to use in your pages:

```tsx
// Import primitives
import { Button, Card, Input, Badge } from '@/design-system/components/primitives'
import { EggCard, FoodCard, ListingCard } from '@/design-system/components/nft'

// Use in your page
export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="clay">Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Follow Page-Specific Rules

When building pages, check the page-specific overrides first:

```bash
design-system/eggoworld-nft-platform/pages/
├── dashboard.md       # Dashboard layout rules
├── marketplace.md     # Marketplace layout rules
├── eggs.md           # Egg management pages
└── mint.md           # Mint page rules
```

These files override the MASTER.md for page-specific layouts.

### 3. Component Index

#### Primitives (Base Components)

| Component | File | Description |
|-----------|------|-------------|
| `Card` | `primitives/Card.tsx` | Claymorphism card with variants |
| `Button` | `primitives/Button.tsx` | Buttons with clay and standard variants |
| `Input` | `primitives/Input.tsx` | Form inputs with clay styling |
| `Badge` | `primitives/Badge.tsx` | Status badges and tags |
| `Avatar` | `primitives/Avatar.tsx` | User avatars with status |

#### NFT Components

| Component | File | Description |
|-----------|------|-------------|
| `EggCard` | `nft/EggCard.tsx` | Egg NFT display card |
| `FoodCard` | `nft/FoodCard.tsx` | Food NFT display card |
| `ListingCard` | `nft/ListingCard.tsx` | Marketplace listing card |

## 📖 Documentation

### Master Design System

See [`MASTER.md`](./MASTER.md) for complete design token documentation:

- Color system with Jules Design tokens
- Typography scale (Space Grotesk, Plus Jakarta Sans)
- Spacing variables (4px - 64px)
- Shadow depths (claymorphism system)
- Border radius tokens

### Component Examples

#### Card Component

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/design-system/components/primitives'

// Standard clay card
<Card variant="default" shadow="md">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Card actions
  </CardFooter>
</Card>

// Compact variant
<Card variant="compact">
  <CardContent>Compact content</CardContent>
</Card>

// Interactive card
<Card variant="interactive" onClick={handleClick}>
  <CardContent>Clickable card</CardContent>
</Card>
```

#### Button Component

```tsx
import { Button } from '@/design-system/components/primitives'

// Clay buttons (primary UI)
<Button variant="clay" size="clay-md">Click Me</Button>
<Button variant="clay-secondary">Secondary</Button>
<Button variant="clay-outline">Outlined</Button>

// Standard buttons
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>

// Loading state
<Button loading>Loading...</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Heart className="w-5 h-5" />
</Button>
```

#### Badge Component

```tsx
import { Badge } from '@/design-system/components/primitives'

// Standard badges
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Error</Badge>

// Rarity badges (for NFTs)
<Badge variant="legendary">Legendary</Badge>
<Badge variant="epic">Epic</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium (default)</Badge>
<Badge size="lg">Large</Badge>
```

#### Egg Card Component

```tsx
import { EggCard } from '@/design-system/components/nft'

<EggCard
  image="/egg-1.png"
  name="Sun-Kissed Shell #042"
  rarity="legendary"
  price={1.24}
  foodCount={3}
  maxFoodCount={10}
  isReady={true}
  onClick={() => router.push(`/eggs/123`)}
/>
```

#### Food Card Component

```tsx
import { FoodCard } from '@/design-system/components/nft'

<FoodCard
  image="/food-berry.png"
  name="Berry Boost Pack"
  effect="+25 Energy"
  price={0.05}
  rarity="uncommon"
  onBuy={handleBuy}
/>
```

## 🎨 Design Principles

### Claymorphism

1. **Volume** - Use inner shadows to create 3D volume effect
2. **Depth** - Outer shadows for elevation and separation
3. **Softness** - Large border radius (16px+) for friendly feel
4. **Lighting** - Highlights from top-left, shadows bottom-right

### Color Usage

1. **Primary Actions** - Use `primary-container` with `on-primary` text
2. **Secondary Actions** - Use `secondary-container` with `on-secondary` text
3. **Success States** - Use `tertiary-container` for positive feedback
4. **Text** - Always use `on-surface` or `on-surface-variant` for contrast

### Accessibility

1. **Touch Targets** - Minimum 44×44px for all interactive elements
2. **Contrast Ratio** - 4.5:1 minimum for text (WCAG AA)
3. **Focus States** - Visible focus rings on all interactive elements
4. **Reduced Motion** - Respect `prefers-reduced-motion` preference

## 📱 Responsive Design

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | 375px | iPhone Mini, small phones |
| Mobile Large | 428px | iPhone Max, large phones |
| Tablet | 768px | iPad Portrait |
| Desktop | 1024px | Laptop, desktop |
| Large Desktop | 1440px | Large monitors |

### Responsive Utilities

```tsx
// Hide/show based on screen size
className="hidden lg:block"  // Desktop only
className="block lg:hidden"  // Mobile only

// Responsive spacing
className="p-4 md:p-6 lg:p-8"

// Responsive grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

## ✅ Pre-Delivery Checklist

Before delivering any UI work, verify:

- [ ] No emojis used as icons (use Lucide React)
- [ ] All icons from consistent icon set
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

## 🚫 Anti-Patterns

### NEVER DO

```tsx
// ❌ Emoji as icon
<div>🎨 Collect Art</div>

// ✅ Use Lucide icon
<div><Palette className="w-5 h-5" /> Collect Art</div>

// ❌ Missing cursor pointer
<div onClick={handleClick} className="hover:bg-primary">
  
// ✅ Add cursor-pointer
<div onClick={handleClick} className="hover:bg-primary cursor-pointer">

// ❌ Instant hover state
<div className="hover:bg-primary">

// ✅ Smooth transition
<div className="hover:bg-primary transition-colors duration-200">

// ❌ Low contrast text
<p className="text-slate-400">  // Too light

// ✅ Sufficient contrast
<p className="text-slate-600">  // Readable
```

## 🔧 Development

### Component Structure

```tsx
export interface ComponentProps {
  // Props definition
}

export function Component({ prop }: ComponentProps) {
  // Component implementation
}
```

### Testing

All components should be tested at:

- Mobile: 375px, 428px
- Tablet: 768px, 1024px
- Desktop: 1440px

### Performance

- Use `will-change: transform` on animated cards
- Lazy load images with Next.js Image
- Reduce shadow complexity on mobile
- Virtualize long lists

## 📚 Resources

- **MASTER.md** - Complete design token reference
- **pages/** - Page-specific layout rules
- **components/** - Reusable component library
- **resources/eggo-world-uxui-jules/** - Original Jules Design reference

## 🤝 Contributing

When adding new components:

1. Follow existing token system
2. Support light/dark mode
3. Ensure accessibility compliance
4. Test at all breakpoints
5. Update this documentation

---

**Generated:** 2026-04-22  
**Version:** 2.0 (Claymorphism)  
**Stack:** Next.js 16 + React 19 + Tailwind CSS 4
