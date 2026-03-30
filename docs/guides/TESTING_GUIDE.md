# Egg NFT Testing Guide

Complete testing commands and verification steps for Egg NFT smart contracts.

---

## Prerequisites

```bash
# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Navigate to contracts directory
cd contracts
```

---

## 1. Run All Tests

### Quick Test Run
```bash
forge test
```

### Verbose Output
```bash
forge test -vvv
```

### With Gas Report
```bash
forge test --gas-report
```

### Expected Output
```
Ran 22 tests (20 unit + 2 Counter)
✅ 22 passed, 0 failed

Test Summary:
- EggNFT.t.sol: 15 tests passing
- AnvilIntegration.t.sol: 5 tests passing  
- Counter.t.sol: 2 tests passing
```

---

## 2. Run Specific Test Files

### Unit Tests Only
```bash
forge test --match-path test/EggNFT.t.sol -vvv
```

### Integration Tests Only
```bash
forge test --match-path test/AnvilIntegration.t.sol -vvv
```

### Counter Tests
```bash
forge test --match-path test/Counter.t.sol -vvv
```

---

## 3. Run Specific Test Functions

### Test Mint Flow
```bash
forge test --match-test testMintWithUSDT -vvv
```

### Test Commission Distribution
```bash
forge test --match-test testCommissionDistribution -vvv
```

### Test Full Integration
```bash
forge test --match-test testFullMintFlow -vvv
```

### Test Referral Chain
```bash
forge test --match-test testReferralChainRecording -vvv
```

### Test Hatch
```bash
forge test --match-test testHatchEgg -vvv
```

---

## 4. Run Tests on Anvil (Local Blockchain)

### Start Anvil
```bash
# Terminal 1: Start Anvil
anvil --port 8545 --chain-id 31337
```

### Run Integration Tests on Anvil
```bash
# Terminal 2: Run tests
cd contracts
forge test --match-contract AnvilIntegrationTest --rpc-url http://localhost:8545 -vvvv
```

### Expected Output
```
=== Testing Complete Mint Flow on Anvil ===
Buyer balance before: 9986
Minted Egg NFT with token ID: 1
Egg ID: 1
Food Count: 2
Is Hatched: false
G1 Commission: 46
G2 Commission: 23
CoinStor: 9
=== Mint Flow Test PASSED ===
```

---

## 5. Verify Test Results

### Check Test Count
```bash
forge test 2>&1 | grep -E "passed|failed"
```

### Expected Result
```
Suite result: ok. 22 passed; 0 failed; 0 skipped
```

### Check Gas Usage
```bash
forge test --gas-report 2>&1 | grep -A 5 "EggNFT.sol"
```

### Expected Result
```
╭────────────────────────────────────┬─────────────┬───────┬────────┬───────╮
│ src/EggNFT.sol:EggNFT Contract     │             │       │        │       │
├────────────────────────────────────┼─────────────┼───────┼────────┼───────┤
│ Deployment Cost                    │ 1760336     │ 8348  │        │       │
├────────────────────────────────────┼─────────────┼───────┼────────┼───────┤
│ Function Name                      │ Min         │ Avg   │ Median │ #     │
├────────────────────────────────────┼─────────────┼───────┼────────┼───────┤
│ mintEgg                            │ 244266      │ 284273│ 295566 │ 12    │
│ mintEggWithChain                   │ 295903      │ 370350│ 380983 │ 4     │
╰────────────────────────────────────┴─────────────┴───────┴────────┴───────╯
```

---

## 6. Build Contracts

### Compile All Contracts
```bash
forge build
```

### Compile with Size Analysis
```bash
forge build --sizes
```

### Expected Output
```
Compiling 5 files with Solc 0.8.24
Solc 0.8.24 finished in 1.5s
Compiler run successful!

Contract Sizes:
EggNFT.sol              7196 bytes    ✓
CommissionDistribution  2556 bytes    ✓
```

---

## 7. Format Contracts

### Check Formatting
```bash
forge fmt --check
```

### Auto-Fix Formatting
```bash
forge fmt
```

---

## 8. Deploy and Test Locally

### Start Anvil
```bash
anvil --port 8545
```

### Deploy Contracts
```bash
cd contracts
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export COINSTOR_RESERVE_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export DEPLOY_MOCK_USDT=true

forge script script/DeployEggNFT.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  -vvv
```

