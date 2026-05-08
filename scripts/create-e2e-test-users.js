#!/usr/bin/env node
/**
 * Create E2E test users in PocketBase
 * Phase 42: Auth Mock + Blockchain Helpers
 * 
 * Usage: node scripts/create-e2e-test-users.js
 * 
 * Environment variables:
 * - POCKETBASE_URL (default: http://localhost:8090)
 * - PB_ADMIN_EMAIL
 * - PB_ADMIN_PASSWORD
 */

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'test@e2e.local'
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'test-password'

const TEST_USERS = [
  {
    email: 'test_buyer@e2e.eggoworld.io',
    password: 'test_buyer_e2e_test_password',
    username: 'test_buyer',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil Account 0
  },
  {
    email: 'test_seller@e2e.eggoworld.io',
    password: 'test_seller_e2e_test_password',
    username: 'test_seller',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Anvil Account 1
  },
  {
    email: 'test_referrer@e2e.eggoworld.io',
    password: 'test_referrer_e2e_test_password',
    username: 'test_referrer',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Anvil Account 2
  },
  {
    email: 'test_admin@e2e.eggoworld.io',
    password: 'test_admin_e2e_test_password',
    username: 'test_admin',
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Anvil Account 3
  },
  {
    email: 'test_buyer_poor@e2e.eggoworld.io',
    password: 'test_buyer_poor_e2e_test_password',
    username: 'test_buyer_poor',
    wallet: '0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65', // Anvil Account 4
  },
]

async function adminAuth() {
  const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: PB_ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Admin auth failed: ${error}`)
  }

  const data = await response.json()
  return data.token
}

async function createOrUpdateUser(token, userData) {
  // First, try to find existing user
  const searchResponse = await fetch(
    `${POCKETBASE_URL}/api/collections/users/records?filter=(email='${userData.email}')`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!searchResponse.ok) {
    throw new Error(`Search failed for ${userData.email}: ${await searchResponse.text()}`)
  }

  const searchResult = await searchResponse.json()

  if (searchResult.items.length > 0) {
    // User exists, update it
    const existingUser = searchResult.items[0]
    console.log(`⚠️  User ${userData.email} already exists (ID: ${existingUser.id}), updating...`)

    const updateResponse = await fetch(
      `${POCKETBASE_URL}/api/collections/users/records/${existingUser.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: userData.password,
          passwordConfirm: userData.password,
          wallet: userData.wallet,
        }),
      }
    )

    if (!updateResponse.ok) {
      throw new Error(`Update failed for ${userData.email}: ${await updateResponse.text()}`)
    }

    console.log(`✅ Updated: ${userData.email}`)
    return await updateResponse.json()
  } else {
    // Create new user
    console.log(`Creating user: ${userData.email}...`)

    const createResponse = await fetch(
      `${POCKETBASE_URL}/api/collections/users/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          passwordConfirm: userData.password,
          username: userData.username,
          wallet: userData.wallet,
          emailVisibility: true,
        }),
      }
    )

    if (!createResponse.ok) {
      throw new Error(`Create failed for ${userData.email}: ${await createResponse.text()}`)
    }

    console.log(`✅ Created: ${userData.email}`)
    return await createResponse.json()
  }
}

async function main() {
  console.log('🚀 Creating E2E test users in PocketBase')
  console.log(`📍 PocketBase URL: ${POCKETBASE_URL}`)
  console.log('')

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating as admin...')
    const token = await adminAuth()
    console.log('✅ Admin authenticated')
    console.log('')

    // Create or update each test user
    for (const userData of TEST_USERS) {
      await createOrUpdateUser(token, userData)
    }

    console.log('')
    console.log('🎉 All test users created/updated successfully!')
    console.log('')
    console.log('📋 Test User Summary:')
    console.log('┌─────────────────────────────────────────────────────────────────┐')
    for (const user of TEST_USERS) {
      console.log(`│ Email:    ${user.email}`.padEnd(73) + '│')
      console.log(`│ Password: ${user.password}`.padEnd(73) + '│')
      console.log(`│ Wallet:   ${user.wallet}`.padEnd(73) + '│')
      console.log('├─────────────────────────────────────────────────────────────────┤')
    }
    console.log('└─────────────────────────────────────────────────────────────────┘')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
