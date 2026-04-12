# Phase 02: PocketBase Backend Production Deployment Automation

## Executive Summary

**Objective:** Create fully automated, zero-manual-deployment infrastructure for PocketBase backend (Phase 02 of Eggo NFT Platform).

**Scope:**

1. Automated Docker image build & push
2. Automated production deployment via SSH
3. Automated migration execution with safety
4. Health checks & automated rollback
5. Integration with Flux workflow
6. One-command deployment: `make deploy-prod`

**Deliverables:**

- Infrastructure as Code (IaC): scripts, CI configs
- Secrets management: `.env.production` template
- Deployment orchestration: main deploy script
- Monitoring: health checks, logging hooks
- Documentation: `DEPLOY_PHASE02.md` runbook

---

## Pre-flight Checklist

### Prerequisites (Must be completed before execution)

| Item                          | Status | Details                                     |
| ----------------------------- | ------ | ------------------------------------------- |
| Production server SSH access  | ⬜     | Root or deploy user with Docker permissions |
| Docker Hub / GHCR credentials | ⬜     | For image push                              |
| Domain DNS configured         | ⬜     | pb.eggoworld.io → server IP                 |
| SSL certificates ready        | ⬜     | For nginx HTTPS                             |
| pb_data backup system         | ⬜     | Existing automated backups                  |
| WALLET_MASTER_KEY             | ⬜     | Generated, securely stored                  |
| LINE_CHANNEL_ID/SECRET        | ⬜     | Production credentials                      |
| DACC_MNEMONIC                 | ⬜     | Wallet generation seed                      |
| Flux project access           | ⬜     | Project ID: zsvm79i                         |

### Required Secrets (to be configured)

```bash
# Production environment variables
DEPLOY_HOST=your-server-ip
DEPLOY_USER=root
DEPLOY_KEY_PATH=~/.ssh/production-key
DOCKER_REGISTRY=ghcr.io/your-org
IMAGE_NAME=eggo-pocketbase
WALLET_MASTER_KEY=<32-char-hex>
LINE_CHANNEL_ID=<line-id>
LINE_CHANNEL_SECRET=<line-secret>
DACC_MNEMONIC=<bip39-mnemonic>
```

---

## Task Dependency Graph

| Task                               | Depends On | Reason                              |
| ---------------------------------- | ---------- | ----------------------------------- |
| 1. Create deployment scripts       | None       | Starting point, no prerequisites    |
| 2. Create CI/CD pipeline           | None       | Independent of scripts              |
| 3. Create secrets management       | None       | Template creation                   |
| 4. Create deployment orchestration | 1, 2, 3    | Uses scripts, CI config, secrets    |
| 5. Create health monitoring        | 4          | Depends on deployment mechanism     |
| 6. Create rollback strategy        | 4          | Depends on deployment orchestration |
| 7. Create Makefile targets         | 1-6        | Integrates all components           |
| 8. Create documentation            | 1-7        | Documents all created artifacts     |
| 9. Create verification tests       | 4, 5       | Tests deployment and monitoring     |

---

## Parallel Execution Graph

### Wave 1 (Start immediately - no dependencies)

- **Task 1:** Create deployment scripts
- **Task 2:** Create CI/CD pipeline
- **Task 3:** Create secrets management

### Wave 2 (After Wave 1 completes)

- **Task 4:** Create deployment orchestration
- **Task 5:** Create health monitoring

### Wave 3 (After Wave 2 completes)

- **Task 6:** Create rollback strategy
- **Task 7:** Create Makefile targets

### Wave 4 (After Wave 3 completes)

- **Task 8:** Create documentation
- **Task 9:** Create verification tests

**Critical Path:** Task 1 → Task 4 → Task 6 → Task 8
**Estimated Parallel Speedup:** 35% faster than sequential

---

## Tasks

### Task 1: Create Deployment Scripts

**Description:** Create shell scripts for building, pushing, and deploying PocketBase Docker images

**Files to Create:**

- `scripts/deploy-pocketbase.sh` - Main SSH deployment script
- `scripts/build-push-image.sh` - Docker build and push
- `scripts/backup-before-deploy.sh` - Pre-deployment backup

**Delegation Recommendation:**

- **Category:** `unspecified-high` - Complex shell scripting with safety checks
- **Skills:** `git-master` - For git-based version tagging

**Depends On:** None
**Acceptance Criteria:**

- [ ] Scripts are executable (`chmod +x`)
- [ ] Scripts handle errors with `set -euo pipefail`
- [ ] Build script tags images with git commit hash
- [ ] Backup script creates timestamped pb_data backup
- [ ] Deploy script uses SSH with key-based auth

---

### Task 2: Create CI/CD Pipeline

