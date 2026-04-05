# EggoWorld Design System

**Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Project:** EggoWorld NFT Marketplace

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Claymorphism Design System](#claymorphism-design-system)
7. [Pixel Art Guidelines](#pixel-art-guidelines)

---

## Design Philosophy

EggoWorld uses a **hybrid "Clay Frames, Pixel Content"** aesthetic that combines:

- **Modern claymorphism UI** for containers, cards, buttons, and interactive elements
- **Retro pixel art** for NFTs, icons, and decorative elements
- **Press Start 2P** typography for headings and labels

This creates a "modern museum displaying vintage art" effect where the UI frames the pixel art content.

---

## Color System

### Primary Colors

| Token         | Value     | Usage                                       |
| ------------- | --------- | ------------------------------------------- |
| `--primary`   | `#facc15` | Bright yellow - primary actions, highlights |
| `--secondary` | `#0f3460` | Deep blue - secondary actions, backgrounds  |
| `--accent`    | `#e94560` | Red accent - alerts, important elements     |

### Background Colors

| Token          | Value     | Usage                       |
| -------------- | --------- | --------------------------- |
| `--background` | `#1a1a2e` | Main background (navy dark) |
| `--card`       | `#16213e` | Card surfaces (dark blue)   |
| `--foreground` | `#fef9c3` | Text color (pale yellow)    |

---

## Typography

### Font Stack

```css
--font-sans: "Geist", sans-serif; /* Body text, UI */
--font-pixel: "Press Start 2P", monospace; /* Headings, NFT labels */
```

### Usage Guidelines

- **Body text**: Use Geist sans-serif for readability
- **Headings**: Use Press Start 2P for retro gaming aesthetic
- **NFT labels**: Always use pixel font for NFT names, IDs
- **UI elements**: Use sans-serif for buttons, inputs, forms

---

## Spacing & Layout

### Standard Spacing Scale

```css
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### Claymorphism Spacing

For claymorphism elements, use increased padding:

```css
--clay-padding-sm: 12px; /* Small elements */
--clay-padding-md: 16px; /* Standard buttons */
--clay-padding-lg: 24px; /* Cards */
--clay-padding-xl: 32px; /* Large cards */
--clay-padding-2xl: 48px; /* Hero sections */
```

---

## Components

### Button Variants

- `default` - Standard primary button
- `secondary` - Secondary action
- `outline` - Bordered button
- `ghost` - Minimal button
- `link` - Text link style
- `clay` - Claymorphism style (see below)

### Card Variants

- `default` - Standard card with border
- `clay` - Claymorphism card (standard depth)
- `clay-lg` - Featured card (medium depth)
- `clay-xl` - Hero card (maximum depth)

---

## Claymorphism Design System

**Version:** 1.0.0  
**Introduced:** Phase 07  
**Design Philosophy:** Hybrid "Clay Frames, Pixel Content"

### Overview

Claymorphism is a 3D design style that combines soft shadows with rounded corners to create elements that appear to float above the surface with a puffy, clay-like appearance.

### When to Use Claymorphism

✅ **Use claymorphism for:**

- UI containers (cards, buttons, modals, inputs)
- Interactive elements (dropdowns, navigation)
- Feedback components (alerts, progress bars)
- Data display (tables, badges)

❌ **Avoid claymorphism for:**

- NFT sprites (preserve pixel art)
- Icon graphics (keep pixelated or vector)
- Typography headings (keep Press Start 2P)
- Decorative elements (keep retro gaming aesthetic)

### Shadow Tokens

| Token      | CSS Variable      | Use Case                      | Example                    |
| ---------- | ----------------- | ----------------------------- | -------------------------- |
| `clay-sm`  | `var(--clay-sm)`  | Badges, chips, small elements | `<Badge>`                  |
| `clay-md`  | `var(--clay-md)`  | Buttons, inputs, small cards  | `<Button variant="clay">`  |
| `clay-lg`  | `var(--clay-lg)`  | Standard cards, dropdowns     | `<Card variant="clay">`    |
| `clay-xl`  | `var(--clay-xl)`  | Featured cards, modals        | `<Card variant="clay-xl">` |
| `clay-2xl` | `var(--clay-2xl)` | Hero sections, dialogs        | `<DialogContent>`          |

### Border Radius Tokens

| Token               | Value  | Use Case                     | Element Size     |
| ------------------- | ------ | ---------------------------- | ---------------- |
| `clay-rounded-sm`   | 16px   | Badges, small buttons        | < 40px height    |
| `clay-rounded`      | 20px   | Standard buttons, inputs     | 40-60px height   |
| `clay-rounded-md`   | 24px   | Cards, panels                | 60-120px height  |
| `clay-rounded-lg`   | 32px   | Featured cards, NFT displays | 120-200px height |
| `clay-rounded-xl`   | 40px   | Hero sections, modals        | > 200px height   |
| `clay-rounded-full` | 9999px | Pills, circles, avatars      | Any (full round) |

### Color Extensions

Claymorphism requires extended color palettes for highlights and shadows:

```css
/* Primary Yellow Extensions */
--clay-primary-highlight: rgba(250, 204, 21, 0.15); /* Inner highlight */
--clay-primary-shadow: rgba(250, 204, 21, 0.3); /* Inner depth */

/* Secondary Blue Extensions */
--clay-secondary-highlight: rgba(15, 52, 96, 0.1);
--clay-secondary-shadow: rgba(15, 52, 96, 0.4);

/* Card Blue Extensions */
--clay-card-highlight: rgba(22, 33, 62, 0.15);
--clay-card-shadow: rgba(22, 33, 62, 0.5);

/* Accent Red Extensions */
--clay-accent-highlight: rgba(233, 69, 96, 0.15);
--clay-accent-shadow: rgba(233, 69, 96, 0.4);
```

### Gradient Utilities

For volume perception on clay surfaces:

```css
--gradient-clay-light: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.15) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.1) 100%
);
--gradient-clay-highlight: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.2) 0%,
  transparent 40%,
  transparent 60%,
  rgba(0, 0, 0, 0.15) 100%
);
--gradient-clay-surface: linear-gradient(
  145deg,
  rgba(255, 255, 255, 0.08) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.12) 100%
);
```

### Hybrid Approach: Clay + Pixel

EggoWorld uses a hybrid "Clay Frames, Pixel Content" aesthetic:

```
┌─────────────────────────────┐
│  [Clay container:           │
│   rounded-clay-lg           │
│   shadow-clay-xl]           │
│                             │
│  ┌───────────────────────┐  │
│  │ [Pixel art sprite:    │  │
│  │  pixelated class,     │  │
│  │  sharp edges]         │  │
│  └───────────────────────┘  │
│                             │
│  [Press Start 2P labels]    │
└─────────────────────────────┘
```

**Key principle:** Clay UI frames showcase pixel art content (like a modern museum displaying vintage art).

### Component Examples

#### Clay Button

```tsx
<Button variant="clay" size="clay-md">
  Buy NFT
