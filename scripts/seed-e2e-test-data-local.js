#!/usr/bin/env node
const POCKETBASE_URL = 'http://localhost:8091'

const CONTRACTS = {
  USDT: '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB',
  EggNFT: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
  AnimalNFT: '0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9',
  FoodNFT: '0x851356ae760d987E095750cCeb3bC6014560891C',
  CommissionDistribution: '0x9E545E3C0baAB3E08CdfD552C960A1050f373042',
}

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
    const err = await response.text()
    throw new Error(`Auth failed for ${email}: ${err}`)
  }
  const data = await response.json()
  return { token: data.token, userId: data.record.id, wallet: data.record.wallet }
}

async function getRecords(token, collection, filter) {
  const url = `${POCKETBASE_URL}/api/collections/${collection}/records?filter=${encodeURIComponent(filter)}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Failed to query ${collection}: ${await response.text()}`)
  const result = await response.json()
  return result.items || []
}

async function createRecord(token, collection, data) {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error(`  ❌ Create failed for ${collection}: ${err}`)
    return null
  }
  return await response.json()
}

async function seedTestData() {
  console.log('🌱 Seeding E2E test data in local PocketBase\n')

  try {
    const buyerAuth = await authenticateUser(TEST_USERS.test_buyer.email, TEST_USERS.test_buyer.password)
    const sellerAuth = await authenticateUser(TEST_USERS.test_seller.email, TEST_USERS.test_seller.password)
    console.log('✅ All users authenticated\n')

    let successCount = 0

    // 1. Create test egg for test_buyer (for Feed + Hatch journey)
    console.log('🥚 Creating test egg for test_buyer...')
    const buyerEggs = await getRecords(buyerAuth.token, 'egg_nfts', `owner='${buyerAuth.userId}'`)

    if (buyerEggs.length === 0) {
      const r = await createRecord(buyerAuth.token, 'egg_nfts', {
        token_id: 800001,
        owner: buyerAuth.userId,
        owner_wallet: TEST_USERS.test_buyer.wallet,
        rarity: 'common',
        food_count: 2,
        max_feed: 10,
        is_hatched: false,
        is_fed: false,
        contract_address: CONTRACTS.EggNFT,
        tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        minted_at: new Date().toISOString(),
      })
      if (r) { console.log('  ✅ Created egg (token_id: 800001)'); successCount++ }
    } else {
      console.log(`  ⏭️  User already has ${buyerEggs.length} egg(s)`)
    }

    // 2. Create test animal for test_seller (for Marketplace Multi-User journey)
    console.log('🐾 Creating test animal for test_seller...')
    const sellerAnimals = await getRecords(sellerAuth.token, 'animal_nfts', `owner='${sellerAuth.userId}'`)

    if (sellerAnimals.length === 0) {
      const r = await createRecord(sellerAuth.token, 'animal_nfts', {
        token_id: 900001,
        owner: sellerAuth.userId,
        owner_wallet: TEST_USERS.test_seller.wallet,
        species: 'Chicken',
        rarity: 'Common',
        generation: 1,
        contract_address: CONTRACTS.AnimalNFT,
        tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
        minted_at: new Date().toISOString(),
      })
      if (r) { console.log('  ✅ Created animal (token_id: 900001)'); successCount++ }
    } else {
      console.log(`  ⏭️  User already has ${sellerAnimals.length} animal(s)`)
    }

    // 3. Create marketplace listing for test_seller's animal
    console.log('🏪 Creating animal marketplace listing...')
    const animalListings = await getRecords(sellerAuth.token, 'marketplace_listings', `seller='${sellerAuth.userId}' && nft_type='animal' && status='active'`)
    if (animalListings.length === 0) {
      const r = await createRecord(sellerAuth.token, 'marketplace_listings', {
        seller: sellerAuth.userId,
        nft_id: '900001',
        nft_type: 'animal',
        name: 'Chicken #900001',
        rarity: 'Common',
        price: 100,
        status: 'active',
      })
      if (r) { console.log('  ✅ Created animal listing (100 USDT)'); successCount++ }
    } else {
      console.log(`  ⏭️  Already has ${animalListings.length} animal listing(s)`)
    }

    // 4. Create egg marketplace listing (for Buy Egg journey)
    console.log('🥚 Creating egg marketplace listing...')
    const eggListings = await getRecords(sellerAuth.token, 'marketplace_listings', `seller='${sellerAuth.userId}' && nft_type='egg' && status='active'`)

    if (eggListings.length === 0) {
      const sellerEggs = await getRecords(sellerAuth.token, 'egg_nfts', `owner='${sellerAuth.userId}'`)
      let eggTokenId = 800002

      if (sellerEggs.length === 0) {
        const r = await createRecord(sellerAuth.token, 'egg_nfts', {
          token_id: eggTokenId,
          owner: sellerAuth.userId,
          owner_wallet: TEST_USERS.test_seller.wallet,
          rarity: 'common',
          food_count: 2,
          max_feed: 10,
          is_hatched: false,
          is_fed: false,
          contract_address: CONTRACTS.EggNFT,
          tx_hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
          minted_at: new Date().toISOString(),
        })
        if (r) console.log(`  ✅ Created egg for listing (token_id: ${eggTokenId})`)
      } else {
        eggTokenId = sellerEggs[0].get ? sellerEggs[0].get('token_id') : sellerEggs[0].token_id
        console.log(`  ⏭️  Using existing egg (token_id: ${eggTokenId})`)
      }

      const r = await createRecord(sellerAuth.token, 'marketplace_listings', {
        seller: sellerAuth.userId,
        nft_id: String(eggTokenId),
        nft_type: 'egg',
        name: `Egg #${eggTokenId}`,
        rarity: 'Common',
        price: 50,
        status: 'active',
      })
      if (r) { console.log(`  ✅ Created egg listing (${eggTokenId}, 50 USDT)`); successCount++ }
    } else {
      console.log(`  ⏭️  Already has ${eggListings.length} egg listing(s)`)
    }

    // 5. Seed user_wallets with USDT balance for buyer and seller
    console.log('💰 Seeding USDT balances...')
    for (const auth of [buyerAuth, sellerAuth]) {
      const wallets = await getRecords(auth.token, 'user_wallets', `user_id='${auth.userId}'`)
      if (wallets.length === 0) {
        const r = await createRecord(auth.token, 'user_wallets', {
          user_id: auth.userId,
          wallet_address: auth.wallet,
          usdt_balance: 1000,
          total_earned: 0,
          total_spent: 0,
          last_deposit_amount: 0,
          last_deposit_tx: '',
          last_deposit_block: 0,
        })
        if (r) console.log(`  ✅ Created wallet for ${auth.userId} (1000 USDT)`)
      } else if (wallets.length > 0) {
        // Update balance to 1000
        const wallet = wallets[0]
        const walletId = wallet.id
        const response = await fetch(`${POCKETBASE_URL}/api/collections/user_wallets/records/${walletId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ usdt_balance: 1000 }),
        })
        if (response.ok) console.log(`  ✅ Updated wallet for ${auth.userId} (1000 USDT)`)
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🎉 Local E2E test data seeding complete! (${successCount} new records)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Test data summary:')
    console.log('  🥚 test_buyer: Has egg for feeding/hatching, 1000 USDT')
    console.log('  🐾 test_seller: Has animal + egg for listings, 1000 USDT')
    console.log('  🏪 Marketplace: Has active listings (egg 50 USDT, animal 100 USDT)')
    console.log('')
    console.log('🚀 Ready to run E2E journey tests!\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

seedTestData()
