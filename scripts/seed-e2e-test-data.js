#!/usr/bin/env node
/**
 * Seed E2E test data in production PocketBase
 * Creates eggs, marketplace listings, and animals for journey tests
 * 
 * Usage: node scripts/seed-e2e-test-data.js
 */

const POCKETBASE_URL = 'https://pb.eggoworld.io'

// Test user credentials (verified working)
const TEST_USERS = {
  test_buyer: {
    email: 'test_buyer@e2e.eggoworld.io',
    password: 'test_buyer_e2e_test_password',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  test_seller: {
    email: 'test_seller@e2e.eggoworld.io',
    password: 'test_seller_e2e_test_password',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  test_referrer: {
    email: 'test_referrer@e2e.eggoworld.io',
    password: 'test_referrer_e2e_test_password',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
}

async function authenticateUser(email, password) {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })

  if (!response.ok) {
    throw new Error(`Auth failed for ${email}: ${await response.text()}`)
  }

  const data = await response.json()
  return { token: data.token, userId: data.record.id, wallet: data.record.wallet }
}

async function getUserRecords(token, collection, filter) {
  const url = `${POCKETBASE_URL}/api/collections/${collection}/records?filter=${encodeURIComponent(filter)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Failed to query ${collection}: ${await response.text()}`)
  }

  return (await response.json()).items || []
}

async function createRecord(token, collection, data) {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to create ${collection} record: ${await response.text()}`)
  }

  return await response.json()
}

async function seedTestData() {
  console.log('🌱 Seeding E2E test data in production PocketBase\n')

  try {
    // Authenticate as test users
    console.log('🔐 Authenticating test users...')
    const buyerAuth = await authenticateUser(TEST_USERS.test_buyer.email, TEST_USERS.test_buyer.password)
    const sellerAuth = await authenticateUser(TEST_USERS.test_seller.email, TEST_USERS.test_seller.password)
    const referrerAuth = await authenticateUser(TEST_USERS.test_referrer.email, TEST_USERS.test_referrer.password)
    console.log('✅ All users authenticated\n')

    let successCount = 0

    // 1. Create test egg for test_buyer (for Feed + Hatch journey)
    console.log('🥚 Creating test egg for test_buyer...')
    const buyerEggs = await getUserRecords(buyerAuth.token, 'egg_nfts', `owner='${buyerAuth.userId}'`)
    
    if (buyerEggs.length === 0) {
      const eggData = {
        token_id: 800001,
        owner: buyerAuth.userId,
        owner_wallet: TEST_USERS.test_buyer.wallet,
        rarity: 'common',
        food_count: 2,  // Default initial food count from mint-egg hook
        max_feed: 10,
        is_hatched: false,
        is_fed: false,
        contract_address: '0xb2FE193523A1E6A240141331A80755f5642e7A44',
        tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        minted_at: new Date().toISOString(),
      }

      await createRecord(buyerAuth.token, 'egg_nfts', eggData)
      console.log('  ✅ Created egg (token_id: 800001)\n')
      successCount++
    } else {
      console.log(`  ⏭️  User already has ${buyerEggs.length} egg(s)\n`)
    }

    // 2. Create test animal for test_seller (for Marketplace Multi-User journey)
    console.log('🐾 Creating test animal for test_seller...')
    const sellerAnimals = await getUserRecords(sellerAuth.token, 'animal_nfts', `owner='${sellerAuth.userId}'`)
    
    if (sellerAnimals.length === 0) {
      const animalData = {
        token_id: 900001,
        owner: sellerAuth.userId,
        owner_wallet: TEST_USERS.test_seller.wallet,
        species: 'Chicken',
        rarity: 'Common',
        generation: 1,
        contract_address: '0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C',
        tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
        minted_at: new Date().toISOString(),
      }

      await createRecord(sellerAuth.token, 'animal_nfts', animalData)
      console.log('  ✅ Created animal (token_id: 900001)\n')
      successCount++
    } else {
      console.log(`  ⏭️  User already has ${sellerAnimals.length} animal(s)\n`)
    }

    // 3. Create marketplace listing for test_seller's animal
    console.log('🏪 Creating marketplace listing...')
    const existingListings = await getUserRecords(
      sellerAuth.token,
      'marketplace_listings',
      `seller='${sellerAuth.userId}' && status='active'`
    )

    if (existingListings.length === 0) {
      const listingData = {
        seller: sellerAuth.userId,
        nft_id: '900001',
        nft_type: 'Animal',
        name: 'Chicken #900001',
        rarity: 'Common',
        price: 100,
        status: 'active',
      }

      await createRecord(sellerAuth.token, 'marketplace_listings', listingData)
      console.log('  ✅ Created marketplace listing (animal #900001, 100 USDT)\n')
      successCount++
    } else {
      console.log(`  ⏭️  User already has ${existingListings.length} active listing(s)\n`)
    }

    // 4. Create egg marketplace listing (for Buy Egg journey)
    console.log('🥚 Creating egg marketplace listing...')
    const eggListings = await getUserRecords(
      sellerAuth.token,
      'marketplace_listings',
      `nft_type='egg' && status='active'`
    )

    if (eggListings.length === 0) {
      // First create an egg owned by seller
      const sellerEggs = await getUserRecords(sellerAuth.token, 'egg_nfts', `owner='${sellerAuth.userId}'`)
      let eggTokenId = 800002

      if (sellerEggs.length === 0) {
        const eggData = {
          token_id: eggTokenId,
          owner: sellerAuth.userId,
          owner_wallet: TEST_USERS.test_seller.wallet,
          rarity: 'common',
          food_count: 2,  // Default initial food count from mint-egg hook
          max_feed: 10,
          is_hatched: false,
          is_fed: false,
          contract_address: '0xb2FE193523A1E6A240141331A80755f5642e7A44',
          tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
          minted_at: new Date().toISOString(),
        }

        await createRecord(sellerAuth.token, 'egg_nfts', eggData)
        console.log(`  ✅ Created egg for listing (token_id: ${eggTokenId})`)
      } else {
        eggTokenId = sellerEggs[0].token_id
        console.log(`  ⏭️  Using existing egg (token_id: ${eggTokenId})`)
      }

      const eggListingData = {
        seller: sellerAuth.userId,
        nft_id: String(eggTokenId),
        nft_type: 'Egg',
        name: `Egg #${eggTokenId}`,
        rarity: 'Common',
        price: 50,
        status: 'active',
      }

      await createRecord(sellerAuth.token, 'marketplace_listings', eggListingData)
      console.log(`  ✅ Created egg marketplace listing (egg #${eggTokenId}, 50 USDT)\n`)
      successCount++
    } else {
      console.log(`  ⏭️  Already has ${eggListings.length} egg listing(s)\n`)
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 E2E test data seeding complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 Created items:')
    console.log(`  ✅ ${successCount} new record(s) created\n`)
    console.log('📋 Test data summary:')
    console.log('  🥚 test_buyer: Has egg(s) for feeding/hatching')
    console.log('  🐾 test_seller: Has animal(s) for marketplace listing')
    console.log('  🏪 Marketplace: Has active listings (eggs + animals)')
    console.log('')
    console.log('🚀 Ready to run E2E journey tests!')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

seedTestData()
