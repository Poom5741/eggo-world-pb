#!/bin/bash
# Mint test USDT to wallet for testing
# Run on server: bash mint-test-usdt.sh

RPC_URL="https://0xl3.me"
USDT_ADDRESS="0x93886105218Ca14b370ACA538b13895295916028"
TARGET_WALLET="0x311Bf77Ec173A2045387A1dAe67f6003503d8296"
AMOUNT="1000"
PRIVATE_KEY="0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630"

echo "=== Mint Test USDT ==="
echo "Network: 0xl3 Testnet (Chain ID: 7117)"
echo "Target Wallet: $TARGET_WALLET"
echo "Amount: $AMOUNT USDT"
echo ""

# Check if cast is available (from foundry)
if ! command -v cast &> /dev/null; then
  echo "Installing foundry cast..."
  # Try using foundryup or direct install
  foundryup 2>/dev/null || curl -L https://foundry.paradigm.xyz | bash 2>/dev/null
  export PATH="$HOME/.foundry/bin:$PATH"
fi

if command -v cast &> /dev/null; then
  echo "Using cast (Foundry) for RPC calls"
  
  # Check balance before
  echo "Current balance:"
  cast call "$USDT_ADDRESS" "balanceOf(address)(uint256)" "$TARGET_WALLET" --rpc-url "$RPC_URL" 2>/dev/null || echo "Could not read balance"
  
  # Mint USDT (if we have private key)
  echo ""
  echo "Calling mint function..."
  cast send "$USDT_ADDRESS" "mint(address,uint256)" "$TARGET_WALLET" "$AMOUNT"000000000000000000" --private-key "$PRIVATE_KEY" --rpc-url "$RPC_URL" 2>&1 | tee /tmp/mint-result.txt
  
  # Check balance after
  echo ""
  echo "New balance:"
  cast call "$USDT_ADDRESS" "balanceOf(address)(uint256)" "$TARGET_WALLET" --rpc-url "$RPC_URL" 2>/dev/null || echo "Could not read balance"
  
  if grep -q "transactionHash" /tmp/mint-result.txt 2>/dev/null; then
    echo ""
    echo "✅ Successfully minted $AMOUNT USDT to $TARGET_WALLET"
  fi
else
  echo "cast not found. Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
fi