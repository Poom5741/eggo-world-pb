# Phase 41: Framework Setup + Docker Environment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 41-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 41-framework-setup-docker-env
**Areas discussed:** Playwright Integration, Docker Architecture, Anvil Setup, Test Organization

---

## Playwright Integration

| Option               | Description                                                                  | Selected |
| -------------------- | ---------------------------------------------------------------------------- | -------- |
| Bun + Playwright     | Install @playwright/test with Bun, use bun run test:e2e, unified test runner | ✓        |
| Separate Node runner | Use npx playwright test for E2E, keep Bun for unit tests, two runtimes       |          |
| Vitest + Playwright  | Use @vitest/browser for unified config, less mature but Bun-compatible       |          |

**User's choice:** Bun + Playwright
**Notes:** Unified test runner keeps project consistent with existing Bun setup. Static export compatibility by testing against apps/web/out/ artifact.

---

## Docker Architecture

| Option             | Description                                                          | Selected |
| ------------------ | -------------------------------------------------------------------- | -------- |
| Standalone e2e.yml | Fresh isolated test env, no conflicts, reproducible teardown         | ✓        |
| Extend existing    | Shared config, single source of truth, but test data may pollute dev |          |
| Profile-based      | Single file with Docker profiles, native isolation but shared base   |          |

**User's choice:** Standalone docker-compose.e2e.yml
**Notes:** Test isolation is critical. Fresh database state, dedicated Anvil instance, reproducible teardown. Sync manageable with documented service list.

---

## Anvil Setup

| Option      | Description                                                      | Selected |
| ----------- | ---------------------------------------------------------------- | -------- |
| BSC Fork    | Fork BSC testnet, actual token data, matches production behavior | ✓        |
| Fresh Local | Deploy fresh contracts, no external data, fully isolated         |          |
| Hybrid      | Fork for VRF/mocks, best of both, stable contracts               |          |

**User's choice:** BSC Fork
**Notes:** Matches production behavior, actual NFT data for testing. VRF mocking deferred to Phase 42.

---

## Test Organization

| Option          | Description                                                   | Selected |
| --------------- | ------------------------------------------------------------- | -------- |
| tests/e2e/      | Keep existing location, project-level, matches Phase 19 setup | ✓        |
| apps/web/e2e/   | Colocated with frontend, easier imports, new directory        |          |
| Hybrid location | Tests at project level, fixtures in apps/web/tests/           |          |

**User's choice:** tests/e2e/
**Notes:** Existing location from Phase 19, project-level test directory. Fixtures go in tests/fixtures/.

---

## Test Command

| Option           | Description                                               | Selected |
| ---------------- | --------------------------------------------------------- | -------- |
| bun run test:e2e | Unified with existing test:\* pattern, Bun runner         | ✓        |
| playwright test  | Direct playwright invocation, explicit but breaks pattern |          |
| make test-e2e    | Use make command, matches existing dev/backend commands   |          |

**User's choice:** bun run test:e2e
**Notes:** Matches existing `bun run test`, `bun run test:watch`, `bun run test:coverage` pattern.

---

## Claude's Discretion

- Browser selection (Chromium-first, Firefox/Safari optional)
- Anvil startup timeout configuration
- Test fixture data format (JSON fixtures vs inline)

---

## Deferred Ideas

None raised during discussion. All items in deferred section of CONTEXT.md are from prior planning (Phase 42-44 scope).
