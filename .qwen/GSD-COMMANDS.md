# GSD Commands Quick Reference

All 79 GSD (Get Shit Done) commands are now available in this project.

## Core Workflow Commands

### Project Initialization
- **`/gsd-new-project`** - Initialize new project with research, requirements, roadmap
- **`/gsd-map-codebase`** - Map existing codebase for brownfield projects

### Phase Planning
- **`/gsd-discuss-phase <number>`** - Capture vision for a phase before planning
- **`/gsd-discuss-phase <number> --batch`** - Ask multiple questions at once
- **`/gsd-research-phase <number>`** - Ecosystem research for complex domains
- **`/gsd-list-phase-assumptions <number>`** - See Claude's intended approach
- **`/gsd-plan-phase <number>`** - Create detailed execution plan
- **`/gsd-plan-phase <number> --prd <file>`** - Skip discussion, use PRD file

### Execution
- **`/gsd-execute-phase <number>`** - Execute all plans in a phase
- **`/gsd-execute-phase <number> --wave N`** - Execute only wave N
- **`/gsd-execute-phase <number> --gaps-only`** - Execute only gap closure plans
- **`/gsd-execute-phase <number> --interactive`** - Execute inline with checkpoints

### Smart Router & Quick Mode
- **`/gsd-do <description>`** - Auto-route to correct GSD command
- **`/gsd-quick`** - Execute small tasks with GSD guarantees
- **`/gsd-quick --full`** - Full quality pipeline
- **`/gsd-quick --validate`** - Add validation only
- **`/gsd-fast [description>`** - Trivial inline task (no planning)

## Roadmap Management

### Phase Management
- **`/gsd-add-phase <description>`** - Add phase to end of milestone
- **`/gsd-insert-phase <after> <description>`** - Insert urgent phase (e.g., 7.1)
- **`/gsd-remove-phase <number>`** - Remove future phase

### Milestone Management
- **`/gsd-new-milestone <name>`** - Start new milestone
- **`/gsd-new-milestone --reset-phase-numbers <name>`** - Restart numbering at 1
- **`/gsd-complete-milestone <version>`** - Archive completed milestone

## Progress & Session Management

### Progress Tracking
- **`/gsd-progress`** - Check status and route to next action
- **`/gsd-stats`** - Display project statistics

### Session Management
- **`/gsd-resume-work`** - Resume from previous session
- **`/gsd-pause-work`** - Create context handoff for pausing

### Debugging
- **`/gsd-debug [issue>`** - Systematic debugging with persistent state

## Spiking & Sketching

### Spikes (Feasibility Experiments)
- **`/gsd-spike [idea>`** - Rapid feasibility experiments
- **`/gsd-spike [idea> --quick`** - Skip decomposition, build immediately
- **`/gsd-spike-wrap-up`** - Package spike findings into skill

### Sketches (UI Design Exploration)
- **`/gsd-sketch [idea>`** - UI design with multi-variant exploration
- **`/gsd-sketch [idea> --quick`** - Skip mood intake, start building
- **`/gsd-sketch-wrap-up`** - Package sketch findings into skill

## Notes & Todos

### Quick Notes
- **`/gsd-note <text>`** - Zero-friction idea capture
- **`/gsd-note list`** - List all notes
- **`/gsd-note promote <N>`** - Convert note to todo

### Todo Management
- **`/gsd-add-todo [description>`** - Capture task from conversation
- **`/gsd-check-todos`** - List and select todos to work on
- **`/gsd-check-todos <area>`** - Filter todos by area

## Testing & Verification

### User Acceptance Testing
- **`/gsd-verify-work [phase>`** - Conversational UAT for built features
- **`/gsd-audit-uat`** - Cross-phase audit of UAT items

### Ship & Review
- **`/gsd-ship [phase>`** - Create PR from completed phase
- **`/gsd-review --phase N --all`** - Cross-AI peer review
- **`/gsd-pr-branch [target>`** - Create clean PR branch

### Auditing
- **`/gsd-audit-milestone [version>`** - Audit milestone completion
- **`/gsd-plan-milestone-gaps`** - Create phases to close audit gaps

## Configuration

