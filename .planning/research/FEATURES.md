# Feature Research: E2E Flow Testing for Blockchain/NFT Applications

**Domain:** E2E Testing Patterns for NFT/Blockchain Marketplace
**Researched:** 2026-04-27
**Confidence:** HIGH (based on official docs, industry patterns, existing project context)

## Executive Summary

E2E testing for blockchain/NFT applications requires fundamentally different patterns than traditional web apps. The key challenges are: **transaction timing**, **on-chain state verification**, **test data isolation**, and **OAuth simulation**. This research maps table stakes features (what all blockchain testing must have) and differentiators (patterns that provide competitive advantage in test reliability).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that are non-negotiable for E2E blockchain testing. Missing these = tests are unreliable or incomplete.

| Feature                           | Why Expected                                               | Complexity | Notes                                                                                                                         |
| --------------------------------- | ---------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Transaction Confirmation Wait** | Blockchain txs are async; UI can't proceed until confirmed | HIGH       | Use `tx.wait()` (ethers) or `waitForTransactionReceipt()` (wagmi/viem). Default 1 confirmation for testnet, 2+ for production |
| **On-Chain State Verification**   | Trust comes from blockchain, not just UI                   | HIGH       | Query contract state directly: `ownerOf(tokenId)`, `balanceOf(address)`. Don't rely solely on PocketBase                      |
| **Event Parsing**                 | Mint/transfer outcomes are in events, not return values    | MEDIUM     | Parse Transfer events from receipt logs: `from: 0x000...` = mint, `from/to: real addresses` = transfer                        |
| **Test Account Isolation**        | Each test needs clean wallet state                         | HIGH       | Use Anvil/Hardhat local fork with deterministic accounts, or mock wallet responses                                            |
| **Timeout Handling**              | Blockchain ops can take seconds to minutes                 | MEDIUM     | Use `test.setTimeout(120000)` for blockchain tests in Playwright/Bun                                                          |
| **Gas Estimation Mocking**        | Real gas costs make tests expensive                        | MEDIUM     | Mock gas or use testnet with faucet; BSC testnet provides free gas                                                            |

### Differentiators (Competitive Advantage)

Patterns that set apart reliable blockchain testing. Not required, but valuable.

| Feature                        | Value Proposition                                  | Complexity | Notes                                                                               |
| ------------------------------ | -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| **Forked Mainnet Testing**     | Test against real contract state without cost      | HIGH       | Anvil/Hardhat can fork BSC mainnet at specific block; use actual USDT/NFT contracts |
| **Wallet Mocking (web3-mock)** | Skip real wallet interactions; deterministic tests | HIGH       | DePayFi web3-mock intercepts MetaMask responses; no real tx signing needed          |
| **Event Indexing Simulation**  | Verify indexing layer catches blockchain events    | MEDIUM     | Test that PocketBase hooks correctly process Transfer events                        |
| **Multi-Step Flow Automation** | Test complete journeys (auth→mint→feed→hatch)      | HIGH       | Synpress/Playwright automates MetaMask for real browser tests                       |
| **Referral Chain Mocking**     | Test MLM commission without 4 real users           | MEDIUM     | Mock PocketBase user referral_chain field; verify commission distribution           |

### Anti-Features (Commonly Requested, Often Problematic)

Patterns that seem good but create issues.

| Feature                          | Why Requested              | Why Problematic                                                   | Alternative                                                            |
| -------------------------------- | -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Real Mainnet Testing**         | "Trust only mainnet"       | Expensive gas, unpredictable timing, rate limits                  | Use Anvil fork with `--fork-url <BSC_RPC>`                             |
| **No Mocking, Pure Integration** | "Real tests are better"    | Flaky, slow, requires faucet funding, rate limit triggers         | Hybrid: mock wallet, test contract logic                               |
| **Fixed Timeout Values**         | "Simple wait"              | Blockchain timing varies wildly; 30s may be too short or wasteful | Use `waitForTransactionReceipt({ confirmations: 1 })` with polling     |
| **UI-Only Assertions**           | "If UI shows it, it works" | UI can lag behind blockchain; PocketBase sync delay               | Assert on-chain state AND UI: `expect(onChainOwner).toBe(userAddress)` |
| **Single Test User**             | "One account is enough"    | Can't test marketplace buy/sell, referral chain                   | Multiple test accounts from Anvil's deterministic wallets              |

