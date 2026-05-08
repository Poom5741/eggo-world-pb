# Gas Sponsorship Operator Runbook

> **Scope:** Operator documentation for the gas sponsorship system implemented in Phase 19.  
> **Audience:** DevOps, platform operators, and on-call engineers.  
> **Last Updated:** 2026-04-22

---

## 1. Overview

The **gas sponsorship system** allows users to mint, buy, and feed NFTs on the blockchain **without holding BNB** (or the chain's native gas token). Instead of requiring every user to acquire and manage a native token balance, the platform operates a **relayer wallet** that pays all on-chain gas fees on behalf of users.

### Why It Exists

- **User Experience:** New users can interact with NFTs immediately after receiving USDT — no need to source BNB from an exchange or faucet.
- **MVP Simplicity:** For the current MVP, meta-transaction infrastructure (EIP-2771 or similar) is out of scope. The relayer wallet directly signs and broadcasts transactions for sponsored operations.
- **Cost Tracking:** Every sponsored transaction is logged with user ID, gas cost in BNB, and transaction hash for accounting and monitoring.

### MVP Decision (D-05 from Phase 19)

- **Mint Egg:** User wallet pays gas (logged for tracking via `logGasSponsorship`).
- **Buy NFT:** Relayer wallet pays gas (full sponsorship).
- **Feed Egg:** Relayer wallet pays gas (full sponsorship).

> **Future:** Full meta-transaction gas sponsorship (e.g., ERC-2771 trusted forwarder) is planned post-MVP to decentralize the relayer role.

---

## 2. Architecture

### Flow Diagram

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────────────┐     ┌───────────┐
│   User      │────▶│ Frontend │────▶│  PocketBase │────▶│   Wallet API    │────▶│ Blockchain│
│ (USDT only) │     │  (Next)  │     │  (Backend)  │     │  (Node/Bun)     │     │  (0xl3)   │
└─────────────┘     └──────────┘     └─────────────┘     └─────────────────┘     └───────────┘
                                                                │
                                                                ▼
                                                        ┌───────────────┐
                                                        │ Relayer Wallet│
                                                        │   (BNB)       │
                                                        └───────────────┘
```

### Operations That Consume Relayer Gas

| Operation    | Endpoint                    | Relayer Pays? | Description                                              |
| ------------ | --------------------------- | ------------- | -------------------------------------------------------- |
| **Buy NFT**  | `POST /api/wallet/buy-nft`  | ✅ Yes        | On-chain marketplace purchase via `buyNFT` contract call |
| **Feed Egg** | `POST /api/wallet/feed-egg` | ✅ Yes        | On-chain `feedEgg` contract call                         |
| **Mint Egg** | `POST /api/wallet/mint-egg` | ❌ No\*       | User wallet pays gas; logged for tracking only           |

> \*Mint gas is paid by the user wallet per MVP decision D-05. The `logGasSponsorship` call exists for cost tracking and future migration to full sponsorship.

### Key Components

- **`wallet-api/server.js`** — Core service that initializes the relayer wallet, estimates gas, and broadcasts sponsored transactions.
- **`logGasSponsorship()`** — Helper function that formats and emits structured console logs for every sponsored transaction.
- **Environment variables** — `RELAYER_PRIVATE_KEY`, `RPC_URL`, `GAS_BUFFER_PERCENT`, `CONFIRMATIONS`.

---

## 3. Environment Configuration

The following environment variables must be configured in the wallet-api runtime environment (`.env` file or container orchestration secrets):

| Variable              | Required | Description                                          | Default                | Example                |
| --------------------- | -------- | ---------------------------------------------------- | ---------------------- | ---------------------- |
| `RELAYER_PRIVATE_KEY` | **Yes**  | Private key of the relayer wallet (hex, 0x-prefixed) | —                      | `0xabc123...`          |
| `RPC_URL`             | **Yes**  | Blockchain RPC endpoint                              | `https://rpc.0xl3.com` | `https://rpc.0xl3.com` |
| `GAS_BUFFER_PERCENT`  | No       | Percentage buffer added to estimated gas             | `20`                   | `20`                   |
| `CONFIRMATIONS`       | No       | Number of block confirmations to wait                | `12`                   | `12`                   |

### Configuration Notes

- **`RELAYER_PRIVATE_KEY`**: Must be kept secret. Store in Docker secrets, Vault, or encrypted env — never commit to git.
- **`RPC_URL`**: For development, use `https://rpc.0xl3.com` (0xl3 testnet, Chain ID 7117). For production, use a dedicated BSC mainnet RPC (e.g., QuickNode, Alchemy, or self-hosted).
- **`GAS_BUFFER_PERCENT = 20`**: Adds a 20% safety margin to the gas estimate to prevent out-of-gas failures, especially for variable-cost operations like `feedEgg`.
- **`CONFIRMATIONS = 12`**: Standard for BSC. On 0xl3 testnet, block time is ~3s, so 12 confirmations ≈ 36 seconds.

---

## 4. Relayer Wallet Funding

The relayer wallet must maintain a sufficient BNB balance at all times. If the balance drops to zero, all sponsored transactions will fail with "insufficient funds for gas".

### Steps to Check and Fund

1. **Identify Relayer Address**
   - Check wallet-api startup logs for:
     ```
     Relayer wallet initialized: 0x...
     ```
   - Or derive the address from the private key using any BSC wallet tool.

2. **Check BNB Balance**
   - **Via BSCScan:** Search the relayer address on [https://bscscan.com](https://bscscan.com) (mainnet) or [https://testnet.bscscan.com](https://testnet.bscscan.com) (testnet).
   - **Via RPC call:**
     ```bash
     curl -X POST https://rpc.0xl3.com \
       -H "Content-Type: application/json" \
       -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x<RELAYER_ADDRESS>","latest"],"id":1}'
     ```

3. **Fund the Wallet**
   - **Testnet (0xl3):** Request BNB from the team faucet or internal treasury.
   - **BSC Mainnet:** Transfer BNB from a centralized exchange (Binance, etc.) or the platform treasury wallet.

4. **Verify Funding**
   - Re-check balance after transfer confirmation.
   - Test with a small sponsored transaction (e.g., feed an egg) and confirm the `[Gas Sponsorship]` log appears.

### Minimum Balance Recommendations

| Environment | Minimum Balance | Rationale                                    |
| ----------- | --------------- | -------------------------------------------- |
| Development | 0.1 BNB         | Low traffic, occasional testing              |
| Staging     | 0.5 BNB         | Moderate UAT traffic                         |
| Production  | 1.0 BNB         | High traffic; monitor and refill proactively |

> **Alert Thresholds:** See Section 5 for automated alerting recommendations.

---

## 5. Monitoring

### 5.1 Startup Check

When wallet-api starts, verify the relayer initializes correctly:

```
Relayer wallet initialized: 0x<address>
```

If you see instead:

```
WARNING: RELAYER_PRIVATE_KEY not set. Gas sponsorship disabled.
Users will need their own BNB for gas fees.
```

→ Immediate action: set `RELAYER_PRIVATE_KEY` and restart the service.

### 5.2 Log Parsing

All sponsored transactions emit a structured log via `logGasSponsorship()`:

```
[Gas Sponsorship] {operation} - User: {userId}, Gas: {cost} BNB, TxHash: {txHash}
```

**Example log entries:**

```
[Gas Sponsorship] Mint Egg - User: user123, Gas: 0.002345 BNB, TxHash: 0xabc...
[Gas Sponsorship] Buy NFT - User: user456, Gas: 0.003123 BNB, TxHash: 0xdef...
[Gas Sponsorship] Feed Egg - User: user789, Gas: 0.002876 BNB, TxHash: 0xghi...
```

**View recent gas sponsorship logs:**

```bash
# If wallet-api logs to stdout / Docker
docker-compose logs -f wallet-api | grep "\[Gas Sponsorship\]"

# If logs are written to file
tail -f /var/log/wallet-api/server.log | grep "\[Gas Sponsorship\]"
```

**Extract daily gas costs for accounting:**

```bash
grep "\[Gas Sponsorship\]" /var/log/wallet-api/server.log | \
  awk -F'Gas: ' '{print $2}' | awk '{print $1}' | \
  awk '{s+=$1} END {print "Total BNB spent today:", s}'
```

### 5.3 Balance Monitoring

Check relayer BNB balance daily on production. Automate with a cron job or monitoring script:

```bash
#!/bin/bash
BALANCE=$(curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$RELAYER_ADDRESS\",\"latest\"],\"id\":1}" \
  | jq -r '.result' | xargs printf "%d\n" | awk '{print $1/1e18}')

echo "Relayer balance: $BALANCE BNB"
```

### 5.4 Alert Thresholds

| Severity     | Condition                         | Action                                                            |
| ------------ | --------------------------------- | ----------------------------------------------------------------- |
| **INFO**     | Single transaction gas > 0.01 BNB | Investigate unexpected spike (possible contract issue or gas war) |
| **WARNING**  | Relayer balance < 0.05 BNB        | Plan refill within 24 hours; notify treasury                      |
| **CRITICAL** | Relayer balance < 0.01 BNB        | **Immediate refill required** — transactions will start failing   |

---

## 6. Gas Limits and Estimation

### Estimation Pattern

The wallet-api uses the following pattern for every on-chain transaction:

```javascript
// 1. Get gas estimate from contract
const gasEstimate = await contract.functionName.estimateGas(...args)

// 2. Apply buffer (default 20%)
const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

// 3. Execute with buffered limit
const tx = await contract.functionName(...args, { gasLimit })
```

With the default `GAS_BUFFER_PERCENT = 20`, this adds a **20% safety margin** above the ethers.js estimate.

### Typical Gas Costs

These are observed averages on 0xl3 testnet; mainnet costs may vary with network congestion:

| Operation | Typical Gas Cost | Notes                                  |
| --------- | ---------------- | -------------------------------------- |
| Feed Egg  | ~0.002–0.004 BNB | Variable based on food array length    |
| Buy NFT   | ~0.003–0.005 BNB | Includes marketplace contract overhead |
| Mint Egg  | ~0.002–0.003 BNB | User-paid in MVP; logged for tracking  |

### Tuning the Buffer

- If transactions fail with "out of gas" despite the buffer, increase `GAS_BUFFER_PERCENT` to `30` or `50` temporarily.
- If gas costs are consistently higher than expected, audit the contract for inefficiencies (e.g., redundant storage writes).

---

## 7. Key Rotation Procedure

If the relayer private key is suspected to be compromised, or as part of a quarterly security rotation, follow this procedure:

1. **Generate New Wallet**

   ```javascript
   const newWallet = ethers.Wallet.createRandom()
   console.log("Address:", newWallet.address)
   console.log("Private Key:", newWallet.privateKey)
   ```

2. **Fund New Wallet**
   - Transfer sufficient BNB to the new address (see Section 4).
   - Wait for 12 confirmations.

3. **Update Environment**
   - Replace `RELAYER_PRIVATE_KEY` in the `.env` file or secret store with the new private key.

4. **Restart wallet-api Service**

   ```bash
   # Docker Compose
   docker-compose restart wallet-api

   # Or via SSH (see Section 10)
   ssh -i ~/.ssh/id_ed25519-dokcer -o IdentitiesOnly=yes root@204.168.144.14 \
     "cd /root/eggo-world-pb && docker-compose restart wallet-api"
   ```

5. **Verify New Address**
   - Check startup logs for:
     ```
     Relayer wallet initialized: <new_address>
     ```

6. **Update Monitoring**
   - Update any dashboards, alerting rules, or scripts that reference the old relayer address.

7. **Drain Old Wallet (Optional)**
   - Transfer remaining BNB from the old wallet to the new wallet or treasury.

8. **Securely Destroy Old Key**
   - Overwrite the old private key in memory and any backups.
   - Remove from password managers or secret stores.

> **Downtime:** This procedure causes ~5–10 seconds of downtime (Docker restart). Coordinate with the team if production traffic is high.

---

## 8. Troubleshooting

| Symptom                                                           | Likely Cause                                 | Solution                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `WARNING: RELAYER_PRIVATE_KEY not set. Gas sponsorship disabled.` | Environment variable missing                 | Set `RELAYER_PRIVATE_KEY` in `.env` and restart wallet-api                                                           |
| `insufficient funds for gas`                                      | Relayer BNB balance too low                  | Fund relayer wallet immediately (see Section 4)                                                                      |
| Gas estimation fails with `CALL_EXCEPTION`                        | Contract not deployed or wrong address       | Verify `CONTRACT_ADDRESSES` in `wallet-api/server.js` match deployed contracts                                       |
| Transaction hangs indefinitely                                    | RPC_URL unreachable or network down          | Check RPC connectivity: `curl -X POST $RPC_URL -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'` |
| `[Gas Sponsorship] ...` log missing                               | `logGasSponsorship` not called for this path | Check endpoint code; ensure `receipt` is available after `tx.wait(CONFIRMATIONS)`                                    |
| `Relayer wallet not configured` (HTTP 500)                        | `relayerWallet` is `null`                    | Verify `RELAYER_PRIVATE_KEY` is valid and wallet initialized without error                                           |

### Debug Commands

```bash
# Check wallet-api health
curl http://localhost:3001/health

# Check relayer balance via RPC
curl -X POST https://rpc.0xl3.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x<RELAYER_ADDRESS>","latest"],"id":1}'

# Follow live logs
docker-compose logs -f wallet-api --tail=50
```

---

## 9. Human Verification Tests (5 tests from GAPS-03)

These tests verify the gas sponsorship system is functioning correctly end-to-end. Execute manually before each production deployment or after any wallet-api infrastructure change.

### Test 1: Relayer Initialization

**Objective:** Verify the relayer wallet starts correctly on service boot.

**Steps:**

1. Ensure `RELAYER_PRIVATE_KEY` is set in the wallet-api environment.
2. Start or restart wallet-api (`docker-compose up -d wallet-api`).
3. Observe startup logs (`docker-compose logs wallet-api`).

**Expected Result:**

- [ ] Log line `Relayer wallet initialized: 0x...` appears within 5 seconds of startup.
- [ ] No `WARNING: RELAYER_PRIVATE_KEY not set` message appears.

---

### Test 2: Gas Sponsorship Log on Buy NFT

**Objective:** Verify the Buy Now flow triggers a gas sponsorship log.

**Steps:**

1. Navigate to the marketplace listing page.
2. Click **Buy Now** on an active listing.
3. Confirm the purchase in the dialog.
4. Wait for the 12-block confirmation (~36 seconds on 0xl3).
5. Check wallet-api logs for the sponsorship entry.

**Expected Result:**

- [ ] A log line matching the following format appears:
  ```
  [Gas Sponsorship] Buy NFT - User: <userId>, Gas: <cost> BNB, TxHash: 0x...
  ```
- [ ] The buyer's wallet did not need BNB — only USDT was required.

---

### Test 3: Gas Sponsorship Log on Feed Egg

**Objective:** Verify the Feed Egg flow triggers a gas sponsorship log.

**Steps:**

1. Navigate to `/eggs` and select an egg that has not hatched (food count < 10).
2. Click **Feed** and select one or more food NFTs.
3. Confirm the feed operation.
4. Wait for confirmation.
5. Check wallet-api logs.

**Expected Result:**

- [ ] A log line matching the following format appears:
  ```
  [Gas Sponsorship] Feed Egg - User: <userId>, Gas: <cost> BNB, TxHash: 0x...
  ```
- [ ] Egg food count increases correctly on-chain and in PocketBase.

---

### Test 4: Buyer Does Not Need BNB

**Objective:** Confirm that a user with zero BNB can still complete a sponsored transaction.

**Steps:**

1. Create a test account (or use an existing one).
2. Ensure the account wallet holds **0 BNB** but at least **25 USDT**.
3. Execute either **Buy Now** or **Feed Egg** flow.
4. Verify transaction succeeds.

**Expected Result:**

- [ ] Transaction succeeds and returns a transaction hash.
- [ ] Buyer's wallet BNB balance remains **0** after the transaction.
- [ ] `[Gas Sponsorship]` log confirms the relayer paid the gas.

---

### Test 5: Relayer Balance Decreases

**Objective:** Confirm that the relayer wallet's BNB balance decreases after sponsoring a transaction.

**Steps:**

1. Record the relayer's BNB balance before the transaction (use BSCScan or RPC).
2. Execute a sponsored transaction (**Buy NFT** or **Feed Egg**).
3. Wait for 12 confirmations.
4. Record the relayer's BNB balance after the transaction.

**Expected Result:**

- [ ] Relayer balance decreased by approximately the gas cost amount.
- [ ] The decrease matches the `Gas: <cost> BNB` value from the `[Gas Sponsorship]` log.
- [ ] Decrease is within ±10% due to fluctuating gas prices.

---

## 10. Deployment Notes

### Production Infrastructure

- **Host:** `root@204.168.144.14`
- **Remote path:** `/root/eggo-world-pb`
- **SSH key (mandatory):** `~/.ssh/id_ed25519-dokcer` (per `resources/pkbase-wallet/AGENTS.md`)

### Required SSH Flags

Every SSH command **must** include:

- `-i ~/.ssh/id_ed25519-dokcer`
- `-o IdentitiesOnly=yes`

**Example restart command:**

```bash
ssh -i ~/.ssh/id_ed25519-dokcer -o IdentitiesOnly=yes root@204.168.144.14 \
  "cd /root/eggo-world-pb && docker-compose restart wallet-api"
```

### Deployment Checklist

- [ ] `.env` file on production contains `RELAYER_PRIVATE_KEY` (not committed to git).
- [ ] `RPC_URL` points to the correct network (mainnet for production, 0xl3 for dev).
- [ ] Relayer wallet is funded with sufficient BNB (≥ 1.0 BNB for production).
- [ ] Post-deploy: verify `Relayer wallet initialized: 0x...` in logs.
- [ ] Post-deploy: run **Test 1** (Relayer Initialization).

---

## 11. Reference

### Internal Documentation

| Document                                                    | Description                                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `wallet-api/server.js`                                      | Implementation source — relayer init, `logGasSponsorship`, gas estimation, buy/feed/mint endpoints |
| `resources/pkbase-wallet/wallet-srv/README-payment-flow.md` | EIP-712 authorization patterns and gasless payment flow (Tokenine Wallet API)                      |
| `resources/pkbase-wallet/SKILL.md`                          | Tokenine Wallet System API reference — supported networks, error handling, JS/TS examples          |
| `resources/pkbase-wallet/AGENTS.md`                         | Deployment rules and SSH restrictions (mandatory `id_ed25519-dokcer` key)                          |
| `tests/e2e/PHASE-19-VERIFICATION.md`                        | Phase 19 verification checklist with gas sponsorship checks (Section 2.3)                          |

### Supported Networks (from SKILL.md)

| Chain ID | Network          | Native Currency | RPC Endpoint                |
| -------- | ---------------- | --------------- | --------------------------- |
| 7442     | Thai Vote        | THV             | `https://chain.th.vote/rpc` |
| 7117     | 0xl3             | ETH             | —                           |
| 56       | BSC              | BNB             | —                           |
| 1        | Ethereum Mainnet | ETH             | —                           |
| 137      | Polygon Mainnet  | MATIC           | —                           |

### Key Code Snippets

**Relayer Initialization:**

```javascript
function initializeRelayerWallet() {
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
  if (!relayerPrivateKey) {
    console.warn("WARNING: RELAYER_PRIVATE_KEY not set. Gas sponsorship disabled.")
    return null
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)
  console.log(`Relayer wallet initialized: ${relayerWallet.address}`)
  return relayerWallet
}
```

**Gas Sponsorship Log Format:**

```javascript
function logGasSponsorship(operation, userId, receipt) {
  const gasCost = receipt.gasUsed * receipt.effectiveGasPrice
  const gasCostBNB = ethers.formatEther(gasCost)
  console.log(
    `[Gas Sponsorship] ${operation} - User: ${userId}, Gas: ${gasCostBNB} BNB, TxHash: ${receipt.transactionHash}`
  )
  return {
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    totalCostWei: gasCost.toString(),
    totalCostBNB: gasCostBNB,
  }
}
```

**Gas Estimation with Buffer:**

```javascript
const gasEstimate = await eggContract.feedEgg.estimateGas(egg_token_id, food_ids)
const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)
```

---

_This runbook is a living document. Update it whenever gas sponsorship logic, contract addresses, or deployment procedures change._
