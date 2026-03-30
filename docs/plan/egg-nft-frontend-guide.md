# Egg NFT Frontend Implementation - Visual Guide

## Design Aesthetic: Retro Pixel Gaming

### Theme: "EggoWorld - Pixel Metaverse"

**Visual Identity:**
- **Style:** 8-bit retro gaming meets modern web
- **Mood:** Nostalgic, playful, collectible
- **Colors:** Space exploration palette with neon accents

---

## Color Palette

```css
Background:     #1a1a2e (Deep Space Blue)
Card:           #16213e (Navy)
Foreground:     #fef9c3 (Cream Yellow)
Primary:        #facc15 (Bright Yellow - Gold)
Secondary:      #0f3460 (Dark Navy)
Accent:         #e94560 (Red-Pink)
Muted:          #94a3b8 (Gray-Blue)
```

---

## Typography

**Display Font:** Press Start 2P (Google Fonts)
- Used for: Headings, buttons, stats, prices
- Style: 8-bit pixel art
- Sizes: text-xs (10px), text-sm (12px), text-lg (18px), text-2xl (24px)

**Body Font:** System sans-serif
- Used for: Descriptions, labels
- Style: Clean, readable

---

## Page Layouts

### 1. Mint Page (`/mint`)

```
┌────────────────────────────────────────────┐
│  [Header]                                  │
├────────────────────────────────────────────┤
│                                            │
│         🥚 MINT YOUR EGG NFT               │
│      OWN A PIECE OF THE EGGOVERSE          │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ EGG MINTING                          │  │
│  │ PRICE: 25 USDT                       │  │
│  ├──────────────────────────────────────┤  │
│  │ YOUR USDT BALANCE: 100.00 USDT      │  │
│  │ [████████████░░░░] 400%             │  │
│  │                                      │  │
│  │ YOUR EGG INCLUDES:                   │  │
│  │ ✓ 1 EGG NFT (ERC-721)               │  │
│  │ ✓ 2 BONUS FOOD NFTs                 │  │
│  │ ✓ UNIQUE RARITY SEED                │  │
│  │ ✓ REFERRAL CHAIN TRACKING           │  │
│  │                                      │  │
│  │ REFERRER ID (OPTIONAL)               │  │
│  │ [____________________________]       │  │
│  │                                      │  │
│  │ [MINT EGG (25 USDT)]                 │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  HOW IT WORKS                              │
│  01 Ensure you have 25 USDT               │
│  02 Enter referrer ID (optional)          │
│  03 Click "Mint Egg"                      │
│  04 Get your Egg NFT + 2 Food NFTs        │
└────────────────────────────────────────────┘
```

### 2. Eggs Dashboard (`/dashboard/eggs`)

```
┌────────────────────────────────────────────┐
│  [Header]                                  │
├────────────────────────────────────────────┤
│  🥚 MY EGG NFTs            [+ MINT NEW]    │
│  MANAGE YOUR COLLECTION                    │
│                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐│
│  │TOTAL    │HATCHED  │FOOD NFTs│VALUE    ││
│  │5        │2        │10       │125 USDT ││
│  └─────────┴─────────┴─────────┴─────────┘│
│                                            │
│  ┌───────────┬───────────┬───────────┐    │
│  │  #1       │  #2       │  #3       │    │
│  │  [🥚]     │  [🥚]     │  [🥚]     │    │
│  │  EPIC     │  RARE     │  COMMON   │    │
│  │  Food: 2  │  Food: 2  │  Food: 2  │    │
│  │  Unhatched│  Hatched  │  Unhatched│    │
│  │  [HATCH]  │  [VIEW]   │  [HATCH]  │    │
│  └───────────┴───────────┴───────────┘    │
│                                            │
│  ┌───────────┬───────────┬───────────┐    │
│  │  #4       │  #5       │           │    │
│  │  [🥚]     │  [🥚]     │           │    │
│  └───────────┴───────────┴───────────┘    │
└────────────────────────────────────────────┘
```

### 3. EggCard Component

```
┌─────────────────────────────┐
│  🥚 #1            [EPIC]    │
├─────────────────────────────┤
│                             │
│      ┌───────────┐          │
│      │           │          │
│      │    🥚     │          │
│      │           │          │
│      └───────────┘          │
│                             │
│  # EGG ID: 1001             │
│  ✨ FOOD NFTs: 2 / 10       │
│  📅 MINTED: Mar 30, 2026    │
│  STATUS: [UNHATCHED]        │
│                             │
│  [VIEW REFERRAL CHAIN ▼]    │
│  ┌─────────────────────────┐│
│  │ G1 (20%): 0x12...5678   ││
│  │ G2 (10%): 0x34...9012   ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  🔥 [HATCH EGG]             │
└─────────────────────────────┘
```

### 4. Commissions Dashboard

