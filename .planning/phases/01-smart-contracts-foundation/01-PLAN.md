---
phase: 01-smart-contracts-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - contracts/foundry.toml
  - contracts/.env.local
  - contracts/deployment-addresses.json
autonomous: false
requirements:
  - "REQUIREMENTS.md:1.1 USDT Integration"
  - "REQUIREMENTS.md:1.2 NFT Contracts"
  - "REQUIREMENTS.md:1.3 Commission Engine"
  - "REQUIREMENTS.md:1.4 Marketplace Contract"
  - "REQUIREMENTS.md:1.5 CoinStor Reserve"
user_setup:
  - service: bsc_testnet

must_haves:
  truths:
    - "Contracts deploy successfully to BSC testnet"
    - "Contract addresses are documented and accessible"
    - "Contracts are verified on BscScan"
    - "Cross-contract authorizations are correctly configured"
  artifacts:
    - path: "contracts/deployment-addresses.json"
      provides: "Deployed contract addresses"
      contains: "EggNFT, FoodNFT, AnimalNFT, CommissionDistribution addresses"
    - path: "contracts/broadcast/DeployEggNFT.s.sol/97/run-latest.json"
      provides: "Deployment transaction records"
      contains: "Broadcast transactions"
  key_links:
    - from: "contracts/script/DeployEggNFT.s.sol"
      to: "BSC testnet (chain 97)"
      via: "forge script --rpc-url bsc_testnet --broadcast"
      pattern: "forge script.*bsc_testnet.*--broadcast"
    why: "Deploy smart contracts to BSC testnet"
    env_vars:
      - name: PRIVATE_KEY
        source: "Deployer wallet private key (MetaMask or similar)"
      - name: COINSTOR_RESERVE_ADDRESS
        source: "Reserve wallet address for 4% CoinStor fees"
      - name: BSCSCAN_API_KEY
        source: "BscScan API key from https://bscscan.com/myprofile"
  - service: usdt_token
    why: "USDT token address for payments"
    env_vars:
      - name: USDT_ADDRESS
        source: "Use existing USDT on BSC testnet or set DEPLOY_MOCK_USDT=true"
---

<objective>
Deploy smart contracts to BSC testnet with proper configuration and verification.

Purpose: Phase 1 implementation is complete (all contracts written and tested). This plan executes deployment to BSC testnet, making contracts available for Phase 2 backend integration.

Output: Deployed contract addresses, verified contracts on BscScan, deployment documentation
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-smart-contracts-foundation/01-CONTEXT.md
@contracts/DEPLOYMENT.md
@contracts/script/DeployEggNFT.s.sol
@contracts/foundry.toml
</context>

<tasks>

<task type="checkpoint:decision" gate="blocking">
  <name>task 1: Configure deployment environment</name>
  <files>contracts/.env.local</files>
  <action>
    Before deploying, user must provide deployment configuration. Present the following options:

    **Required environment variables:**
    1. PRIVATE_KEY - Deployer wallet private key
    2. COINSTOR_RESERVE_ADDRESS - Wallet address to receive 4% CoinStor fees
    3. USDT_ADDRESS or DEPLOY_MOCK_USDT - Either use existing USDT or deploy mock

    **Ask user:**
    - Do you want to deploy to BSC testnet first (recommended) or mainnet?
    - What is your deployer wallet address (for PRIVATE_KEY)?
    - What is the CoinStor reserve wallet address?
    - For testnet: Should we deploy a mock USDT (DEPLOY_MOCK_USDT=true) or use an existing testnet USDT address?
    - Do you have a BscScan API key for contract verification? (optional, can skip and verify manually later)

    Once user provides answers, update contracts/.env.local with:
    ```
    PRIVATE_KEY=<user-provided>
    COINSTOR_RESERVE_ADDRESS=<user-provided>
    DEPLOY_MOCK_USDT=true  # For testnet
    # USDT_ADDRESS=0x...  # For mainnet
    BSCSCAN_API_KEY=<optional>
    ```

  </action>
  <verify>
    <automated>MISSING — Human must provide environment values</automated>
  </verify>
  <done>
    - User provides deployment configuration
    - contracts/.env.local updated with correct values
    - User confirms ready to deploy
  </done>
</task>

<task type="auto">
  <name>task 2: Deploy contracts to BSC testnet</name>
  <files>contracts/script/DeployEggNFT.s.sol</files>
  <action>
    Execute deployment script to BSC testnet:

    ```bash
    cd contracts

    # Load environment
    set -a && source .env.local && set +a

    # Deploy all contracts
    forge script script/DeployEggNFT.s.sol:DeployEggNFT \
      --rpc-url bsc_testnet \
      --broadcast \
      --verify \
      -vvvv
    ```

    The deployment script will:
    1. Deploy MockUSDT (if DEPLOY_MOCK_USDT=true)
    2. Deploy CommissionDistribution
    3. Deploy AnimalNFT
    4. Deploy EggNFT
    5. Deploy FoodNFT
    6. Wire contracts together (set authorizations)
    7. Output all contract addresses

    Capture the deployment output and extract contract addresses from the broadcast artifact:
    ```bash
    cat broadcast/DeployEggNFT.s.sol/97/run-latest.json
    ```

  </action>
  <verify>
    <automated>test -f contracts/broadcast/DeployEggNFT.s.sol/97/run-latest.json && cat contracts/broadcast/DeployEggNFT.s.sol/97/run-latest.json | jq '.transactions | length' | grep -q '[1-9]'</automated>
  </verify>
  <done>
    - All 4-5 contracts deployed to BSC testnet
    - Deployment transactions broadcast successfully
    - Contract addresses captured in run-latest.json
  </done>
