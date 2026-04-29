#!/usr/bin/env node
/**
 * Create E2E test users in production PocketBase using the custom endpoint
 * Run: node scripts/seed-e2e-test-users.js
 */

const POCKETBASE_URL = 'https://pb.eggoworld.io'

const TEST_USERS = [
  {
    email: 'test_buyer@e2e.eggoworld.io',
    name: 'Test Buyer',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  {
    email: 'test_seller@e2e.eggoworld.io',
    name: 'Test Seller',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  {
    email: 'test_referrer@e2e.eggoworld.io',
    name: 'Test Referrer',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
  {
    email: 'test_admin@e2e.eggoworld.io',
    name: 'Test Admin',
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
  {
    email: 'test_buyer_poor@e2e.eggoworld.io',
    name: 'Test Buyer Poor',
    wallet: '0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65',
  },
]

async function createTestUser(userData) {
  console.log(`\n📝 Creating: ${userData.email}`)
  console.log(`   Wallet: ${userData.wallet}`)

  const response = await fetch(`${POCKETBASE_URL}/api/v2/create-test-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      name: userData.name,
      wallet_address: userData.wallet,
    }),
  })

  const result = await response.json()

  if (result.success) {
    console.log(`  ✅ Created successfully (ID: ${result.user_id})`)
    console.log(`   Email: ${result.email}`)
    console.log(`   Wallet: ${result.wallet}`)
    console.log(`   USDT Balance: ${result.usdt_balance}`)
    return true
  } else {
    console.log(`  ❌ Failed: ${result.error}`)
    return false
  }
}

async function main() {
  console.log('🚀 Creating E2E test users in production PocketBase')
  console.log(`📍 URL: ${POCKETBASE_URL}`)
  console.log('')

  let successCount = 0
  let failCount = 0

  for (const user of TEST_USERS) {
    try {
      const success = await createTestUser(user)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
      failCount++
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════')
  if (failCount === 0) {
    console.log('🎉 All test users created successfully!')
  } else {
    console.log(`⚠️  Completed: ${successCount} succeeded, ${failCount} failed`)
  }
  console.log('═══════════════════════════════════════════════════════')
  console.log('')
  console.log('📋 Test User Credentials:')
  console.log('')
  console.log('All test users have the following password:')
  console.log('  Password: TestPass123!')
  console.log('')
  
  for (const user of TEST_USERS) {
    const testUser = user.email.split('@')[0]
    console.log(`  ${testUser}`)
    console.log(`    Email:    ${user.email}`)
    console.log(`    Password: TestPass123!`)
    console.log(`    Wallet:   ${user.wallet}`)
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  IMPORTANT: Update E2E test configuration!')
  console.log('')
  console.log('The custom endpoint uses password: TestPass123!')
  console.log('Update apps/web/lib/auth/e2e-auth.ts to use this password')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
