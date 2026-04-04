# Production Deployment Checklist

**Date:** 2026-04-04
**Deployer:** Solo Dev (GSD Phase 05)
**Version:** v0.0.5
**Network:** 0XL3 Testnet (chainId 7117)
**Status:** Integration testing on testnet; mainnet deployment deferred

## Smart Contracts (Testnet)

**Deployed:** 2026-04-03 to 0XL3 Testnet
**Explorer:** https://exp.0xl3.com

| Contract | Address |
|----------|---------|
| MockUSDT | `0xc015ebb27696b73E72Bef099b72791D7e666E2d0` |
| CommissionDistribution | `0x3c48926556e766E4564af0E264A9980e7C3a1787` |
| AnimalNFT | `0x973F2cA33E96FCC1fdbc48a7880b238b4C6be464` |
| EggNFT | `0xd7135090d78854820722CbCe0B29481Dd5D4808c` |
| FoodNFT | `0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC` |

**Config:**
- CoinStor Reserve: `0x17A670280817999B4073eB6CE2D7B4Eb542d372b`
- Egg Mint Price: 25 USDT
- Food Mint Price: 0.50 USDT

## Pre-Deployment

### Security
- [x] Secrets removed from Docker Compose (WALLET_MASTER_KEY, DACC_MNEMONIC, CORS_ORIGIN use ${} syntax)
- [x] Math.random() replaced with crypto.randomBytes() (Phase 05-01)
- [x] Passwords removed from API responses (Phase 05-01)
- [x] Zod validation added to wallet-api (Phase 05-01)
- [x] Health checks for all services (PocketBase, wallet-api, nginx)

### Backend (PocketBase)
- [ ] Production server SSH access configured (root@204.168.144.14)
- [ ] Docker Compose files updated with health checks
- [ ] Environment variables set on server (.env with real secrets)
- [ ] PocketBase collections created/migrated
- [ ] Hooks deployed (01-create-wallet.pb.js through latest)

### Wallet API
- [ ] Docker image built and deployed
- [ ] WALLET_MASTER_KEY set in production
- [ ] CORS_ORIGIN set to production domain
- [ ] Health check endpoint responding

### Frontend
- [ ] NEXT_PUBLIC_POCKETBASE_URL set to production URL
- [ ] NEXT_PUBLIC_WALLET_API_URL set to production URL
- [ ] Contract addresses updated with testnet addresses
- [ ] Build succeeds locally: `cd apps/web && bun run build`
- [ ] Cloudflare Pages project connected and configured

## Deployment Steps

### 1. PocketBase Backend
```bash
# On production server
ssh -i ~/.ssh/poom-server root@204.168.144.14
cd /path/to/eggo-pocketbase
docker-compose pull
docker-compose up -d
docker-compose logs -f
```
- [ ] PocketBase running (http://localhost:8090/api/health)
- [ ] Wallet API running (http://localhost:3001/health)
- [ ] All hooks loaded without errors

### 2. Frontend
```bash
cd apps/web
bun run build
# Upload /out directory to Cloudflare Pages
```
- [ ] Cloudflare Pages build succeeded
- [ ] Site accessible at production URL
- [ ] SSL certificate valid

## Post-Deployment Verification

### Critical User Flows
- [ ] LINE OAuth login works
- [ ] Wallet auto-created on signup
- [ ] Can view dashboard
- [ ] Can buy egg (25 USDT on testnet)
- [ ] Can buy food (0.50 USDT on testnet)
- [ ] Can feed egg
- [ ] Can hatch egg
- [ ] Can view commissions

### Health Checks
- [ ] PocketBase: https://pb.eggoworld.io/api/health
- [ ] Wallet API: https://wallet.eggoworld.io/health
- [ ] Frontend: production domain

### Monitoring
- [ ] Server logs accessible
- [ ] Error tracking configured
- [ ] Uptime monitoring configured

## Rollback Plan

If deployment fails:
1. Revert Docker Compose to previous version
2. Re-deploy frontend from previous commit
3. For contract issues: contracts are on testnet — no financial risk

**Rollback tested:** [ ] Yes [ ] No

## Future: BSC Mainnet Deployment

When ready for mainnet:
1. Deploy contracts to BSC mainnet (chainId 56)
2. Update deployment-addresses.json
3. Update frontend contract addresses
4. Run full integration test suite on mainnet with small amounts

## Sign-Off

- Deployer: _________________
- Date: _________________
- Time: _________________
