# GSD Agents for Qoder - Quick Reference

## Overview

All 22 GSD (Get Shit Done) agents from the original framework have been successfully ported to Qoder at `~/.qoder/agents/`. These agents enable spec-driven development with context engineering, automated planning, execution, and verification.

## Core Workflow Agents

### 1. **gsd-planner**

Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification.

- **Use when:** Planning implementation phases after discussion
- **Spawned by:** `/gsd-plan-phase` command
- **Key output:** PLAN.md files with atomic tasks

### 2. **gsd-executor**

Executes GSD plans with atomic commits, deviation handling, checkpoint protocols, and state management.

- **Use when:** Implementing planned phases
- **Spawned by:** `/gsd-execute-phase` command
- **Key output:** SUMMARY.md, git commits per task

### 3. **gsd-verifier**

Verifies phase goal achievement through goal-backward analysis. Checks codebase delivers what phase promised.

- **Use when:** After executing phases to verify completion
- **Spawned by:** Verification workflow
- **Key output:** VERIFICATION.md report

### 4. **gsd-debugger**

Investigates bugs using scientific method, manages debug sessions, handles checkpoints.

- **Use when:** Debugging issues systematically
- **Spawned by:** `/gsd-debug` command
- **Key output:** Root cause analysis, fixes

## Research & Discovery Agents

### 5. **gsd-project-researcher**

Researches domain ecosystem before roadmap creation. Produces files in `.planning/research/`.

- **Use when:** Starting new projects or milestones
- **Key output:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

### 6. **gsd-phase-researcher**

Researches specific phase implementation details guided by CONTEXT.md decisions.

- **Use when:** Before planning complex phases
- **Key output:** Phase-specific RESEARCH.md

### 7. **gsd-codebase-mapper**

Analyzes existing codebase to extract stack, architecture, conventions, and concerns.

- **Use when:** Working with existing codebases
- **Key output:** CONVENTIONS.md, STRUCTURE.md, ARCHITECTURE.md

### 8. **gsd-advisor-researcher**

Provides expert advice on specific technical domains or architectural decisions.

- **Use when:** Needing specialized domain knowledge

### 9. **gsd-research-synthesizer**

Synthesizes research findings into actionable recommendations.

- **Use when:** Multiple research sources need consolidation

### 10. **gsd-ui-researcher**

Specialized research for UI/UX patterns, component libraries, and design systems.

- **Use when:** Planning UI-heavy features

## Documentation Agents

### 11. **gsd-doc-writer**

Creates comprehensive documentation following project standards.

- **Use when:** Writing technical docs, guides, or specifications

### 12. **gsd-doc-verifier**

Verifies documentation accuracy against actual implementation.

- **Use when:** Ensuring docs match code

## Quality & Audit Agents

### 13. **gsd-plan-checker**

Reviews plans for completeness, consistency, and adherence to GSD standards.

- **Use when:** Validating plans before execution

### 14. **gsd-integration-checker**

Verifies integration points between components, APIs, and services.

- **Use when:** Checking cross-component contracts

### 15. **gsd-ui-checker**

Audits UI implementation against design specs and accessibility standards.

- **Use when:** Reviewing UI quality

### 16. **gsd-ui-auditor**

Comprehensive UI audit covering performance, accessibility, and UX.

- **Use when:** Final UI quality gate

### 17. **gsd-security-auditor**

Security-focused audit of implementations against threat models.

- **Use when:** Security review needed

### 18. **gsd-nyquist-auditor**

Ensures verification criteria are testable and measurable (Nyquist rule).

- **Use when:** Validating test coverage

## Specialized Agents

### 19. **gsd-roadmapper**

Creates strategic roadmaps from requirements and research.

- **Use when:** Initial project planning
- **Key output:** ROADMAP.md with phased approach

### 20. **gsd-user-profiler**

Analyzes user needs and creates user personas/profiles.

- **Use when:** Understanding target users

### 21. **gsd-assumptions-analyzer**

Identifies and validates assumptions in plans or implementations.

- **Use when:** Risk assessment needed

### 22. **gsd-executor** (already listed above)

Note: This is the primary execution agent.

## How to Use

### Automatic Delegation

Qoder will automatically delegate to these agents when you mention them or when the task matches their description. For example:

```
"Plan phase 1 for authentication" → gsd-planner
"Execute the auth plan" → gsd-executor
"Verify phase 1 is complete" → gsd-verifier
"Debug this login issue" → gsd-debugger
```

### Manual Invocation

You can explicitly request an agent:

```
"Use the gsd-planner agent to create a plan for..."
"Spawn gsd-executor to implement..."
"Have gsd-verifier check if..."
```

## Key Principles

1. **Context Engineering**: Each agent maintains focused context, preventing context rot
2. **Atomic Commits**: Executors commit after each task for traceability
3. **Goal-Backward Verification**: Verifiers check outcomes, not just task completion
4. **Deviation Rules**: Auto-fix bugs (Rule 1), add critical functionality (Rule 2), fix blockers (Rule 3), ask about architecture (Rule 4)
5. **Quality Gates**: Checkers and auditors ensure quality at each stage

## File Structure

Agents are stored at: `~/.qoder/agents/gsd-*.md`

Each agent file contains:

- YAML frontmatter (name, description, tools)
- Role definition
- Workflows and processes
- Output formats
- Success criteria

## Integration with GSD Commands

These agents work with the GSD command system:

- `/gsd-new-project` → Uses roadmapper, researcher, planner
- `/gsd-discuss-phase` → Captures user decisions
- `/gsd-plan-phase` → Spawns gsd-planner
- `/gsd-execute-phase` → Spawns gsd-executor
- `/gsd-debug` → Spawns gsd-debugger
- Verification workflows → Spawn gsd-verifier

## Best Practices

1. **Let agents auto-delegate**: Trust the descriptions to trigger the right agent
2. **Don't skip verification**: Always verify phases before moving forward
3. **Honor locked decisions**: User decisions from discuss-phase are non-negotiable
4. **Follow deviation rules**: Auto-fix within scope, ask about architecture
5. **Keep context fresh**: Use `/clear` between major operations
6. **Review agent outputs**: Check PLAN.md, SUMMARY.md, VERIFICATION.md for quality

## Troubleshooting

### Agent Not Triggering

- Ensure agent description mentions your use case
- Try explicit invocation: "Use the gsd-X agent to..."
- Check agent file exists: `ls ~/.qoder/agents/gsd-*.md`

### Poor Plan Quality

- Provide more context in discuss-phase
- Check CONTEXT.md was created and loaded
- Verify research was done first

### Execution Issues

- Check for auth gates (may need manual setup)
- Review deviation tracking in SUMMARY.md
- Verify no scope creep beyond plan

### Verification Failures

- Review VERIFICATION.md gaps section
- Run `/gsd-plan-phase --gaps` to create closure plans
- Address human verification items manually

## Next Steps

1. Initialize a project: Start with `/gsd-new-project` or explore existing codebase with gsd-codebase-mapper
2. Plan a phase: Use gsd-planner after discussing requirements
3. Execute: Let gsd-executor implement the plan atomically
4. Verify: Use gsd-verifier to confirm goal achievement
5. Iterate: Fix gaps, move to next phase

---

**Port Date:** April 4, 2026  
**Source:** https://github.com/gsd-build/get-shit-done.git  
**Location:** `~/.qoder/agents/`  
**Total Agents:** 22
