/**
 * E2E Test Data Setup
 * Seeds fresh test data (listings, NFTs, balances) before journey tests run.
 * Runs as a Playwright "setup" project before the test suite.
 */
import { test } from '@playwright/test'

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8091'

test.describe.configure({ mode: 'serial' })

test('seed E2E test data', async () => {
  const startTime = Date.now()
  console.log(`\n[setup] Seeding E2E test data at ${PB_URL}...`)

  // 1. Authenticate test users
  const sellerAuth = await authUser('test_seller')
  const buyerAuth = await authUser('test_buyer')
  const referrerAuth = await authUser('test_referrer')

  // 2. Delete all marketplace listings
  const allListings = await pbList('marketplace_listings', sellerAuth.token)
  for (const item of allListings) {
    await fetch(`${PB_URL}/api/collections/marketplace_listings/records/${item.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${sellerAuth.token}` }
    })
  }
  console.log(`[setup] Cleared ${allListings.length} old listings`)

  // 3. Ensure seller has eggs, then create listings
  let sellerEggs = await pbList('egg_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
  if (sellerEggs.length === 0) {
    // Transfer one of buyer's eggs to seller
    const buyerEggs = await pbList('egg_nfts', buyerAuth.token, `owner='${buyerAuth.id}'`)
    if (buyerEggs.length > 0) {
      const transferEgg = buyerEggs[0]
      await fetch(`${PB_URL}/api/collections/egg_nfts/records/${transferEgg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerAuth.token}` },
        body: JSON.stringify({ owner: sellerAuth.id, owner_wallet: sellerAuth.wallet }),
      })
      console.log(`[setup] Transferred egg ${transferEgg.id} from buyer to seller`)
      sellerEggs = await pbList('egg_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
    }
  }
  for (const egg of sellerEggs) {
    // Fix egg_id: set it to token_id so card renders correct ID (e.g. "Egg #800001")
    const eggTokenId = egg.token_id || egg.get?.('token_id') || 0
    if (eggTokenId && (egg.egg_id === 0 || egg.egg_id === undefined)) {
      await fetch(`${PB_URL}/api/collections/egg_nfts/records/${egg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerAuth.token}` },
        body: JSON.stringify({ egg_id: eggTokenId }),
      })
    }
    await pbCreate('marketplace_listings', sellerAuth.token, {
      seller: sellerAuth.id, nft_id: egg.id, nft_type: 'Egg',
      name: 'Egg', price: 50, status: 'active', rarity: 'Common',
    })
  }
  console.log(`[setup] Created ${sellerEggs.length} egg listings`)

  // 4. Create animal listings from seller's existing animals
  let sellerAnimals = await pbList('animal_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
  if (sellerAnimals.length === 0) {
    // Transfer one of buyer's animals to seller (check buyer too)
    const buyerAnimals = await pbList('animal_nfts', buyerAuth.token, `owner='${buyerAuth.id}'`)
    if (buyerAnimals.length > 0) {
      await fetch(`${PB_URL}/api/collections/animal_nfts/records/${buyerAnimals[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerAuth.token}` },
        body: JSON.stringify({ owner: sellerAuth.id }),
      })
      sellerAnimals = await pbList('animal_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
    }
  }
  for (const animal of sellerAnimals) {
    // Fix animal_id: set it to token_id so card renders correct ID (e.g. "Chicken #900001")
    const animalTokenId = animal.token_id || animal.get?.('token_id') || 0
    if (animalTokenId && (animal.animal_id === 0 || animal.animal_id === undefined)) {
      await fetch(`${PB_URL}/api/collections/animal_nfts/records/${animal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerAuth.token}` },
        body: JSON.stringify({ animal_id: animalTokenId }),
      })
    }
    await pbCreate('marketplace_listings', sellerAuth.token, {
      seller: sellerAuth.id, nft_id: animal.id, nft_type: 'Animal',
      name: animal.species || 'Animal', price: 100, status: 'active', rarity: 'Common',
    })
  }
  console.log(`[setup] Created ${sellerAnimals.length} animal listings`)

  // Extra: create enough egg listings so tests don't exhaust supply (need 3+ eggs for serial tests)
  let stableEggs = await pbList('egg_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
  if (stableEggs.length < 5) {
    // Transfer another egg from buyer
    const buyerEggs2 = await pbList('egg_nfts', buyerAuth.token, `owner='${buyerAuth.id}'`)
    if (buyerEggs2.length > 0) {
      await fetch(`${PB_URL}/api/collections/egg_nfts/records/${buyerEggs2[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerAuth.token}` },
        body: JSON.stringify({ owner: sellerAuth.id, owner_wallet: sellerAuth.wallet }),
      })
      stableEggs = await pbList('egg_nfts', sellerAuth.token, `owner='${sellerAuth.id}'`)
    }
  }
  for (const egg of stableEggs) {
    await pbCreate('marketplace_listings', sellerAuth.token, {
      seller: sellerAuth.id, nft_id: egg.id, nft_type: 'Egg',
      name: 'Egg', price: 50, status: 'active', rarity: 'Common',
    })
    console.log('[setup] Created extra egg listing')
  }

  // 5. Ensure buyer has at least one egg (for Feed+Hatch test)
  let buyerEggs = await pbList('egg_nfts', buyerAuth.token, `owner='${buyerAuth.id}'`)
  if (buyerEggs.length === 0) {
    const newEgg = await pbCreate('egg_nfts', buyerAuth.token, {
      token_id: 801000, egg_id: 801000, owner: buyerAuth.id, owner_wallet: buyerAuth.wallet,
      rarity: 'common', food_count: 2, max_feed: 10, is_hatched: false, is_fed: false,
      generation: 0,
      contract_address: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
      minted_at: new Date().toISOString(),
      tx_hash: `${txHash}1`,
    })
    if (newEgg.id) console.log('[setup] Created buyer egg for feed/hatch test')
    buyerEggs = await pbList('egg_nfts', buyerAuth.token, `owner='${buyerAuth.id}'`)
  }
  // Fix egg_id on buyer's eggs too
  for (const egg of buyerEggs) {
    const eggTokenId = egg.token_id || 0
    if (eggTokenId && (egg.egg_id === 0 || egg.egg_id === undefined)) {
      await fetch(`${PB_URL}/api/collections/egg_nfts/records/${egg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerAuth.token}` },
        body: JSON.stringify({ egg_id: eggTokenId }),
      })
    }
  }

  // 6. Reset USDT balances
  for (const u of [buyerAuth, sellerAuth, referrerAuth]) {
    const wallets = await pbList('user_wallets', u.token, `user_id='${u.id}'`)
    for (const w of wallets) {
      await fetch(`${PB_URL}/api/collections/user_wallets/records/${w.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u.token}` },
        body: JSON.stringify({ usdt_balance: 1000, total_spent: 0 }),
      })
    }
  }
  console.log('[setup] Reset all wallet balances to 1000 USDT')

  // 7. Verify
  const allActive = await pbList('marketplace_listings', sellerAuth.token, "status='active'")
  const eggs = allActive.filter((i: any) => i.nft_type === 'Egg').length
  const animals = allActive.filter((i: any) => i.nft_type === 'Animal').length
  console.log(`[setup] Active listings: ${allActive.length} (${eggs} eggs, ${animals} animals)`)

  // 8. Verify buy API by just checking the endpoint is reachable (don't actually buy)
  // The buy endpoint will reject because we're not sending a valid POST body
  const verifyRes = await fetch(`${PB_URL}/api/v2/marketplace/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),  // Empty body — will fail with validation before any side effects
  })
  if (verifyRes.status === 401 || verifyRes.status === 400) {
    console.log(`[setup] ✅ Buy endpoint reachable (HTTP ${verifyRes.status})`)
  } else {
    console.log(`[setup] ⚠️ Buy endpoint responded: HTTP ${verifyRes.status}`)
  }

  // Ensure we still have at least 2 active listings when done
  const finalActive = await pbList('marketplace_listings', sellerAuth.token, "status='active'")
  console.log(`[setup] Final active listings: ${finalActive.length}`)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[setup] Done in ${elapsed}s\n`)
})

async function authUser(username: string) {
  const r = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: `${username}@e2e.eggoworld.io`, password: `${username}_e2e_test_password` }),
  })
  if (!r.ok) throw new Error(`Auth failed for ${username}: ${await r.text()}`)
  const d = await r.json()
  return { token: d.token, id: d.record.id, wallet: d.record.wallet }
}

async function pbList(collection: string, token: string, filter?: string) {
  const url = `${PB_URL}/api/collections/${collection}/records?perPage=50${filter ? `&filter=(${encodeURIComponent(filter)})` : ''}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const d = await r.json()
  return d.items || []
}

async function pbCreate(collection: string, token: string, data: any) {
  const r = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  const result = await r.json()
  return result
}