```
┌────────────────────────────────────────────┐
│  [Header]                                  │
├────────────────────────────────────────────┤
│  💰 COMMISSIONS                            │
│  EARN FROM YOUR REFERRAL CHAIN            │
│                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐│
│  │PENDING  │EARNED   │G1 (20%) │G2-G4    ││
│  │50 USDT  │200 USDT │150 USDT │50 USDT  ││
│  └─────────┴─────────┴─────────┴─────────┘│
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ CLAIM COMMISSIONS                    │  │
│  ├──────────────────────────────────────┤  │
│  │ AVAILABLE: 50.00 USDT                │  │
│  │ [████████████████████] 100%          │  │
│  │                                      │  │
│  │ [💰 CLAIM 50.00 USDT]                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  EARNINGS BREAKDOWN                        │
│  ┌──────────────────────────────────────┐  │
│  │ [G1] Direct referrals (20%)  150 USDT│  │
│  │ [G2] Level 2 (10%)          30 USDT  │  │
│  │ [G3] Level 3 (10%)          15 USDT  │  │
│  │ [G4] Level 4 (10%)           5 USDT  │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  COMMISSION HISTORY                        │
│  ┌──────────────────────────────────────┐  │
│  │ [G1] 5.0 USDT  TX: 0x12...   [CLAIMED]│ │
│  │ [G2] 2.5 USDT  TX: 0x34...   [CLAIMED]│ │
│  │ [G1] 5.0 USDT  TX: 0x56...   [PENDING]│ │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
app/
├── mint/
│   └── page.tsx (MintPage)
│       ├── Header
│       ├── Card
│       │   ├── Progress
│       │   ├── Alert
│       │   └── Button (MintButton)
│       └── Info Section
│
├── dashboard/
│   ├── eggs/
│   │   └── page.tsx (EggsDashboard)
│   │       ├── Header
│   │       ├── Stats Grid (4 Cards)
│   │       └── EggCard Grid
│   │           └── EggCard
│   │               ├── Badge (Rarity)
│   │               ├── ReferralChainDisplay
│   │               └── Button (Hatch)
│   │
│   └── commissions/
│       └── page.tsx (CommissionsDashboard)
│           ├── Header
│           ├── Stats Grid (4 Cards)
│           ├── Claim Card
│           │   └── Button
│           ├── CommissionBreakdown
│           └── History List
│
components/
└── egg-nft/
    ├── EggCard.tsx
    ├── ReferralChainDisplay.tsx
    ├── CommissionBreakdown.tsx
    └── MintButton.tsx
```

---

## Interaction States

### Button States:
1. **Default:** Yellow border, hover glow
2. **Disabled:** Gray, 50% opacity
3. **Loading:** Spinner animation
4. **Success:** Green checkmark

### Card States:
1. **Default:** Blue border
2. **Hover:** Yellow border glow
3. **Selected:** Thicker yellow border

### Egg States:
1. **Unhatched:** Egg icon 🥚
2. **Hatching:** Pulse animation
3. **Hatched:** Flame icon 🔥

---

## Animations

```css
/* Float animation for logo */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Pulse for hatching */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## Responsive Breakpoints

```
Mobile:     320px - 767px  (1 column)
Tablet:     768px - 1023px (2 columns)
Desktop:    1024px+        (3-4 columns)
```

---

## Accessibility

- Semantic HTML (article, section, header)
- ARIA labels for icons
- Keyboard navigation support
- Color contrast: WCAG AA compliant
- Screen reader friendly

---

## Performance

- Lazy loading images
- Code splitting by route
- Static generation where possible
- Optimized animations (transform/opacity only)

---

## Files Summary

| File | Purpose | Size |
|------|---------|------|
| `mint/page.tsx` | Minting interface | ~300 lines |
| `dashboard/eggs/page.tsx` | Egg collection | ~250 lines |
| `dashboard/commissions/page.tsx` | Commission tracking | ~400 lines |
| `EggCard.tsx` | Egg display | ~150 lines |
| `ReferralChainDisplay.tsx` | Chain visualization | ~50 lines |
| `CommissionBreakdown.tsx` | Earnings breakdown | ~100 lines |
| `MintButton.tsx` | Action button | ~50 lines |
| `use-egg-nft.ts` | Contract hook | ~200 lines |

**Total:** ~1500 lines of production React code

---

## Testing Checklist

- [ ] Mint page renders with balance
- [ ] Mint button disabled when insufficient balance
- [ ] Referrer ID accepts valid input
- [ ] Success message shows after mint
- [ ] Redirect to eggs dashboard works
- [ ] EggCard displays all properties
- [ ] Rarity labels correct (Common → Legendary)
- [ ] Hatch button works
- [ ] Referral chain toggle works
- [ ] Commissions dashboard shows earnings
- [ ] Claim button processes correctly
- [ ] All loading states work
- [ ] Error states display properly

---

**Implementation Status:** ✅ COMPLETE

All Phase 3 frontend components implemented with pixel-perfect retro gaming aesthetic!
