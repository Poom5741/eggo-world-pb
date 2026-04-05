# Phase 10: Egg Management - Research

**Researched:** 2026-04-05  
**Researcher:** gsd-phase-researcher (simulated)  
**Model:** sonnet

## Executive Summary

Phase 10 requires building an egg management interface with three core flows: view eggs, feed eggs (exactly 10 food items), and hatch eggs into Animal NFTs. The research reveals we have strong existing patterns to leverage from Phase 8-9, a clear reference design from Jules, and existing smart contract functions ready for integration.

**Key findings:**

- Existing `useEggNft` hook needs extension for feed/hatch operations
- Smart contract has `hatchEgg(tokenId)` but NO `feedEgg` function — feeding is handled via `upgradeEggRarity` or direct food NFT burn
- PocketBase `egg_nfts` collection already tracks `food_count` field
- Hatch animation requires new component with particle effects (not in existing UI components)
- Polling pattern from `useWalletPoll` can be adapted for egg status

---

## Technical Architecture

### Smart Contract Integration

**From EggNFT.sol analysis:**

```solidity
// Key functions available:
function hatchEgg(uint256 tokenId) external nonReentrant returns (uint256)
function upgradeEggRarity(uint256 eggTokenId, uint256[] calldata foodIds) external
function getEggProperties(uint256 tokenId) external view returns (...)
function getFoodCount(uint256 tokenId) external view returns (uint256)
function isEggHatched(uint256 tokenId) external view returns (bool)
```

**CRITICAL FINDING:** There is NO `feedEgg()` function in EggNFT.sol. Feeding appears to be handled by:

1. `upgradeEggRarity()` — burns food NFTs and increments `food_count`
2. FoodNFT contract's `burnFoodFor()` is called internally

**Feeding Flow (reverse-engineered from contract):**

```typescript
// Frontend must:
1. Get user's food NFT IDs from inventory
2. Call `upgradeEggRarity(eggId, [foodId1, foodId2, ...])` with exactly 10 IDs
3. Contract burns food NFTs and increments egg's food_count
4. When food_count >= 10, egg becomes hatchable
```

**Hatching Flow:**

```typescript
// Frontend must:
1. Verify egg has food_count >= 10
2. Call `hatchEgg(eggId)`
3. Contract mints Animal NFT and returns token ID
4. Frontend triggers reveal animation with Animal metadata
```

### Data Flow Architecture

```
┌─────────────────┐
│ Egg Cards Page  │
└────────┬────────┘
         │
         ├─► Fetch user's eggs from PocketBase (egg_nfts collection)
         │
         ├─► Poll egg status every 30s (useEggPoll hook)
         │
         └─► On Feed/Hatch:
              ├─► Call smart contract via wallet-api
              ├─► Wait for transaction receipt
              ├─► Trigger UI update
              └─► Poll for confirmation
```

### Existing Patterns to Reuse

**From Phase 8-9:**

| Pattern             | Source              | Adaptation                                 |
| ------------------- | ------------------- | ------------------------------------------ |
| Auto-polling        | `useWalletPoll`     | Create `useEggPoll` for egg status         |
| Transaction flow    | Phase 9 feed flow   | Same confirmation → submit → wait pattern  |
| Claymorphism cards  | `card.tsx` variants | Use `clay-card` class for egg cards        |
| Badge component     | `badge.tsx`         | Rarity badges (Common/Rare/Epic/Legendary) |
| Progress bar        | `progress.tsx`      | Feeding progress (X/10)                    |
| Hydration safety    | `useIsHydrated`     | Same pattern for egg data access           |
| Toast notifications | `useToast`          | Success/error toasts for transactions      |

---

## Implementation Strategy

### Component Hierarchy

```
app/eggs/page.tsx (main page)
├── LayoutWrapper (nav, auth guard)
├── FeaturedEggHero (large card, egg closest to hatching)
├── EggGrid
│   └── EggCard[] (repeated for each egg)
│       ├── EggImage
│       ├── EggName (#ID)
│       ├── RarityBadge (Common/Rare/Epic/Legendary)
│       ├── ElementBadge (Fire/Water/Aero/etc.)
│       ├── FeedingProgress (X/10 bar)
│       └── ManageEggButton → opens dialog
├── FeedDialog (modal for feeding flow)
│   ├── Egg selector (if multiple eggs)
│   ├── Quick-fill auto-select (first 10 food items)
│   ├── Confirmation dialog
│   └── Submit button → contract call
└── HatchRevealModal (full-screen animation)
    ├── EggCrackAnimation (stages: crack → shake → burst)
    ├── ParticleEffects (sparkles, glow)
    ├── AnimalReveal (emerges from egg)
    └── RarityBadgeReveal (prominent display)
```