---

## Feature Dependencies

```
Transaction Confirmation Wait
    └──requires──> On-Chain State Verification
                       └──requires──> Test Account Isolation

Wallet Mocking
    └──enables──> Fast Test Execution
    └──conflicts──> Real MetaMask Integration (Synpress)

Forked Mainnet Testing
    └──requires──> Anvil/Hardhat Local Node
    └──enables──> Real Contract State Testing

Multi-Step Flow Automation (Auth → Mint → Feed → Hatch)
    └──requires──> OAuth Simulation
    └──requires──> Transaction Confirmation Wait
    └──requires──> Test Data Preparation (USDT balance, NFTs)

Referral Chain Testing
    └──requires──> Multi-Account Setup
    └──requires──> Commission Event Verification
```

### Dependency Notes

- **Transaction Wait requires On-Chain Verification**: Waiting confirms tx mined; verification confirms correct state change
- **Wallet Mocking conflicts with Synpress**: Choose deterministic mock OR real MetaMask automation; both approaches work
- **Multi-Step Flow requires Test Data**: Can't test hatch without pre-existing egg with 10 food; can't test marketplace without pre-listed NFTs
- **Referral Chain requires Multi-Account**: 4-level MLM needs 4 test accounts (G1→G4); setup in beforeEach hooks

---

## Flow-Specific Testing Patterns

### Auth Flow (LINE OAuth → Dashboard)

| Step                       | Expected Behavior                           | Verification                  |
| -------------------------- | ------------------------------------------- | ----------------------------- |
| 1. Click "Login with LINE" | Redirect to LINE auth page                  | URL contains `access.line.me` |
| 2. Authorize in LINE       | Redirect to callback                        | URL contains `/auth/callback` |
| 3. Callback processing     | Create PocketBase user, wallet auto-created | `pb.authStore.valid === true` |
| 4. Dashboard load          | Show user balance, referral chain           | UI displays non-zero elements |

**Testing Approach:**

- **Mock OAuth**: Use Cypress `cy.origin()` pattern for multi-domain testing (Auth0 pattern applies to LINE)
- **Session Injection**: For most tests, inject authenticated session directly via `pb.authStore.save(token, model)`
- **Wallet Auto-Creation**: Verify `user.wallet_address` exists in PocketBase after auth

```typescript
// Pattern: Inject auth session for faster tests
Cypress.Commands.add("loginToApp", () => {
  cy.request("POST", "/api/auth/line-test", {
    test_user_id: "TEST_USER_001",
  }).then((response) => {
    window.localStorage.setItem("pocketbase_auth", JSON.stringify(response.body))
  })
})
```

### Mint Flow (Buy Egg → NFT appears in /eggs)

| Step                     | Expected Behavior                             | Verification                                             |
| ------------------------ | --------------------------------------------- | -------------------------------------------------------- |
| 1. User clicks "Buy Egg" | Dialog opens, shows 25 USDT price             | UI renders price correctly                               |
| 2. USDT approval         | If insufficient allowance, prompt approval tx | `allowance < 25 USDT` triggers approve flow              |
| 3. Approval transaction  | tx.hash returned, wait for confirmation       | `await approvalTx.wait(1)`                               |
| 4. Mint transaction      | `mintEggNFT()` called, tx.hash returned       | Capture tx hash from contract call                       |
| 5. Transaction confirmed | Egg NFT minted + 2 Food NFTs bonus            | Parse `EggMinted` event from receipt                     |
| 6. UI update             | Egg appears in /eggs page                     | Poll PocketBase `eggs` collection OR wait for UI element |

