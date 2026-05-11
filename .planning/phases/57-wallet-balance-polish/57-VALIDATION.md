---
phase: 57
slug: wallet-balance-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-09
---

# Phase 57 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Framework**          | bun:test (Bun's built-in test runner) + @testing-library/react                                   |
| **Config file**        | none — bun:test is zero-config; tests discovered by `*.test.ts` / `*.test.tsx` glob              |
| **Quick run command**  | `cd apps/web && bun test app/wallet/page.test.tsx hooks/use-wallet-poll.test.ts --timeout 10000` |
| **Full suite command** | `cd apps/web && bun test --timeout 10000`                                                        |
| **Estimated runtime**  | ~10 seconds                                                                                      |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/web && bun test app/wallet/page.test.tsx hooks/use-wallet-poll.test.ts --timeout 10000`
- **After every plan wave:** Run `cd apps/web && bun test app/wallet/page.test.tsx hooks/use-wallet-poll.test.ts --timeout 10000`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref                | Secure Behavior                                  | Test Type | Automated Command              | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ------------------------- | ------------------------------------------------ | --------- | ------------------------------ | ----------- | ---------- |
| 57-01-01 | 01   | 1    | WALLET-01   | T-57-01 / —               | Balance data displayed as JSX text content       | unit      | `test -f` file existence check | ❌ W0       | ⬜ pending |
| 57-01-02 | 01   | 1    | WALLET-01   | T-57-01, T-57-02, T-57-03 | All changes are display-only — no new data flows | unit      | `cd apps/web && bun test`      | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `apps/web/app/wallet/page.test.tsx` — page structure tests (skeleton, fade-in, badge, error, formatting)
- [ ] `apps/web/hooks/use-wallet-poll.test.ts` — hook behavior tests (7 test cases)

_Wave 0 is included as Task 1 of Plan 01 — tests are created before implementation._

---

## Manual-Only Verifications

| Behavior                           | Requirement | Why Manual                                            | Test Instructions                                                                                 |
| ---------------------------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Smooth fade-in animation (D-02)    | WALLET-01   | CSS animation cannot be unit-tested deterministically | Load wallet page, observe skeleton card → smooth fade-in to balance content (500ms)               |
| "Updating..." badge during polling | WALLET-01   | Requires live polling state                           | Wait 30 seconds for background poll, observe "Updating..." badge appears without skeleton         |
| Error state rendering              | WALLET-01   | Requires simulated API failure                        | Use browser DevTools to block `pb.eggoworld.io` → reload wallet page → observe inline error Alert |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
