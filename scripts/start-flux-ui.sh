#!/bin/bash
# Flux Web UI Starter Script
# Run this to start Flux web UI for your project

set -e

FLUX_DIR="/tmp/flux"
PROJECT_FLUX_DATA="/Users/poom-work/tokenine/eggo-pocketbase/.flux/data.sqlite"

echo "🚀 Starting Flux Web UI..."
echo ""

# Check if Flux repo exists
if [ ! -d "$FLUX_DIR" ]; then
  echo "❌ Flux not found. Installing..."
  cd /tmp
  git clone https://github.com/sirsjg/flux.git --depth=1
  cd flux
  bun install
  bun run build
  cd /Users/poom-work/tokenine/eggo-pocketbase
fi

# Check if SQLite exists
if [ ! -f "$PROJECT_FLUX_DATA" ]; then
  echo "❌ Flux SQLite not found. Run 'flux init --sqlite' in your project first."
  exit 1
fi

echo "📊 Using data: $PROJECT_FLUX_DATA"
echo "🌐 Web UI: http://localhost:3589"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$FLUX_DIR"
export FLUX_DATA="$PROJECT_FLUX_DATA"

# Start with Bun runtime
exec bun run packages/server/dist/index.js
