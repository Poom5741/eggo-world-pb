## Rollback Strategy Implementation

Date: 2026-04-12

### Scripts Created

1. **scripts/rollback.sh**
   - Supports `--version=<hash>` for specific version rollback
   - Supports `--auto` for automatic rollback on deployment failure
   - Supports `--dry-run` for testing without execution
   - Never touches pb_data (preserves stateful data)
   - Sends alerts via alert-hook.sh
   - Verifies health after rollback
   - Records rollback in history (last 5 entries kept)
   - Syntax verified: `bash -n rollback.sh` passes

2. **scripts/snapshot-create.sh**
   - Creates pre-deployment Docker image snapshots
   - Generates metadata JSON file with deployment info
   - Tags current image as `pre-deploy-<timestamp>`
   - Supports `--tag=<name>` for custom tag names
   - Cleans up old snapshots (keeps last 10)
   - Integrates with rollback system
   - Syntax verified: `bash -n snapshot-create.sh` passes

### Key Design Decisions

- **Image-only rollback**: Only container images are rolled back, never pb_data
- **SSH-based**: All operations occur on production server (204.168.144.14)
- **Alert integration**: Uses alert-hook.sh for all rollback notifications
- **Metadata tracking**: JSON metadata files enable quick rollback version lookup
- **History cleanup**: Automatic cleanup prevents accumulation of old snapshots

### Integration Points

- Called from: `scripts/stages/70-rollback.sh` (emergency rollback)
- Called from: `scripts/deploy-pocketbase.sh` (automatic rollback on failure)
- Notifications: `scripts/monitoring/alert-hook.sh`
- Phase orchestration: `scripts/deploy-phase02.sh`

### Usage Examples

```bash
# Pre-deployment snapshot
./snapshot-create.sh
./snapshot-create.sh --tag=pre-release-v1.2

# Manual rollback
./rollback.sh                          # Most recent snapshot
./rollback.sh --version=abc123         # Specific version

# Automatic rollback (from deploy script)
./rollback.sh --auto

# Test rollback without changes
./rollback.sh --dry-run
```
