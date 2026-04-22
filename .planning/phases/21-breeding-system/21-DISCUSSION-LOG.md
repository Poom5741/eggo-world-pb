# Phase 21: Breeding System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 21-breeding-system
**Areas discussed:** Breeding UI & animal selection flow, Cooldown & validation UX, Breeding egg handling & feedback, Navigation & entry points

---

## Breeding UI & Animal Selection

| Option                        | Description                                                                                                                                                  | Selected |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Dialog with two animal slots  | Modal/Dialog that opens from animal card — shows two selection slots, drag/drop or click to add animals, shows compatibility info (reuse FeedDialog pattern) | ✓        |
| Dedicated breeding page       | Separate page (/breeding) with grid of owned animals, select first then second, shows available pairs with cooldown status                                   |          |
| Multi-select from animal grid | Long-press or multi-select mode on existing animal list/cards, then 'Breed Selected' button appears                                                          |          |

**User's choice:** Dialog with two animal slots
**Notes:** Reuse FeedDialog pattern for consistency. Show full animal details (species, rarity, generation, cooldown) in selection. Require confirmation modal before breeding with fee, generation, and rarity probability table.

---

## Cooldown & Validation UX

| Option                            | Description                                                                                                                             | Selected |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Visual countdown + disabled state | Show countdown timer (e.g., 'Available in 12h 34m') on animal cards, disable breeding button with tooltip, gray out unavailable animals | ✓        |
| Badge only, no countdown          | Show 'On Cooldown' badge, no timer — user hovers/clicks to see when available                                                           |          |
| Exact time, no live update        | Show exact timestamp (e.g., 'Available: Apr 24, 2:30 PM'), no live countdown                                                            |          |

**User's choice:** Visual countdown + disabled state
**Notes:** Live-updating countdown timer preferred over static timestamp. Multi-layer validation: frontend filters → backend hook fast-fail → contract enforcement (defense in depth pattern from Phase 20).

---

## Breeding Egg Handling & Feedback

| Option                              | Description                                                                                                   | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Show in egg list with badge         | Breeding eggs show in /eggs page mixed with regular eggs, distinguished by badge/icon and parent info tooltip | ✓        |
| Separate breeding section           | Separate 'Breeding' tab or section showing pending breeding eggs, distinct from purchased eggs                |          |
| Notification only, redirect to eggs | Show success notification with egg details, then auto-redirect to /eggs page where egg appears in grid        |          |

**User's choice:** Show in egg list with badge
**Notes:** Breeding eggs mixed with regular eggs, not separate view. Success flow: animated confirmation (similar to hatch animation) → display egg details with parent animals → "View Egg" button routes to /eggs page.

---

## Navigation & Entry Points

| Option                        | Description                                                                                             | Selected |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| Action menu on animal card    | Add 'Breed' button to animal card's action menu (alongside 'Feed', 'Sell', etc.), opens breeding dialog | ✓        |
| Dedicated tab in bottom nav   | Add 'Breeding' tab to bottom navigation bar (alongside Dashboard, Eggs, Marketplace)                    |          |
| Button on dashboard/eggs page | Add 'Breed Animals' button to /eggs page header or /dashboard quick actions                             |          |

**User's choice:** Action menu on animal card
**Notes:** No dedicated route — breeding accessed from animal cards only. Keeps navigation simple, reuses existing /eggs and /dashboard routes.

---

## Claude's Discretion

- Exact animation duration and style for breeding success (use hatch animation as reference)
- Loading states during breeding transaction (12-block confirmation wait)
- Exact wording of cooldown error messages and tooltips
- Color/design of breeding egg badge (use claymorphism design system)
- Parent info tooltip design and interaction pattern

## Deferred Ideas

None — discussion stayed within Phase 21 scope.
