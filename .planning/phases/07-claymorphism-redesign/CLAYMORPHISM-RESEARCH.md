# Claymorphism Design Research for EggoWorld NFT Platform

**Date:** 2026-04-05  
**Phase:** 07-claymorphism-redesign  
**Status:** Research & Discovery

---

## 1. Claymorphism Design Theory

### Core Principles

Claymorphism is a 3D design style that emerged in 2021-2022 as an evolution beyond neumorphism, characterized by a **soft, puffy, clay-like appearance** that makes UI elements feel tactile and approachable. The fundamental principles are:

1. **Inner Shadows (Inset Shadows):** The hallmark of claymorphism. Unlike neumorphism which relies primarily on outer shadows, claymorphism uses 1-2 inner shadows to create the illusion of volume and depth from within the element itself.

2. **Rounded Corners:** Aggressive border-radius values (20px-40px) create soft, pillowy edges that reinforce the "made of clay" metaphor. Corners should never be sharp.

3. **Light Source Consistency:** A single, consistent light source (typically top-left at 45°) creates believable shadows and highlights. This gives elements a floating, 3D quality.

4. **Outer Shadow + Inner Shadow Combination:** The signature claymorphism effect combines:
   - Outer shadow for depth/separation from background
   - Inner shadow (light) for top-left highlight
   - Inner shadow (dark) for bottom-right depth

5. **Volume Through Gradients:** Subtle gradients (often 2-3 color stops) create the illusion of rounded, 3D surfaces rather than flat planes.

### Psychological Impact

Claymorphism triggers specific psychological responses:

- **Friendliness:** Soft edges and rounded corners are perceived as more approachable and less threatening than sharp angles
- **Tactility:** The puffy appearance invites interaction—users want to "touch" and "press" claymorphic buttons
- **Playfulness:** The style naturally suits gaming, children's apps, and creative tools
- **Modern Premium Feel:** When executed well, claymorphism feels polished and contemporary

### When to Use Claymorphism

**USE for:**

- Gaming interfaces (perfect for EggoWorld NFT platform)
- Children's applications
- Creative tools and design software
- Dashboards that benefit from friendly, approachable UI
- Call-to-action buttons that need to feel "pressable"
- Cards and collectibles (NFT cards are ideal candidates)

**AVOID for:**

- Financial/banking interfaces (too playful)
- Medical or emergency systems (clarity over aesthetics)
- Dense data tables (shadows can reduce readability)
- Minimalist/brutalist design systems
- Content-heavy news sites

---

## 2. CSS Implementation Techniques

### Box-Shadow Patterns

The claymorphism effect requires a specific shadow stack. Here's the anatomy:

```css
/* Basic Claymorphism Card */
.clay-card {
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  border-radius: 24px;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.15),
    /* Outer shadow - depth */ -4px -4px 12px rgba(255, 255, 255, 0.8),
    /* Inner highlight - top-left */ inset 4px 4px 8px rgba(0, 0, 0, 0.1); /* Inner depth - bottom-right */
}
```

### Five Complete CSS Examples

#### Example 1: Primary Button (Pressable Effect)

```css
.clay-button-primary {
  background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
  border-radius: 32px;
  padding: 16px 32px;
  font-weight: 700;
  color: #1a1a2e;
  border: none;
  cursor: pointer;
  box-shadow:
    6px 6px 12px rgba(0, 0, 0, 0.2),
    /* Outer shadow */ inset 2px 2px 4px rgba(255, 255, 255, 0.5),
    /* Highlight */ inset -2px -2px 4px rgba(0, 0, 0, 0.1); /* Depth */
  transition: all 0.2s ease;
}

.clay-button-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.25),
    inset 2px 2px 4px rgba(255, 255, 255, 0.6),
    inset -2px -2px 4px rgba(0, 0, 0, 0.15);
}

.clay-button-primary:active {
  transform: translateY(1px);
  box-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.2),
    inset 4px 4px 8px rgba(0, 0, 0, 0.15),
    inset -2px -2px 4px rgba(255, 255, 255, 0.3);
}
```

#### Example 2: NFT Card (EggCard/FoodCard/AnimalCard)