**Critical Timing Pattern:**

```typescript
// Pattern: Wait for transaction + verify on-chain
const mintTx = await contract.mintEggNFT(userAddress, referrerAddress)
const receipt = await mintTx.wait(1) // 1 confirmation

// Parse events
const eggMintedEvent = receipt.logs.find((log) => log.fragment?.name === "EggMinted")
const eggId = eggMintedEvent.args.egg_id

// Verify on-chain
const eggOwner = await contract.ownerOf(eggId)
expect(eggOwner).toBe(userAddress)

// Verify UI (with retry)
await page.waitForSelector(`[data-testid="egg-card-${eggId}"]`, { timeout: 30000 })
```

### Feed Flow (Buy Food → Feed Egg → Progress)

| Step                    | Expected Behavior                         | Verification                          |
| ----------------------- | ----------------------------------------- | ------------------------------------- |
| 1. Buy Food NFT         | `mintFoodNFT(quantity)` called            | Verify food_count in user inventory   |
| 2. Select Egg + Food    | UI shows eligible eggs and available food | UI renders correct lists              |
| 3. Feed transaction     | `feedEgg(eggId, foodIds[])` called        | tx.wait() for confirmation            |
| 4. Food burned          | Food NFTs marked as consumed              | `food.is_consumed === true`           |
| 5. Egg progress updated | `egg.food_count += len(foodIds)`          | Query contract: `getFoodCount(eggId)` |

**Key Test Pattern:**

```typescript
// Pattern: Verify food consumption (burn)
const beforeFoodCount = await contract.getFoodCount(eggId)
const feedTx = await contract.feedEgg(eggId, [foodId1, foodId2])
await feedTx.wait(1)
const afterFoodCount = await contract.getFoodCount(eggId)
expect(afterFoodCount).toBe(beforeFoodCount + 2)

// Verify food burned
const foodOwner = await foodContract.ownerOf(foodId1)
expect(foodOwner).toBe("0x000...") // Burned = transferred to null address
```

### Hatch Flow (Feed 10 → Hatch → Animal NFT minted)

| Step                     | Expected Behavior                    | Verification                                |
| ------------------------ | ------------------------------------ | ------------------------------------------- |
| 1. Check eligibility     | `egg.food_count >= 10`               | Contract query OR UI shows "Ready to Hatch" |
| 2. Click Hatch           | `hatchEgg(eggId)` called             | tx.hash returned                            |
| 3. Transaction confirmed | Animal NFT minted with random rarity | Parse `EggHatched` event                    |
| 4. Egg marked hatched    | `egg.is_hatched === true`            | Contract query                              |
| 5. Animal appears        | New Animal NFT in user inventory     | UI shows animal card                        |

**Rarity Verification Pattern:**

```typescript
// Pattern: Parse hatch event for rarity
const hatchTx = await contract.hatchEgg(eggId)
const receipt = await hatchTx.wait(1)

const hatchEvent = receipt.logs.find((log) => log.fragment?.name === "EggHatched")
const { egg_id, animal_id, rarity, species } = hatchEvent.args

// Verify egg marked as hatched
const eggProps = await contract.getEggProperties(eggId)
expect(eggProps.is_hatched).toBe(true)

// Verify animal ownership
const animalOwner = await animalContract.ownerOf(animal_id)
expect(animalOwner).toBe(userAddress)

// Verify rarity in valid range
expect(rarity).toBeWithin(0, 3) // Common=0 to Legendary=3
```

### Marketplace Flow (List → Buy → Transfer)

