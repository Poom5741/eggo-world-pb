# Phase 44: CI Integration - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

GitHub Actions workflow for automated E2E test execution with parallel workers and failure artifacts.

**Delivers:**

1. GitHub Actions workflow for E2E tests triggered on PR to main
2. Parallel worker configuration for faster test execution
3. Test artifacts (screenshots, videos, traces) on failure
4. Docker services setup for Anvil, wallet-api, frontend in CI

**Not delivering:**

- Actual E2E flow tests (Auth → Mint → Feed → Hatch) — future milestone
- Production deployment automation
- VRF mock coordinator setup

</domain>

<decisions>
## Implementation Decisions

### Workflow Trigger Strategy

- **D-01:** Run E2E tests on every PR to main (standard CI pattern)
- **D-02:** Path filtering: only run when `apps/web/**`, `tests/**`, `wallet-api/**` changed
- **D-03:** No scheduled (nightly) runs — PR-only keeps CI simple and fast
- **D-04:** Manual dispatch available for debugging failed tests (workflow_dispatch)

### Parallel Execution (Claude's Discretion)

- **D-05:** Use Playwright's built-in `--workers=N` for parallel execution within single job
- **D-06:** Worker count: 2-4 workers (depends on GitHub Actions runner capacity)
- **D-07:** No matrix splitting — single job is simpler for Docker services orchestration

### Artifact Storage (Claude's Discretion)

- **D-08:** Use GitHub Actions artifacts (built-in, 7-day retention)
- **D-09:** Artifact types: screenshots, videos, traces (Playwright default)
- **D-10:** Upload only on failure — saves storage, artifacts available for debugging

### Docker Services Setup (Claude's Discretion)

- **D-11:** Use `docker-compose -f docker-compose.e2e.yml up` in CI job
- **D-12:** Run all services (wallet-api, anvil, frontend) as single compose stack
- **D-13:** Wait for health checks before starting tests (built into docker-compose.e2e.yml)
- **D-14:** PocketBase uses production instance (pb.eggoworld.io) — no local container

### Claude's Discretion

- Worker count (default: 2)
- Playwright timeout in CI (default: 60s)
- Artifact retention (default: 7 days)
- Test retries in CI (default: 1 retry for flaky tests)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing CI Infrastructure

- `.github/workflows/pr-checks.yml` — Existing PR checks workflow (Bun setup pattern)
- `.github/workflows/deploy-web.yml` — Deployment workflow reference

### E2E Test Infrastructure

- `docker-compose.e2e.yml` — Docker services for E2E (wallet-api, anvil, frontend)
- `playwright.config.ts` — Playwright configuration (workers, timeout, retries)
- `tests/fixtures/e2e-setup.ts` — E2E test scaffold

### Project Context

- `.planning/REQUIREMENTS.md` — CI-01, CI-02, CI-03 requirements
- `.planning/ROADMAP.md` — Phase 44 success criteria

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `.github/workflows/pr-checks.yml`: Bun setup pattern, Docker validation, Trivy security scan
- `docker-compose.e2e.yml`: Services already configured with health checks
- `playwright.config.ts`: Existing config can be extended for CI-specific settings

### Established Patterns

- Bun runtime for all tests
- Docker compose for service orchestration
- GitHub Actions artifacts for build outputs

### Integration Points

- New workflow: `.github/workflows/e2e-tests.yml`
- Path filtering: match existing pr-checks.yml pattern
- Services: use docker-compose.e2e.yml directly in CI job

</code_context>

<specifics>
## Specific Ideas

- Workflow file: `.github/workflows/e2e-tests.yml`
- Trigger: `on: pull_request: branches: [main]` with path filtering
- Job steps: checkout → Bun setup → Docker compose up → Playwright test → Upload artifacts on failure
- Playwright command: `bun run test:e2e --workers=2 --retries=1`
- Artifact paths: `tests/e2e-results/` (screenshots, videos, traces)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled (nightly) E2E runs for comprehensive testing
- Matrix splitting for parallel jobs (more complex, single job simpler)
- External artifact storage (S3/R2) for long-term retention
- Slack/email notifications on test failure
- CI cache for Playwright browser binaries

</deferred>

---

_Phase: 44-ci-integration_
_Context gathered: 2026-04-27_
