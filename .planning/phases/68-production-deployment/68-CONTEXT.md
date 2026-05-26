# Phase 68: Production Deployment - Context

**Gathered:** 2025-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy admin treasury functionality to production and verify end-to-end functionality. This phase is primarily **verification and documentation** rather than traditional deployment, as:

1. **Frontend deployment is automated** — Cloudflare Pages auto-deploys on git push
2. **Backend services already running** — PocketBase (`https://pb.eggoworld.io`) and wallet-api are in production
3. **PocketBase hooks already deployed** — Phase 64's `39-pool-balance.pb.js` hook is file-based and picked up on restart

**Primary Activities:**

- Push frontend code to trigger Cloudflare Pages auto-deployment
- Verify production environment configuration (SSH check env vars, mainnet configuration)
- Verify PocketBase hook is loaded and responding
- Perform comprehensive end-to-end testing on production BSC mainnet
- Create deployment verification checklist and sign-off documentation

**Subtasks:** DEPL-01, DEPL-02, DEPL-03

**Scope Clarification:** ROADMAP.md success criteria mention "New PocketBase hook deployed" but this refers to Phase 64's hook which was already created. Phase 68 focuses on verification that existing production infrastructure correctly supports the new admin treasury functionality.
</domain>

<decisions>
## Implementation Decisions

### Deployment Strategy

- **D-31:** **Automated frontend deployment** — Cloudflare Pages auto-deploys frontend on git push. No manual deployment steps needed for frontend layer.
- **D-32:** **Sequential verification** — Verify services in dependency order: wallet-api → PocketBase hook → frontend. Each layer verified before moving to next.
- **D-33:** **Immediate deployment timing** — Deploy immediately when ready. No maintenance window needed as this is additive functionality (new `/admin/treasury` page) with no existing users to disrupt.
- **D-34:** **Git-based rollback** — If issues arise, use git to revert to previous version and push to trigger Cloudflare Pages rollback. Clean, familiar approach with minimal risk.

### Environment Configuration

- **D-35:** **Verify existing production configuration** — PocketBase and wallet-api already configured for BSC mainnet. Verify `RPC_URL`, `CHAIN_ID=56`, and contract addresses are correct before deployment.
- **D-36:** **SSH-based configuration verification** — SSH into production PocketBase server and check `.env` file contents to confirm mainnet configuration. Document verification steps for future reference.
- **D-37:** **Configuration troubleshooting documentation** — Document common production configuration issues (wrong chain ID, missing RPC URL, incorrect contract addresses) and resolution steps.

### Database Migrations

- **D-38:** **No database migrations needed** — Phase 64's `39-pool-balance.pb.js` hook is file-based and should already be loaded in production PocketBase. No schema changes or data migrations required.
- **D-39:** **Verify hook is loaded** — Check PocketBase logs for `"endpoint registered"` message from the pool balance hook. If not found, investigate hook file deployment and PocketBase restart.
- **D-40:** **PocketBase hook troubleshooting** — Document common hook issues (file not found, syntax errors, registration failures, wrong file permissions) and manual remediation steps.

### End-to-End Verification

- **D-41:** **Comprehensive E2E testing** — Test complete admin treasury user journey: admin login, navigate to `/admin/treasury`, connect MetaMask, verify BSC mainnet connection, check contract ownership status, view pool balances, test form validation (without real withdrawals).
- **D-42:** **Production testing environment** — Test directly on production (`pb.eggoworld.io`) with real admin account and MetaMask wallet. No staging environment available.
- **D-43:** **Existing admin credentials** — Use existing PocketBase admin account that has CommissionDistribution ownership. No dedicated test account creation.
- **D-44:** **E2E verification checklist** — Create detailed step-by-step checklist covering: login, navigation, MetaMask connection, ownership verification, pool balance display, form validation, responsive design, error handling.
- **D-45:** **Core functionality success criteria** — E2E test passes when all core functionality works: admin can access treasury page, view contract ownership, see pool balances, MetaMask connects to BSC mainnet, form validation works.
- **D-46:** **Deployment sign-off document** — Create formal sign-off document to be approved after successful E2E verification. Documents deployment steps, verification results, issues found, resolution steps, and final approval.

### Claude's Discretion

- Exact format of E2E checklist (numbered steps, screenshots, pass/fail checkboxes)
- Sign-off document format and approval workflow (single approver vs committee)
- Timing and coordination for SSH access to production servers
- Rollback verification steps (how to confirm git rollback succeeded)
- Performance baseline measurements (if any) during verification

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Dependencies

