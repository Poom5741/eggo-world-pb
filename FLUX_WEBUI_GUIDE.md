# 🚀 Flux Web UI Setup

**Date:** April 11, 2026  
**Status:** ✅ Ready to run  

---

## Quick Start

### Option 1: Run from Project (Recommended)

```bash
# From your project root
./scripts/start-flux-ui.sh
```

This will:
1. Check if Flux is installed in `/tmp/flux`
2. Install if needed (first time only)
3. Start server on **http://localhost:3589**
4. Use your project's SQLite database at `.flux/data.sqlite`

### Option 2: Manual Start

```bash
# First time setup
cd /tmp
git clone https://github.com/sirsjg/flux.git --depth=1
cd flux
bun install
bun run build

# Start server
export FLUX_DATA=/Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite
cd /tmp/flux
bun run packages/server/dist/index.js
```

### Option 3: Docker (Not Recommended for Your Mac)

Docker has permission issues on ARM Macs. Use Option 1 instead.

---

## Access Web UI

Once running, visit: **http://localhost:3589**

You'll see:
- Project: Eggo NFT Platform
- 6 tasks (3 P0, 1 P1, 2 P2)
- Drag-and-drop Kanban board
- Real-time updates

---

## Current Tasks

| Priority | Task ID | Title |
|----------|---------|-------|
| 🔴 P0 | 5nr4bh0 | Fix pending changes (7 modified files) |
| 🔴 P0 | nfripul | Complete Phase 10 UAT (Egg Management) |
| 🔴 P0 | t4xdpox | Launch NFT Marketplace (Phase 11) |
| 🟡 P1 | 450p479 | Referral System Testing & Verification |
| ⚪ P2 | wq8k6hd | Performance optimization for Claymorphism UI |
| ⚪ P2 | olv544u | Archive old `.planning/` phases documentation |

---

## Configuration

### Your Flux Setup
```
Project Root: /Users/poom-work/tokenine/eggo-pocketbase
Flux Data:    /Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite
Flux Config:  /Users/poom-work/tokenine/eggo-pocketbase/.flux/config.json
Flux Server:  /tmp/flux (runs from here)
Web UI:       http://localhost:3589
Port:         3589 = FLUX on keypad
```

### Environment Variables
```bash
export FLUX_DATA=/Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite
export PORT=3589  # Optional, default 3000
```

---

## Development Mode (With Hot Reload)

If you want to customize Flux UI:

```bash
# Terminal 1: API server
cd /tmp/flux
export FLUX_DATA=/Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite
bun run packages/server/dev  # or: bun --filter @flux/server dev

# Terminal 2: Web UI with HMR
bun run packages/web/dev  # or: bun --filter @flux/web dev

# Access at: http://localhost:5173 (proxies to :3000)
```

---

## API Endpoint

Flux also has a REST API:
```
http://localhost:3589/api/*
```

Example:
```bash
curl http://localhost:3589/api/projects
curl http://localhost:3589/api/tasks?project=zsvm79i
```

---

## Troubleshooting

### "SQLite not found"
Run `flux init --sqlite` in your project root first.

### "Port already in use"
```bash
# Kill existing Flux process
pkill -f "bun.*flux"
# Or use different port
export PORT=3589
./scripts/start-flux-ui.sh
```

### "Flux not found"
The startup script will auto-install on first run. Or run manually:
```bash
cd /tmp
git clone https://github.com/sirsjg/flux.git --depth=1
cd flux
bun install
bun run build
```

### Docker Permission Errors
Don't use Docker. Run from source instead (see "Option 2" above).

---

## CLI vs Web UI

| Feature | CLI | Web UI |
|---------|-----|--------|
| View tasks | ✅ `flux ready` | ✅ Kanban board |
| Create task | ✅ `flux task create` | ✅ Drag from sidebar |
| Update status | ✅ `flux task update` | ✅ Drag cards |
| Add comments | ✅ `flux comment add` | ✅ Click card + comment |
| Priority | ✅ `-P 0\|1\|2` | ✅ Set in card editor |
| Dependencies | ✅ `--depends-on` | ✅ Link cards |

Use **CLI** for scripts and agents.  
Use **Web UI** for visual management and drag-and-drop.

---

## Stopping the Server

Press `Ctrl+C` in the terminal running the server.

---

**Last Updated:** April 11, 2026  
**Flux Version:** 0.1.1 (from source)  
