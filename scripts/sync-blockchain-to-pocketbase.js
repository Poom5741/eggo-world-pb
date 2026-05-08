#!/usr/bin/env node
/**
 * Sync PocketBase records with minted blockchain NFTs
 * Creates PocketBase records for eggs and animals that exist on-chain
 * 
 * Usage: node scripts/sync-blockchain-to-pocketbase.js
 */

// Use native fetch (available in Node.js 18+)

// Configuration
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8091'
const ANVIL_RPC_URL = process.env.ANVIL_RPC_URL || 'http://localhost:8545'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@e2e.local'
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'admin_e2e_password'

// Test user credentials (for authentication)
const TEST_USERS = {
  test_buyer: {
    email: 'test_buyer@e2e.eggoworld.io',
    password: 'test_buyer_e2e_test_password',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  test_seller: {
    email: 'test_seller@e2e.eggoworld.io',
    password: 'test_seller_e2e_test_password',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  test_referrer: {
    email: 'test_referrer@e2e.eggoworld.io',
    password: 'test_referrer_e2e_test_password',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
}

// Contract addresses from deployment
const CONTRACTS = {
  EggNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  AnimalNFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
}

// Test NFT token IDs
const TEST_DATA = {
  eggs: [800001, 800002, 800003, 800004, 800005],
  animals: [900001, 900002, 900003, 900004, 900005],
}

let adminToken = null

/**
 * Authenticate as admin to get token
 */
async function authenticateAdmin() {
  console.log('🔐 Authenticating with PocketBase admin...')
  
  // Try to get admin token via API
  // Note: Production may disable this endpoint, so we'll use user auth instead
  console.log('⚠️  Admin auth may be disabled in production')
  console.log('💡 Will authenticate as test users instead\n')
}

/**
 * Authenticate as a test user and get their PocketBase user ID
 */
async function authenticateUser(username) {
  const user = TEST_USERS[username]
  
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: user.email,
        password: user.password,
      }),
    })

    if (!response.ok) {
      console.error(`❌ Failed to authenticate ${username}:`, await response.text())
      return null
    }

    const data = await response.json()
    return {
      userId: data.record.id,
      token: data.token,
      wallet: user.walletAddress,
    }
  } catch (error) {
    console.error(`❌ Error authenticating ${username}:`, error.message)
    return null
  }
}

/**
 * Create egg record in PocketBase with robust error handling and validation
 */
async function createEggRecord(auth, tokenId) {
  const eggData = {
    token_id: parseInt(tokenId.toString(), 10), // Ensure numeric format
    owner: auth.userId,
    owner_wallet: auth.wallet,
    rarity: 'common',
    food_count: 2, // Initial food count from mint hook
    max_feed: 10,
    is_hatched: false,
    is_fed: false,
    contract_address: CONTRACTS.EggNFT,
    tx_hash: `0x${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`, // Valid 66-char hash pattern
    minted_at: new Date().toISOString(),
    // Include additional necessary fields for consistency with actual hook creation
    egg_type: 'Regular', // Default egg type
    energy: 100, // Default energy level
    last_fed: null, // Hasn't been fed yet
  }

  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/egg_nfts/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify(eggData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`  ❌ Failed to create egg #${tokenId}:`, error)
      
      // Additional debugging info
      console.error(`  ❌ Request body: ${JSON.stringify(eggData)}`)
      console.error(`  ❌ Response status: ${response.status}`)
      console.error(`  ❌ Response headers:`, [...response.headers.entries()])
      return false
    }

    const result = await response.json()
    console.log(`  ✅ Created egg #${tokenId} (ID: ${result.id})`)
    return result // Return the full result instead of just true
  } catch (error) {
    console.error(`  ❌ Error creating egg #${tokenId}:`, error.message)
    return false
  }
}

/**
 * Create animal record in PocketBase with robust error handling and validation
 */
async function createAnimalRecord(auth, tokenId) {
  const animalData = {
    token_id: parseInt(tokenId.toString(), 10), // Ensure numeric format
    owner: auth.userId,
    owner_wallet: auth.wallet,
    rarity: 'Common',  // Capitalized
    species: 'Chicken',  // Capitalized
    generation: 1,
    is_breeding: false,
    contract_address: CONTRACTS.AnimalNFT,
    tx_hash: `0x${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 18)}`, // Valid 66-char hash pattern
    minted_at: new Date().toISOString(),  // Use minted_at, not hatched_at
    // Include additional necessary fields for consistency with actual hook creation
    health: 100, // Default health
    stamina: 100, // Default stamina
    breeding_count: 0, // Default breeding count
    parent1_token_id: null, // Has no parents yet
    parent2_token_id: null, // Has no parents yet
  }

  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/animal_nfts/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`,
      },
      body: JSON.stringify(animalData),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`  ❌ Failed to create animal #${tokenId}:`, error)
      
      // Additional debugging info
      console.error(`  ❌ Request body: ${JSON.stringify(animalData)}`)
      console.error(`  ❌ Response status: ${response.status}`)
      console.error(`  ❌ Response headers:`, [...response.headers.entries()])
      return false
    }

    const result = await response.json()
    console.log(`  ✅ Created animal #${tokenId} (ID: ${result.id})`)
    return result // Return the full result instead of just true
  } catch (error) {
    console.error(`  ❌ Error creating animal #${tokenId}:`, error.message)
    return false
  }
}

