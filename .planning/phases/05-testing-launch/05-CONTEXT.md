# Phase 5: Testing & Launch - Context

**Gathered:** 2026-04-04  
**Status:** Ready for planning

<domain>
## Phase Boundary

Production deployment, integration testing, bug fixes, and UI polish for NFT marketplace launch. This phase covers end-to-end testing, deployment to production environments, and resolving issues found during testing. Core game loop must work without errors.

**Duration:** Days 13-14 (from ROADMAP.md)

**In Scope:**

- Integration testing (E2E user flows, commission verification, gas optimization)
- Production deployment (contracts, frontend, PocketBase, wallet API)
- Bug fixes from testing (critical → high → medium → low priority)
- UI polish (visual consistency pass)
- Error message standardization
- Documentation for users

**Out of Scope:**

- New features (breeding, tiers, admin dashboard — Phase 6+)
- E2E test automation with Playwright (Phase 8)
- Advanced monitoring/alerting (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Bug Priority & Tracking

- **D-01:** Bugs prioritized as Critical → High → Medium → Low
  - Critical: Security vulnerabilities, funds at risk, data loss
  - High: Core loop broken (buy egg, buy food, feed, hatch, sell)
  - Medium: UX issues, non-critical features broken
  - Low: Cosmetic issues, typos, minor alignment
- **D-02:** Bugs tracked in `.planning/STATE.md` under bug tracking section
  - Add "## Active Bugs" section to STATE.md
  - List each bug with priority, description, and status
  - Update STATE.md as bugs are fixed

### UI Polish

- **D-03:** Visual consistency pass across all pages
  - Typography consistency (font sizes, weights)
  - Spacing alignment (margins, paddings)
  - Component alignment (buttons, cards, inputs)
  - Color consistency (button variants, status colors)
- **D-04:** Focus on production-ready appearance, not pixel-perfect
  - Fix obvious visual issues that hurt credibility
  - Ensure mobile responsive layout works
  - Loading states already implemented (from Phase 3)

### Error Messages

- **D-05:** English technical error messages
  - Format: Simple, direct, technical (e.g., "Insufficient balance", "Transaction failed")
  - No Thai localization for errors (keep codebase simple)
  - Error codes for debugging (e.g., `INSUFFICIENT_BALANCE`, `TRANSACTION_REVERTED`)
- **D-06:** Error display pattern
  - Show error message in alert/toast component
  - Include transaction hash when applicable
  - Provide action step when possible (e.g., "Approve USDT first")

### OpenCode's Discretion

- Exact bug triage process (how to decide Critical vs High)
- Specific pages/components needing visual polish (OpenCode to identify during testing)
- Error message wording specifics (as long as pattern is followed)
- Gas optimization approach (specific techniques)

### Folded Todos

None — no pending todos were cross-referenced for this phase.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing Strategy

- `.planning/codebase/TESTING.md` — Test frameworks, patterns, existing test coverage (Forge, Bun test)
- `.planning/codebase/CONCERNS.md` — Security concerns, test coverage gaps, critical issues to validate

### Deployment

- `.planning/deployment/ssh-config.md` — Production server SSH configuration
- `docker-compose.wallet-api.yml` — Wallet API production deployment config
- `contracts/DEPLOYMENT.md` — Smart contract deployment procedures
- `apps/backend/docker-compose.yml` — PocketBase deployment (check existing config)

### Security Audit

- `.planning/codebase/CONCERNS.md` §Security — Critical security issues to fix before launch
  - Rotate hardcoded secrets (LINE_CHANNEL_SECRET, master keys)
  - Replace `Math.random()` with `crypto.randomBytes()`
  - Upgrade XOR encryption to AES-256-GCM
  - Remove passwords from API responses
  - Add input validation (Zod schemas)

### Success Criteria

- `.planning/ROADMAP.md` §Phase 5 — Phase goals and success metrics
- `.planning/REQUIREMENTS.md` — Definition of Done, acceptance criteria

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Wallet API tests** (`wallet-api/wallet.test.ts`) — 13 integration tests for wallet creation endpoint
- **Frontend component tests** (`apps/web/components/*/*.test.tsx`) — Component test patterns with Testing Library
- **Smart contract tests** (`contracts/test/*.t.sol`) — 48+ Forge tests covering all contracts
- **State management** (`.planning/STATE.md`) — Existing pattern for tracking progress and issues

### Established Patterns

- **Bun test runner** for frontend and wallet API
- **Forge test** for smart contracts with Foundry
- **File content assertions** for page testing (testing file contents, not rendering)
- **Docker Compose** for service deployment (PocketBase, wallet-api, nginx)
- **Static export** for frontend (`output: 'export'` in next.config.mjs)

### Integration Points

- **PocketBase hooks** → Need to test in production-like environment
- **Wallet API** → Docker deployment with health checks configured
- **Smart contracts** → Deploy to BSC testnet first, then mainnet
- **Frontend** → Cloudflare Pages deployment (static export)

### Testing Gaps (from CONCERNS.md)

- No integration tests for PocketBase hooks
- No E2E tests for user flows (Phase 8)
- No tests for wallet encryption logic
- Security vulnerabilities need validation before launch

</code_context>

<specifics>
## Specific Ideas

- "Visual consistency pass" — User wants typography, spacing, and alignment fixes across all pages, not just loading/error states
- "English technical errors" — Keep error messages simple and technical (no Thai localization for errors)
- Bug tracking in STATE.md rather than GitHub Issues for simplicity during launch phase
- Priority system: Critical (security/funds) → High (core loop) → Medium (UX) → Low (cosmetic)

**References:**

- User prefers Thai comments in code, but English UI (established pattern)
- Urgent timeline (<2 weeks) — focus on critical fixes only
- Solo developer — keep processes simple, avoid overhead

</specifics>

<deferred>
## Deferred Ideas

### E2E Test Automation

- Playwright integration for automated E2E tests — Phase 8 (already in ROADMAP.md)
- Should not delay Phase 5 launch

### Advanced Monitoring

- Real-time alerting, dashboards, analytics — Phase 6 (Admin & Analytics)
- For launch: Basic health checks and manual monitoring sufficient

### Additional Security Hardening

- Rate limiting on API endpoints — implement if time permits, otherwise defer
- Database indexing strategy — can be added post-launch
- Audit logging — defer to Phase 6

### Reviewed Todos (not folded)

None — no todos were reviewed for this phase.

</deferred>

---

_Phase: 05-testing-launch_
_Context gathered: 2026-04-04_
