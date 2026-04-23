# Phase 27: Egg Rarity Upgrade System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 27-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 27-egg-rarity-upgrade
**Areas discussed:** Spec vs Contract, Contract Mechanics, Upgrade Fee, UI Entry Point, Food Selection, Probability Display, Backend Hook, Show Conditions, Session Mode, Confirmation

---

## Spec vs Contract

| Option                 | Description                                                                       | Selected |
| ---------------------- | --------------------------------------------------------------------------------- | -------- |
| Follow Contract        | Use actual contract mechanics: max 10 extra food, +2% bonus per item, $5/item fee |          |
| Follow Spec Thresholds | Requires contract modification to allow 500+ items                                | ✓        |
| Hybrid Approach        | Implement current contract now, plan spec thresholds as future phase              |          |

**User's choice:** Follow Spec Thresholds
**Notes:** Spec thresholds (50→Rare, 200→Epic, 500→Legendary) are the intended user experience. Contract modification required.

---

## Contract Mechanics

| Option                                       | Description                                           | Selected |
| -------------------------------------------- | ----------------------------------------------------- | -------- |
| Hybrid: Bonuses + Guaranteed Minimums        | Keep +2% bonus per food, add tier guaranteed minimums | ✓        |
| Hard Threshold Guarantees Only               | Remove bonus, pure thresholds (50=100% Rare, etc.)    |          |
| Keep Current Contract, Fake Thresholds in UI | Visualization only, no contract changes               |          |

**User's choice:** Hybrid: Bonuses + Guaranteed Minimums
**Notes:** Each extra food gives +2% bonus to higher tiers, AND tier thresholds guarantee minimum rarity (50→Rare min, 200→Epic min, 500→Legendary min).

---

## Upgrade Fee

| Option                       | Description                                        | Selected |
| ---------------------------- | -------------------------------------------------- | -------- |
| No Upgrade Fee (Follow Spec) | User only burns food NFTs, no USDT charge          | ✓        |
| Keep $5/item Fee             | Current contract fee, expensive for large upgrades |          |
| Set $0.50/item Fee           | Same as food mint price                            |          |

**User's choice:** No Upgrade Fee (Follow Spec)
**Notes:** Spec doesn't mention upgrade fee. Remove current $5/item fee from contract. User cost = food NFTs burned (which they already paid $0.50 each to mint).

---

## UI Entry Point

| Option                               | Description                                        | Selected |
| ------------------------------------ | -------------------------------------------------- | -------- |
| Egg Card Action Menu (Recommended)   | Add 'Upgrade Rarity' button to EggCard action menu | ✓        |
| Egg Detail Page Button               | Open upgrade dialog from dedicated egg detail page |          |
| Extend FeedDialog (Post-Feed Prompt) | Show upgrade prompt after feeding 10 in FeedDialog |          |
| Dedicated Upgrade Page               | Create /eggs/[id]/upgrade route                    |          |

**User's choice:** Egg Card Action Menu (Recommended)
**Notes:** Reuse existing EggCard action menu pattern. Button next to Feed/Hatch.

---

## Food Selection UX

| Option                              | Description                                                | Selected |
| ----------------------------------- | ---------------------------------------------------------- | -------- |
| Manual Grid Selection (Recommended) | Grid like FeedDialog, user clicks items, shows counter     | ✓        |
| Tier-Based Auto-Select              | Click tier button, system auto-selects required food count |          |
| Quantity Slider/Input               | User enters count, system auto-picks from inventory        |          |
| Tier-Then-Items Flow                | Two-step: select tier first, then see which items used     |          |

**User's choice:** Manual Grid Selection (Recommended)
**Notes:** Reuse FeedDialog pattern: 2-column grid, user clicks to select/deselect, counter shows "X items selected (Y% bonus, guaranteed: [tier])".

---

## Probability Display

| Option                                 | Description                                                    | Selected |
| -------------------------------------- | -------------------------------------------------------------- | -------- |
| Percentage Bars per Tier (Recommended) | Visual bars for Common/Rare/Epic/Legendary, dynamic update     | ✓        |
| Guaranteed Tier Badge Preview          | Show minimum tier badge based on food count                    |          |
| Text Probability Breakdown             | Detailed text: "Common 40%, Rare 45%, Epic 22%, Legendary 13%" |          |
| Badge + Bars Combo                     | Show guaranteed badge + bars above that tier                   |          |

**User's choice:** Percentage Bars per Tier (Recommended)
**Notes:** Use existing Progress component. Bars fill based on probability percentages, update as user selects food. Tier colors: gray/blue/purple/gold.

---

## Backend Hook

| Option                 | Description                                  | Selected |
| ---------------------- | -------------------------------------------- | -------- |
| New Hook (Recommended) | Create dedicated 27-upgrade-egg-rarity.pb.js | ✓        |
| Extend Feed Hook       | Add upgrade logic to 16-feed-egg.pb.js       |          |
| Direct Wallet-API Call | No hook, frontend calls wallet-api directly  |          |

**User's choice:** New Hook (Recommended)
**Notes:** Clean separation, follows GSD phase numbering, independent testing.

---

## Show Upgrade Button Conditions

| Option                                | Description                                         | Selected |
| ------------------------------------- | --------------------------------------------------- | -------- |
| Show Only on Ready Eggs (Recommended) | Button appears only on eggs with food_count >= 10   | ✓        |
| Show Always, Disable if Not Ready     | Show on all eggs, disable with tooltip if < 10      |          |
| Show on Unhatched Ready Eggs          | Show on eggs >= 10 AND not hatched, hide on hatched |          |

**User's choice:** Show Only on Ready Eggs (Recommended)
**Notes:** Avoids confusing UX. Upgrade only relevant when egg is ready to hatch.

---

## Upgrade Session Mode

| Option                           | Description                                    | Selected |
| -------------------------------- | ---------------------------------------------- | -------- |
| Single Upgrade Session (Max 490) | One session, max 490 extra items               | ✓        |
| Multiple Upgrade Sessions        | Allow partial upgrades: 10 now, 40 later, etc. |          |

**User's choice:** Single Upgrade Session (Max 490)
**Notes:** User commits to full upgrade path in one transaction. No piecemeal upgrades.

---

## Confirmation Modal

| Option                       | Description                                    | Selected |
| ---------------------------- | ---------------------------------------------- | -------- |
| Standard Confirmation Modal  | Simple: "Burn X food for Y% bonus?"            | ✓        |
| Enhanced Probability Preview | Show current/new tier probabilities            |          |
| Two-Step Confirmation        | First confirm food, then confirm probabilities |          |

**User's choice:** Standard Confirmation Modal
**Notes:** "Burn X food NFTs for Y% rarity bonus (guaranteed minimum: [tier])?" with Confirm/Cancel.

---

## Claude's Discretion

Areas where user deferred to Claude:

- Exact percentage bar styling
- Animation for probability bar updates
- Error message wording
- Loading states during transaction
- Exact dialog width/height

---

## Deferred Ideas

None — discussion stayed within Phase 27 scope.

---

_Discussion completed: 2026-04-23_