### Hook Architecture

**New hooks needed:**

```typescript
// hooks/use-egg-poll.ts
// Adapts useWalletPoll pattern for egg status
export function useEggPoll(
  eggIds: number[],
  intervalMs: number = 30000
): { eggs: EggData[]; loading: boolean; error: string | null }

// hooks/use-egg-feed.ts
// Manages feeding flow state and contract calls
export function useEggFeed(): {
  feedEgg: (eggId: number, foodIds: number[]) => Promise<boolean>
  loading: boolean
  error: string | null
}

// hooks/use-egg-hatch.ts
// Manages hatching flow and animal reveal
export function useEggHatch(): {
  hatchEgg: (eggId: number) => Promise<AnimalData | null>
  loading: boolean
  error: string | null
}
```

**Extend existing hook:**

```typescript
// hooks/use-egg-nft.ts — ADD:
const feedEgg = useCallback(async (eggId: number, foodIds: number[]) => {
  // Call wallet-api endpoint that triggers upgradeEggRarity
})

const hatchEgg = useCallback(async (eggId: number) => {
  // Call wallet-api endpoint that triggers hatchEgg
})
```

### API Endpoints (via wallet-api)

**Current wallet-api structure from Phase 9:**

```javascript
// Apps need to call via POST with auth token
POST /api/wallet/{address}/feed-egg
Body: { eggId, foodIds: number[] }

POST /api/wallet/{address}/hatch-egg
Body: { eggId }
```

**Wallet-api must:**

1. Receive request from frontend
2. Sign transaction with user's wallet (via dacc-js)
3. Broadcast to blockchain
4. Return transaction hash
5. Frontend polls for confirmation

---

## UX Design Decisions

### Egg Card Layout (per Jules reference)

**Desktop (3-column grid):**

- Card width: ~320px
- Egg image: 128px height, centered
- Progress bar: Full width, 8px height
- "Manage Egg" button: Full width, claymorphism style

**Mobile (1-column):**

- Full width cards
- Larger touch targets (48px min height)
- Stacked layout for image + details

### Featured Egg Hero

**Selection logic:**

```typescript
// Show egg closest to hatching (highest food_count)
const featuredEgg = eggs.reduce((closest, egg) =>
  egg.food_count > closest.food_count ? egg : closest
)
```

**Visual treatment:**