- `.planning/phases/64-backend-pool-balance-endpoint/64-CONTEXT.md` — Phase 64 endpoint and hook details (D-02: response format, D-06: env config reuse)
- `.planning/phases/65-admin-page-shell-metamask/65-CONTEXT.md` — MetaMask integration (D-07: viem, D-08: TreasuryGuard, D-10: page shell)
- `.planning/phases/66-ownership-dashboard/66-CONTEXT.md` — Ownership dashboard (D-13: acceptOwnership, D-15: TreasuryGuard)
- `.planning/phases/67-pool-balance-treasury-withdrawal/67-CONTEXT.md` — Pool balance and withdrawal functionality

### Production Infrastructure

- `.planning/STATE.md` §Environment — Production URLs and configuration:
  - PocketBase: `https://pb.eggoworld.io`
  - Frontend: Cloudflare Pages (static export)
  - Network: BSC mainnet (Chain ID: 56)
- BSC mainnet USDT: `0x55d398326f99059fF775485246999027B3197955`

### Cloudflare Pages

- Cloudflare Pages deployment configuration (project settings, build commands)
- Git repository integration and auto-deployment triggers
- Custom domain configuration for `pb.eggoworld.io`

### PocketBase Hooks

- `apps/backend/pb_hooks/39-pool-balance.pb.js` — Pool balance proxy hook (from Phase 64)
- PocketBase hook loading and registration mechanism (volume-mounted, requires restart)
- PocketBase logging and log access methods

### Requirements

- `.planning/REQUIREMENTS.md` §v0.10.0 — Full milestone requirements including DEPL-01, DEPL-02, DEPL-03

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Cloudflare Pages auto-deployment**: Already configured for frontend. Push to main branch triggers automatic build and deployment.
- **Production infrastructure**: PocketBase and wallet-api already running in production with BSC mainnet configuration.
- **Phase 64 pool balance hook**: `39-pool-balance.pb.js` already deployed and should be loaded in production.

### Established Patterns

- **Frontend deployment**: `bun run build` generates static export, pushed to git, Cloudflare Pages auto-deploys.
- **PocketBase operation**: Docker-based deployment with volume-mounted hooks. `docker compose restart pocketbase` for hook changes.
- **BSC mainnet configuration**: CHAIN_ID=56, BSC mainnet RPC URLs, mainnet contract addresses.
- **MetaMask production usage**: viem wallet clients connect to BSC mainnet, not testnet.

### Integration Points

- **Phase 64**: Pool balance endpoint (`/api/v2/admin/pool-balances`) should be responding in production
- **Phase 65**: `/admin/treasury` route should be accessible on production domain
- **Phase 66**: Ownership dashboard should display contract ownership on mainnet
- **Phase 67**: Pool balance and withdrawal functionality should work with production mainnet data

### Deployment Checklist Context

From ROADMAP.md success criteria (adjusted for actual deployment needs):

1. ✅ wallet-api endpoints deployed to production container and responding correctly (Phase 64)
2. ✅ PocketBase hook (`39-pool-balance.pb.js`) deployed and loaded (verify in Phase 68)
3. ✅ Frontend deployed to Cloudflare Pages, `/admin/treasury` route working (verify in Phase 68)
4. ✅ End-to-end verification: admin can visit `pb.eggoworld.io/admin/treasury`, connect MetaMask, view ownership and pool balances

</code_context>

<specifics>
## Specific Ideas

- Cloudflare Pages deployment should use production build configuration (not development)
- Verification should include responsive design testing (mobile and desktop)
- E2E checklist should be detailed enough that any team member can execute it
- Sign-off document should include rollback confirmation and issue resolution steps
- Consider creating a pre-deployment checklist to verify all prerequisites before pushing frontend code

</specifics>

<deferred>
## Deferred Ideas

- Staging environment setup — deferred to future milestones due to infrastructure complexity
- Automated deployment testing — deferred in favor of manual verification for this phase
- Performance monitoring integration — deferred, could be added in future phases
- Multi-region deployment — single production region sufficient for current needs
- Blue-green deployment for zero-downtime — git-based rollback is sufficient for current risk level

</deferred>

---

_Phase: 68-production-deployment_
_Context gathered: 2025-01-26_
