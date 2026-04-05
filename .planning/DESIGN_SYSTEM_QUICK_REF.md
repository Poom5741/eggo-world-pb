# Design System Quick Reference

**Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Project:** EggoWorld NFT Marketplace

---

## Table of Contents

1. [Color Quick Ref](#color-quick-ref)
2. [Typography Quick Ref](#typography-quick-ref)
3. [Clay Token Cheat Sheet](#clay-token-cheat-sheet)
4. [Component Quick Picks](#component-quick-picks)
5. [When NOT to Use Clay](#when-not-to-use-clay)
6. [Hybrid Pattern](#hybrid-pattern)

---

## Color Quick Ref

```
Primary Yellow  → #facc15 (buttons, highlights, actions)
Secondary Blue  → #0f3460 (cards, backgrounds)
Accent Red      → #e94560 (alerts, important)
Background      → #1a1a2e (main background)
Card            → #16213e (card surfaces)
Foreground      → #fef9c3 (text color)
```

---

## Typography Quick Ref

```
Body Text  → Geist sans-serif (readable, modern)
Headings   → Press Start 2P (retro gaming)
NFT Labels → Press Start 2P (names, IDs)
UI Elements → Geist sans-serif (buttons, inputs)
```

---

## Clay Token Cheat Sheet

### Shadows (Quick Reference)

```
clay-sm   → Badges, chips, tags (small elements)
clay-md   → Buttons, inputs, small cards
clay-lg   → Standard cards, dropdowns, panels
clay-xl   → Featured cards, modal content
clay-2xl  → Hero sections, dialog overlays
```

### Radius (Quick Reference)

```
clay-rounded-sm  → 16px (badges, small buttons)
clay-rounded     → 20px (standard buttons, inputs)
clay-rounded-md  → 24px (cards, panels)
clay-rounded-lg  → 32px (featured cards, NFT displays)
clay-rounded-xl  → 40px (hero sections, modals)
clay-rounded-full → 9999px (pills, circles)
```

### Spacing (Quick Reference)

```
clay-padding-sm  → 12px (small elements)
clay-padding-md  → 16px (standard buttons)
clay-padding-lg  → 24px (cards)
clay-padding-xl  → 32px (large cards)
clay-padding-2xl → 48px (hero sections)

gap-clay-sm  → 8px
gap-clay-md  → 16px
gap-clay-lg  → 24px
gap-clay-xl  → 32px
```

---

## Component Quick Picks

| Component       | Clay Variant             | Shadow                   | Radius            |
| --------------- | ------------------------ | ------------------------ | ----------------- |
| Button          | `variant="clay"`         | clay-md                  | clay-rounded      |
| Card (standard) | `variant="clay"`         | clay-lg                  | clay-rounded-md   |
| Card (featured) | `variant="clay-lg"`      | clay-xl                  | clay-rounded-lg   |
| Card (hero)     | `variant="clay-xl"`      | clay-2xl                 | clay-rounded-xl   |
| Badge           | default                  | clay-sm                  | clay-rounded-sm   |
| Input           | `className="clay-input"` | clay-sm (focus: clay-md) | clay-rounded      |
| Dialog          | -                        | clay-2xl                 | clay-rounded-xl   |
| Progress        | -                        | clay-sm (container)      | clay-rounded-full |

---

## When NOT to Use Clay

- ❌ NFT sprites (keep pixelated)
- ❌ Typography headings (keep Press Start 2P)
- ❌ Icons (keep vector or pixel)
- ❌ Decorative retro elements

**Remember:** Clay frames, pixel content. Modern museum, vintage art.

---

## Hybrid Pattern

```tsx
// Clay container + Pixel content
<Card variant="clay">
  <img src={sprite} className="pixelated" />
  <h3 className="font-[var(--font-pixel)]">Title</h3>
</Card>
```

### Example: NFT Card

```tsx
<Card variant="clay-lg" className="overflow-hidden">
  {/* Clay frame */}
  <div className="p-clay-lg">
    {/* Pixel sprite (preserved) */}
    <img src={eggSprite} alt="Egg" className="w-32 h-32 pixelated mx-auto" />

    {/* Pixel typography (preserved) */}
    <h3 className="font-[var(--font-pixel)] text-xs mt-clay-md">Egg #12345</h3>

    {/* Clay buttons */}
    <div className="flex gap-clay-md mt-clay-md">
      <Button variant="clay" size="clay-sm">
        Feed
      </Button>
      <Button variant="clay" size="clay-sm" disabled>
        Hatch
      </Button>
    </div>
  </div>
</Card>
```

---

## Before & After Examples

### Standard Button

**Before (Flat):**

```tsx
<Button variant="default">Buy NFT</Button>
```

**After (Clay):**

```tsx
<Button variant="clay" size="clay-md">
  Buy NFT
</Button>
```

**Visual difference:** Button now floats with soft dual-layer shadows and rounded corners (20px radius).

---

### Standard Card

**Before (Flat border):**

```tsx
<Card>
  <CardHeader>
    <CardTitle>NFT</CardTitle>
  </CardHeader>
</Card>
```

**After (Clay depth):**

```tsx
<Card variant="clay">
  <CardHeader>
    <CardTitle>NFT</CardTitle>
  </CardHeader>
</Card>
```

**Visual difference:** Card now appears to float above surface with 24px radius and lg clay shadow.

---

### Input Field

**Before (Flat border):**

```tsx
<Input placeholder="Enter text" />
```

**After (Clay styling):**

```tsx
<Input placeholder="Enter text" className="clay-input" />
```

**Visual difference:** Input has soft 20px radius and subtle clay-sm shadow, focus enhances to clay-md.

---

## Migration Notes for Existing Components

### Step 1: Update Button Variants

```tsx
// Find all:
<Button>Click me</Button>

// Replace with clay variant:
<Button variant="clay" size="clay-md">Click me</Button>
```

### Step 2: Update Card Variants

```tsx
// Find all:
<Card>...</Card>

// Replace with clay variant:
<Card variant="clay">...</Card>
```

### Step 3: Update Input Fields

```tsx
// Find all:
<Input />

// Add clay-input class:
<Input className="clay-input" />
```

### Step 4: Update Badge Styling

```tsx
// Badges already have clay-sm shadow by default
// No changes needed - verify shadow is visible
<Badge>Active</Badge>
```

---

## Common Patterns

### Step Indicator (Clay Pills)

```tsx
<div className="flex items-center gap-clay-lg">
  <div className="w-10 h-10 rounded-clay-full bg-primary shadow-clay-md">1</div>
  <div className="w-16 h-1 rounded-clay-full bg-primary" />
  <div className="w-10 h-10 rounded-clay-full bg-muted shadow-clay-sm">2</div>
</div>
```

### Progress Bar (Clay Container)

```tsx
<div className="w-full h-3 rounded-clay-full bg-muted shadow-clay-sm">
  <div className="h-full rounded-clay-full bg-primary" style={{ width: `${progress}%` }} />
</div>
```

### Modal Dialog (Maximum Depth)

```tsx
<DialogContent className="rounded-clay-xl shadow-clay-2xl">
  <DialogHeader>
    <DialogTitle>Modal Title</DialogTitle>
  </DialogHeader>
  <DialogContent>{/* Modal content */}</DialogContent>
</DialogContent>
```

---

**Quick Ref Version:** 2.0.0  
**For full documentation:** See DESIGN_SYSTEM.md  
**For component examples:** See DESIGN_SYSTEM_SHOWCASE.md