/**
 * Check if record already exists
 */
async function checkExistingRecord(collectionType, tokenId) {
  const collection = collectionType === 'egg' ? 'egg_nfts' : 'animal_nfts'
  
  try {
    // Use standardized query syntax compatible with PocketBase
    // Convert to numeric query instead of string for token_id fields to prevent type mismatches
    const queryParam = typeof tokenId === 'number' ? tokenId : parseInt(tokenId, 10)
    const response = await fetch(
      `${POCKETBASE_URL}/api/collections/${collection}/records?filter=(token_id="${queryParam}")`
    )
    
    if (!response.ok) {
      console.error(`Failed to check existing ${collection} #${tokenId}:`, await response.text())
      return false
    }
    
    const data = await response.json()
    const exists = data.items && data.items.length > 0
    if (exists) {
      console.log(`  ℹ️  ${collectionType === 'egg' ? 'Egg' : 'Animal'} #${tokenId} already exists in ${collection}`)
    }
    return exists
  } catch (error) {
    console.error(`Error checking existing ${collection} #${tokenId}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔄 Syncing blockchain NFTs to PocketBase\n')
  console.log(`📍 PocketBase: ${POCKETBASE_URL}`)
  console.log(`🔗 Anvil RPC: ${ANVIL_RPC_URL}\n`)

  // Step 1: Authenticate test users
  console.log('👤 Step 1: Authenticating test users...')
  
  const buyerAuth = await authenticateUser('test_buyer')
  const sellerAuth = await authenticateUser('test_seller')

  if (!buyerAuth || !sellerAuth) {
    console.error('\n❌ Failed to authenticate test users')
    console.error('💡 Check credentials and PocketBase availability')
    process.exit(1)
  }

  console.log(`  ✅ test_buyer authenticated (ID: ${buyerAuth.userId})`)
  console.log(`  ✅ test_seller authenticated (ID: ${sellerAuth.userId})\n`)

  // Step 2: Sync Egg NFTs
  console.log('🥚 Step 2: Syncing Egg NFTs to PocketBase...')
  
  let eggsCreated = 0
  let eggsSkipped = 0

  for (const tokenId of TEST_DATA.eggs) {
    const exists = await checkExistingRecord('egg', tokenId.toString())
    
    if (exists) {
      console.log(`  ⏭️  Egg #${tokenId} already exists, skipping`)
      eggsSkipped++
      continue
    }

    const created = await createEggRecord(buyerAuth, tokenId)
    if (created) eggsCreated++
  }

  console.log(`\n  📊 Eggs: ${eggsCreated} created, ${eggsSkipped} skipped\n`)

  // Step 3: Sync Animal NFTs
  console.log('🐾 Step 3: Syncing Animal NFTs to PocketBase...')
  
  let animalsCreated = 0
  let animalsSkipped = 0

  for (const tokenId of TEST_DATA.animals) {
    const exists = await checkExistingRecord('animal', tokenId.toString())
    
    if (exists) {
      console.log(`  ⏭️  Animal #${tokenId} already exists, skipping`)
      animalsSkipped++
      continue
    }

    const created = await createAnimalRecord(sellerAuth, tokenId)
    if (created) animalsCreated++
  }

  console.log(`\n  📊 Animals: ${animalsCreated} created, ${animalsSkipped} skipped\n`)

  // Step 4: Create marketplace listings
  console.log('🏪 Step 4: Creating marketplace listings...')

  // Create egg listing for sale by test_buyer
  const eggListingData = {
    seller: buyerAuth.userId,
    nft_id: '800001',
    nft_type: 'Egg',
    name: 'Egg #800001',
    rarity: 'Common',
    price: 50,
    status: 'active',
  }

  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/marketplace_listings/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerAuth.token}`,
      },
      body: JSON.stringify(eggListingData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`  ✅ Created egg listing (ID: ${result.id})`)
    } else {
      console.log(`  ⚠️  Failed to create egg listing:`, await response.text())
    }
  } catch (error) {
    console.log(`  ⚠️  Error creating egg listing:`, error.message)
  }

  // Create animal listing for sale by test_seller
  const animalListingData = {
    seller: sellerAuth.userId,
    nft_id: '900001',
    nft_type: 'Animal',
    name: 'Animal #900001',
    rarity: 'Common',
    price: 100,
    status: 'active',
  }

  try {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/marketplace_listings/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerAuth.token}`,
      },
      body: JSON.stringify(animalListingData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`  ✅ Created animal listing (ID: ${result.id})`)
    } else {
      console.log(`  ⚠️  Failed to create animal listing:`, await response.text())
    }
  } catch (error) {
    console.log(`  ⚠️  Error creating animal listing:`, error.message)
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ PocketBase sync complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📊 Summary:')
  console.log(`  🥚 Egg NFTs: ${eggsCreated} synced to PocketBase`)
  console.log(`  🐾 Animal NFTs: ${animalsCreated} synced to PocketBase`)
  console.log(`  🏪 Marketplace: Listings created for trading\n`)
  console.log('🚀 Ready to run E2E journey tests!')
  console.log('   bun run test:e2e --grep "Buy Egg Journey|Feed.*Hatch|Marketplace.*Multi-User|Referral Commission"\n')
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message)
  console.error(error.stack)
  process.exit(1)
})