### Settings
- **`/gsd-settings`** - Configure workflow toggles interactively
- **`/gsd-set-profile <profile>`** - Switch model profile
  - `quality` - Opus everywhere
  - `balanced` - Opus planning, Sonnet execution (default)
  - `budget` - Sonnet writing, Haiku research
  - `inherit` - Use current session model

## Utility Commands

### Maintenance
- **`/gsd-cleanup`** - Archive completed phase directories
- **`/gsd-health`** - Diagnose planning directory health
- **`/gsd-update`** - Update GSD to latest version

### Help & Community
- **`/gsd-help`** - Show this command reference
- **`/gsd-join-discord`** - Join GSD Discord community

### Advanced Commands
- **`/gsd-autonomous`** - Run all remaining phases autonomously
- **`/gsd-manager`** - Interactive command center for multiple phases
- **`/gsd-thread`** - Manage persistent context threads
- **`/gsd-workstreams`** - Manage parallel workstreams
- **`/gsd-new-workspace`** - Create isolated workspace
- **`/gsd-list-workspaces`** - List active workspaces
- **`/gsd-remove-workspace`** - Remove workspace
- **`/gsd-from-gsd2`** - Import GSD-2 project format
- **`/gsd-graphify`** - Build and query project knowledge graph
- **`/gsd-intel`** - Query codebase intelligence files
- **`/gsd-inbox`** - Triage GitHub issues and PRs
- **`/gsd-import`** - Ingest external plans with conflict detection
- **`/gsd-eval-review`** - Audit AI phase evaluation coverage
- **`/gsd-extract_learnings`** - Extract decisions from phase artifacts
- **`/gsd-explore`** - Socratic ideation and idea routing
- **`/gsd-forensics`** - Post-mortem for failed GSD workflows
- **`/gsd-milestone-summary`** - Generate comprehensive project summary
- **`/gsd-next`** - Advance to next logical GSD step
- **`/gsd-plant-seed`** - Capture forward-looking idea with triggers
- **`/gsd-profile-user`** - Generate developer behavioral profile
- **`/gsd-reapply-patches`** - Reapply local mods after GSD update
- **`/gsd-review-backlog`** - Review and promote backlog items
- **`/gsd-scan`** - Rapid codebase assessment
- **`/gsd-secure-phase`** - Verify threat mitigations for phase
- **`/gsd-session-report`** - Generate session report with tokens
- **`/gsd-spec-phase`** - Socratic spec refinement before planning
- **`/gsd-undo`** - Safe git revert for phase commits
- **`/gsd-validate-phase`** - Audit Nyquist validation gaps
- **`/gsd-ui-phase`** - Generate UI design contract
- **`/gsd-ui-review`** - Retroactive 6-pillar visual audit
- **`/gsd-add-backlog`** - Add idea to backlog parking lot
- **`/gsd-add-tests`** - Generate tests for completed phase
- **`/gsd-ai-integration-phase`** - Generate AI design contract
- **`/gsd-analyze-dependencies`** - Analyze phase dependencies
- **`/gsd-audit-fix`** - Autonomous audit-to-fix pipeline
- **`/gsd-code-review`** - Review source files for bugs
- **`/gsd-docs-update`** - Generate/update project documentation

## Quick Start

```bash
# 1. Start new project
/gsd-new-project

# 2. Plan first phase
/gsd-plan-phase 1

# 3. Execute the phase
/gsd-execute-phase 1

# 4. Check progress
/gsd-progress
```

## Files & Structure

```
.planning/
├── PROJECT.md            # Project vision
├── ROADMAP.md            # Current phase breakdown
├── STATE.md              # Project memory & context
├── config.json           # Workflow mode & gates
├── phases/               # Phase plans and summaries
│   ├── 01-foundation/
│   │   ├── 01-01-PLAN.md
│   │   └── 01-01-SUMMARY.md
│   └── ...
├── debug/                # Active debug sessions
├── todos/                # Captured ideas and tasks
├── spikes/               # Spike experiments
└── sketches/             # Design sketches
```

---

**Installed:** 79 GSD skills at `~/.qwen/skills/`
**Version:** GSD v1.37.1
**Last Updated:** 2026-04-19