| Step                     | Expected Behavior                        | Verification                        |
| ------------------------ | ---------------------------------------- | ----------------------------------- |
| 1. Approve NFT           | `setApprovalForAll(marketplace, true)`   | tx.wait() for confirmation          |
| 2. Create listing        | `createListing(tokenId, nftType, price)` | Parse `ListingCreated` event        |
| 3. Listing appears       | NFT shows in marketplace with price      | UI query OR PocketBase query        |
| 4. Buyer purchases       | `buyNFT(listingId)` by different user    | Must have USDT approved             |
| 5. Ownership transferred | NFT now owned by buyer                   | `ownerOf(tokenId) === buyerAddress` |
| 6. Seller receives USDT  | Balance updated (minus fees)             | Verify seller USDT balance change   |

**Multi-Account Pattern:**

```typescript
// Pattern: Two accounts for marketplace
const sellerSigner = await provider.getSigner(0) // Anvil account 0
const buyerSigner = await provider.getSigner(1)  // Anvil account 1

// Seller lists
const listingTx = await marketplace.connect(sellerSigner).createListing(...)
await listingTx.wait(1)
const listingId = parseListingCreatedEvent(listingTx.receipt)

// Buyer purchases (with USDT approval first)
await usdt.connect(buyerSigner).approve(marketplaceAddress, price)
const buyTx = await marketplace.connect(buyerSigner).buyNFT(listingId)
await buyTx.wait(1)

// Verify ownership transfer
const newOwner = await nftContract.ownerOf(tokenId)
const buyerAddress = await buyerSigner.getAddress()
expect(newOwner).toBe(buyerAddress)
```

### Commission Flow (Referral → Earn → Claim)

| Step                      | Expected Behavior          | Verification                        |
| ------------------------- | -------------------------- | ----------------------------------- |
| 1. User registers         | With referrer G1 address   | `user.referral_chain[0] = G1`       |
| 2. User buys Egg          | Commission triggers        | `distributeEggCommission` called    |
| 3. G1 receives 20%        | USDT credited to G1 wallet | Verify G1 USDT balance increase     |
| 4. G2-G4 receive 10% each | Commission cascades up     | Verify G2, G3, G4 balances          |
| 5. User claims            | Withdraw commission        | USDT transferred to external wallet |

**Commission Verification Pattern:**

```typescript
// Pattern: Verify commission distribution
const g1BeforeBalance = await usdt.balanceOf(g1Address)
const g2BeforeBalance = await usdt.balanceOf(g2Address)

// Trigger purchase
const mintTx = await eggContract.connect(userSigner).mintEggNFT(userAddress, g1Address)
await mintTx.wait(1)

// Verify commission (25 USDT * 20% = 5 USDT to G1)
const g1AfterBalance = await usdt.balanceOf(g1Address)
const expectedG1Commission = parseUnits("5", 18) // 20% of 25 USDT
expect(g1AfterBalance - g1BeforeBalance).toBe(expectedG1Commission)

// G2 receives 10% = 2.5 USDT
const g2AfterBalance = await usdt.balanceOf(g2Address)
const expectedG2Commission = parseUnits("2.5", 18)
expect(g2AfterBalance - g2BeforeBalance).toBe(expectedG2Commission)
```

### Tier Flow (Consume Food → Threshold → Badge)

| Step                           | Expected Behavior                     | Verification                              |
| ------------------------------ | ------------------------------------- | ----------------------------------------- |
| 1. Track lifetime food         | `user.lifetime_food_items` increments | PocketBase record update                  |
| 2. Hit threshold (10/100/1000) | Tier upgrade triggered                | Check threshold in contract OR PocketBase |
| 3. Badge minted                | TierBadge NFT (soulbound ERC-5192)    | Verify badge ownership, locked=true       |
| 4. USDT reward claimed         | Tier reward credited                  | Verify USDT balance                       |

---

## MVP Definition for E2E Testing Framework

### Phase 1: Core Infrastructure (Must Have)

