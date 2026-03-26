# LINE OAuth Development Frontend

## Architecture (Option A - Reference Pattern)

This follows the same pattern as mvp-foodcourt reference implementation:
- **Frontend (Bun)**: Port 3000 - Serves UI + handles OAuth callback
- **PocketBase (Docker)**: Port 8090 - API only (auth, database)

## Running Services

```bash
# Terminal 1: Start PocketBase
cd eggo-pb && docker-compose up -d

# Terminal 2: Start Frontend
cd frontend && bun --hot ./index.ts
```

## Test Flow

1. **Open frontend**: http://localhost:3000/frontend/
2. **Click "Login with LINE"** → Redirects to LINE OAuth
3. **Authenticate with LINE** → LINE redirects to callback
4. **Callback handled**: http://localhost:3000/frontend/callback.html
5. **Success** → Auth stored in localStorage

## Configuration

### LINE Developers Console

Register this callback URL:
```
http://localhost:3000/frontend/callback.html
```

### PocketBase OIDC Config

```yaml
OIDC_CLIENT_ID: "2009441873"
OIDC_CLIENT_SECRET: "4ede94afa7d59b71ffda15a136ffddea"
OIDC_ISSUER_URL: "https://access.line.me"
OIDC_REDIRECT_URI: "http://localhost:3000/frontend/callback.html"
```

## Running Tests

```bash
# Unit tests
bunx vitest run

# With coverage
bunx vitest run --coverage

# E2E tests (Cypress)
bunx cypress open
```

## Tech Stack

- React 19
- Bun (runtime + dev server)
- Vitest (unit tests)
- Cypress (E2E tests)
- PocketBase SDK

## Troubleshooting

### OAuth returns to 8090 instead of 3000

Check that `frontend/components/auth-flow.tsx` has:
```typescript
const REDIRECT_URL = 'http://localhost:3000/frontend/callback.html'
```

### Callback 404 error

Make sure Bun server is running on port 3000:
```bash
lsof -ti:3000
```

### LINE OAuth fails with 400

Verify callback URL in LINE Developers Console matches exactly:
`http://localhost:3000/frontend/callback.html`

