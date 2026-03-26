# EggoWorld

NFT Membership System with LINE OAuth and EVM Wallet Integration.

## Project Structure

```
eggo-world/
├── apps/
│   ├── backend/     # PocketBase (auth, database, wallet hooks)
│   └── frontend/    # React + Bun (UI, LINE OAuth)
├── nginx/           # Nginx reverse proxy config
├── wallet-api/      # Express.js wallet generation service
├── docs/            # Documentation
└── package.json     # Monorepo workspace config
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Bun (for frontend)

### Development

```bash
# Start backend (PocketBase + Wallet API)
cd apps/backend && docker compose up -d

# Start frontend
bun install
bun run dev:frontend
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React + Bun dev server |
| PocketBase | 8090 | Backend API |
| Wallet API | 3001 | Wallet generation |

## Features

- **LINE OAuth** - Login with LINE account
- **Auto Wallet Creation** - EVM wallet generated on OAuth signup
- **NFT Membership** - Buy Egg NFT, get Food NFT + membership

## Tech Stack

- **Frontend**: React 19, Bun, TypeScript
- **Backend**: PocketBase, Express.js
- **Blockchain**: EVM-compatible chains

## Deployment

See `docs/` for deployment guides:
- [LINE OAuth Setup](docs/LINE_OAUTH_FINAL_INSTRUCTIONS.md)
- [Cloudflare Setup](docs/CLOUDFLARE_SETUP.md)
- [Nginx Config](docs/README-NGINX.md)

## License

MIT