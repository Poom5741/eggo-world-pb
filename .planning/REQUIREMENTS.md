# Milestone v0.0.6 Requirements

## Frontend Foundation & Auth

- [ ] **FOUND-01**: Landing page renders with Jules design (hero, NFT showcase, how-to steps)
- [ ] **FOUND-02**: Join page initiates LINE OAuth with single-click button
- [ ] **FOUND-03**: Auth callback handler processes LINE OAuth response and redirects to dashboard
- [ ] **FOUND-04**: Navigation components render correctly (TopNav desktop, BottomNav mobile, SideNav)
- [x] **FOUND-05**: LayoutWrapper provides consistent structure across all pages
- [x] **FOUND-06**: Material Symbols icons load and display correctly

## Dashboard & Wallet Integration

- [ ] **DASH-01**: Dashboard displays user's USDT balance from PocketBase
- [ ] **FOUND-07**: Wallet balance auto-polls every 30 seconds with "Updating..." indicator
- [ ] **DASH-02**: Referral chain displays 4 levels (G1-G4) with correct percentages
- [ ] **DASH-03**: Quick action buttons trigger correct flows (Feed All, Hatch Ready, Buy Food)
- [ ] **DASH-04**: Recent activity shows last 10 transactions from PocketBase
- [ ] **DASH-05**: Active eggs count displays correctly with egg preview avatars

## Egg Management

- [x] **EGG-01**: My Eggs page lists all user's Egg NFTs with status badges
- [x] **EGG-02**: Egg card shows feeding progress (X/10 food items)
- [x] **EGG-03**: Feed flow allows selecting egg and exactly 10 food items
- [x] **EGG-04**: Feed transaction calls smart contract with correct parameters
- [x] **EGG-05**: Hatch flow triggers EggNFT.hatchEgg() transaction
- [x] **EGG-06**: Hatch reveal displays Animal NFT with rarity badge
- [x] **EGG-07**: Egg status updates after blockchain confirmation

## Marketplace Integration

- [ ] **MKT-01**: Marketplace page lists all available NFTs from PocketBase
- [ ] **MKT-02**: Product detail page shows NFT metadata and price
- [ ] **MKT-03**: Buy flow approves USDT then executes marketplace purchase
- [ ] **MKT-04**: Sell flow creates marketplace listing with escrow
- [ ] **MKT-05**: Commission breakdown displays 4-level referral distribution
- [ ] **MKT-06**: Transaction confirmation updates UI after blockchain sync

## Mobile & Polish

- [ ] **MOB-01**: BottomNav toggles correctly on mobile breakpoints
- [ ] **MOB-02**: All pages responsive at 320px, 768px, 1024px, 1440px
- [ ] **MOB-03**: Touch interactions work (tap, swipe for refresh)
- [ ] **MOB-04**: All existing 63+ tests pass with new component structure
- [ ] **MOB-05**: Build passes with zero errors and zero warnings

## Future Requirements (Deferred)

### Breeding & Tiers

- Animal breeding mechanics
- Tier reward badges (soulbound NFTs)
- Rarity upgrade paths

### Admin & Analytics

- Admin dashboard
- Platform statistics
- User management tools

### Advanced Features

- Secondary market royalties (10% to referral chain)
- KYC verification
- Multi-chain support

## Out of Scope

- **New smart contracts** — Using existing EggNFT, FoodNFT, AnimalNFT, Marketplace contracts
- **Backend changes** — PocketBase collections and hooks remain unchanged
- **Wallet API changes** — Existing dacc-js integration preserved
- **Auth flow changes** — LINE OAuth single-click flow maintained
- **New game mechanics** — Breeding, artifacts, raids deferred to next milestone

## Traceability

| Requirement | Phase    | Plan | Status |
| ----------- | -------- | ---- | ------ |
| FOUND-01    | Phase 8  | TBD  | —      |
| FOUND-02    | Phase 8  | TBD  | —      |
| FOUND-03    | Phase 8  | TBD  | —      |
| FOUND-04    | Phase 8  | TBD  | —      |
| FOUND-05    | Phase 8  | TBD  | —      |
| FOUND-06    | Phase 8  | TBD  | —      |
| FOUND-07    | Phase 9  | TBD  | —      |
| DASH-01     | Phase 9  | TBD  | —      |
| DASH-02     | Phase 9  | TBD  | —      |
| DASH-03     | Phase 9  | TBD  | —      |
| DASH-04     | Phase 9  | TBD  | —      |
| DASH-05     | Phase 9  | TBD  | —      |
| EGG-01      | Phase 10 | TBD  | —      |
| EGG-02      | Phase 10 | TBD  | —      |
| EGG-03      | Phase 10 | 02   | —      |
| EGG-04      | Phase 10 | 02   | —      |
| EGG-05      | Phase 10 | 03   | ✅     |
| EGG-06      | Phase 10 | 03   | ✅     |
| EGG-07      | Phase 10 | 03   | ✅     |
| MKT-01      | Phase 11 | TBD  | —      |
| MKT-02      | Phase 11 | TBD  | —      |
| MKT-03      | Phase 11 | TBD  | —      |
| MKT-04      | Phase 11 | TBD  | —      |
| MKT-05      | Phase 11 | TBD  | —      |
| MKT-06      | Phase 11 | TBD  | —      |
| MOB-01      | Phase 12 | TBD  | —      |
| MOB-02      | Phase 12 | TBD  | —      |
| MOB-03      | Phase 12 | TBD  | —      |
| MOB-04      | Phase 12 | TBD  | —      |
| MOB-05      | Phase 12 | TBD  | —      |