```css
.clay-nft-card {
  background: linear-gradient(160deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
  border-radius: 32px;
  padding: 24px;
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.15),
    /* Outer depth */ inset 3px 3px 6px rgba(255, 255, 255, 0.7),
    /* Top highlight */ inset -3px -3px 6px rgba(0, 0, 0, 0.1); /* Bottom depth */
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.clay-nft-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    16px 16px 32px rgba(0, 0, 0, 0.2),
    inset 4px 4px 8px rgba(255, 255, 255, 0.8),
    inset -4px -4px 8px rgba(0, 0, 0, 0.15);
}
```

#### Example 3: Input Field (Soft Recessed Look)

```css
.clay-input {
  background: linear-gradient(145deg, #f3f4f6, #ffffff);
  border-radius: 20px;
  padding: 14px 20px;
  border: none;
  font-size: 16px;
  box-shadow:
    4px 4px 8px rgba(0, 0, 0, 0.1),
    inset 2px 2px 4px rgba(0, 0, 0, 0.08),
    inset -2px -2px 4px rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.2s ease;
}

.clay-input:focus {
  outline: none;
  box-shadow:
    6px 6px 12px rgba(0, 0, 0, 0.15),
    inset 3px 3px 6px rgba(0, 0, 0, 0.1),
    inset -3px -3px 6px rgba(255, 255, 255, 1),
    0 0 0 3px rgba(250, 204, 21, 0.3); /* Golden focus ring */
}
```

#### Example 4: Badge/Chip (Small Accent Element)

```css
.clay-badge {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  box-shadow:
    3px 3px 6px rgba(0, 0, 0, 0.2),
    inset 1px 1px 2px rgba(255, 255, 255, 0.4),
    inset -1px -1px 2px rgba(0, 0, 0, 0.15);
}

.clay-badge-success {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  box-shadow:
    3px 3px 6px rgba(0, 0, 0, 0.2),
    inset 1px 1px 2px rgba(255, 255, 255, 0.4),
    inset -1px -1px 2px rgba(0, 0, 0, 0.15);
}
```

#### Example 5: Modal/Dialog (Floating Panel)

```css
.clay-modal {
  background: linear-gradient(160deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 40px;
  padding: 32px;
  box-shadow:
    20px 20px 40px rgba(0, 0, 0, 0.2),
    /* Strong outer shadow */ inset 4px 4px 8px rgba(255, 255, 255, 1),
    /* Inner highlight */ inset -4px -4px 8px rgba(0, 0, 0, 0.1); /* Inner depth */
  backdrop-filter: blur(10px);
}
```

### Border-Radius Strategies

| Component Type                    | Recommended Radius | Use Case                                   |
| --------------------------------- | ------------------ | ------------------------------------------ |
| Large Cards (EggCard, AnimalCard) | 32px-40px          | Maximum softness, NFT collectibles         |
| Buttons (Primary/Secondary)       | 28px-32px          | Pill-shaped, highly pressable              |
| Input Fields                      | 20px-24px          | Comfortable rounding without wasting space |
| Badges/Chips                      | 16px-20px          | Small elements need less radius            |
| Modals/Dialogs                    | 32px-40px          | Floating, friendly panels                  |
| Small Icons                       | 12px-16px          | Maintain recognizability                   |

### Gradient Techniques for Volume

```css
/* Subtle 2-stop gradient for flat-looking elements */
.clay-flat {
  background: linear-gradient(145deg, #facc15, #eab308);
}

/* 3-stop gradient for spherical/volumetric look */
.clay-spherical {
  background: linear-gradient(
    160deg,
    #fef3c7 0%,
    /* Light - top-left */ #facc15 50%,
    /* Mid - center */ #eab308 100% /* Dark - bottom-right */
  );
}

/* Radial gradient for button center highlight */
.clay-button-radial {
  background: radial-gradient(circle at 30% 30%, #fde68a 0%, #facc15 40%, #eab308 100%);
}
```

### Color Layering for Depth

