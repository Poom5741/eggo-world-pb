# Phase 20: Gap Closure & UAT Execution - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 20-gap-closure-uat-execution
**Areas discussed:** UAT Execution Strategy, Bug Fix Scope, foodCount Validation, Gas Sponsorship Documentation

---

## UAT Execution Strategy

| Option                                   | Description                                                    | Selected |
| ---------------------------------------- | -------------------------------------------------------------- | -------- |
| Automate critical paths only             | Automate feed/hatch/buy flows; manual for rest                 |          |
| Automate all repeatable scenarios        | Browser automation for repeatable; manual for visual/animation | ✓        |
| All manual with structured documentation | No automation; all 16 scenarios manual                         |          |

**User's choice:** Automate all repeatable scenarios
**Notes:** Playwright/Cypress browser tests for repeatable scenarios. Manual execution reserved for visual/animation tests (hatch animation, polling badge).

---

| Option                                     | Description                                               | Selected |
| ------------------------------------------ | --------------------------------------------------------- | -------- |
| Markdown checklists in phase directory     | Create 20-UAT.md with checkboxes and pass/fail            | ✓        |
| Integrated with existing verification docs | Append to existing PHASE-19-VERIFICATION.md and 10-UAT.md |          |
| Structured test report with evidence       | 20-UAT-REPORT.md with tables, screenshots, sign-off       |          |

**User's choice:** Markdown checklists in phase directory
**Notes:** Simple, version-controlled documentation approach.

---

| Option                    | Description                                   | Selected |
| ------------------------- | --------------------------------------------- | -------- |
| Local dev only            | localhost:8090 + localhost:3001               |          |
| Production backend only   | https://pb.eggoworld.io                       |          |
| Both local and production | Full suite on local, smoke-test on production | ✓        |

**User's choice:** Both local and production
**Notes:** Local uses Anvil for blockchain. Production uses live network.

---

| Option                              | Description                                              | Selected |
| ----------------------------------- | -------------------------------------------------------- | -------- |
| All scenarios pass                  | Every scenario must pass; blockers fixed and retested    | ✓        |
| P0 scenarios pass, P1/P2 documented | Critical paths must pass; lower priority can be deferred |          |
| 80% pass rate with issue log        | Majority pass acceptable; failures logged for next phase |          |

**User's choice:** All scenarios pass
**Notes:** No gaps remain at sign-off.

---

### UAT Deep Dive Questions

| Question        | Options                                          | Selected                                                                                    |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Automation tool | E2E test scripts / Playwright/Cypress / API-only | Playwright/Cypress browser tests                                                            |
| Test data setup | Seeded account / Fresh per run / Hybrid          | Seeded account on Anvil (local), live network (production)                                  |
| Execution order | Dependency order / Risk order / Phase order      | Dependency order (auth → wallet → mint → feed → hatch → marketplace → polling → edge cases) |

**Notes on test data:** User emphasized real blockchain integration and specifically requested Anvil for local testing.

---

## Bug Fix Scope

| Option                       | Description                      | Selected       |
| ---------------------------- | -------------------------------- | -------------- |
| Empty state CTA route        | /marketplace / /mint / Both      | ✓ /marketplace |
| FeaturedEggHero FEED ME stub | Fix it / Defer to breeding phase | ✓ Fix it       |

**User's choice:** Route to `/marketplace`; fix FEED ME stub in Phase 20
**Notes:** Empty state should not be a dead-end. FeaturedEggHero stub is a user-facing bug blocking proper feed flow from the hero section.

---

## foodCount Validation

| Option           | Description                                                     | Selected                    |
| ---------------- | --------------------------------------------------------------- | --------------------------- |
| Validation layer | Backend hook + wallet-api / Wallet-api only / Backend hook only | ✓ Backend hook + wallet-api |
| Error UX         | Disable button / Show error toast / Both                        | ✓ Disable FEED ME button    |

**User's choice:** Dual-layer validation (backend hook fast-fail + wallet-api safety net). Disable FEED ME button when `foodCount >= 10`; show HATCH! instead.
**Notes:** Prevention is better than apology. Aligns with Phase 17 dual-layer validation decision.

---

## Gas Sponsorship Documentation

| Option        | Description                                               | Selected                               |
| ------------- | --------------------------------------------------------- | -------------------------------------- |
| Doc scope     | Operator runbook / Developer guide / Both                 | ✓ Operator runbook                     |
| Detail source | Custom / 100% from resources/pkbase-wallet                | ✓ 100% from resources/pkbase-wallet    |
| Doc location  | Standalone docs/ / Expand PHASE-19-VERIFICATION.md / Both | ✓ Standalone `docs/GAS_SPONSORSHIP.md` |

**User's choice:** Operator runbook at `docs/GAS_SPONSORSHIP.md`, detailed patterns from `resources/pkbase-wallet`
**Notes:** Follow pkbase-wallet reference exactly. Don't reinvent.

---

## Claude's Discretion

- Exact Playwright vs Cypress choice
- Anvil test network configuration details
- Exact wording and styling of error messages
- Specific Anvil block time and fork configuration
- Loading states during UAT test execution

## Deferred Ideas

None — discussion stayed within Phase 20 scope.