- [ ] **Transaction Wait Helper** — `waitForTransaction(tx, confirmations=1)` utility
- [ ] **On-Chain Verification Helper** — `verifyNFTOwnership(contract, tokenId, expectedOwner)`
- [ ] **Event Parser Helper** — `parseEvent(receipt, eventName)` utility
- [ ] **Test Account Setup** — 5 deterministic Anvil accounts for multi-user tests
- [ ] **Timeout Configuration** — `test.setTimeout(120000)` for blockchain tests

### Phase 2: Flow Coverage (Should Have)

- [ ] **Auth Flow Test** — Mock LINE OAuth, verify wallet auto-creation
- [ ] **Mint Flow Test** — Buy Egg, verify NFT + Food bonus
- [ ] **Feed Flow Test** — Feed egg, verify food burn + progress
- [ ] **Hatch Flow Test** — Hatch ready egg, verify Animal NFT + rarity
- [ ] **Marketplace Flow Test** — List, buy (different users), verify transfer

### Phase 3: Advanced Patterns (Nice to Have)

- [ ] **Commission Flow Test** — 4-level referral chain verification
- [ ] **Tier Badge Test** — Threshold trigger, soulbound badge mint
- [ ] **Forked Mainnet Mode** — Test against real BSC contracts
- [ ] **Gas Optimization Verification** — Track gas costs across flows

---

## Feature Prioritization Matrix

| Feature                          | User Value (Test Reliability) | Implementation Cost   | Priority |
| -------------------------------- | ----------------------------- | --------------------- | -------- |
| Transaction Wait Helper          | HIGH                          | LOW (ethers built-in) | P1       |
| On-Chain Verification Helper     | HIGH                          | LOW                   | P1       |
| Event Parser Helper              | HIGH                          | MEDIUM                | P1       |
| Test Account Setup (Anvil)       | HIGH                          | MEDIUM                | P1       |
| Auth Flow Mock                   | HIGH                          | MEDIUM                | P1       |
| Mint Flow Test                   | HIGH                          | MEDIUM                | P1       |
| Feed Flow Test                   | HIGH                          | MEDIUM                | P1       |
| Hatch Flow Test                  | HIGH                          | MEDIUM                | P1       |
| Marketplace Flow (Multi-Account) | HIGH                          | HIGH                  | P2       |
| Commission Verification          | MEDIUM                        | HIGH                  | P2       |
| Forked Mainnet Mode              | MEDIUM                        | HIGH                  | P3       |
| Tier Badge Test                  | MEDIUM                        | MEDIUM                | P3       |

---

## Transaction Timing Patterns

### Timing Constants for BSC Testnet

| Operation            | Expected Duration | Timeout Setting |
| -------------------- | ----------------- | --------------- |
| USDT Approval        | 3-10 seconds      | 30 seconds      |
| NFT Mint (Egg)       | 5-15 seconds      | 45 seconds      |
| NFT Transfer         | 3-10 seconds      | 30 seconds      |
| Marketplace Purchase | 5-15 seconds      | 45 seconds      |
| Hatch (includes VRF) | 10-30 seconds     | 60 seconds      |
| Breed                | 5-15 seconds      | 45 seconds      |

### Wait Pattern (ethers.js)

```typescript
// Pattern: Wait with confirmation count
export async function waitForTransaction(
  tx: ContractTransactionResponse,
  confirmations: number = 1
): Promise<TransactionReceipt> {
  const receipt = await tx.wait(confirmations)
  if (receipt?.status !== 1) {
    throw new Error(`Transaction failed: ${tx.hash}`)
  }
  return receipt
}
```

### Poll Pattern (UI sync after blockchain)

```typescript
// Pattern: Poll PocketBase until synced
export async function pollUntilSynced(
  collection: string,
  recordId: string,
  predicate: (record: Record) => boolean,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<Record> {
  for (let i = 0; i < maxAttempts; i++) {
    const record = await pb.collection(collection).getOne(recordId)
    if (predicate(record)) return record
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`Sync timeout: ${collection}/${recordId}`)
}
```