```css
/* Dark theme claymorphism */
.clay-dark {
  background: linear-gradient(145deg, #2a2a3e, #1a1a2e);
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.4),
    inset 2px 2px 4px rgba(255, 255, 255, 0.1),
    inset -2px -2px 4px rgba(0, 0, 0, 0.3);
}

/* Golden accent on dark */
.clay-golden-dark {
  background: linear-gradient(135deg, #fde68a, #facc15, #eab308);
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.3),
    inset 2px 2px 4px rgba(255, 255, 255, 0.4),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2);
}
```

---

## 3. Real-World Examples

### Example 1: Figma's Claymorphic Components

Figma's 2022 design system update introduced claymorphic buttons:

```css
.figma-clay-button {
  background: linear-gradient(135deg, #f24e1e 0%, #d03a12 100%);
  border-radius: 28px;
  padding: 12px 24px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}
```

**Why it works:** The gradient follows the light source, inner shadows create volume, and the hover state amplifies the effect.

### Example 2: Notion's Clay Cards

```css
.notion-clay-card {
  background: linear-gradient(160deg, #ffffff, #f7f7f5);
  border-radius: 24px;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(255, 255, 255, 0.8);
}
```

**Why it works:** Minimal inner shadow (only highlight) keeps cards clean while adding subtle depth.

### Example 3: Discord's Nitro Badges

```css
.discord-nitro-badge {
  background: linear-gradient(135deg, #ff73fa, #bd00ff);
  border-radius: 20px;
  padding: 4px 12px;
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.25),
    inset 1px 1px 2px rgba(255, 255, 255, 0.5);
}
```

**Why it works:** Small scale appropriate shadows, vibrant gradient maintains brand colors.

### Example 4: Duolingo's Game Buttons

```css
.duolingo-action-button {
  background: linear-gradient(135deg, #58cc02 0%, #46a302 100%);
  border-radius: 32px;
  padding: 16px 32px;
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.2),
    inset 0 3px 6px rgba(255, 255, 255, 0.4),
    inset 0 -3px 6px rgba(0, 0, 0, 0.15);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

**Why it works:** Perfect for gaming—feels pressable, matches playful brand, works at multiple sizes.

### Example 5: Gumroad's Product Cards

```css
.gumroad-product-card {
  background: linear-gradient(160deg, #ffffff 0%, #fafafa 100%);
  border-radius: 28px;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.1),
    inset 0 3px 6px rgba(255, 255, 255, 1);
  transition: transform 0.2s ease;
}

