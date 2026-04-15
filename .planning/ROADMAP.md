# Roadmap: v0.0.6 Frontend Migration & Integration

**Milestone:** v0.0.6 Frontend Migration & Integration  
**Goal:** Replace current frontend with Jules-generated claymorphism design using TDD while maintaining full backend integration  
**Granularity:** Standard (5 phases, urgent timeline)  
**Total Requirements:** 30 v1 requirements

---

## Phases

- [x] **Phase 8: Foundation & Auth** - Landing page, LINE OAuth flow, navigation structure
- [x] **Phase 9: Dashboard & Wallet** - Real-time balance, referral tracking, activity feed
- [x] **Phase 10: Egg Management** - Egg listing, feeding flow, hatching mechanics (completed 2026-04-05)
- [ ] **Phase 11: Marketplace** - NFT listings, buy/sell flows, commission display
- [ ] **Phase 12: Mobile & Polish** - Responsive breakpoints, touch interactions, test coverage

---

## Phase Details

### Phase 8: Foundation & Auth

**Goal**: Users can access the new claymorphism UI and authenticate via LINE OAuth  
**Depends on:** Nothing (first phase of milestone)  
**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06  
**Success Criteria** (what must be TRUE):

1. Landing page renders hero section, NFT showcase, and how-to steps with claymorphism styling
2. User can click Join/Login button and initiate LINE OAuth with single click
3. User is redirected to dashboard after successful OAuth callback
4. Navigation components (TopNav, SideNav, BottomNav) render correctly on all device sizes
5. Material Symbols icons load and display consistently across all pages
6. LayoutWrapper provides consistent page structure throughout the application
   **Plans:** 3 plans
   **Status:** ✅ COMPLETE (2026-04-05)
   **Plans:**
   - [x] 08-foundation-auth-01-PLAN.md — Material Symbols + LayoutWrapper foundation
   - [x] 08-foundation-auth-02-PLAN.md — Navigation components (TopNav, SideNav, BottomNav)
   - [x] 08-foundation-auth-03-PLAN.md — Auth pages (Landing, Join, Callback)
         **TDD Workflow:** Red (test specs) → Green (implement) → Refactor (optimize) commits per feature
         **UI hint:** yes
         **Summary:** 18 tests passing, build succeeds, all FOUND-01/02/03 requirements complete

### Phase 9: Dashboard & Wallet

**Goal**: Users can view real-time wallet balance and track referral earnings  
**Depends on:** Phase 8 (auth required for dashboard access)  
**Requirements:** FOUND-07, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05  
**Success Criteria** (what must be TRUE):

1. Dashboard displays user's USDT balance fetched from PocketBase
2. Wallet balance auto-polls every 30 seconds with "Updating..." indicator during refresh
3. Referral chain displays 4 levels (G1-G4) with correct commission percentages (20%/10%/10%/10%)
4. Quick action buttons (Feed All, Hatch Ready, Buy Food) trigger correct navigation flows
5. Recent activity shows last 10 transactions from PocketBase
6. Active eggs count displays correctly with egg preview avatars
   **Plans:** 3 plans
   **TDD Workflow:** Red (test specs) → Green (implement) → Refactor (optimize) commits per feature
   **Plans:**
   - [x] 09-dashboard-wallet-01-PLAN.md — Balance card with auto-polling (FOUND-07, DASH-01)
   - [x] 09-dashboard-wallet-02-PLAN.md — Buddy Chain referral visualization (DASH-02)
   - [x] 09-dashboard-wallet-03-PLAN.md — Quick actions + activity feed (DASH-03, DASH-04, DASH-05)
         **Status:** ✅ COMPLETE (2026-04-05)
         **Summary:** All DASH requirements complete, balance polling working

### Phase 10: Egg Management

**Goal**: Users can view, feed, and hatch their Egg NFTs  
**Depends on:** Phase 8 (auth), Phase 9 (wallet integration)  
**Requirements:** EGG-01, EGG-02, EGG-03, EGG-04, EGG-05, EGG-06, EGG-07  
**Success Criteria** (what must be TRUE):

1. My Eggs page lists all user's Egg NFTs with status badges (Ready/Feeding/Hatched)
2. Egg card displays feeding progress bar showing X/10 food items collected
3. Feed flow allows selecting one egg and exactly 10 food items from inventory
4. Feed transaction calls smart contract `feedEgg()` with correct parameters (eggId, foodIds)
5. Hatch flow triggers `EggNFT.hatchEgg(eggId)` transaction and waits for confirmation
6. Hatch reveal animation displays newly hatched Animal NFT with rarity badge (Common/Rare/Epic/Legendary)
7. Egg status updates automatically after blockchain confirmation
   **Plans:** 4/4 plans complete
   **TDD Workflow:** Red (test specs) → Green (implement) → Refactor (optimize) commits per feature
   **Plans:**
   - [x] 10-01-PLAN.md — Egg display foundation with polling and cards (EGG-01, EGG-02) ✅ COMPLETE
   - [x] 10-02-PLAN.md — Feed flow with quick-fill and contract integration (EGG-03, EGG-04) ✅ COMPLETE
   - [x] 10-03-PLAN.md — Hatch flow with reveal animation (EGG-05, EGG-06) ✅ COMPLETE
   - [x] 10-04-PLAN.md — Polish: loading, error handling, polling indicators (EGG-07) ✅ COMPLETE
         **Status:** ✅ COMPLETE (2026-04-05)
         **Summary:** All EGG requirements complete, polling with backoff working, loading/error states implemented

### Phase 11: Marketplace

