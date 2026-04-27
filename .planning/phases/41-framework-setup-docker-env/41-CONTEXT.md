# Phase 41: Framework Setup + Docker Environment - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Test infrastructure foundation with isolated Docker environment ready for E2E test execution.

**Delivers:**

1. Playwright configuration with Bun test runner
2. Docker Compose test environment (docker-compose.e2e.yml)
3. Anvil blockchain node with BSC fork
4. Health checks for all services

**Not delivering:**

- Authentication bypass helpers (Phase 42)
- Blockchain polling utilities (Phase 42)
- Wallet automation/Synpress (Phase 43)
- CI workflow (Phase 44)

</domain>

<decisions>
## Implementation Decisions

### Playwright Integration

- **D-01:** Install `@playwright/test` with Bun package manager
- **D-02:** Use `bun run test:e2e` as unified test command (not separate Node runner)
- **D-03:** Playwright config at project root (`playwright.config.ts`)
- **D-04:** Static export compatibility: test against `apps/web/out/` artifact

### Docker Architecture

- **D-05:** Standalone `docker-compose.e2e.yml` (not extending existing docker-compose.yml)
- **D-06:** Isolated test environment with clean teardown
- **D-07:** Services: PocketBase, wallet-api, Anvil, frontend preview
- **D-08:** Health checks for all services (wget/curl health endpoints)

### Anvil Setup

- **D-09:** BSC Testnet fork (`anvil --fork-url bsc_testnet`)
- **D-10:** Real contract addresses from BSC testnet deployment
- **D-11:** Matches production behavior (actual NFT data, marketplace flows)
- **D-12:** VRF mocking deferred to Phase 42 (blockchain helpers)

### Test Organization

- **D-13:** E2E tests in `tests/e2e/` (existing location from Phase 19)
- **D-14:** Test fixtures/helpers in `tests/fixtures/` (new directory)
- **D-15:** Playwright browser binaries in standard location (`~/.cache/ms-playwright/`)

### Claude's Discretion

- Browser selection (Chromium-first, Firefox/Safari optional)
- Anvil startup timeout configuration
- Test fixture data format (JSON fixtures vs inline)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test Infrastructure

- `tests/e2e/README.md` — Existing E2E test setup from Phase 19
- `tests/e2e/nft-mint-marketplace-flow.test.js` — Example E2E test structure
- `.planning/REQUIREMENTS.md` — INFRA-01/02/03, ENV-01/02/03 requirements

### Docker & Architecture

- `docker-compose.yml` — Existing dev Docker Compose (reference for services)
- `contracts/foundry.toml` — BSC testnet RPC endpoint for Anvil fork

### Project Context

- `apps/web/test-setup.ts` — Existing Bun test setup with happy-dom
- `.planning/ROADMAP.md` — Phase 41 success criteria and requirements mapping

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `tests/e2e/` — E2E test directory already exists
- `apps/web/test-setup.ts` — Bun test configuration pattern
- `docker-compose.yml` — Docker Compose service definitions (PocketBase, wallet-api, nginx)

### Established Patterns

- Bun test runner (`bun test` for unit tests)
- Health checks in Docker Compose (wget/curl endpoints)
- Foundry/Anvil for blockchain testing (contracts/foundry.toml)

### Integration Points

- Playwright config connects to `tests/e2e/` test files
- Docker Compose exposes ports for test runner access
- Anvil fork connects to BSC testnet RPC (foundry.toml endpoint)

</code_context>

<specifics>
## Specific Ideas

- `bun run test:e2e` matches existing `bun run test`, `bun run test:watch`, `bun run test:coverage` pattern
- Anvil fork uses `bsc_testnet` RPC from foundry.toml: `https://data-seed-prebsc-1-s1.binance.org:8545`
- Test environment uses fresh PocketBase data directory (pb_data.e2e/) for isolation

</specifics>

<deferred>
## Deferred Ideas

- VRF mock coordinator setup (Phase 42)
- Synpress wallet automation (Phase 43)
- CI parallel workers (Phase 44)
- Test data snapshot/restore utilities (not in scope)
- Real LINE OAuth smoke test (Phase 42 AUTH-03)

</deferred>

---

_Phase: 41-framework-setup-docker-env_
_Context gathered: 2026-04-27_
