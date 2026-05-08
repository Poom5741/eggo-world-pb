// Mint test USDT to wallet for testing
// Usage: bun scripts/mint-test-usdt.js

const { ethers } = require('ethers')

// Configuration
const RPC_URL = 'https://0xl3.me' // 0xl3 testnet RPC
const USDT_ADDRESS = '0x93886105218Ca14b370ACA538b13895295916028'
const TARGET_WALLET = '0x311Bf77Ec173A2045387A1dAe67f6003503d8296'
const AMOUNT = '1000' // Mint 1000 USDT for testing

// MockUSDT minimal ABI (just the mint function)
const MOCK_USDT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
]

async function main() {
  console.log('=== Mint Test USDT ===')
  console.log('Network: 0xl3 Testnet (Chain ID: 7117)')
  console.log('USDT Contract:', USDT_ADDRESS)
  console.log('Target Wallet:', TARGET_WALLET)
  console.log('Amount:', AMOUNT, 'USDT')
  console.log('')

  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || '0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630' // Default for testing
  
  if (process.env.DEPLOYER_PRIVATE_KEY === undefined && process.env.PRIVATE_KEY === undefined) {
    console.log('Using default private key (deployer). Set DEPLOYER_PRIVATE_KEY or PRIVATE_KEY env var to override.')
  }

  try {
    // Connect to network
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    
    console.log('Connected with address:', wallet.address)
    
    // Check balance before
    const usdt = new ethers.Contract(USDT_ADDRESS, MOCK_USDT_ABI, wallet)
    const decimals = await usdt.decimals()
    const balanceBefore = await usdt.balanceOf(TARGET_WALLET)
    
    console.log('Current balance:', ethers.formatUnits(balanceBefore, decimals), 'USDT')
    console.log('')
    
    // Mint USDT
    console.log('Minting', AMOUNT, 'USDT...')
    const amountWei = ethers.parseUnits(AMOUNT, decimals)
    
    const tx = await usdt.mint(TARGET_WALLET, amountWei)
    console.log('Transaction submitted:', tx.hash)
    
    const receipt = await tx.wait()
    console.log('Transaction confirmed! Block:', receipt.blockNumber)
    console.log('Gas used:', receipt.gasUsed.toString())
    
    // Check balance after
    const balanceAfter = await usdt.balanceOf(TARGET_WALLET)
    console.log('')
    console.log('New balance:', ethers.formatUnits(balanceAfter, decimals), 'USDT')
    console.log('')
    console.log('✅ Successfully minted', AMOUNT, 'USDT to', TARGET_WALLET)
    
  } catch (error) {
    console.error('❌ Failed to mint USDT:')
    console.error(error.message)
    console.error('')
    console.error('Possible causes:')
    console.error('1. Wrong private key (not the contract owner)')
    console.error('2. Insufficient native token for gas')
    console.error('3. Network connection issue')
    process.exit(1)
  }
}

main()
