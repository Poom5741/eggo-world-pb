# Fix Deposit Tracking - Learnings

## Deployment (2026-05-15)

### Key patterns discovered:

1. **Dockerfile has cleanup step**: Line 12 in Dockerfile runs `rm -f /pb/pb_hooks/13-track-deposit.pb.js || true` during build. This means the hook file in pb_hooks/ is DELETED before the COPY happens. The file must be in the source directory at build time.

2. **Build picks up local files**: The `COPY pb_hooks/*.pb.js /pb/pb_hooks/` instruction copies from the local `pb_hooks/` directory, not from the uploaded file. Uploading to `/root/eggo-world-pb/apps/backend/pb_hooks/` doesn't help because Dockerfile uses its own local source context.

3. **Correct approach**: Either:
   - Modify Dockerfile to copy from the right directory, OR
   - Edit the file in the Docker build context on the server

### Actual successful deployment:

- Uploaded fixed file to server
- Server had the file in its local pb_hooks/ directory
- Docker build picked up the local file during `COPY pb_hooks/*.pb.js`
- Container restarted and hook loaded successfully

### Verification commands:

```bash
# Check container
docker ps | grep eggo-pb

# Check logs
docker compose -f /root/eggo-world-pb/docker-compose.yml logs --tail=30 pocketbase | grep -i 'deposit'

# Verify file
ls -la /root/eggo-world-pb/apps/backend/pb_hooks/13-track-deposit.pb.js
```

### Deployment 2026-05-15 (repeated)

1. scp upload fixed file to `/root/eggo-world-pb/apps/backend/pb_hooks/`
2. docker compose build pocketbase
3. docker compose up -d pocketbase
4. Container healthy, hook loaded with "Deposit tracking endpoints registered"

### Evidence files saved:

- `.sisyphus/evidence/task-2-file-uploaded.txt`
- `.sisyphus/evidence/task-2-container-restarted.txt`
- `.sisyphus/evidence/task-2-hook-loaded.txt`
