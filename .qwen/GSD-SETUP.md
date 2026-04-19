# GSD Commands Setup for Qwen Code

## Problem

After installing GSD skills to `~/.qwen/skills/`, the commands might not appear immediately in Qwen Code because:

1. Qwen Code caches skills on startup
2. Skills need to be reloaded after installation

## Solution

### Option 1: Restart Qwen Code (Recommended)

1. Close Qwen Code completely
2. Reopen Qwen Code
3. The GSD commands should now be available

### Option 2: Clear Cache and Reload

1. In Qwen Code, use the `/clear` command
2. Restart the Qwen Code session
3. Skills should be reloaded

### Option 3: Use Project-Level Skills

Copy skills to project directory:

```bash
# From project root
cp -r ~/.qwen/skills/gsd-* .qwen/skills/
```

Then restart Qwen Code.

## Verify Installation

After restarting Qwen Code, try these commands:

```
/gsd-help
/gsd-progress
/gsd-stats
```

If they work, GSD is properly loaded!

## Available Commands

See `.qwen/GSD-COMMANDS.md` for the complete list of 79 GSD commands.

## Quick Start

```bash
# Check project status
/gsd-progress

# Plan a new phase
/gsd-plan-phase 1

# Execute the phase
/gsd-execute-phase 1

# Debug an issue
/gsd-debug "describe your issue"

# Quick task
/gsd-quick "describe small task"
```

## Troubleshooting

### Commands Not Showing

1. **Restart Qwen Code** - This is the most reliable fix
2. **Check skills exist**: `ls ~/.qwen/skills/gsd-*`
3. **Verify skill format**: `cat ~/.qwen/skills/gsd-help/SKILL.md`

### Skills Directory Missing

Reinstall GSD:

```bash
npx get-shit-done-cc@latest
```

### Still Not Working

Check if skills are in the correct location:

```bash
# Should show 79 GSD skills
ls ~/.qwen/skills/ | grep gsd- | wc -l

# Should be 79
```

## File Locations

- **Global Skills**: `~/.qwen/skills/gsd-*` (79 skills)
- **Project Skills**: `.qwen/skills/` (4 external skills)
- **Skills Lock**: `skills-lock.json` (updated with GSD skills)
- **Command Reference**: `.qwen/GSD-COMMANDS.md`
- **Workflows**: `.qwen/get-shit-done/workflows/`

---

**Last Updated**: 2026-04-19
**GSD Version**: 1.37.1
**Skills Count**: 79
