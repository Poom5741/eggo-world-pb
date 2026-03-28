# EggoWorld

NFT Membership System with LINE OAuth and EVM Wallet Integration.

## Project Structure

```
eggo-world/
├── apps/
│   ├── backend/          # PocketBase (auth, database, wallet hooks)
│   │   ├── pb_public/    # Simple HTML fallback (LINE OAuth)
│   │   ├── pb_hooks/     # PocketBase hooks (wallet creation)
│   │   └── pb_migrations/# Database migrations
│   └── web/              # Next.js 16 frontend
│       ├── app/          # App Router pages
│       ├── components/   # React components + shadcn/ui
│       └── lib/          # PocketBase client, utilities
├── wallet-api/           # Express.js wallet generation service
├── nginx/                # Nginx reverse proxy config
└── docs/                 # Documentation
```

## Quick Start

### Prerequisites
- Bun

### Development

```bash
# Install dependencies
bun install apps/web

# Start frontend (connects to production PocketBase)
bun run dev

# Or use Makefile
make dev
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | `http://localhost:3000` | Next.js frontend (dev) |
| PocketBase | `https://pb.eggoworld.io` | Backend API (production) |
| PocketBase Admin | `https://pb.eggoworld.io/_/` | Admin dashboard |

### Makefile Commands

```bash
make dev        # Start frontend (connects to pb.eggoworld.io)
make install    # Install dependencies
make build      # Build for production
make start      # Start production server
make dev-local  # Start frontend with local PocketBase
make backend    # Start local PocketBase (docker)
make help       # Show all commands
```

### Environment

Frontend connects to production PocketBase by default:
- `NEXT_PUBLIC_POCKETBASE_URL=https://pb.eggoworld.io`

For local development with local PocketBase:
```bash
make backend    # Start local PocketBase
make dev-local  # Start frontend with localhost:8090
```

## Features

- **LINE OAuth** - Login with LINE account
- **Email Auth** - Traditional email/password authentication
- **Auto Wallet Creation** - EVM wallet generated on signup
- **NFT Membership** - Buy Egg NFT, get Food NFT + membership

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Bun
- **Backend**: PocketBase (Go) - hosted at pb.eggoworld.io
- **Wallet API**: Express.js + ethers
- **Blockchain**: EVM-compatible chains

## Deployment

See `docs/` for deployment guides:
- [LINE OAuth Setup](docs/LINE_OAUTH_FINAL_INSTRUCTIONS.md)
- [Cloudflare Setup](docs/CLOUDFLARE_SETUP.md)
- [Nginx Config](docs/README-NGINX.md)

## License

MIT