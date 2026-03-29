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

# Contracts
contracts-test:
	cd contracts && forge test

contracts-test-verbose:
	cd contracts && forge test -vvv

contracts-coverage:
	cd contracts && forge coverage --report lcov

contracts-snapshot:
	cd contracts && forge snapshot

contracts-build:
	cd contracts && forge build

contracts-build-size:
	cd contracts && forge build --sizes

contracts-deploy-testnet:
	cd contracts && forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast

contracts-deploy-mainnet:
	cd contracts && forge script script/Deploy.s.sol --rpc-url bsc --broadcast

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
	@echo ""
	@echo "Contracts:"
	@echo "  make contracts-test       Run contract tests"
	@echo "  make contracts-test-verbose Run tests with verbose output"
	@echo "  make contracts-coverage   Generate test coverage report"
	@echo "  make contracts-snapshot   Update gas snapshots"
	@echo "  make contracts-build      Build contracts"
	@echo "  make contracts-build-size Show contract sizes"
	@echo "  make contracts-deploy-testnet Deploy to BSC testnet"
	@echo "  make contracts-deploy-mainnet Deploy to BSC mainnet"