**Goal**: Users can browse, buy, and sell NFTs with transparent commission display  
**Depends on:** Phase 8 (auth), Phase 9 (wallet integration)  
**Requirements:** MKT-01, MKT-02, MKT-03, MKT-04, MKT-05, MKT-06  
**Success Criteria** (what must be TRUE):

1. Marketplace page lists all available NFTs from PocketBase with filters
2. Product detail page shows NFT metadata (image, name, rarity, owner) and price in USDT
3. Buy flow executes USDT approval then marketplace purchase transaction
4. Sell flow creates marketplace listing with escrow and sets asking price
5. Commission breakdown displays 4-level referral distribution (G1 20%, G2-G4 10% each)
6. Transaction confirmation updates UI state after blockchain sync completes
   **Plans:** 3 plans
   **TDD Workflow:** Red (test specs) → Green (implement) → Refactor (optimize) commits per feature
   **Plans:**
   - [ ] 11-01-PLAN.md — Buy flow TDD: USDT approval → marketplace purchase
   - [ ] 11-02-PLAN.md — Sell flow TDD + commission breakdown visualization
   - [ ] 11-03-PLAN.md — Marketplace filters + polling + error handling

### Phase 12: Mobile & Polish

**Goal**: Application is fully responsive with all tests passing  
**Depends on:** Phases 8-11 (all features implemented)  
**Requirements:** MOB-01, MOB-02, MOB-03, MOB-04, MOB-05  
**Success Criteria** (what must be TRUE):

1. BottomNav toggles visibility correctly at mobile breakpoints (<768px)
2. All pages render correctly at 320px, 768px, 1024px, and 1440px viewport widths
3. Touch interactions work correctly (tap buttons, swipe-to-refresh on lists)
4. All 63+ existing tests pass with new component structure
5. Production build completes with zero errors and zero warnings
   **Plans:** TBD
   **TDD Workflow:** Red (test specs) → Green (implement) → Refactor (optimize) commits per feature

---

## Progress

| Phase                  | Requirements | Success Criteria | Plans Complete | Status      | Completed  |
| ---------------------- | ------------ | ---------------- | -------------- | ----------- | ---------- |
| 8 - Foundation & Auth  | 6            | 6                | 3/3            | Complete    | 2026-04-05 |
| 9 - Dashboard & Wallet | 6            | 6                | 3/3            | Complete    | 2026-04-05 |
| 10 - Egg Management    | 7            | 7                | 4/4            | Complete    | 2026-04-05 |
| 11 - Marketplace       | 6            | 6                | 0/0            | Not started | -          |
| 12 - Mobile & Polish   | 5            | 5                | 0/0            | Not started | -          |

---

## Coverage

**Total v1 requirements:** 30  
**Mapped to phases:** 30/30 ✓  
**Orphaned requirements:** 0 ✓

### Requirement Mapping

| Requirement | Phase    | Plan | Status |
| ----------- | -------- | ---- | ------ |
| FOUND-01    | Phase 8  | 03   | —      |
| FOUND-02    | Phase 8  | 03   | —      |
| FOUND-03    | Phase 8  | 03   | —      |
| FOUND-04    | Phase 8  | 02   | —      |
| FOUND-05    | Phase 8  | 01   | —      |
| FOUND-06    | Phase 8  | 01   | —      |
| FOUND-07    | Phase 9  | TBD  | —      |
| DASH-01     | Phase 9  | TBD  | —      |
| DASH-02     | Phase 9  | TBD  | —      |
| DASH-03     | Phase 9  | TBD  | —      |
| DASH-04     | Phase 9  | TBD  | —      |
| DASH-05     | Phase 9  | TBD  | —      |
| EGG-01      | Phase 10 | 01   | ✅     |
| EGG-02      | Phase 10 | 01   | ✅     |
| EGG-03      | Phase 10 | TBD  | —      |
| EGG-04      | Phase 10 | TBD  | —      |
| EGG-05      | Phase 10 | TBD  | —      |
| EGG-06      | Phase 10 | TBD  | —      |
| EGG-07      | Phase 10 | TBD  | —      |
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

---

## Dependencies

```
Phase 8 (Foundation & Auth)
    │
    ├──────────────────────────────┐
    ▼                              ▼
Phase 9 (Dashboard & Wallet)       │
    │                              │
    ├──────────────┐               │
    ▼              ▼               │
Phase 10 (Egg)  Phase 11 (Market) │
    │              │               │
    └──────────────┴───────────────┘
                   ▼
         Phase 12 (Mobile & Polish)
```

**Critical Path:** 8 → 9 → 10 → 12 (egg management unlocks final polish)
**Parallel Execution:** Phase 11 (Marketplace) can run parallel to Phase 10 after Phase 9 completes

---

## Notes

**TDD Commit Pattern:**
Each phase follows Test-Driven Generation workflow:

- `red: test spec for [feature] (#issue)` — Write failing test first
- `green: implement [feature] (#issue)` — Minimum code to pass test
- `refactor: [improvement] (#issue)` — Optimize with clean patterns

**Backend Integration:**

- All existing PocketBase collections preserved
- LINE OAuth flow unchanged (single-click authentication)
- Wallet API (dacc-js v0.0.5) integration maintained
- Smart contracts on 0XL3 testnet (existing deployment)

**UI Design Source:**

- Jules-generated claymorphism design in `resources/eggo-world-uxui-jules/`
- Material Symbols icons throughout
- Claymorphism aesthetic with "Clay Frames, Pixel Content" hybrid approach

**Deployment Target:**

- Static export for Cloudflare Pages
- Build command: `bun run build`
- Output directory: `out/`
