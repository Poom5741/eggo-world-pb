# Design System Showcase

**Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Project:** EggoWorld NFT Marketplace

---

## Table of Contents

1. [Claymorphism Component Showcase](#claymorphism-component-showcase)
2. [Button Variants](#button-variants)
3. [Card Variants](#card-variants)
4. [NFT Cards (Hybrid Example)](#nft-cards-hybrid-example)
5. [Input Fields](#input-fields)
6. [Badges](#badges)
7. [Progress Bars](#progress-bars)
8. [Dialogs/Modals](#dialogsmodals)

---

## Claymorphism Component Showcase

This showcase demonstrates all claymorphism component variants with code examples and visual descriptions.

---

## Button Variants

### Clay Button (Primary)

```tsx
<Button variant="clay" size="clay-md">
  Primary Action
</Button>
```

**Visual appearance:**

- Rounded corners (20px radius for md size)
- Dual-layer shadows (outer + inner)
- Hover increases shadow depth
- Active decreases shadow (pressed effect)
- Smooth 200ms transition
- Background: Primary yellow (#facc15)
- Text: Primary foreground (#1a1a2e)

---

### Clay Button (Secondary)

```tsx
<Button variant="clay-secondary" size="clay-md">
  Secondary Action
</Button>
```

**Visual appearance:**

- Same shadow system as primary
- Background: Secondary blue (#0f3460)
- Text: Secondary foreground (#fef9c3)

---

### Clay Button (Outline)

```tsx
<Button variant="clay-outline" size="clay-md">
  Outline Action
</Button>
```

**Visual appearance:**

- Clay shadow with transparent background
- Border: Primary color with 20% opacity
- Hover fills with subtle primary tint

---

### Clay Button Sizes

```tsx
// Small - for compact UI
<Button variant="clay" size="clay-sm">
  Small
</Button>

// Medium - standard (default)
<Button variant="clay" size="clay-md">
  Medium
</Button>

// Large - for emphasis
<Button variant="clay" size="clay-lg">
  Large
</Button>

// Extra Large - for hero CTAs
<Button variant="clay" size="clay-xl">
  Extra Large
</Button>
```

**Size comparison:**

- `clay-sm`: Height 32px, radius 16px, padding 12px
- `clay-md`: Height 40px, radius 20px, padding 16px
- `clay-lg`: Height 48px, radius 24px, padding 20px
- `clay-xl`: Height 56px, radius 32px, padding 24px

---

## Card Variants

### Standard Clay Card

```tsx
<Card variant="clay">
  <CardHeader>
    <CardTitle>Standard Card</CardTitle>
  </CardHeader>
  <CardContent>Content goes here...</CardContent>
</Card>
```

**Visual appearance:**

- 24px radius (clay-rounded-md)
- clay-lg shadow (standard depth)
- Appears to float ~6px above surface
- Background: Card blue (#16213e)

---

### Featured Clay Card

```tsx
<Card variant="clay-lg">
  <CardHeader>
    <CardTitle>Featured Card</CardTitle>
  </CardHeader>
  <CardContent>More prominent content...</CardContent>
</Card>
```

**Visual appearance:**

- 32px radius (clay-rounded-lg)
- clay-xl shadow (featured depth)
- Appears to float ~8px above surface
- More prominent than standard card

---

### Hero Clay Card

```tsx
<Card variant="clay-xl">
  <CardHeader>
    <CardTitle>Hero Card</CardTitle>
  </CardHeader>
  <CardContent>Maximum depth content...</CardContent>
</Card>
```

**Visual appearance:**

- 40px radius (clay-rounded-xl)
- clay-2xl shadow (maximum depth)
- Appears to float ~12px above surface
- Used for hero sections, featured NFTs

---

## NFT Cards (Hybrid Example)

### EggCard with Hybrid Clay-Pixel Approach

```tsx
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function EggCard({ egg }) {
  return (
    <Card variant="clay-lg" className="overflow-hidden">
      {/* Clay frame */}
      <div className="p-clay-lg">
        {/* Pixel sprite (preserved) */}
        <img src={egg.sprite} alt={egg.name} className="w-32 h-32 pixelated mx-auto" />

        {/* Pixel typography (preserved) */}
        <h3 className="font-[var(--font-pixel)] text-xs mt-clay-md text-center">{egg.name}</h3>

        <p className="text-muted-foreground text-xs mt-clay-sm text-center">ID: #{egg.id}</p>

        {/* Rarity badge with clay effect */}
        <Badge variant="default" className="absolute top-3 right-3 shadow-clay-sm">
          {egg.rarity.toUpperCase()}
        </Badge>

        {/* Clay buttons */}
        <div className="flex gap-clay-md mt-clay-lg">
          <Button variant="clay" size="clay-sm" className="flex-1">
            Feed
          </Button>
          <Button variant="clay" size="clay-sm" className="flex-1" disabled={!egg.canHatch}>
            Hatch
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

**Visual appearance:**

- Clay container: 32px radius, xl shadow
- Pixel sprite: sharp edges, pixelated rendering
- Clear contrast between clay frame and pixel content
- Intentional hybrid aesthetic
- Badge floats with clay-sm shadow
- Buttons use clay-md shadow on hover

---

### FoodCard Example

```tsx
<Card variant="clay" className="overflow-hidden">
  <div className="relative">
    {/* Pixel food sprite */}
    <img src={food.sprite} alt={food.name} className="w-24 h-24 pixelated mx-auto p-clay-md" />

    {/* Clay badge for quantity */}
    <Badge variant="secondary" className="absolute top-2 right-2">
      x{food.quantity}
    </Badge>
  </div>

  <CardContent className="text-center">
    <h4 className="font-[var(--font-pixel)] text-xs">{food.name}</h4>
    <p className="text-xs text-muted-foreground mt-clay-sm">{food.energy} Energy</p>

    <Button variant="clay" size="clay-sm" className="w-full mt-clay-md">
      Use
    </Button>
  </CardContent>
</Card>
```

---

## Input Fields

### Standard Clay Input

```tsx
<Input placeholder="Enter wallet address..." className="clay-input" />
```

**Visual appearance:**

- 20px radius (clay-rounded)
- Subtle clay-sm shadow
- Focus enhances to clay-md shadow
- Smooth transition (200ms)
- Border becomes primary color on focus
- Background: Card blue (#16213e)

---

### Input with Label

```tsx
<div className="flex flex-col gap-clay-sm">
  <label className="text-sm font-medium">Wallet Address</label>
  <Input placeholder="0x..." className="clay-input" />
</div>
```

---

### Input States

```tsx
// Default state
<Input className="clay-input" />

// Focus state (automatic)
<Input className="clay-input" autoFocus />

// Disabled state
<Input className="clay-input" disabled />

// Error state
<Input
  className="clay-input border-destructive"
  aria-invalid="true"
/>
```

---

## Badges

### Badge Variants

```tsx
// Default badge (primary yellow)
<Badge variant="default">Default</Badge>

// Secondary badge (blue)
<Badge variant="secondary">Secondary</Badge>

// Outline badge
<Badge variant="outline">Outline</Badge>

// Ghost badge (minimal)
<Badge variant="ghost">Ghost</Badge>
```

**Visual appearance:**

- 16px radius (clay-rounded-sm)
- Subtle clay-sm shadow
- Pill shape
- Small, compact size
- All variants maintain consistent shadow

---

### Badge Usage Examples

```tsx
// Status badge
<Badge variant="default">Active</Badge>

// Count badge
<Badge variant="secondary">
  +3
</Badge>

// New feature badge
<Badge variant="default" className="animate-pulse">
  NEW
</Badge>

// Rarity badge (on NFT cards)
<Badge
  variant="default"
  className={cn(
    egg.rarity === 'legendary' && 'bg-accent',
    egg.rarity === 'rare' && 'bg-secondary',
    egg.rarity === 'common' && 'bg-muted'
  )}
>
  {egg.rarity.toUpperCase()}
</Badge>
```

---

## Progress Bars

### Standard Progress

```tsx
<Progress value={67} className="h-3" />
```

**Visual appearance:**

- Full radius (clay-rounded-full) for pill shape
- Container has inner shadow (recessed appearance)
- Fill has gradient for volume
- Subtle shadow on fill (raised appearance)
- Smooth transition on value change

---

### Progress with Label

```tsx
<div className="flex flex-col gap-clay-sm">
  <div className="flex justify-between text-xs">
    <span>Progress</span>
    <span className="font-medium">67%</span>
  </div>
  <Progress value={67} className="h-3" />
</div>
```

---

### Circular Progress (Clay Container)

```tsx
<div className="relative w-32 h-32">
  {/* Clay container */}
  <div className="absolute inset-0 rounded-clay-full shadow-clay-md bg-muted" />

  {/* Circular progress content */}
  <div
    className="absolute inset-2 rounded-clay-full bg-primary"
    style={{
      clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
    }}
  />

  {/* Center label */}
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="font-[var(--font-pixel)] text-xs">{progress}%</span>
  </div>
</div>
```

---

## Dialogs/Modals

### Standard Dialog

```tsx
<DialogContent className="rounded-clay-xl shadow-clay-2xl">
  <DialogHeader>
    <DialogTitle className="font-[var(--font-pixel)]">Modal Title</DialogTitle>
    <DialogDescription>This is a description of the modal.</DialogDescription>
  </DialogHeader>

  <DialogContent>{/* Modal content */}</DialogContent>

  <DialogFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="clay">Confirm</Button>
  </DialogFooter>
</DialogContent>
```

**Visual appearance:**

- 40px radius (clay-xl)
- Maximum depth (clay-2xl shadow)
- Floats above page content
- Clear visual hierarchy
- Backdrop blur (if supported)

---

### Confirmation Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="clay">Delete NFT</Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="rounded-clay-xl shadow-clay-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="font-[var(--font-pixel)]">Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your NFT.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="clay-input">Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Responsive Patterns

### Mobile-First Clay Cards

```tsx
<Card variant="clay" className="sm:rounded-clay-md lg:rounded-clay-lg">
  <CardContent className="p-clay-md sm:p-clay-lg">
    {/* Content adapts to screen size */}
  </CardContent>
</Card>
```

### Clay Grid Layout

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-clay-lg">
  {items.map((item) => (
    <Card key={item.id} variant="clay">
      <CardContent>{item.content}</CardContent>
    </Card>
  ))}
</div>
```

---

## Animation Examples

### Clay Button Hover

```css
/* Automatic from shadcn/ui */
.clay-button {
  transition: all 200ms ease;
}

.clay-button:hover {
  box-shadow: var(--clay-lg); /* Increases on hover */
}

.clay-button:active {
  box-shadow: var(--clay-sm); /* Decreases on press */
}
```

### Clay Card Float Animation

```tsx
<Card variant="clay" className="animate-float">
  {/* Content floats up and down */}
</Card>
```

**CSS:**

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}
```

---

**Showcase Version:** 2.0.0  
**For token reference:** See DESIGN_SYSTEM_QUICK_REF.md  
**For full documentation:** See DESIGN_SYSTEM.md
