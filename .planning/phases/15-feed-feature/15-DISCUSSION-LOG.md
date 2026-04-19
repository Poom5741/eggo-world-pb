# Phase 15: Feed Feature - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19  
**Phase:** 15-feed-feature  
**Areas discussed:** Food Picker Modal UX, Hatching Ready State, Consumed Food NFTs, Mobile Food Picker

---

## Food Picker Modal UX

| Option                      | Description                                                                                                                      | Selected |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Modal with manual selection | Enhanced FeedDialog showing food thumbnails, selection counter (X/10), clear submit button. Best UX for both mobile and desktop. | ✓        |
| Quick-fill auto-select      | User taps 'Quick Fill' button → auto-selects 10 food items → confirmation dialog. Fast, minimal UI, but less control for users.  |          |
| Both quick-fill and manual  | Show both options: Quick Fill button for speed, 'Select Manually' button for control. More flexible but more complex UI.         |          |

**User's choice:** Modal with manual selection (Recommended)  
**Notes:** Replace quick-fill as primary flow — users manually select 1-10 food items with visual feedback

## Hatching Ready State

| Option                       | Description                                                                                                                               | Selected |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Visual indicator on egg card | Add visual cue (glowing border, sparkle icon, 'Ready to Hatch!' badge) when food_count reaches 10/10. Clear, exciting feedback for users. | ✓        |
| Auto-trigger hatch animation | Egg card shows progress bar. When it reaches 10/10, auto-open hatch animation or show 'Tap to Hatch' button. Seamless flow.               |          |

**User's choice:** Visual indicator on egg card (Recommended)  
**Notes:** HATCH button becomes prominent when egg is ready, not just enabled

## Consumed Food NFTs

| Option                      | Description                                                                                                           | Selected |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Hide consumed from picker   | Filter out is_consumed=true foods from the picker grid/dialog. Users only see available food, less confusion.         | ✓        |
| Show as disabled/grayed out | Show consumed foods but grayed out with 'Already Used' label. Users can see their full history but can't select them. |          |

**User's choice:** Hide consumed from picker (Recommended)  
**Notes:** Users only see available food NFTs, reducing confusion

## Mobile Food Picker

| Option                      | Description                                                                                                               | Selected |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Mobile-optimized grid       | Show 2-column grid of food thumbnails with tap-to-select. Works well with bottom tab bar and touch targets from Phase 14. | ✓        |
| Dialog with scrollable list | Keep current dialog but optimize for mobile: larger touch targets, scrollable list, sticky 'Feed' button at bottom.       |          |

**User's choice:** Mobile-optimized grid (Recommended)  
**Notes:** Works with Phase 14 bottom tab bar and 44px touch targets

---

## Claude's Discretion

The following decisions were left to Claude's discretion:

- Exact visual style for "ready to hatch" indicator (glow vs badge vs animation)
- Color scheme for selected vs unselected food items in picker
- Whether to show food type icons or just thumbnails
- Animation timing for selection feedback

## Deferred Ideas

None — discussion stayed within phase scope
