# Phase 9: Dashboard & Wallet - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 09-dashboard-wallet
**Areas discussed:** Icon System, Referral Display, Quick Actions, Activity Feed, Polling UI, OpenCode Discretion

---

## Icon System

| Option                             | Description                                                                                                         | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Full Material Symbols adoption     | Migrate all icons to Material Symbols — matches Jules design exactly, consistent with Phase 8 navigation components | ✓        |
| Keep Lucide, migrate in Phase 12   | Keep Lucide for now, migrate later — faster implementation, but creates inconsistency                               |          |
| Hybrid (Material Symbols + Lucide) | Hybrid approach — Material Symbols for stats/displays, Lucide for action buttons                                    |          |

**User's choice:** Full Material Symbols adoption (Recommended)

**Notes:** This decision aligns with Phase 8's Material Symbols adoption for navigation components. All Lucide icons in current dashboard will be replaced.

---

## Referral Display

| Option                      | Description                                                                                                                | Selected |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Buddy Chain cards           | Adopt Jules 'Buddy Chain' card visualization with percentage fills and level counts — shows growth progress, more engaging | ✓        |
| Simple stat cards (4 cards) | Simple stat cards — one card per level showing count and earnings only                                                     |          |
| Expandable accordion view   | Expandable accordion — compact header that expands to show full chain details                                              |          |

**User's choice:** Buddy Chain cards (Recommended)

**Notes:** Jules design shows 4 square cards with percentage fill overlays, level labels (Lvl 1-4), and buddy counts. More gamified than simple stat cards.

---

## Quick Actions

| Option                 | Description                                                                                          | Selected |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Jules 3 action cards   | Replace with Jules action cards exactly (Feed/Hatch/Buy) — matches design, focuses on core game loop | ✓        |
| Current 4-button grid  | Keep current 4-button grid (Mint/Buy/Eggs/Wallet) — covers more flows including minting              |          |
| Jules cards + Mint Egg | Hybrid: 4 cards — add 'Mint Egg' as 4th card to Jules design                                         |          |

**User's choice:** Jules 3 action cards (Feed/Hatch/Buy)

**Notes:** Focus on core game loop actions. Minting flow will be accessible from other pages. Cards: "Feed All Eggs", "Hatch Ready Eggs", "Buy Food Bundle".

---

## Activity Feed

| Option              | Description                                                                   | Selected |
| ------------------- | ----------------------------------------------------------------------------- | -------- |
| Jules styling       | Match Jules styling exactly — colored circles, slide animation, compact cards | ✓        |
| shadcn/ui Table     | Use shadcn/ui Table pattern — consistent with rest of app, more data-dense    |          |
| shadcn/ui Card list | Use shadcn/ui Card list — middle ground between Jules and table               |          |

**User's choice:** Jules styling (Recommended)

**Notes:** Transaction cards with colored circular icons (left), title + timestamp (center), amount (right). Hover animation: `hover:translate-x-2 transition-transform duration-300`.

---

## Polling UI

| Option                        | Description                                                                                        | Selected |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 'Updating...' badge + pulse   | Keep 'Updating...' badge + pulse animation on card — clear feedback, user knows data is refreshing | ✓        |
| Shimmer effect on balance     | Subtle shimmer effect on balance text only — less intrusive, still visible                         |          |
| Silent polling (no indicator) | No visible indicator — silent background polling for cleaner UX                                    |          |

**User's choice:** 'Updating...' badge + pulse (Recommended)

**Notes:** Badge appears in top-right of balance card header during polling. Uses existing `useWalletPoll` hook which already provides loading state.

---

## OpenCode's Discretion

| Area                           | Decision                                                                                                                     | Rationale                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Empty state (0 eggs)           | Friendly illustration + "Get your first egg" CTA button linking to mint page                                                 | Welcoming, clear action path            |
| Error state (wallet API fails) | Show error message with retry button                                                                                         | User control, recovery path             |
| Polling retry strategy         | Exponential backoff: 30s → 60s → 120s → 5min, reset on success                                                               | Balance between UX and API load         |
| After 3 failed attempts        | Show "Wallet unavailable" with manual refresh option                                                                         | Clear communication, user can retry     |
| Transaction categorization     | Map PocketBase types to icons/labels (hatch→egg_alt, mint_egg→egg, mint_food→shopping_cart, commission→group, sale→payments) | Consistent with Material Symbols system |

**User's choice:** All discretion decisions accepted (Recommended)

**Notes:** User confirmed "Yes, looks good" — OpenCode has full discretion on these implementation details.

---

## Summary

**Total areas discussed:** 6
**User decisions:** 6 specific choices + 5 discretion areas confirmed
**Deferred ideas:** 5 (transaction detail modal, export history, date filter, real-time notifications, multi-wallet)

**Key implementation direction:**

- Full Material Symbols adoption (replacing Lucide)
- Buddy Chain visualization with percentage cards
- Jules 3 action cards (Feed/Hatch/Buy)
- Activity feed with colored circles and slide animation
- "Updating..." badge with pulse during polling
- OpenCode discretion on error/empty states and retry logic

**Next step:** `/gsd-plan-phase 9` to create task breakdown
