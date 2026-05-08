#!/bin/bash
# Deploy test contracts and setup blockchain data for E2E tests
# Usage: ./scripts/deploy-test-contracts.sh

set -e

ANVIL_RPC_URL="${ANVIL_RPC_URL:-http://localhost:8545}"
CHAIN_ID=7117

# Test user addresses (Anvil default accounts)
TEST_BUYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
TEST_SELLER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
TEST_REFERRER="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
TEST_ADMIN="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
TEST_BUYER_POOR="0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65"

# Anvil default private key (Account 0)
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "🚀 Deploying test contracts to Anvil (Chain ID: $CHAIN_ID)"
echo "📍 RPC URL: $ANVIL_RPC_URL"
echo ""

# Navigate to contracts directory
cd "$(dirname "$0")/../contracts"

# Step 1: Deploy contracts using Forge
echo "📦 Step 1: Deploying test contracts..."
echo ""

DEPLOY_OUTPUT=$(forge script script/DeployTestContracts.s.sol \
  --rpc-url "$ANVIL_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --chain-id $CHAIN_ID \
  --gas-limit 10000000000 \
  --silent 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "✅ Contracts deployed successfully"
echo ""

# Step 2: Extract contract addresses from deployment output
echo "📋 Step 2: Extracting contract addresses..."

# Use cast to call a simple function and verify contracts are deployed
# We'll deploy manually since forge script output parsing is complex

echo "📝 Deploying contracts individually..."

# Deploy TestUSDT
echo "  🪙 Deploying TestUSDT..."
USDT_ADDRESS=$(cast send --rpc-url "$ANVIL_RPC_URL" --private-key "$PRIVATE_KEY" --create "0x608060405234801561001057600080fd5b50600436106100545760003560e01c806340c10f1961006457600080fd5b639dc29fac61007457600080fd5b63a9059cbb61008457600080fd5b63dd62ed3e61009457600080fd5b600080fd5b600080fd5b600080fd5b600080fd" --json 2>/dev/null | jq -r '.contractAddress')

# For simplicity, let's use a Node.js script instead for better control
echo ""
echo "⚠️  Using Node.js for deployment and setup..."
echo ""

cd ..
node scripts/finalize-anvil-setup.js "$ANVIL_RPC_URL" "$PRIVATE_KEY" "$CHAIN_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ E2E blockchain setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Test data summary:"
echo "  🪙 USDT balance: 1000 USDT per user"
echo "  🥚 Egg NFTs: Minted for test_buyer (token IDs: 800001-800005)"
echo "  🐾 Animal NFTs: Minted for test_seller (token IDs: 900001-900005)"
echo "  🍕 Food NFTs: Minted for testing (token IDs: 700001-700010)"
echo "  💰 Commission: Contract deployed and ready"
echo ""
echo "🚀 Ready to run E2E journey tests with full blockchain support!"
echo ""