---

## Test Data Requirements

### Required Test Data per Flow

| Flow        | Required Data                 | Setup Method                                 |
| ----------- | ----------------------------- | -------------------------------------------- |
| Auth        | Test LINE user                | Create in PocketBase with mock LINE ID       |
| Mint        | 25+ USDT in wallet            | Anvil: setBalance, or faucet on testnet      |
| Feed        | Egg NFT + Food NFTs           | Mint Egg (gets 2 food), mint additional food |
| Hatch       | Egg with food_count=10        | Feed egg 10 times in beforeEach              |
| Marketplace | Listed NFT + buyer USDT       | Create listing, fund buyer account           |
| Commission  | 4-user referral chain         | Create G1→G4 users, link referral_chain      |
| Tier        | User with lifetime_food_items | Accumulate food consumption records          |

### Anvil Account Setup

```typescript
// Pattern: Deterministic test accounts
const ANVIL_ACCOUNTS = [
  { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", privateKey: "0xac0974..." }, // Account 0: Admin
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", privateKey: "0x59c6..." }, // Account 1: User A
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA429", privateKey: "0x5de4..." }, // Account 2: User B (G1)
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", privateKey: "0x7c85..." }, // Account 3: User C (G2)
  { address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C", privateKey: "0x68e9..." }, // Account 4: User D (G3)
]
```

---

## Sources

- **Wagmi waitForTransactionReceipt**: https://wagmi.sh/core/api/actions/waitForTransactionReceipt — HIGH confidence
- **Viem Documentation**: https://viem.sh/ — HIGH confidence
- **Ethers.js Transaction Handling**: https://docs.ethers.org/v6/ — HIGH confidence
- **Blockscout NFT Verification Guide**: https://www.blog.blockscout.com/minted-nft-not-showing-how-to-verify-onchain/ — HIGH confidence
- **Synpress GitHub**: https://github.com/synpress-io/synpress — HIGH confidence
- **DePayFi web3-mock**: https://github.com/DePayFi/web3-mock — HIGH confidence
- **Auth0 Testing Patterns**: https://auth0.com/blog/testing-auth0-login-with-cypress/ — HIGH confidence (applies to LINE OAuth)
- **Playwright Timeouts**: https://playwright.dev/docs/test-timeouts — HIGH confidence
- **7BlockLabs Testing Frameworks**: https://www.7blocklabs.com/blog/blockchain-testing-frameworks-compared-hardhat-foundry-and-more — MEDIUM confidence
- **Thinksys Blockchain Testing Guide**: https://thinksys.com/blockchain/blockchain-testing/ — MEDIUM confidence
- **Existing Project Contract Files**: apps/web/lib/contracts/\*.ts — HIGH confidence (verified patterns in use)

---

## Confidence Assessment

| Area                    | Confidence | Reason                                                         |
| ----------------------- | ---------- | -------------------------------------------------------------- |
| Transaction Timing      | HIGH       | Official ethers/wagmi docs, patterns verified in existing code |
| On-Chain Verification   | HIGH       | Blockscout guide, standard ERC-721 patterns                    |
| Event Parsing           | HIGH       | Existing code in eggNft.ts already parses EggHatched events    |
| OAuth Testing           | MEDIUM     | Auth0 pattern applies, LINE-specific nuances need validation   |
| Multi-Account Setup     | HIGH       | Anvil deterministic accounts are standard practice             |
| Commission Verification | MEDIUM     | MLM-specific; need to verify contract implementation details   |
| Forked Mainnet          | HIGH       | Anvil/Hardhat fork is standard blockchain testing pattern      |

---

_Feature research for: E2E Flow Testing in NFT/Blockchain Applications_
_Researched: 2026-04-27_
_Context: Egg × Food × Animal NFT Marketplace on BSC_
