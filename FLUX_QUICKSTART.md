# 🚀 Flux Web UI - Quick Start

## ✅ Status: RUNNING

**Web UI:** http://localhost:3589  
**Port:** 3589 (= FLUX on keypad)  
**Data:** `.flux/data.sqlite` in your project  
**Your Frontend Port (3000):** Available ✅  

---

## 🔧 To Restart Flux Server

### If server is already running:
```bash
# Stop
pkill -f "bun.*packages/server"

# Start on 3589
cd /tmp/flux
export FLUX_DATA=/Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite
export PORT=3589
bun run packages/server/dist/index.js
```

### Or use the project script:
```bash
./scripts/start-flux-ui.sh
```

---

## 📋 Your Tasks

Visit **http://localhost:3589** to see:

- 🔴 **P0 (3 tasks):**
  - Fix pending changes (7 modified files)
  - Complete Phase 10 UAT (Egg Management)
  - Launch NFT Marketplace (Phase 11)

- 🟡 **P1 (1 task):**
  - Referral System Testing & Verification

- ⚪ **P2 (2 tasks):**
  - Performance optimization for Claymorphism UI
  - Archive old `.planning/` phases documentation

---

## 🎯 CLI Commands

```bash
# View ready tasks
flux ready

# Start a task
flux task start 5nr4bh0

# Mark complete
flux task done 5nr4bh0 --note "Fixed: [details]"

# Create new task
flux task create "New feature" -P 1
```

---

## 🌐 Ports

| Service | Port | URL |
|---------|------|-----|
| **Flux Web UI** | 3589 | http://localhost:3589 |
| **Your Frontend Dev** | 3000 | http://localhost:3000 |
| **Flux API** | 3589 | http://localhost:3589/api/* |

---

**Flux keeps your frontend port (3000) free!** 🎉

Last updated: April 11, 2026