**Description:** Create GitHub Actions workflow for automated deployment

**Files to Create:**

- `.github/workflows/deploy-pocketbase.yml` - Main CI/CD workflow
- `.github/workflows/pr-checks.yml` - Pre-merge checks

**Delegation Recommendation:**

- **Category:** `unspecified-high` - CI/CD configuration requires expertise
- **Skills:** [] - No specific skills needed

**Depends On:** None
**Acceptance Criteria:**

- [ ] Workflow triggers on push to `main` branch
- [ ] Workflow builds and pushes Docker image
- [ ] Workflow runs on Ubuntu latest
- [ ] Uses secrets for Docker registry auth
- [ ] Includes migration dry-run before deploy

---

### Task 3: Create Secrets Management

**Description:** Create production environment template and secrets setup guide

**Files to Create:**

- `.env.production.example` - Template for production env vars
- `scripts/setup-secrets.sh` - Interactive secrets setup
- `docs/SECRETS_SETUP.md` - Secrets management guide

**Delegation Recommendation:**

- **Category:** `unspecified-low` - Template creation is straightforward
- **Skills:** [] - No specific skills needed

**Depends On:** None
**Acceptance Criteria:**

- [ ] Template includes all required env vars from .env.example
- [ ] Script generates secure WALLET_MASTER_KEY
- [ ] Script validates required variables
- [ ] Guide explains how to add secrets to GitHub
- [ ] Guide includes secrets rotation procedure

---

### Task 4: Create Deployment Orchestration

**Description:** Create main orchestration script that coordinates all deployment stages

**Files to Create:**

- `scripts/deploy-phase02.sh` - Main orchestration script
- `scripts/stages/00-pre-deploy.sh` - Pre-deployment checks
- `scripts/stages/10-build.sh` - Build stage
- `scripts/stages/20-push.sh` - Push stage
- `scripts/stages/30-backup.sh` - Backup stage
- `scripts/stages/40-deploy.sh` - Remote deployment
- `scripts/stages/50-migrate.sh` - Migration execution
- `scripts/stages/60-verify.sh` - Post-deployment verification

**Delegation Recommendation:**

- **Category:** `deep` - Complex orchestration with multiple stages
- **Skills:** [] - No specific skills needed

**Depends On:** Task 1, Task 2, Task 3
**Acceptance Criteria:**

- [ ] Orchestration script runs all stages sequentially
- [ ] Each stage can be run independently
- [ ] Stage failures halt deployment
- [ ] Progress logging with timestamps
- [ ] Exit codes: 0=success, 1=failure, 2=rollback triggered

---

### Task 5: Create Health Monitoring

**Description:** Create health checks and monitoring hooks

**Files to Create:**

- `scripts/health-check.sh` - Comprehensive health check
- `scripts/monitoring/log-aggregator.sh` - Log collection
- `scripts/monitoring/alert-hook.sh` - Alert notification

**Delegation Recommendation:**

- **Category:** `unspecified-high` - Monitoring requires robust error handling
- **Skills:** [] - No specific skills needed

**Depends On:** Task 4
**Acceptance Criteria:**

- [ ] Health check validates all services (PB, wallet-api, nginx)
- [ ] Health check verifies database connectivity
- [ ] Health check checks migration status
- [ ] Log aggregator collects from all containers
- [ ] Alert hook supports Slack/webhook notifications

---

### Task 6: Create Rollback Strategy

**Description:** Create automated rollback mechanism

**Files to Create:**

- `scripts/rollback.sh` - Main rollback script
- `scripts/stages/99-rollback.sh` - Rollback stage
- `scripts/snapshot-create.sh` - Create pre-deploy snapshot

**Delegation Recommendation:**

- **Category:** `unspecified-high` - Critical safety feature
- **Skills:** [] - No specific skills needed

**Depends On:** Task 4
**Acceptance Criteria:**

- [ ] Rollback restores previous image version
- [ ] Rollback preserves pb_data (never rolls back data)
- [ ] Rollback can be triggered automatically on health check failure
- [ ] Rollback can be triggered manually
- [ ] Rollback logs all actions

---

### Task 7: Create Makefile Targets

**Description:** Add deployment targets to existing Makefile

**Files to Modify:**

- `Makefile` - Add deployment targets

**Targets to Add:**

- `make deploy-prod` - Full production deployment
- `make deploy-prod-dry-run` - Simulate deployment
- `make backup-prod` - Create production backup
- `make rollback-prod` - Rollback production
- `make health-check-prod` - Check production health

**Delegation Recommendation:**

- **Category:** `quick` - Simple Makefile additions
- **Skills:** [] - No specific skills needed

**Depends On:** Task 1-6
**Acceptance Criteria:**

