---
phase: 20
slug: gap-closure-uat-execution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bun:test + @testing-library/react + happy-dom |
| **Config file** | `apps/web/bunfig.toml` (preload: `./test-setup.ts`) |
| **Quick run command** | `cd apps/web && bun test` |
| **Full suite command** | `cd apps/web && bun test --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/web && bun test`
- **After every plan wave:** Run `cd apps/web && bun test --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | GAPS-01 | T-20-01 | Hook rejects feed when foodCount >= 10 | unit (hook) | `bun test apps/backend/pb_hooks/16-feed-egg.pb.test.js` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | GAPS-01 | T-20-01 | Wallet-api rejects feed when newFoodCount > 10 | unit (API) | `bun test wallet-api/server.test.js` | ❌ W0 | ⬜ pending |
| 20-02-01 | 02 | 1 | GAPS-04 | — | Empty state CTA routes to /marketplace | unit / e2e | `bun test apps/web/app/eggs/page.test.tsx` | ❌ W0 | ⬜ pending |
| 20-02-02 | 02 | 1 | GAPS-04 | — | Empty state renders when eggs.length === 0 | unit | `bun test apps/web/app/eggs/page.test.tsx` | ❌ W0 | ⬜ pending |
| 20-02-03 | 02 | 1 | D-08 | — | FeaturedEggHero FEED ME opens FeedDialog | unit | `bun test apps/web/components/eggs/featured-egg-hero.test.tsx` | ❌ W0 | ⬜ pending |
| 20-03-01 | 03 | 2 | GAPS-02 | — | UAT Scenario 2-6, 8 (manual) | manual | N/A — human execution | ✅ | ⬜ pending |
| 20-03-02 | 03 | 2 | GAPS-05 | — | Phase 17 UAT scenarios (6 manual) | manual | N/A — human execution | ✅ | ⬜ pending |
| 20-04-01 | 04 | 2 | GAPS-03 | — | Gas sponsorship logs appear | manual | Check wallet-api console | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/pb_hooks/16-feed-egg.pb.test.js` — stub for GAPS-01 hook validation
- [ ] `wallet-api/server.test.js` — stub for GAPS-01 wallet-api safety net
- [ ] `apps/web/app/eggs/page.test.tsx` — stub for GAPS-04 empty state routing
- [ ] `apps/web/components/eggs/featured-egg-hero.test.tsx` — stub for D-08 FEED ME wiring
- [ ] `docs/GAS_SPONSORSHIP.md` — operator runbook structure (no automated test, manual verification)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Feed flow — Quick Fill | GAPS-02 | Requires real blockchain tx + wallet signing | Navigate to /eggs, click FEED ME, confirm dialog, verify tx toast |
| Feed flow — Validation | GAPS-02 | Visual state change (button disabled) | Navigate to /eggs with foodCount=10 egg, verify FEED ME disabled |
| Hatch flow — Button Visibility | GAPS-02 | Visual UI state | Verify HATCH! button appears when foodCount >= 10 |
| Hatch flow — Animation | GAPS-02 | Animation sequence (10-15s) | Click HATCH!, verify glow → crack → shake → burst → animal |
| Hatch flow — Result Display | GAPS-02 | Visual rarity badge colors | Verify Common=gray, Rare=blue, Epic=purple, Legendary=yellow |
| Error Boundary — Retry | GAPS-02 | Network failure simulation | Stop PocketBase, navigate to /eggs, verify error boundary + retry |
| Buy Now flow | GAPS-05 | Real USDT + blockchain tx | Navigate to marketplace, click Buy Now, confirm purchase |
| Dashboard polling | GAPS-05 | 30s interval visual check | Keep dashboard open 30s+, verify "Updating..." badge appears |
| Gas sponsorship — 5 human tests | GAPS-03 | Operator procedures | Follow docs/GAS_SPONSORSHIP.md checklist |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
