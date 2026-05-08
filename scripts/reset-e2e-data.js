#!/usr/bin/env node
// Reset E2E test data: create marketplace listings, egg/animals, user wallets
const PB = 'http://localhost:8091'

async function auth(email, password) {
  const r = await fetch(`${PB}/api/collections/users/auth-with-password`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({identity:email, password})
  })
  const d = await r.json()
  return { token: d.token, id: d.record.id, wallet: d.record.wallet }
}

async function main() {
  const buyer = await auth('test_buyer@e2e.eggoworld.io', 'test_buyer_e2e_test_password')
  const seller = await auth('test_seller@e2e.eggoworld.io', 'test_seller_e2e_test_password')
  const referrer = await auth('test_referrer@e2e.eggoworld.io', 'test_referrer_e2e_test_password')

  // Helper: create record or skip if exists
  async function create(collection, data, token) {
    const exists = await fetch(`${PB}/api/collections/${collection}/records?perPage=1`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => d.totalItems > 0)
    if (exists) return { skipped: true }
    const r = await fetch(`${PB}/api/collections/${collection}/records`, {
      method:'POST', headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify(data)
    })
    const result = await r.json()
    if (!result.id) throw new Error(`Create ${collection} failed: ${JSON.stringify(result)}`)
    return { id: result.id }
  }

  // Clear old listings
  for (const token of [seller.token, buyer.token]) {
    const listings = await fetch(`${PB}/api/collections/marketplace_listings/records?perPage=50`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json())
    for (const item of listings.items || []) {
      await fetch(`${PB}/api/collections/marketplace_listings/records/${item.id}`, {
        method:'DELETE', headers:{ Authorization: `Bearer ${token}` }
      })
    }
  }
  console.log('Cleared old listings')

  // Create seller eggs (for marketplace)
  const eggIds = []
  for (let i = 1; i <= 3; i++) {
    const tid = 800100 + i
    const result = await create('egg_nfts', {
      token_id: tid, owner: seller.id, owner_wallet: seller.wallet,
      rarity: 'common', food_count: 2, max_feed: 10,
      is_hatched: false, is_fed: false, generation: 1,
      contract_address: '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8',
      minted_at: new Date().toISOString(),
      tx_hash: `0x${tid.toString(16).padStart(64,'0')}`
    }, seller.token)
    if (result.id) eggIds.push(result.id)
    console.log(`  Egg #${tid}: ${result.id || 'exists'}`)
  }

  // Create egg listings
  for (const eid of eggIds) {
    const r = await create('marketplace_listings', {
      seller: seller.id, nft_id: eid, nft_type: 'Egg',
      name: 'Egg', price: 50, status: 'active', rarity: 'Common'
    }, seller.token)
    if (r.id) console.log(`  Egg listing: ${r.id}`)
  }

  // Create animal listings (from seller's existing animals)
  const animals = await fetch(`${PB}/api/collections/animal_nfts/records?perPage=5`, {
    headers: { Authorization: `Bearer ${seller.token}` }
  }).then(r => r.json())
  for (const animal of animals.items || []) {
    const r = await create('marketplace_listings', {
      seller: seller.id, nft_id: animal.id, nft_type: 'Animal',
      name: animal.species || 'Animal', price: 100, status: 'active', rarity: 'Common'
    }, seller.token)
    if (r.id) console.log(`  Animal listing: ${r.id}`)
  }

  // Reset user wallet balances to 1000
  for (const u of [buyer, seller, referrer]) {
    const wallets = await fetch(`${PB}/api/collections/user_wallets/records?filter=(user_id='${u.id}')`, {
      headers: { Authorization: `Bearer ${u.token}` }
    }).then(r => r.json())
    for (const w of wallets.items || []) {
      await fetch(`${PB}/api/collections/user_wallets/records/${w.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json', Authorization: `Bearer ${u.token}`},
        body: JSON.stringify({ usdt_balance: 1000, total_spent: 0 })
      })
    }
  }

  // Count listings
  const all = await fetch(`${PB}/api/collections/marketplace_listings/records?perPage=20`, {
    headers: { Authorization: `Bearer ${seller.token}` }
  }).then(r => r.json())
  const active = (all.items || []).filter(i => i.status === 'active')
  console.log(`\nActive listings: ${active.length}`)
  active.forEach(i => console.log(`  ${i.id}: ${i.nft_type} $${i.price}`))
}

main().catch(e => { console.error(e); process.exit(1) })