</task>

<task type="auto">
  <name>task 3: Document deployed addresses</name>
  <files>contracts/deployment-addresses.json</files>
  <action>
    Extract contract addresses from deployment output and create documentation file:

    ```bash
    # Extract addresses from deployment
    ADDRESSES=$(cat broadcast/DeployEggNFT.s.sol/97/run-latest.json | jq '{
      chainId: 97,
      network: "BSC Testnet",
      deployedAt: (now | strftime("%Y-%m-%d %H:%M:%S")),
      contracts: {
        MockUSDT: (.contracts[] | select(.contractName == "MockUSDT") | .contractAddress),
        CommissionDistribution: (.contracts[] | select(.contractName == "CommissionDistribution") | .contractAddress),
        AnimalNFT: (.contracts[] | select(.contractName == "AnimalNFT") | .contractAddress),
        EggNFT: (.contracts[] | select(.contractName == "EggNFT") | .contractAddress),
        FoodNFT: (.contracts[] | select(.contractName == "FoodNFT") | .contractAddress)
      }
    }')

    echo "$ADDRESSES" > deployment-addresses.json
    ```

    Also update DEPLOYMENT.md with the deployed addresses in the "Contract Addresses (Testnet)" table.

  </action>
  <verify>
    <automated>test -f contracts/deployment-addresses.json && cat contracts/deployment-addresses.json | jq -e '.contracts.EggNFT' && cat contracts/deployment-addresses.json | jq -e '.contracts.FoodNFT' && cat contracts/deployment-addresses.json | jq -e '.contracts.AnimalNFT' && cat contracts/deployment-addresses.json | jq -e '.contracts.CommissionDistribution'</automated>
  </verify>
  <done>
    - deployment-addresses.json created with all contract addresses
    - DEPLOYMENT.md updated with deployed addresses
    - Addresses verified on BscScan (if --verify was used)
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>task 4: Verify deployment on BscScan</name>
  <files>contracts/deployment-addresses.json</files>
  <action>
    This is a checkpoint task - human verification required to confirm deployment success on BscScan.
    
    Use the contract addresses from deployment-addresses.json to verify each contract on BSC testnet BscScan.
  </action>
  <what-built>
    Deployed 4-5 smart contracts to BSC testnet:
    - MockUSDT (if deployed)
    - CommissionDistribution
    - EggNFT
    - FoodNFT
    - AnimalNFT
    
    All contract addresses documented in contracts/deployment-addresses.json
  </what-built>
  <how-to-verify>
    **Step 1:** Visit BSC Testnet BscScan: https://testnet.bscscan.com/

    **Step 2:** Search for each deployed contract address from deployment-addresses.json:
    - EggNFT contract
    - FoodNFT contract
    - AnimalNFT contract
    - CommissionDistribution contract

    **Step 3:** Verify each contract shows:
    - ✅ "Contract" tab (not just "Address")
    - ✅ Source code verified (green checkmark)
    - ✅ Contract name matches expected

    **Step 4:** Test contract interaction:
    - Open EggNFT contract on BscScan
    - Go to "Contract" → "Read Contract"
    - Check that view functions work (e.g., `owner`, `MINT_PRICE`)

    **Step 5:** Verify cross-contract wiring:
    - On EggNFT: `foodNFT()` should return FoodNFT address
    - On EggNFT: `animalNFTContract()` should return AnimalNFT address
    - On FoodNFT: `eggNFTContract()` should return EggNFT address

  </how-to-verify>
  <verify>
    <automated>MISSING - Requires manual verification on BscScan</automated>
  </verify>
  <done>
    - All contracts visible on BscScan with verified source code
    - Contract read functions return expected values
    - Cross-contract addresses correctly configured
  </done>
  <resume-signal>Type "verified" if all contracts are deployed and verified, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
All contracts deployed to BSC testnet with addresses documented. Contracts verified on BscScan. Cross-contract authorizations confirmed working.
</verification>

<success_criteria>

- ✅ 4-5 contracts deployed to BSC testnet (chain ID 97)
- ✅ Contract addresses documented in contracts/deployment-addresses.json
- ✅ Contracts verified on BscScan (source code visible)
- ✅ Cross-contract authorizations working (EggNFT ↔ FoodNFT ↔ AnimalNFT)
- ✅ DEPLOYMENT.md updated with deployed addresses
- ✅ Ready for Phase 2 backend integration
  </success_criteria>

<output>
After completion, create `.planning/phases/01-smart-contracts-foundation/01-01-SUMMARY.md` with:
- Deployment timestamp
- All contract addresses
- BscScan verification links
- Any deployment issues encountered and resolutions
- Confirmation that Phase 1 is complete and Phase 2 can begin
</output>