</Button>
```

#### Clay Card

```tsx
<Card variant="clay">
  <CardHeader>
    <CardTitle>NFT Collection</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

#### Clay Input

```tsx
<Input placeholder="Enter wallet address" className="clay-input" />
```

### Dark Mode Support

All claymorphism tokens have dark mode variants with adjusted opacity for visibility on dark backgrounds. Dark mode shadows are stronger (higher opacity) to maintain visibility.

---

## Pixel Art Guidelines

### When to Use Pixel Art

- NFT sprites (Egg, Food, Animal)
- Decorative icons
- Retro gaming elements
- Achievement badges

### CSS Class for Pixel Art

```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

### Preserving Sharp Edges

Never apply blur, smooth, or anti-aliasing to pixel art:

```css
/* ✅ Good - preserves pixel edges */
img.pixelated {
  image-rendering: pixelated;
}

/* ❌ Bad - blurs pixel art */
img {
  image-rendering: auto; /* Don't use */
}
```

---

## Accessibility

### Focus States

All interactive clay elements must have visible focus states:

```css
.clay-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: var(--clay-md);
}
```

### Motion Sensitivity

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .clay-button,
  .clay-input,
  .clay-card {
    transition: none;
  }

  .animate-float {
    animation: none;
  }
}
```

---

**Document Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Maintained By:** EggoWorld Design System Team

# EggoWorld Design System

**Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Project:** EggoWorld NFT Marketplace

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Claymorphism Design System](#claymorphism-design-system)
7. [Pixel Art Guidelines](#pixel-art-guidelines)

---

## Design Philosophy

EggoWorld uses a **hybrid "Clay Frames, Pixel Content"** aesthetic that combines:

- **Modern claymorphism UI** for containers, cards, buttons, and interactive elements
- **Retro pixel art** for NFTs, icons, and decorative elements
- **Press Start 2P** typography for headings and labels

This creates a "modern museum displaying vintage art" effect where the UI frames the pixel art content.

---

## Color System

### Primary Colors

| Token         | Value     | Usage                                       |
| ------------- | --------- | ------------------------------------------- |
| `--primary`   | `#facc15` | Bright yellow - primary actions, highlights |
| `--secondary` | `#0f3460` | Deep blue - secondary actions, backgrounds  |
| `--accent`    | `#e94560` | Red accent - alerts, important elements     |

### Background Colors

| Token          | Value     | Usage                       |
| -------------- | --------- | --------------------------- |
| `--background` | `#1a1a2e` | Main background (navy dark) |
| `--card`       | `#16213e` | Card surfaces (dark blue)   |
| `--foreground` | `#fef9c3` | Text color (pale yellow)    |

---

## Typography

### Font Stack

```css
--font-sans: "Geist", sans-serif; /* Body text, UI */
--font-pixel: "Press Start 2P", monospace; /* Headings, NFT labels */
```

### Usage Guidelines

- **Body text**: Use Geist sans-serif for readability
- **Headings**: Use Press Start 2P for retro gaming aesthetic
- **NFT labels**: Always use pixel font for NFT names, IDs
- **UI elements**: Use sans-serif for buttons, inputs, forms

---

## Spacing & Layout

### Standard Spacing Scale

```css
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### Claymorphism Spacing

For claymorphism elements, use increased padding:

```css
--clay-padding-sm: 12px; /* Small elements */
--clay-padding-md: 16px; /* Standard buttons */
--clay-padding-lg: 24px; /* Cards */
--clay-padding-xl: 32px; /* Large cards */
--clay-padding-2xl: 48px; /* Hero sections */
```

---

## Components

### Button Variants

- `default` - Standard primary button
- `secondary` - Secondary action
- `outline` - Bordered button
- `ghost` - Minimal button
- `link` - Text link style
- `clay` - Claymorphism style (see below)

### Card Variants

- `default` - Standard card with border
- `clay` - Claymorphism card (standard depth)
- `clay-lg` - Featured card (medium depth)
- `clay-xl` - Hero card (maximum depth)

---

## Claymorphism Design System

**Version:** 1.0.0  
**Introduced:** Phase 07  
**Design Philosophy:** Hybrid "Clay Frames, Pixel Content"

### Overview

Claymorphism is a 3D design style that combines soft shadows with rounded corners to create elements that appear to float above the surface with a puffy, clay-like appearance.

### When to Use Claymorphism

✅ **Use claymorphism for:**

- UI containers (cards, buttons, modals, inputs)
- Interactive elements (dropdowns, navigation)
- Feedback components (alerts, progress bars)
- Data display (tables, badges)

❌ **Avoid claymorphism for:**

- NFT sprites (preserve pixel art)
- Icon graphics (keep pixelated or vector)
- Typography headings (keep Press Start 2P)
- Decorative elements (keep retro gaming aesthetic)

### Shadow Tokens

| Token      | CSS Variable      | Use Case                      | Example                    |
| ---------- | ----------------- | ----------------------------- | -------------------------- |
| `clay-sm`  | `var(--clay-sm)`  | Badges, chips, small elements | `<Badge>`                  |
| `clay-md`  | `var(--clay-md)`  | Buttons, inputs, small cards  | `<Button variant="clay">`  |
| `clay-lg`  | `var(--clay-lg)`  | Standard cards, dropdowns     | `<Card variant="clay">`    |
| `clay-xl`  | `var(--clay-xl)`  | Featured cards, modals        | `<Card variant="clay-xl">` |
| `clay-2xl` | `var(--clay-2xl)` | Hero sections, dialogs        | `<DialogContent>`          |

### Border Radius Tokens

| Token               | Value  | Use Case                     | Element Size     |
| ------------------- | ------ | ---------------------------- | ---------------- |
| `clay-rounded-sm`   | 16px   | Badges, small buttons        | < 40px height    |
| `clay-rounded`      | 20px   | Standard buttons, inputs     | 40-60px height   |
| `clay-rounded-md`   | 24px   | Cards, panels                | 60-120px height  |
| `clay-rounded-lg`   | 32px   | Featured cards, NFT displays | 120-200px height |
| `clay-rounded-xl`   | 40px   | Hero sections, modals        | > 200px height   |
| `clay-rounded-full` | 9999px | Pills, circles, avatars      | Any (full round) |

### Color Extensions

Claymorphism requires extended color palettes for highlights and shadows:

```css
/* Primary Yellow Extensions */
--clay-primary-highlight: rgba(250, 204, 21, 0.15); /* Inner highlight */
--clay-primary-shadow: rgba(250, 204, 21, 0.3); /* Inner depth */

/* Secondary Blue Extensions */
--clay-secondary-highlight: rgba(15, 52, 96, 0.1);
--clay-secondary-shadow: rgba(15, 52, 96, 0.4);

/* Card Blue Extensions */
--clay-card-highlight: rgba(22, 33, 62, 0.15);
--clay-card-shadow: rgba(22, 33, 62, 0.5);

/* Accent Red Extensions */
--clay-accent-highlight: rgba(233, 69, 96, 0.15);
--clay-accent-shadow: rgba(233, 69, 96, 0.4);
```

### Gradient Utilities

For volume perception on clay surfaces:

```css
--gradient-clay-light: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.15) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.1) 100%
);
--gradient-clay-highlight: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.2) 0%,
  transparent 40%,
  transparent 60%,
  rgba(0, 0, 0, 0.15) 100%
);
--gradient-clay-surface: linear-gradient(
  145deg,
  rgba(255, 255, 255, 0.08) 0%,
  transparent 50%,
  rgba(0, 0, 0, 0.12) 100%
);
```

### Hybrid Approach: Clay + Pixel

EggoWorld uses a hybrid "Clay Frames, Pixel Content" aesthetic:

```
┌─────────────────────────────┐
│  [Clay container:           │
│   rounded-clay-lg           │
│   shadow-clay-xl]           │
│                             │
│  ┌───────────────────────┐  │
│  │ [Pixel art sprite:    │  │
│  │  pixelated class,     │  │
│  │  sharp edges]         │  │
│  └───────────────────────┘  │
│                             │
│  [Press Start 2P labels]    │
└─────────────────────────────┘
```

**Key principle:** Clay UI frames showcase pixel art content (like a modern museum displaying vintage art).

### Component Examples

#### Clay Button

```tsx
<Button variant="clay" size="clay-md">
  Buy NFT
