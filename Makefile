.PHONY: dev install build clean

# Default PocketBase URL (production)
PB_URL ?= https://pb.eggoworld.io

# Development
dev:
	cd apps/web && bun dev

# Install dependencies
install:
	cd apps/web && bun install

# Build for production
build:
	cd apps/web && bun run build

# Start production server
start:
	cd apps/web && bun run start

# Clean
clean:
	rm -rf apps/web/.next apps/web/node_modules apps/web/bun.lock

# Create local env
env:
	cp apps/web/.env.example apps/web/.env.local

# Run with local PocketBase (if needed)
dev-local:
	cd apps/web && NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090 bun dev

# Backend (only if you need local PocketBase)
backend:
	cd apps/backend && docker compose up -d

backend-stop:
	cd apps/backend && docker compose down

# Help
help:
	@echo "EggoWorld - NFT Membership System"
	@echo ""
	@echo "Usage:"
	@echo "  make dev        Start frontend (connects to pb.eggoworld.io)"
	@echo "  make dev-local  Start frontend with local PocketBase"
	@echo "  make install    Install dependencies"
	@echo "  make build      Build for production"
	@echo "  make start      Start production server"
	@echo "  make backend    Start local PocketBase (docker)"
	@echo "  make backend-stop Stop local PocketBase"
	@echo "  make clean      Clean build artifacts"