---
phase: 20-gap-closure-uat-execution
plan: 02
name: "UAT Execution — 16 Manual Scenarios"
status: in-progress
total_scenarios: 16
requirement_ids:
  - GAPS-02
  - GAPS-05
---

# 20-UAT.md — Master UAT Checklist

**Phase:** 20-gap-closure-uat-execution (Plan 02)  
**Wave:** 2  
**Objective:** Execute 16 deferred UAT scenarios covering feed flow, hatch flow, polling, empty state, error boundaries, wallet checks, Buy Now flow, dashboard polling, and foodCount validation.  
**Created:** 2026-04-22

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Execution Order](#execution-order)
3. [Scenario Definitions](#scenario-definitions)
   - [Phase 10 Scenarios (P10-S01 – P10-S10)](#phase-10-scenarios)
   - [Phase 17 Re-Verification Scenarios (P17-S01 – P17-S06)](#phase-17-re-verification-scenarios)
4. [Sign-off](#sign-off)

---

## Prerequisites

Before executing any scenario, verify the following:

- [ ] **PocketBase** running on `localhost:8090` (dev) or `https://pb.eggoworld.io` (production)
- [ ] **Wallet API** running on `localhost:3001`
- [ ] **Frontend** running on `localhost:3000`
- [ ] **Test user account** authenticated via LINE OAuth
- [ ] **Test user owns egg with `food_count < 10`** (for feed flow tests)
- [ ] **Test user owns egg with `food_count = 10`** (for hatch flow / validation tests)
- [ ] **Test user has food NFTs available** (`is_consumed = false`)
- [ ] **Test user has >25 USDT balance** (for marketplace buy tests)
- [ ] **Relayer wallet funded with BNB** for gas sponsorship (check wallet-api logs for relayer initialization)

### Environment Quick Reference

| Service    | Local                         | Production                 |
| ---------- | ----------------------------- | -------------------------- |
| PocketBase | http://localhost:8090         | https://pb.eggoworld.io    |
| Wallet API | http://localhost:3001         | —                          |
| Frontend   | http://localhost:3000         | Cloudflare Pages           |
| Network    | 0xl3 testnet (Chain ID: 7117) | BSC mainnet (Chain ID: 56) |

### Test Data Setup

```bash
# Start PocketBase (Docker)
docker-compose up -d pocketbase

# Start wallet-api
cd wallet-api && bun run server.js

# Start frontend
cd apps/web && bun run dev

# Verify relayer BNB balance (check wallet-api startup logs)
# Look for: "[Relayer] Wallet initialized: 0x..."
```

---

## Execution Order

Per decision **D-03**, execute scenarios in dependency order to avoid state contamination:

```
auth → wallet → mint → feed → hatch → marketplace → polling → edge cases
```

| Order | Scenario ID | Title                           | Page                     | Estimated Time |
| ----- | ----------- | ------------------------------- | ------------------------ | -------------- |
| 1     | P10-S10     | Wallet Check - No Wallet        | `/eggs`                  | 2 min          |
| 2     | P10-S01     | Egg NFT Page Display            | `/eggs`                  | 3 min          |
| 3     | P10-S09     | Empty State - No Eggs           | `/eggs`                  | 3 min          |
| 4     | P17-S04     | Empty State CTA Routing         | `/eggs`                  | 2 min          |
| 5     | P10-S02     | Feed Flow - Quick Fill          | `/eggs`                  | 5 min          |
| 6     | P10-S03     | Feed Flow - Validation          | `/eggs`                  | 2 min          |
| 7     | P17-S05     | FeedDialog from FeaturedEggHero | `/eggs`                  | 3 min          |
| 8     | P17-S03     | foodCount Validation UI         | `/eggs`                  | 2 min          |
| 9     | P10-S04     | Hatch Flow - Button Visibility  | `/eggs`                  | 2 min          |
| 10    | P10-S05     | Hatch Flow - Animation          | `/eggs`                  | 15–20 min      |
| 11    | P10-S06     | Hatch Flow - Result Display     | `/eggs`                  | 3 min          |
| 12    | P10-S07     | Polling - "Updating..." Badge   | `/eggs`                  | 35+ sec        |
| 13    | P17-S02     | Dashboard Polling               | `/dashboard/commissions` | 35+ sec        |
| 14    | P10-S08     | Error Boundary - Retry          | `/eggs`                  | 5 min          |
| 15    | P17-S01     | Buy Now Flow                    | `/marketplace`           | 5 min          |
| 16    | P17-S06     | Hook EGG_FULL Error Handling    | API (curl)               | 2 min          |

> **Note:** Scenarios involving blockchain transactions (P10-S02, P10-S05, P17-S01) require gas sponsorship. Ensure relayer wallet has sufficient BNB before proceeding.

---

## Scenario Definitions

---

### Phase 10 Scenarios

#### Scenario P10-S01: Egg NFT Page Display

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S01                   |
| **Source**      | Phase 10, Scenario 1      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual                    |

**Prerequisites:**

- Authenticated user
- User owns at least one egg NFT

**Steps:**

1. Navigate to `/eggs` while authenticated
2. Verify **featured egg hero** appears at the top of the page
3. Verify **grid of egg cards** appears below the hero (3 columns on desktop, responsive on mobile)
4. Verify each card displays:
   - Egg image
   - Name (#ID)
   - Rarity badge
   - Element type
   - Feeding progress (X/10)
5. Verify **"Updating..." badge** pulses during polling updates
6. Verify **loading skeleton** renders on initial fetch before data loads

**Expected Outcome:** Page renders with all UI elements correctly positioned and styled per claymorphism design system.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S02: Feed Flow - Quick Fill

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S02                   |
| **Source**      | Phase 10, Scenario 2      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | manual tx                 |

**Prerequisites:**

- Authenticated user with egg having `food_count < 10`
- User owns food NFTs (`is_consumed = false`)
- Relayer wallet funded with BNB for gas sponsorship

**Steps:**

1. Navigate to `/eggs` with authenticated user owning egg with `food_count < 10`
2. Click **"FEED ME"** button on the FeaturedEggHero **OR** click **"Manage Egg"** on an EggCard
3. Verify **FeedDialog** opens showing available food NFTs
4. Select **1–10 food items** in the selection grid
5. Click **"Confirm"** button
6. Verify **transaction toast** appears ("Preparing..." → "Waiting for confirmation...")
7. Verify egg card shows **updated food count** after confirmation (e.g., 4/10 → 10/10)

**Expected Outcome:** Food NFTs are consumed, egg `food_count` increases correctly, transaction completes with success toast.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S03: Feed Flow - Validation

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S03                   |
| **Source**      | Phase 10, Scenario 3      |
| **Requirement** | GAPS-05                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual                    |

**Prerequisites:**

- Authenticated user with egg having `food_count = 10`

**Steps:**

1. Navigate to `/eggs` with authenticated user owning egg with `food_count = 10`
2. Verify **"FEED ME" button is NOT shown** on FeaturedEggHero ("HATCH NOW!" shown instead)
3. Verify attempting to feed via API returns **400** with code `EGG_FULL`:

```bash
curl -X POST http://localhost:8090/api/v2/feed-egg \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"egg_token_id":<FULL_EGG_ID>,"food_ids":[1]}'
```

Expected response:

```json
{
  "success": false,
  "error": {
    "message": "Cannot feed this egg — it is full and ready to hatch",
    "code": "EGG_FULL"
  }
}
```

**Expected Outcome:** FEED ME button is hidden/disabled when `food_count >= 10`; backend rejects feed with proper error.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S04: Hatch Flow - Button Visibility

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S04                   |
| **Source**      | Phase 10, Scenario 4      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual                    |

**Prerequisites:**

- Authenticated user with egg having exactly `food_count = 10`

**Steps:**

1. Navigate to `/eggs` with egg having exactly 10 food items
2. Verify **"HATCH!"** button appears on EggCard (replaces or appears alongside "FEED ME")
3. Verify **"HATCH NOW!"** button appears on FeaturedEggHero

**Expected Outcome:** Both EggCard and FeaturedEggHero display hatch buttons when egg is fully fed.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S05: Hatch Flow - Animation

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S05                   |
| **Source**      | Phase 10, Scenario 5      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual / animation        |

**Prerequisites:**

- Authenticated user with egg at `food_count = 10`
- Relayer wallet funded with BNB for gas sponsorship

**Steps:**

1. Click **"HATCH!"** button on an egg card with `food_count = 10`
2. Verify **confirmation modal** appears with egg details
3. Click **"HATCH NOW"** in the modal
4. Verify animation sequence plays (10–15 seconds):
   - **Glow** — Egg emits light/glow effect
   - **Crack** — Visible cracks appear on egg shell
   - **Shake** — Egg shakes violently
   - **Burst** — Bright flash/explosion effect
   - **Animal emerges** — Hatched animal NFT appears

**Expected Outcome:** Smooth animation sequence plays without glitches; all stages visible.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S06: Hatch Flow - Result Display

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S06                   |
| **Source**      | Phase 10, Scenario 6      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual                    |

**Prerequisites:**

- Hatch animation has just completed (follows P10-S05)

**Steps:**

1. After hatch animation completes, verify modal shows the newly **hatched Animal NFT**
2. Verify the following details are displayed:
   - Animal name
   - Element type
   - Rarity badge
3. Verify **rarity color coding** is correct:
   - **Common** = gray
   - **Rare** = blue
   - **Epic** = purple
   - **Legendary** = yellow

**Expected Outcome:** Modal clearly displays all animal attributes with correct rarity color.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S07: Polling — "Updating..." Badge

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S07                   |
| **Source**      | Phase 10, Scenario 7      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual / timed            |

**Prerequisites:**

- Authenticated user with at least one egg
- Frontend and PocketBase connected

**Steps:**

1. Navigate to `/eggs`
2. Keep the page open for **30+ seconds** (polling interval is 30s)
3. Verify **"Updating..." badge** with **pulse animation** appears on egg cards
4. Verify badge shows **spinning sync icon** during polling updates
5. Verify badge disappears once polling completes

**Expected Outcome:** Badge appears every 30 seconds during auto-polling, with visible pulse animation and sync icon.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S08: Error Boundary — Retry

| Field           | Value                            |
| --------------- | -------------------------------- |
| **Scenario ID** | P10-S08                          |
| **Source**      | Phase 10, Scenario 8             |
| **Requirement** | GAPS-02                          |
| **Environment** | Local (requires backend control) |
| **Test URL**    | `/eggs`                          |
| **Type**        | manual error                     |

**Prerequisites:**

- Ability to stop/start PocketBase backend
- Authenticated user

**Steps:**

1. **Stop PocketBase backend** temporarily (or block network to `localhost:8090`)
2. Navigate to `/eggs`
3. Verify **error boundary** appears with:
   - Friendly error message
   - **"Retry"** button
4. Click **"Retry"** and verify it attempts to reload eggs
5. **Restart PocketBase** backend
6. Click **"Retry"** again and verify the page loads eggs successfully

**Expected Outcome:** Error boundary catches failures gracefully; Retry button triggers refetch; recovery works after backend restoration.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S09: Empty State — No Eggs

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S09                   |
| **Source**      | Phase 10, Scenario 9      |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | visual                    |

**Prerequisites:**

- Authenticated user with **zero egg NFTs**

**Steps:**

1. Use an account with zero egg NFTs (or filter to show none)
2. Navigate to `/eggs`
3. Verify **empty state** displays:
   - Friendly illustration or message: **"No Eggs Yet"**
   - Supporting subtext explaining next steps
4. Verify **"Get Your First Egg"** CTA button is present and styled per claymorphism design

**Expected Outcome:** Empty state is visually inviting (not a dead-end) and clearly communicates "no eggs" with a CTA.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P10-S10: Wallet Check — No Wallet

| Field           | Value                     |
| --------------- | ------------------------- |
| **Scenario ID** | P10-S10                   |
| **Source**      | Phase 10, Scenario 10     |
| **Requirement** | GAPS-02                   |
| **Environment** | Both (local + production) |
| **Test URL**    | `/eggs`                   |
| **Type**        | auth                      |

**Prerequisites:**

- Account **without wallet field set** (or disconnected wallet)

**Steps:**

1. Use account without a wallet field set (or disconnect wallet from the app)
2. Navigate to `/eggs`
3. Verify one of the following:
   - **"Connect Wallet"** prompt appears, OR
   - Page **redirects to `/dashboard`** with message about wallet requirement

**Expected Outcome:** User is prevented from accessing egg management without a valid wallet; clear guidance provided.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

### Phase 17 Re-Verification Scenarios

#### Scenario P17-S01: Buy Now Flow

| Field           | Value                               |
| --------------- | ----------------------------------- |
| **Scenario ID** | P17-S01                             |
| **Source**      | Phase 17, Manual Scenario (Buy Now) |
| **Requirement** | GAPS-02                             |
| **Environment** | Both (local + production)           |
| **Test URL**    | `/marketplace`                      |
| **Type**        | manual tx                           |

**Prerequisites:**

- Authenticated user with **>25 USDT balance**
- Listed egg available on marketplace
- Relayer wallet funded with BNB for gas sponsorship

**Steps:**

1. Navigate to `/marketplace`
2. Click **"Buy Now"** on a listed egg
3. Verify **confirmation dialog** shows:
   - Egg price
   - Commission breakdown (if applicable)
   - Total amount
4. Click **"Confirm"** to proceed with purchase
5. Verify **transaction progress** displays:
   - "Preparing..."
   - "Waiting for confirmation (X/12)"
6. Wait for **12-block confirmation**
7. Verify **success message** with transaction hash
8. Verify **BSCScan link** is clickable and shows correct transaction
9. Verify **ownership transferred** — purchased egg appears in `/eggs` page

**Expected Outcome:** Purchase completes end-to-end; egg transfers to buyer; seller receives USDT minus commission; all UI states update correctly.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P17-S02: Dashboard Polling

| Field           | Value                                         |
| --------------- | --------------------------------------------- |
| **Scenario ID** | P17-S02                                       |
| **Source**      | Phase 17, Manual Scenario (Dashboard Polling) |
| **Requirement** | GAPS-02                                       |
| **Environment** | Both (local + production)                     |
| **Test URL**    | `/dashboard/commissions`                      |
| **Type**        | visual / timed                                |

**Prerequisites:**

- Authenticated user with commission data (or any user)
- Frontend and PocketBase connected

**Steps:**

1. Navigate to `/dashboard/commissions`
2. Keep the page open for **30+ seconds**
3. Verify **"Updating..." badge** appears with **spinning sync icon**
4. Verify **commission data refreshes** without page reload
5. Verify the badge disappears after refresh completes

**Expected Outcome:** Auto-polling works on dashboard; commission data refreshes every 30 seconds with visual indicator.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P17-S03: foodCount Validation UI

| Field           | Value                                            |
| --------------- | ------------------------------------------------ |
| **Scenario ID** | P17-S03                                          |
| **Source**      | Phase 17, Manual Scenario (foodCount Validation) |
| **Requirement** | GAPS-05                                          |
| **Environment** | Both (local + production)                        |
| **Test URL**    | `/eggs`                                          |
| **Type**        | visual                                           |

**Prerequisites:**

- Authenticated user with egg at `food_count = 10`

**Steps:**

1. Navigate to `/eggs` with egg at `food_count = 10`
2. Verify **"FEED ME" button is replaced** by **"HATCH NOW!"** on FeaturedEggHero
3. Verify **"HATCH!" button** appears on EggCard
4. Verify **progress bar** shows message: **"Ready to hatch! 🎉"**

**Expected Outcome:** UI clearly indicates egg is full and ready to hatch; feed action is unavailable; hatch action is prominently displayed.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P17-S04: Empty State CTA Routing (Gap Fix Verify)

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| **Scenario ID** | P17-S04                                    |
| **Source**      | Phase 17, Gap Fix Verify (Empty State CTA) |
| **Requirement** | GAPS-05                                    |
| **Environment** | Both (local + production)                  |
| **Test URL**    | `/eggs`                                    |
| **Type**        | navigation                                 |

**Prerequisites:**

- Authenticated user with **zero eggs**

**Steps:**

1. Use account with zero eggs
2. Navigate to `/eggs`
3. Click **"Get Your First Egg"** button in the empty state
4. Verify browser navigates to **`/marketplace`** (NOT `/eggs` — previous bug was self-loop)

**Expected Outcome:** CTA correctly routes user to marketplace where they can purchase an egg.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P17-S05: FeedDialog from FeaturedEggHero (Gap Fix Verify)

| Field           | Value                                              |
| --------------- | -------------------------------------------------- |
| **Scenario ID** | P17-S05                                            |
| **Source**      | Phase 17, Gap Fix Verify (FeaturedEggHero FEED ME) |
| **Requirement** | GAPS-05                                            |
| **Environment** | Both (local + production)                          |
| **Test URL**    | `/eggs`                                            |
| **Type**        | interaction                                        |

**Prerequisites:**

- Authenticated user with egg at `food_count < 10`
- User has food NFTs available

**Steps:**

1. Navigate to `/eggs` with egg at `food_count < 10`
2. Click **"FEED ME"** button on FeaturedEggHero
3. Verify **FeedDialog opens** with correct egg data pre-populated
4. Verify **food selection grid** displays available food NFTs
5. Verify dialog functions identically to FeedDialog opened from EggCard's "Manage Egg"

**Expected Outcome:** FeaturedEggHero FEED ME button is fully wired to FeedDialog; no `console.log` stub behavior.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

#### Scenario P17-S06: Hook EGG_FULL Error Handling (Gap Fix Verify)

| Field           | Value                                          |
| --------------- | ---------------------------------------------- |
| **Scenario ID** | P17-S06                                        |
| **Source**      | Phase 17, Gap Fix Verify (Hook Error Handling) |
| **Requirement** | GAPS-05                                        |
| **Environment** | Local (API test)                               |
| **Test URL**    | API endpoint: `POST /api/v2/feed-egg`          |
| **Type**        | API error                                      |

**Prerequisites:**

- API client or browser dev tools
- Valid authentication token
- Egg with `food_count = 10` (known `egg_token_id`)

**Steps:**

1. Use API client (curl, Postman, or browser dev tools)
2. Send **POST** to `/api/v2/feed-egg` with:
   - `egg_token_id`: ID of egg with `food_count = 10`
   - `food_ids`: array with at least one valid food NFT ID

```bash
curl -X POST http://localhost:8090/api/v2/feed-egg \
  -H "Authorization: Bearer <AUTH_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"egg_token_id":<FULL_EGG_ID>,"food_ids":[1]}'
```

3. Verify response **status is 400**
4. Verify response body:

```json
{
  "success": false,
  "error": {
    "message": "Cannot feed this egg — it is full and ready to hatch",
    "code": "EGG_FULL"
  }
}
```

5. Verify **NO transaction** was sent to the blockchain (check wallet-api logs for no feed-egg call)
6. Verify **NO PocketBase records** were modified (food NFTs remain unconsumed)

**Expected Outcome:** Hook performs fast-fail validation; returns 400 with clear error; no gas wasted; no state modified.

- [ ] PASS / [ ] FAIL

**Notes:**

```
notes:
```

---

## Sign-off

### Summary

| Metric              | Count |
| ------------------- | ----- |
| **Total Scenarios** | 16    |
| **Passed**          | \_    |
| **Failed**          | \_    |
| **Blocked**         | \_    |
| **Skipped**         | \_    |

### Results by Phase

| Phase                | Scenarios | Passed | Failed | Blocked |
| -------------------- | --------- | ------ | ------ | ------- |
| P10 (Scenarios 1–10) | 10        | \_     | \_     | \_      |
| P17 (Scenarios 1–6)  | 6         | \_     | \_     | \_      |

### Failure Log

For any scenario marked FAIL, document below:

| Scenario ID | Severity | Reproduction Steps | Expected | Actual |
| ----------- | -------- | ------------------ | -------- | ------ |
|             |          |                    |          |        |

### Sign-off

**Tested by:** ********\_\_\_\_********  
**Date:** ********\_\_\_\_********  
**Environment(s):** ☐ Local ☐ Production ☐ Both

**Declaration:**

> I have executed all 16 scenarios listed above. All PASS/FAIL marks reflect actual observations against a running system. Any failures have been documented with reproduction steps and severity assessment.

---

_20-UAT.md — Generated from 10-UAT.md, 17-UAT.md, PHASE-19-VERIFICATION.md, and 20-CONTEXT.md_