- [ ] All targets work with `make -n` (dry-run)
- [ ] Targets depend on required env vars
- [ ] Targets show helpful error messages
- [ ] Targets integrate with existing Makefile style

---

### Task 8: Create Documentation

**Description:** Create comprehensive deployment documentation

**Files to Create:**

- `docs/DEPLOY_PHASE02.md` - Main deployment guide
- `docs/DEPLOY_RUNBOOK.md` - Operations runbook
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide

**Delegation Recommendation:**

- **Category:** `writing` - Documentation task
- **Skills:** [] - No specific skills needed

**Depends On:** Task 1-7
**Acceptance Criteria:**

- [ ] DEPLOY_PHASE02.md explains one-command deployment
- [ ] RUNBOOK.md covers incident response
- [ ] TROUBLESHOOTING.md includes common issues
- [ ] All guides reference actual file paths
- [ ] Guides include example commands

---

### Task 9: Create Verification Tests

**Description:** Create tests to verify deployment automation

**Files to Create:**

- `scripts/tests/test-deploy-scripts.sh` - Test deployment scripts
- `scripts/tests/test-health-checks.sh` - Test health monitoring
- `scripts/tests/test-rollback.sh` - Test rollback mechanism

**Delegation Recommendation:**

- **Category:** `unspecified-high` - Testing requires thoroughness
- **Skills:** [] - No specific skills needed

**Depends On:** Task 4, Task 5
**Acceptance Criteria:**

- [ ] Tests verify script syntax (`bash -n`)
- [ ] Tests verify required files exist
- [ ] Tests verify env var requirements
- [ ] Tests run in CI pipeline
- [ ] Tests include mock deployment option

---

## Commit Strategy

### Atomic Commits (One per task)

```
commit 1: feat(deploy): add deployment scripts
  - scripts/deploy-pocketbase.sh
  - scripts/build-push-image.sh
  - scripts/backup-before-deploy.sh

commit 2: ci(deploy): add GitHub Actions workflow
  - .github/workflows/deploy-pocketbase.yml
  - .github/workflows/pr-checks.yml

commit 3: feat(deploy): add secrets management
  - .env.production.example
  - scripts/setup-secrets.sh
  - docs/SECRETS_SETUP.md

commit 4: feat(deploy): add deployment orchestration
  - scripts/deploy-phase02.sh
  - scripts/stages/*.sh

commit 5: feat(deploy): add health monitoring
  - scripts/health-check.sh
  - scripts/monitoring/*.sh

commit 6: feat(deploy): add rollback strategy
  - scripts/rollback.sh
  - scripts/stages/99-rollback.sh
  - scripts/snapshot-create.sh

commit 7: feat(deploy): add Makefile targets
  - Makefile (add targets)

commit 8: docs(deploy): add deployment documentation
  - docs/DEPLOY_PHASE02.md
  - docs/DEPLOY_RUNBOOK.md
  - docs/TROUBLESHOOTING.md

commit 9: test(deploy): add verification tests
  - scripts/tests/*.sh
```

---

## Verification Gates

### Gate 1: Script Validation

```bash
# Verify all scripts have valid syntax
find scripts -name "*.sh" -exec bash -n {} \;
```

### Gate 2: File Structure

```bash
# Verify all required files exist
ls -la scripts/deploy-phase02.sh
ls -la scripts/stages/*.sh
ls -la .github/workflows/deploy-pocketbase.yml
ls -la .env.production.example
```

### Gate 3: Dry-Run Test

```bash
# Test deployment in dry-run mode
make deploy-prod-dry-run
```

### Gate 4: Health Check Test

```bash
# Verify health check script works
./scripts/health-check.sh --local
```

### Gate 5: Rollback Test

```bash
# Test rollback mechanism
./scripts/tests/test-rollback.sh --mock
```

---

## Rollback Plan

### Automatic Rollback Triggers

1. Health check fails 3 consecutive times
2. Migration execution fails
3. Container fails to start within 60 seconds

### Manual Rollback

```bash
# Emergency rollback
make rollback-prod VERSION=previous

# Or via script
./scripts/rollback.sh --version <git-commit-hash>
```

### Rollback Steps

1. Stop new containers
2. Start previous image version
3. Verify health checks pass
4. Notify team (Slack/webhook)

---

## TODO List (ADD THESE)

### Wave 1 (Start Immediately - No Dependencies)

- [x] **1. Create deployment scripts**
  - What: Create `scripts/deploy-pocketbase.sh`, `scripts/build-push-image.sh`, `scripts/backup-before-deploy.sh`
  - Depends: None
  - Blocks: 4
  - Category: `unspecified-high`
  - Skills: [`git-master`]
  - QA: Run `bash -n scripts/*.sh` to verify syntax

