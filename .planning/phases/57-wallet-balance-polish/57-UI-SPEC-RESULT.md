## UI-SPEC COMPLETE

**Phase:** 57 - Wallet Balance Polish
**Design System:** shadcn new-york (neutral base, cssVariables)

### Contract Summary

- Spacing: Tailwind v4 scale (4-64px) — no phase-specific exceptions
- Typography: 4 sizes (12px, 16px, 18px, 36px), 2 weights (400, 600) + bold exception
- Color: Full Jules design system tokens — accent reserved for balance number, header icon, sync button, skeleton
- Copywriting: 12 elements defined — primary CTA "Sync Wallet", refined error copy, no destructive actions
- Registry: shadcn official only — no third-party registries

### File Created

`.planning/phases/57-wallet-balance-polish/57-UI-SPEC.md`

### Pre-Populated From

| Source            | Decisions Used                                                       |
| ----------------- | -------------------------------------------------------------------- |
| CONTEXT.md        | 3 locked decisions (D-01, D-02, D-03) + 7 discretion recommendations |
| REQUIREMENTS.md   | 1 (WALLET-01)                                                        |
| components.json   | Preset config                                                        |
| Existing codebase | Colors, fonts, spacing, component inventory, hook state machine      |
| User input        | 0                                                                    |

### Ready for Verification

UI-SPEC complete. Checker can now validate.

### Key Design Highlights

1. **Skeleton card** mirrors full balance card layout (Card variant clay-xl) — uses existing `Skeleton` component with `animate-pulse`
2. **Smooth fade-in** at 500ms `ease-out` from skeleton to real content — explicit in animation contract
3. **Refined error copy** from "Failed to load balance. Retry" → "Balance update failed. The wallet service may be temporarily unavailable." + "Retry" (discretion decision)
4. **No empty state** — zero balance (`0.00 USDT`) displays naturally; user discretion to keep simple
5. **No new components** — all components (Card, Skeleton, Badge, Button, Alert) already exist in codebase
6. **State machine** documented: LOADING→SUCCESS→ERROR→LOADING loop with explicit rules for initial vs background polling