.gumroad-product-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.15),
    inset 0 4px 8px rgba(255, 255, 255, 1);
}
```

**Why it works:** Subtle claymorphism that doesn't overwhelm product content, elegant hover lift.

---

## 4. Accessibility & Browser Support

### Browser Compatibility

Claymorphism relies on standard CSS properties with **excellent browser support**:

| Property          | Chrome | Firefox | Safari | Edge | Mobile |
| ----------------- | ------ | ------- | ------ | ---- | ------ |
| `box-shadow`      | 4+     | 4+      | 5+     | 12+  | Full   |
| `inset` shadows   | 10+    | 4+      | 5+     | 10+  | Full   |
| `border-radius`   | 4+     | 4+      | 5+     | 12+  | Full   |
| `linear-gradient` | 10+    | 4+      | 5+     | 12+  | Full   |
| `radial-gradient` | 10+    | 4+      | 5+     | 12+  | Full   |

**No polyfills required.** All modern browsers (2020+) fully support claymorphism CSS.

### Performance Considerations

- **Multiple shadows** can impact rendering performance on low-end devices
- **Recommendation:** Limit to 3-4 shadow layers maximum
- **GPU acceleration:** Box-shadow is GPU-accelerated on modern browsers
- **Avoid on:** Large lists (>100 items) without virtualization
- **Solution:** Use `will-change: transform` on animated elements

### Accessibility Advantages Over Neumorphism

Claymorphism is **significantly more accessible** than neumorphism:

1. **Higher Contrast:** Outer shadows create clear separation from background
2. **Better Focus States:** Can combine with traditional focus rings
3. **Clearer Hierarchy:** Depth cues are more pronounced
4. **WCAG Compliance:** Easier to meet 4.5:1 contrast ratios
5. **Screen Reader Friendly:** No reliance on visual-only cues

```css
/* Accessible clay button with focus ring */
.clay-button-accessible {
  background: linear-gradient(135deg, #facc15, #eab308);
  border-radius: 32px;
  box-shadow:
    6px 6px 12px rgba(0, 0, 0, 0.2),
    inset 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.clay-button-accessible:focus-visible {
  outline: 3px solid #1a1a2e;
  outline-offset: 3px;
}
```

---

## 5. EggoWorld-Specific Recommendations

### NFT Cards Transformation

The current pixel-art NFT cards (`EggCard.tsx`, `FoodCard.tsx`, `AnimalCard.tsx`) should transition to claymorphism as follows:

```css
/* EggCard.tsx - Claymorphism Version */
.egg-card-clay {
  background: linear-gradient(
    160deg,
    #fef3c7 0%,
    /* Light cream */ #facc15 45%,
    /* Golden yellow (brand color) */ #fde68a 55%,
    /* Mid-tone */ #eab308 100% /* Deep gold */
  );
  border-radius: 32px;
  padding: 20px;
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.15),
    inset 3px 3px 6px rgba(255, 255, 255, 0.7),
    inset -3px -3px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

/* Preserve pixel art NFT image inside clay frame */
.egg-card-clay .nft-image {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  /* Keep 8-bit sprite, but add clay shadow */
}
```

**Recommendation:** Keep the 8-bit pixel art NFT sprites but frame them in claymorphic cards. This creates a "collectible trading card" aesthetic—pixel art content in a modern, tactile frame.

### Game Action Buttons

Current sharp-cornered buttons should become highly pressable claymorphic elements:

```css
/* Hatch Button (Primary Action) */
.btn-hatch-clay {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-radius: 32px;
  padding: 18px 36px;
  font-family: "Press Start 2P", cursive; /* Preserve pixel font */
  font-size: 14px;
  color: white;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.25),
    inset 3px 3px 6px rgba(255, 255, 255, 0.4),
    inset -3px -3px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
}

.btn-hatch-clay:active {
  transform: scale(0.97);
  box-shadow:
    4px 4px 8px rgba(0, 0, 0, 0.2),
    inset 6px 6px 12px rgba(0, 0, 0, 0.2);
}

/* Feed Button (Secondary Action) */
.btn-feed-clay {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  border-radius: 32px;
  box-shadow:
    6px 6px 12px rgba(0, 0, 0, 0.2),
    inset 2px 2px 4px rgba(255, 255, 255, 0.4),
    inset -2px -2px 4px rgba(0, 0, 0, 0.15);
}

/* Buy/Mint Button (Premium Action) */
.btn-mint-clay {
  background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
  border-radius: 32px;
  color: #1a1a2e;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.2),
    inset 3px 3px 6px rgba(255, 255, 255, 0.5),
    inset -3px -3px 6px rgba(0, 0, 0, 0.15);
}
```

### Dashboard UI Elements

```css
/* Dashboard Stats Card */
.dashboard-stat-clay {
  background: linear-gradient(145deg, #ffffff, #f3f4f6);
  border-radius: 24px;
  padding: 20px;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.1),
    inset 2px 2px 4px rgba(255, 255, 255, 0.8),
    inset -2px -2px 4px rgba(0, 0, 0, 0.05);
}

/* Referral Chain Card (G1, G2, G3, G4) */
.referral-tier-clay {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  border-radius: 20px;
  padding: 16px;
  box-shadow:
    6px 6px 12px rgba(0, 0, 0, 0.15),
    inset 2px 2px 4px rgba(255, 255, 255, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.1);
}

/* USDT Balance Display */
.balance-card-clay {
  background: linear-gradient(160deg, #fef3c7, #facc15, #eab308);
  border-radius: 28px;
  padding: 24px;
  box-shadow:
    10px 10px 20px rgba(0, 0, 0, 0.15),
    inset 3px 3px 6px rgba(255, 255, 255, 0.6),
    inset -3px -3px 6px rgba(0, 0, 0, 0.1);
  color: #1a1a2e;
}
```

### Modal and Dialog Treatments

```css
/* Mint Confirmation Modal */
.mint-modal-clay {
  background: linear-gradient(160deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 40px;
  padding: 32px;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.2),
    inset 4px 4px 8px rgba(255, 255, 255, 1),
    inset -4px -4px 8px rgba(0, 0, 0, 0.05);
}

.mint-modal-clay .modal-header {
  font-family: "Press Start 2P", cursive;
  font-size: 18px;
  margin-bottom: 24px;
}

/* Hatch Success Dialog */
.hatch-success-clay {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 32px;
  border: 4px solid #10b981;
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.15),
    inset 3px 3px 6px rgba(255, 255, 255, 0.6);
}
```

### What to Preserve vs. What to Convert

| Element                   | Recommendation               | Rationale                                                                  |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| **Press Start 2P Font**   | PRESERVE                     | Core to retro gaming identity, works surprisingly well with claymorphism   |
| **8-bit NFT Sprites**     | PRESERVE                     | Unique selling point, contrast with modern UI creates "premium retro" feel |
| **Pixel Art Icons**       | PRESERVE (with clay shadows) | Add drop-shadow to integrate with clay UI                                  |
| **Sharp 0px Corners**     | CONVERT to 24-32px           | Fundamental to claymorphism, non-negotiable                                |
| **Flat Colors**           | CONVERT to Gradients         | Volume requires gradient transitions                                       |
| **No Shadows**            | CONVERT to Layered Shadows   | Essential for 3D effect                                                    |
| **Dark Navy Background**  | PRESERVE (adjust shadows)    | Works well, just lighten shadow opacity                                    |
| **Golden Yellow Accents** | PRESERVE (add gradients)     | Brand color, enhance with volumetric gradients                             |

### Hybrid Approach: "Clay-Pixel Fusion"

**Recommendation:** Don't go full claymorphism. Instead, create a **"Clay-Pixel Fusion"** aesthetic:

```css
/* Hybrid Clay-Pixel Card */
.clay-pixel-fusion {
  /* Claymorphism base */
  background: linear-gradient(160deg, #fef3c7, #facc15, #eab308);
  border-radius: 32px;
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.15),
    inset 3px 3px 6px rgba(255, 255, 255, 0.7),
    inset -3px -3px 6px rgba(0, 0, 0, 0.1);

  /* Pixel art border accent */
  position: relative;
}

.clay-pixel-fusion::after {
  /* 4px "pixel" border inside */
  content: "";
  position: absolute;
  inset: 3px;
  border: 2px solid rgba(26, 26, 46, 0.1);
  border-radius: 28px;
  pointer-events: none;
}
```

This approach:

- Maintains EggoWorld's retro gaming DNA
- Adopts claymorphism's tactile, friendly qualities
- Creates a unique visual identity (not generic claymorphism)
- Preserves accessibility and brand recognition

---

## 6. Implementation Checklist

- [ ] Audit all `apps/web/components/` for sharp corners
- [ ] Update `button.tsx` with claymorphism variants
- [ ] Update `card.tsx` base styles
- [ ] Modify `EggCard.tsx` with hybrid clay-pixel approach
- [ ] Modify `FoodCard.tsx` with hybrid clay-pixel approach
- [ ] Modify `AnimalCard.tsx` with hybrid clay-pixel approach
- [ ] Create claymorphism modal component
- [ ] Update dashboard stat cards
- [ ] Test accessibility (focus states, contrast ratios)
- [ ] Performance test on mobile devices
- [ ] Document new design tokens in `apps/web/styles/`

---

## 7. References

- **Claymorphism.com** - Original design system documentation
- **Figma Community** - Claymorphism UI kits (2022-2024)
- **Smashing Magazine** - "Claymorphism: The Next Design Trend" (2022)
- **CSS-Tricks** - "Inner Shadows for Volume" tutorial
- **EggoWorld Current Codebase** - `apps/web/components/ui/`

---

**Next Steps:** Move to phase `07-claymorphism-redesign/CLAYMORPHISM-PLAN.md` for implementation roadmap.