- [x] **2. Create CI/CD pipeline**
  - What: Create `.github/workflows/deploy-pocketbase.yml`, `.github/workflows/pr-checks.yml`
  - Depends: None
  - Blocks: 9
  - Category: `unspecified-high`
  - Skills: []
  - QA: Verify YAML syntax with `yamllint` or online validator

- [x] **3. Create secrets management**
  - What: Create `.env.production.example`, `scripts/setup-secrets.sh`, `docs/SECRETS_SETUP.md`
  - Depends: None
  - Blocks: 4
  - Category: `unspecified-low`
  - Skills: []
  - QA: Script runs without errors: `./scripts/setup-secrets.sh --help`

### Wave 2 (After Wave 1 Completes)

- [x] **4. Create deployment orchestration**
  - What: Create `scripts/deploy-phase02.sh` with stage scripts in `scripts/stages/`
  - Depends: 1, 2, 3
  - Blocks: 6, 7
  - Category: `deep`
  - Skills: []
  - QA: Dry-run executes: `./scripts/deploy-phase02.sh --dry-run`

- [x] **5. Create health monitoring**
  - What: Create `scripts/health-check.sh`, `scripts/monitoring/*.sh`
  - Depends: 4
  - Blocks: 9
  - Category: `unspecified-high`
  - Skills: []
  - QA: Health check runs locally: `./scripts/health-check.sh --local`

### Wave 3 (After Wave 2 Completes)

- [x] **6. Create rollback strategy**
  - What: Create `scripts/rollback.sh`, `scripts/snapshot-create.sh`
  - Depends: 4
  - Blocks: 8
  - Category: `unspecified-high`
  - Skills: []
  - QA: Rollback script parses correctly: `bash -n scripts/rollback.sh`

- [x] **7. Create Makefile targets**
  - What: Add `deploy-prod`, `backup-prod`, `rollback-prod`, `health-check-prod` to `Makefile`
  - Depends: 1-6
  - Blocks: 8
  - Category: `quick`
  - Skills: []
  - QA: Dry-run works: `make -n deploy-prod`

### Wave 4 (After Wave 3 Completes)

- [x] **8. Create documentation**
  - What: Create `docs/DEPLOY_PHASE02.md`, `docs/DEPLOY_RUNBOOK.md`, `docs/TROUBLESHOOTING.md`
  - Depends: 1-7
  - Blocks: None
  - Category: `writing`
  - Skills: []
  - QA: All referenced files exist: `grep -o '`[^`]_`' docs/_.md | sort -u`

- [x] **9. Create verification tests**
  - What: Create `scripts/tests/*.sh` test scripts
  - Depends: 4, 5
  - Blocks: None
  - Category: `unspecified-high`
  - Skills: []
  - QA: Tests run without errors: `./scripts/tests/test-deploy-scripts.sh`

---

## Execution Instructions

### Wave 1: Fire in parallel

```bash
task(category="unspecified-high", load_skills=["git-master"], run_in_background=false, prompt="Task 1: Create deployment scripts...")
task(category="unspecified-high", load_skills=[], run_in_background=false, prompt="Task 2: Create CI/CD pipeline...")
task(category="unspecified-low", load_skills=[], run_in_background=false, prompt="Task 3: Create secrets management...")
```

### Wave 2: After Wave 1

```bash
task(category="deep", load_skills=[], run_in_background=false, prompt="Task 4: Create deployment orchestration...")
task(category="unspecified-high", load_skills=[], run_in_background=false, prompt="Task 5: Create health monitoring...")
```

### Wave 3: After Wave 2

```bash
task(category="unspecified-high", load_skills=[], run_in_background=false, prompt="Task 6: Create rollback strategy...")
task(category="quick", load_skills=[], run_in_background=false, prompt="Task 7: Create Makefile targets...")
```

### Wave 4: After Wave 3

```bash
task(category="writing", load_skills=[], run_in_background=false, prompt="Task 8: Create documentation...")
task(category="unspecified-high", load_skills=[], run_in_background=false, prompt="Task 9: Create verification tests...")
```

---

## Success Criteria

### Final Verification

- [ ] `make deploy-prod` works end-to-end
- [ ] CI/CD pipeline triggers on main branch push
- [ ] Health checks pass after deployment
- [ ] Rollback can be triggered manually
- [ ] All scripts pass `bash -n` syntax check
- [ ] Documentation covers all deployment scenarios
- [ ] Tests verify all critical paths

### Operational Readiness

- [ ] Zero manual steps required for deployment
- [ ] Deployment completes within 5 minutes
- [ ] Rollback completes within 2 minutes
- [ ] Health monitoring alerts on failure
- [ ] Logs are accessible and searchable
