# Phase 44: CI Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 44-ci-integration
**Areas discussed:** Workflow Trigger Strategy

---

## Workflow Triggers

| Option       | Description                                                                            | Selected |
| ------------ | -------------------------------------------------------------------------------------- | -------- |
| PR only      | Run on every PR to main. Catch issues before merge. Standard CI pattern.               | ✓        |
| PR + Nightly | PR for quick checks + nightly schedule for full E2E suite. Balance speed and coverage. |          |
| All triggers | Run on PR, push, and schedule. Maximum coverage, manual dispatch for debugging.        |          |
| Manual only  | Manual dispatch only. Run E2E tests on demand for debugging. Minimal CI cost.          |          |

**User's choice:** PR only
**Notes:** Simple and fast — standard CI pattern catches issues before merge

---

## Claude's Discretion

The following areas were delegated to Claude's discretion based on standard CI patterns:

- Parallel Execution: Playwright --workers=2 within single job (no matrix splitting)
- Artifact Storage: GitHub Actions artifacts (7-day retention), upload on failure only
- Docker Services: docker-compose.e2e.yml in CI job, single compose stack
- Worker count: 2
- Playwright timeout in CI: 60s
- Artifact retention: 7 days
- Test retries in CI: 1 retry for flaky tests

## Deferred Ideas

- Scheduled (nightly) E2E runs for comprehensive testing
- Matrix splitting for parallel jobs (more complex, single job simpler)
- External artifact storage (S3/R2) for long-term retention
- Slack/email notifications on test failure
- CI cache for Playwright browser binaries
