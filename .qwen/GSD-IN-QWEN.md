# GSD Commands for Qwen Code

## Important Note

**Qwen Code does not support slash commands (`/command`) like Claude Code does.**

The GSD framework was designed for Claude Code which has native slash command support. Qwen Code uses a different architecture with **agents** and **direct prompts**.

## How to Use GSD in Qwen Code

Instead of `/gsd-help`, `/gsd-plan-phase`, etc., you can:

### Option 1: Use GSD Agents Directly

Qwen Code has GSD agents loaded at `~/.qwen/agents/`. Reference them in your prompts:

```
@gsd-planner Create a plan for phase 1 authentication
@gsd-executor Execute the plans in phase 1
@gsd-debugger Help me debug this login issue
@gsd-verifier Verify phase 1 is complete
```

### Option 2: Use Direct Prompts

Just describe what you want to do:

```
"Plan phase 1 of the roadmap using GSD methodology"
"Execute all plans in phase 1 with atomic commits"
"Check project progress and show what's next"
"Debug this issue: login button doesn't work"
```

### Option 3: Use GSD Workflow Files

Reference the workflow files directly:

```
Read `.qwen/get-shit-done/workflows/plan-phase.md` and follow the process
```

## Available GSD Agents

Located at `~/.qwen/agents/`:

### Core Workflow Agents

- `@gsd-planner` - Create phase plans
- `@gsd-executor` - Execute plans
- `@gsd-verifier` - Verify completion
- `@gsd-debugger` - Debug issues

### Research Agents

- `@gsd-project-researcher` - Domain research
- `@gsd-phase-researcher` - Phase-specific research
- `@gsd-codebase-mapper` - Map existing codebase
- `@gsd-ui-researcher` - UI/UX research

### Quality Agents

- `@gsd-plan-checker` - Review plans
- `@gsd-security-auditor` - Security audits
- `@gsd-nyquist-auditor` - Validation coverage

## GSD Project State

Current project has GSD configured:

- Planning directory: `.planning/`
- State file: `.planning/STATE.md`
- Roadmap: `.planning/ROADMAP.md`
- Config: `.planning/config.json`

## Quick Start

1. **Check Progress**: "Check `.planning/STATE.md` and `.planning/ROADMAP.md` to see current project status"

2. **Plan Next Phase**: "@gsd-planner Create a detailed plan for the next phase in the roadmap"

3. **Execute**: "@gsd-executor Execute all plans in the current phase with atomic commits"

4. **Debug**: "@gsd-debugger Investigate this issue: [describe problem]"

## Files

- `.qwen/GSD-COMMANDS.md` - Reference of all 79 GSD commands (for Claude Code)
- `.qwen/get-shit-done/workflows/` - Workflow definitions
- `.qwen/agents/gsd-*.md` - Agent definitions
- `.planning/` - Project planning files

---

**Bottom Line**: Use `@gsd-*` agents or direct prompts instead of `/gsd-*` commands in Qwen Code.
