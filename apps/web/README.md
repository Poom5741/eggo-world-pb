# EggoWorld Web

Next.js 16 frontend for EggoWorld NFT Membership System.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix)
- **Auth**: PocketBase (LINE OAuth + Email)
- **CAPTCHA**: Cloudflare Turnstile

## Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_POCKETBASE_URL` - PocketBase server URL

## Project Structure

```
app/
├── auth/
│   ├── login/         # Email login
│   ├── sign-up/       # Email registration
│   ├── line/          # LINE OAuth login
│   ├── callback/      # OAuth callback
│   └── error/         # Error page
├── api/               # API routes
├── layout.tsx         # Root layout
└── page.tsx           # Landing + Dashboard
components/
├── ui/                # shadcn/ui components
├── dashboard.tsx      # User dashboard
├── header.tsx         # Navigation header
└── wallet-modal.tsx   # Wallet management
lib/
├── pocketbase/        # PocketBase client
└── utils.ts           # Utility functions
```

## Features

- LINE OAuth authentication
- Email/password authentication
- EVM wallet management
- NFT membership dashboard
- Pixel-style design