</Button>
```

#### Clay Card

```tsx
<Card variant="clay">
  <CardHeader>
    <CardTitle>NFT Collection</CardTitle>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

#### Clay Input

```tsx
<Input placeholder="Enter wallet address" className="clay-input" />
```

### Dark Mode Support

All claymorphism tokens have dark mode variants with adjusted opacity for visibility on dark backgrounds. Dark mode shadows are stronger (higher opacity) to maintain visibility.

---

## Pixel Art Guidelines

### When to Use Pixel Art

- NFT sprites (Egg, Food, Animal)
- Decorative icons
- Retro gaming elements
- Achievement badges

### CSS Class for Pixel Art

```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### Preserving Sharp Edges

Never apply blur, smooth, or anti-aliasing to pixel art:

```css
/* ✅ Good - preserves pixel edges */
img.pixelated {
  image-rendering: pixelated;
}

/* ❌ Bad - blurs pixel art */
img {
  image-rendering: auto; /* Don't use */
}
```

---

## Accessibility

### Focus States

All interactive clay elements must have visible focus states:

```css
.clay-button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: var(--clay-md);
}
```

### Motion Sensitivity

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .clay-button,
  .clay-input,
  .clay-card {
    transition: none;
  }

  .animate-float {
    animation: none;
  }
}
```

---

**Document Version:** 2.0.0  
**Last Updated:** 2026-04-05  
**Maintained By:** EggoWorld Design System Team
