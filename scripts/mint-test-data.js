#!/usr/bin/env node
/**
 * Mint test NFTs and USDT on local Anvil for E2E tests
 * 
 * Usage: node scripts/mint-test-data.js
 */

const { ethers } = require('ethers')

// Contract addresses from deployment
const CONTRACTS = {
  USDT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  EggNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  AnimalNFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  FoodNFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  CommissionDistribution: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
}

// ABIs (minimal for minting)
const USDT_ABI = [
  'function mint(address to, uint256 amount)',
  'function balanceOf(address owner) view returns (uint256)',
]

const ERC721_ABI = [
  'function mint(address to, uint256 tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]

const COMMISSION_ABI = [
  'function depositCommission(address user, uint256 amount)',
]

// Test user addresses
const TEST_USERS = {
  test_buyer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  test_seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  test_referrer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  test_admin: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  test_buyer_poor: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
}

const ANVIL_RPC_URL = process.env.ANVIL_RPC_URL || 'http://localhost:8545'
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

async function main() {
  console.log('🚀 Minting test data on local Anvil\n')
  console.log(`📍 RPC URL: ${ANVIL_RPC_URL}\n`)

  const provider = new ethers.JsonRpcProvider(ANVIL_RPC_URL)
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider)

  // Verify connection
  const blockNumber = await provider.getBlockNumber()
  console.log(`✅ Connected to Anvil (block #${blockNumber})\n`)

  // Initialize contracts
  const usdt = new ethers.Contract(CONTRACTS.USDT, USDT_ABI, deployer)
  const eggNFT = new ethers.Contract(CONTRACTS.EggNFT, ERC721_ABI, deployer)
  const animalNFT = new ethers.Contract(CONTRACTS.AnimalNFT, ERC721_ABI, deployer)
  const commission = new ethers.Contract(CONTRACTS.CommissionDistribution, COMMISSION_ABI, deployer)

  // Step 1: Mint USDT for all test users
  console.log('💰 Step 1: Minting USDT (1000 USDT per user)...')
  const usdtAmount = ethers.parseUnits('1000', 18) // 1000 USDT

  for (const [name, address] of Object.entries(TEST_USERS)) {
    const tx = await usdt.mint(address, usdtAmount)
    await tx.wait()
    const balance = await usdt.balanceOf(address)
    console.log(`  ✅ ${name}: ${ethers.formatUnits(balance, 18)} USDT`)
  }
  console.log('')

  // Step 2: Mint Egg NFTs for test_buyer
  console.log('🥚 Step 2: Minting Egg NFTs for test_buyer...')
  const eggTokenIds = [800001, 800002, 800003, 800004, 800005]
  
  for (const tokenId of eggTokenIds) {
    const tx = await eggNFT.mint(TEST_USERS.test_buyer, tokenId)
    await tx.wait()
    const owner = await eggNFT.ownerOf(tokenId)
    console.log(`  ✅ Egg #${tokenId}: owned by ${owner === TEST_USERS.test_buyer ? 'test_buyer ✓' : 'ERROR ✗'}`)
  }
  console.log('')

  // Step 3: Mint Animal NFTs for test_seller
  console.log('🐾 Step 3: Minting Animal NFTs for test_seller...')
  const animalTokenIds = [900001, 900002, 900003, 900004, 900005]
  
  for (const tokenId of animalTokenIds) {
    const tx = await animalNFT.mint(TEST_USERS.test_seller, tokenId)
    await tx.wait()
    const owner = await animalNFT.ownerOf(tokenId)
    console.log(`  ✅ Animal #${tokenId}: owned by ${owner === TEST_USERS.test_seller ? 'test_seller ✓' : 'ERROR ✗'}`)
  }
  console.log('')

  // Step 4: Deposit test commission for referrer
  console.log('💸 Step 4: Depositing test commission for test_referrer...')
  const commissionAmount = ethers.parseEther('1') // 1 ETH equivalent
  const tx = await commission.depositCommission(TEST_USERS.test_referrer, commissionAmount)
  await tx.wait()
  console.log(`  ✅ Commission deposited: ${ethers.formatEther(commissionAmount)} ETH\n`)

  // Step 5: Save contract addresses to file
  console.log('📝 Step 5: Saving contract addresses...')
  const config = {
    contracts: CONTRACTS,
    testUsers: TEST_USERS,
    testTokenIds: {
      eggs: eggTokenIds,
      animals: animalTokenIds,
    },
    deployedAt: new Date().toISOString(),
    chainId: 7117,
  }

  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(__dirname, 'test-contracts-config.json')
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2))
  console.log(`  ✅ Saved to: ${outputPath}\n`)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ E2E blockchain test data setup complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 Summary:')
  console.log(`  🪙 USDT: 1000 per user (${Object.keys(TEST_USERS).length} users)`)
  console.log(`  🥚 Egg NFTs: ${eggTokenIds.length} minted for test_buyer`)
  console.log(`  🐾 Animal NFTs: ${animalTokenIds.length} minted for test_seller`)
  console.log(`  💰 Commission: Deposited for test_referrer\n`)
  console.log('🚀 Ready to run E2E journey tests!\n')
  console.log('💡 To run tests:')
  console.log('   bun run test:e2e --grep "Buy Egg Journey|Feed.*Hatch|Marketplace.*Multi-User|Referral Commission"\n')
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message)
  console.error(error.stack)
  process.exit(1)
})