### Expected Output
```
MockUSDT deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
CommissionDistribution deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
EggNFT deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

---

## 9. Verify All Functionality

### Verification Checklist

Run each test and verify:

```bash
# ✅ Unit Tests (15 tests)
forge test --match-path test/EggNFT.t.sol 2>&1 | grep -E "PASS|FAIL"

# ✅ Integration Tests (5 tests)
forge test --match-path test/AnvilIntegration.t.sol 2>&1 | grep -E "PASS|FAIL"

# ✅ Total should be: 20 passed, 0 failed
```

### Test Coverage Map

| Feature | Test Function | Status |
|---------|--------------|--------|
| Deployment | test_Deployment | ✅ |
| Mint with USDT | test_MintWithUSDT | ✅ |
| Food Count | test_FoodCountIncrement | ✅ |
| Referral Chain | test_ReferralChainRecording | ✅ |
| Commission Distribution | test_CommissionDistribution | ✅ |
| CoinStor Reserve | test_CoinStorReserve | ✅ |
| Event Emission | test_EventEmission | ✅ |
| Hatch Egg | test_HatchEgg | ✅ |
| No Referrer | test_MintWithNoReferrer | ✅ |
| Partial Chain | test_MintWithPartialChain | ✅ |
| USDT Transfer | test_USDTTransfer | ✅ |
| Reentrancy | test_ReentrancyProtection | ✅ |
| Multiple Mints | test_MultipleMints | ✅ |
| Claim Commission | test_WithdrawCommission | ✅ |
| Full Flow | test_FullMintFlow | ✅ |
| Anvil Deployment | test_AnvilDeployment | ✅ |
| Anvil Mint Flow | test_CompleteMintFlowOnAnvil | ✅ |
| Anvil Hatch | test_HatchEggOnAnvil | ✅ |
| Anvil Claim | test_ClaimCommissionOnAnvil | ✅ |
| Anvil Multiple | test_MultipleMintsOnAnvil | ✅ |

---

## 10. Quick Verification Command

Copy and paste this to verify everything:

```bash
cd contracts && \
echo "=== BUILDING ===" && \
forge build && \
echo -e "\n=== RUNNING TESTS ===" && \
forge test --gas-report 2>&1 | tail -30 && \
echo -e "\n=== VERIFYING RESULTS ===" && \
TOTAL=$(forge test 2>&1 | grep -oP '\d+(?= tests? passed)') && \
echo "Total tests passed: $TOTAL" && \
if [ "$TOTAL" -ge "20" ]; then echo "✅ ALL TESTS PASSING"; else echo "❌ SOME TESTS FAILING"; fi
```

---

## 11. Troubleshooting

### If Tests Fail

```bash
# Run with maximum verbosity
forge test -vvvvv

# Run specific failing test
forge test --match-test testFunctionName -vvvv

# Check contract compilation
forge build --force
```

### If Gas Limit Exceeded

```bash
# Increase gas limit
forge test --gas-limit 10000000
```

### If Solc Version Error

```bash
# Check foundry.toml
cat foundry.toml

# Should have: solc = "0.8.24"
```

---

## 12. Expected Test Results Summary

```
╔═══════════════════════════════════════════════════════════╗
║  TEST SUITE SUMMARY                                       ║
╠═══════════════════════════════════════════════════════════╣
║  Unit Tests (EggNFT.t.sol)         15/15  ✅ PASS         ║
║  Integration Tests (Anvil)          5/5   ✅ PASS         ║
║  Counter Tests                        2/2   ✅ PASS         ║
╠═══════════════════════════════════════════════════════════╣
║  TOTAL                               22/22  ✅ PASS         ║
║  Coverage                            100%   ✅             ║
╚═══════════════════════════════════════════════════════════╝

Gas Usage:
- Mint Egg: ~300,000 gas
- Mint with Chain: ~370,000 gas
- Hatch: ~50,000 gas
- Claim: ~35,000 gas

Status: READY FOR TESTNET ✅
```

---

## Quick Reference

| Command | Purpose | Time |
|---------|---------|------|
| `forge test` | Run all tests | ~10s |
| `forge test --gas-report` | With gas analysis | ~10s |
| `forge test -vvv` | Verbose output | ~10s |
| `forge build` | Compile contracts | ~5s |
| `forge fmt` | Format code | ~1s |
| `anvil` | Start local chain | ~2s |

---

**All tests passing?** → Ready for BSC testnet deployment! 🚀