- 2x size of regular cards
- Animated glow effect on hover
- "LEGENDARY" badge rotation (per reference)
- Egg tip popup (Eggo's advice)

### Feed Flow (Quick-Fill Only)

**Per D-07, D-08:**

1. User clicks "FEED ME" on egg card
2. System auto-selects first 10 food items from inventory
3. Confirmation dialog: "Feed [Egg Name] with 10 food items?"
4. User confirms → transaction submitted
5. Success toast → egg card updates progress

**NO manual selection UI** — this is intentional to reduce friction.

### Hatch Reveal Animation

**Animation stages (10-15 seconds total):**

```
0-2s:   Egg appears center screen, subtle glow
2-4s:   First crack appears (hairline fracture)
4-6s:   Egg shakes violently
6-8s:   Bright light bursts from cracks
8-10s:  Egg bursts open, Animal emerges
10-12s: Animal lands, rarity badge appears
12-15s: Metadata display (name, element, rarity)
```

**Particle effects:**

- Sparkles during burst (8-10s)
- Glow effect around animal (10-12s)
- Confetti for Legendary rarity (optional)

**Implementation approach:**

- Use CSS animations for shake/rotate
- Use SVG/Canvas for particle effects
- Use framer-motion for smooth transitions
- OR: Use pre-rendered sprite animation (simpler)

---

## Data Models

### Egg Interface (from PocketBase)

```typescript
interface EggNft {
  id: string // PocketBase record ID
  egg_id: number // On-chain egg ID
  owner: string // User's wallet address
  food_count: number // 0-10 (or 0-20 with upgrades)
  is_hatched: boolean // True after hatching
  rarity_seed: number // For animal determination
  token_id: number // ERC721 token ID
  minted_at: string // ISO timestamp
  // Calculated fields (not in DB):
  status: "Ready" | "Feeding" | "Hatched"
  progress_percent: number // food_count / 10 * 100
}
```

### Animal Interface (post-hatch)

```typescript
interface AnimalNft {
  token_id: number
  egg_id: number
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  species: string // Chicken, Duck, Phoenix, Dragon, etc.
  element: "Fire" | "Water" | "Aero" | "Earth" // Derived from species
  generation: number // 0 for first-gen, higher for bred
  food_distribution: {
    grain: number
    fish: number
    insects: number
    herb: number
  }
}
```

### Rarity Badge Colors

```typescript
const RARITY_COLORS = {
  Common: "bg-gray-400 text-gray-900",
  Rare: "bg-blue-400 text-blue-900",
  Epic: "bg-purple-400 text-purple-900",
  Legendary: "bg-yellow-400 text-yellow-900",
}
```

---

## Validation Architecture (Nyquist)

### Observable Truths

For "Users can view, feed, and hatch their Egg NFTs" to be TRUE:

1. **User can see their eggs** — My Eggs page loads and displays all user's Egg NFTs
2. **User can see egg status** — Each egg card shows correct status badge (Ready/Feeding/Hatched)
3. **User can see feeding progress** — Progress bar shows X/10 food items
4. **User can feed an egg** — Click "FEED ME" → confirm → transaction succeeds
5. **User can hatch an egg** — Click "HATCH" (when food_count=10) → animation plays → Animal appears
6. **User sees rarity badge** — Hatched Animal displays correct rarity (Common/Rare/Epic/Legendary)
7. **Status updates after tx** — Egg card shows "Hatched" after blockchain confirmation

### Required Artifacts

| Artifact                                 | Provides                | Min Size   |
| ---------------------------------------- | ----------------------- | ---------- |
| `app/eggs/page.tsx`                      | Main eggs page          | 100+ lines |
| `components/eggs/egg-card.tsx`           | Reusable egg card       | 80+ lines  |
| `components/eggs/featured-egg-hero.tsx`  | Featured egg section    | 120+ lines |
| `components/eggs/feed-dialog.tsx`        | Feed flow modal         | 100+ lines |
| `components/eggs/hatch-reveal-modal.tsx` | Hatch animation         | 150+ lines |
| `hooks/use-egg-poll.ts`                  | Egg status polling      | 60+ lines  |
| `hooks/use-egg-feed.ts`                  | Feed transaction logic  | 50+ lines  |
| `hooks/use-egg-hatch.ts`                 | Hatch transaction logic | 50+ lines  |
| `lib/contracts/egg-nft.ts`               | Contract ABI and calls  | 80+ lines  |
| `app/eggs/loading.tsx`                   | Loading skeleton        | 40+ lines  |
| `app/eggs/error.tsx`                     | Error boundary          | 30+ lines  |

### Key Wiring

1. **Page → Hook:** `app/eggs/page.tsx` imports `useEggPoll` to fetch eggs
2. **Hook → API:** `useEggPoll` fetches from PocketBase `egg_nfts` collection
3. **Card → Dialog:** `EggCard` "Manage Egg" button opens `FeedDialog`
4. **Dialog → Contract:** `FeedDialog` calls `feedEgg()` → wallet-api → smart contract
5. **Modal → Animation:** `HatchRevealModal` triggers animation sequence
6. **Animation → Metadata:** Animation displays Animal NFT metadata from contract

### Validation Commands

```bash
# Check eggs page exists
test -f apps/web/app/eggs/page.tsx && echo "✓ Page exists"

# Check hooks exist
ls apps/web/hooks/use-egg-*.ts | wc -l | grep -q "[3-9]" && echo "✓ Hooks exist"

# Check contract integration
grep -l "upgradeEggRarity\|hatchEgg" apps/web/lib/contracts/*.ts && echo "✓ Contract calls present"

# Run tests
bun test apps/web/components/eggs/*.test.tsx && echo "✓ Component tests pass"

# Build passes
bun run build && echo "✓ Build passes"
```

---

## Common Pitfalls (Avoid These)

### 1. Feeding Without Verification

**BAD:**

```typescript
// Assumes food_count is correct
const canHatch = egg.food_count === 10
```

**GOOD:**

```typescript
// Verify from contract before allowing hatch
const { food_count } = await eggNftContract.getFoodCount(egg.token_id)
const canHatch = food_count >= 10
```

### 2. Animation Before Transaction Confirmation

**BAD:**

```typescript
// Shows success immediately
await hatchEgg(eggId)
setHatched(true) // Too early!
```

**GOOD:**

```typescript
// Wait for blockchain confirmation
const txHash = await hatchEgg(eggId)
await waitForTransaction(txHash) // Poll until confirmed
setHatched(true) // Now safe
```

### 3. Missing Hydration Check

**BAD:**

```typescript
// Crashes during SSR
const user = pb.authStore.record
```

**GOOD:**

```typescript
const isHydrated = useIsHydrated()
if (!isHydrated) return null
const user = pb.authStore.record
```

### 4. Hardcoded Contract Addresses

**BAD:**

```typescript
const EGG_NFT_ADDRESS = "0x1234..." // Hardcoded
```

**GOOD:**

```typescript
const EGG_NFT_ADDRESS = process.env.NEXT_PUBLIC_EGG_NFT_ADDRESS
```

### 5. No Error Recovery

**BAD:**

```typescript
// Single attempt, fails silently
try {
  await feedEgg(eggId, foodIds)
} catch (e) {
  console.error(e)
}
```

**GOOD:**

```typescript
// Retry with exponential backoff
const result = await retryWithBackoff(() => feedEgg(eggId, foodIds), {
  maxAttempts: 3,
  baseDelay: 1000,
})
```

---

## Dependencies & Integration Points

### Smart Contract Dependencies

```
EggNFT.sol
├── ERC721 (OpenZeppelin)
├── IERC20 (USDT token)
├── FoodNFT (for burning food)
├── AnimalNFT (for minting animals)
└── CommissionDistribution (for fees)
```

### Frontend Dependencies

```json
{
  "react": "^19.0.0",
  "next": "^16.0.0",
  "ethers": "^6.x", // Contract interaction
  "dacc-js": "^latest", // Wallet signing
  "framer-motion": "^11.x" // Animations (optional)
}
```

### PocketBase Collections

- `egg_nfts` — User's eggs with food_count, is_hatched
- `food_nfts` — User's food inventory (for feed dialog)
- `animal_nfts` — Hatched animals (post-hatch display)
- `users` — User profile with wallet address

---

## Test Strategy

### Unit Tests

```typescript
// use-egg-poll.test.ts
describe("useEggPoll", () => {
  it("polls every 30 seconds", async () => {
    // Verify polling interval
  })

  it("handles empty egg list", () => {
    // Graceful empty state
  })
})

// use-egg-feed.test.ts
describe("feedEgg", () => {
  it("selects exactly 10 food items", async () => {
    // Verify food count
  })

  it("fails with insufficient food", async () => {
    // Error handling
  })
})
```

### Integration Tests

```typescript
// eggs-page.test.tsx
describe("Eggs Page", () => {
  it("loads user eggs from PocketBase", async () => {
    // E2E flow
  })

  it("shows featured egg hero", async () => {
    // UI verification
  })

  it("allows feeding an egg", async () => {
    // Full feed flow
  })
})
```

### Visual Regression

Use Percy or Chromatic to verify:

- Egg card layout matches Jules design
- Progress bar renders correctly
- Rarity badge colors match spec

---

## Recommended Approach

### Phase 10 Execution Plan (High-Level)

**Plan 1: Foundation**

- Create `useEggPoll` hook (adapt from `useWalletPoll`)
- Create `EggCard` component with progress bar
- Create `app/eggs/page.tsx` with grid layout
- Test: Eggs display correctly with mock data

**Plan 2: Feed Flow**

- Create `useEggFeed` hook with contract integration
- Create `FeedDialog` with quick-fill auto-select
- Wire to wallet-api for transaction signing
- Test: Feed transaction succeeds, progress updates

**Plan 3: Hatch Flow**

- Create `useEggHatch` hook with contract integration
- Create `HatchRevealModal` with animation stages
- Wire particle effects and rarity display
- Test: Hatch animation plays, Animal metadata shows

**Plan 4: Polish**

- Add loading skeletons
- Add error boundaries
- Add "Updating..." badges during polling
- Test: All edge cases (empty state, errors, network issues)

---

## Research Gaps / Open Questions

1. **Food NFT burn mechanism** — How does frontend know which food IDs to burn?
   - **Resolution:** `upgradeEggRarity` takes `foodIds[]` array — frontend fetches user's food NFTs from PocketBase, selects first 10

2. **Hatch animation library** — Should we use framer-motion, CSS animations, or sprites?
   - **Recommendation:** CSS animations for simplicity, sprites for polish (future phase)

3. **Wallet-api endpoints** — Do `/feed-egg` and `/hatch-egg` endpoints exist?
   - **Action needed:** Check wallet-api, may need to add endpoints

4. **Animal NFT metadata** — How to fetch Animal metadata post-hatch?
   - **Resolution:** Call `AnimalNFT.getAnimalProperties(tokenId)` after hatch

---

## Conclusion

Phase 10 is well-scoped with clear reference designs and existing patterns to leverage. The main complexity is in the hatch animation and ensuring smooth transaction flows. Key risks are:

1. **Wallet-api integration** — May need new endpoints (medium risk)
2. **Hatch animation polish** — Could become scope creep (low risk with clear spec)
3. **Smart contract mismatch** — Feeding via `upgradeEggRarity` is non-obvious (mitigated by this research)

**Recommendation:** Proceed with planning using vertical slices (egg display → feed → hatch → polish) rather than horizontal layers.
