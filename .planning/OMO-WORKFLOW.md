# OMO Workflow Guide

**Oh-My-OpenAgent PM System for EggoPocketbase**

Quick reference for using SPEC.md + tasks.md for feature development.

---

## When to Use

| Work Type                    | Use OMO?  | Where                       |
| ---------------------------- | --------- | --------------------------- |
| New feature (1-5 days)       | ✅ Yes    | `apps/web/features/<name>/` |
| Small bugfix (<1 day)        | ❌ No     | Use Flux only               |
| Major milestone (v1.0, v2.0) | ❌ No     | Keep `.planning/phases/`    |
| Epic (1-2 weeks)             | ⚠️ Hybrid | SPEC.md + multiple tasks.md |

---

## Quick Start (New Feature)

### Step 1: Create Feature Directory

```bash
mkdir -p apps/web/features/<feature-name>
```

### Step 2: Copy Templates

```bash
cp .planning/templates/SPEC.md apps/web/features/<feature-name>/
cp .planning/templates/tasks.md apps/web/features/<feature-name>/
```

### Step 3: Fill SPEC.md

Write the product brief **before** implementation:

- Problem statement
- Success criteria (measurable!)
- Acceptance test
- Out of scope (scope creep prevention)

### Step 4: Create tasks.md

Break down work into atomic tasks:

- P1 = Must have (this sprint)
- P2 = Nice to have (later)
- Add dependencies: `Accepts: deps=TASK-001`

### Step 5: Create GitHub Issues

Manually create issues for P1 tasks:

1. Go to GitHub Issues
2. Create issue from task description
3. Copy issue number to tasks.md

### Step 6: Execute

```bash
# Start task
flux task start <task-id>

# Work, commit with issue reference
git commit -m "feat: add wallet balance #45"

# Mark done
flux task done <task-id> --note "Completed balance display"
```

### Step 7: Update tasks.md

Mark tasks as done in tasks.md:

```markdown
- [x] TASK-001 Fetch wallet balance (#45)
  - **Completed**: 2026-04-13
```

---

## Priority Guide

| Priority | Description                  | Examples                              |
| -------- | ---------------------------- | ------------------------------------- |
| P0       | Blocks team, production down | Security fix, API breaking change     |
| P1       | Normal feature work          | New UI component, API endpoint        |
| P2       | Nice to have                 | Polish, animations, optional features |

---

## Task ID Convention

```
<TYPE>-<NNN>

TYPE: FEAT | BUG | TEST | DOCS | REFACTOR
NNN: 001, 002, 003...
```

Examples:

- `FEAT-001` - First feature task
- `BUG-003` - Third bug fix
- `TEST-001` - First test task

---

## Dependency Management

In `tasks.md`, declare dependencies:

```markdown
- [ ] FEAT-001 Create wallet API client
  - Accepts: deps=none

- [ ] FEAT-002 Build balance component
  - Accepts: deps=FEAT-001 # Waits for FEAT-001

- [ ] FEAT-003 Add balance to dashboard
  - Accepts: deps=FEAT-002 # Waits for FEAT-002
```

**Rule**: Don't start a task until its dependencies are done.

---

## Commit Convention

Always reference GitHub issues:

```bash
feat: add wallet balance display #45
fix: handle loading state in balance card #47
test: add integration test for wallet API #48
```

---

## File Structure Example

```
eggo-pocketbase/
├── apps/web/features/
│   └── wallet-balance/
│       ├── SPEC.md           # What & why
│       ├── tasks.md          # How & when
│       ├── components/       # Feature code
│       │   └── BalanceCard.tsx
│       └── hooks/
│           └── useWalletBalance.ts
├── .planning/
│   ├── templates/
│   │   ├── SPEC.md           # Copy from here
│   │   └── tasks.md
│   └── phases/               # Major milestones only
└── .flux/                    # Flux task tracking
```

---

## Common Pitfalls

❌ **Don't**:

- Skip SPEC.md and start coding immediately
- Create tasks without dependencies
- Forget to update tasks.md after completing work
- Use P0 for everything (reserved for true emergencies)

✅ **Do**:

- Write SPEC.md before any code
- Break tasks small enough to complete in <1 day
- Reference GitHub issues in commits
- Keep tasks.md synchronized with Flux

---

## Tools & Commands

| Task               | Command                                                 |
| ------------------ | ------------------------------------------------------- |
| Create feature dir | `mkdir -p apps/web/features/<name>`                     |
| Copy templates     | `cp .planning/templates/*.md apps/web/features/<name>/` |
| Start task         | `flux task start <id>`                                  |
| Mark done          | `flux task done <id> --note "..."`                      |
| Show ready tasks   | `flux ready`                                            |
| Create issue       | Manual (GitHub UI)                                      |

---

**Questions?** See `AGENTS.md` for full OMO workflow documentation.
