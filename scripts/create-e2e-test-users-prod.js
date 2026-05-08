#!/usr/bin/env node
/**
 * Create E2E test users in production PocketBase
 * Run: node scripts/create-e2e-test-users-prod.js
 * 
 * This will use the production PocketBase at https://pb.eggoworld.io
 */

const POCKETBASE_URL = 'https://pb.eggoworld.io'

// You'll need to provide admin credentials
// These should match your production PocketBase admin account
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@eggoworld.io'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.error('❌ Error: PB_ADMIN_PASSWORD environment variable is required')
  console.error('Usage: PB_ADMIN_PASSWORD=your_password node scripts/create-e2e-test-users-prod.js')
  process.exit(1)
}

const TEST_USERS = [
  {
    email: 'test_buyer@e2e.eggoworld.io',
    password: 'test_buyer_e2e_test_password',
    username: 'test_buyer',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
  {
    email: 'test_seller@e2e.eggoworld.io',
    password: 'test_seller_e2e_test_password',
    username: 'test_seller',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  {
    email: 'test_referrer@e2e.eggoworld.io',
    password: 'test_referrer_e2e_test_password',
    username: 'test_referrer',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
  {
    email: 'test_admin@e2e.eggoworld.io',
    password: 'test_admin_e2e_test_password',
    username: 'test_admin',
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
  {
    email: 'test_buyer_poor@e2e.eggoworld.io',
    password: 'test_buyer_poor_e2e_test_password',
    username: 'test_buyer_poor',
    wallet: '0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65',
  },
]

async function adminAuth() {
  console.log('🔐 Authenticating as admin...')
  
  const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Admin auth failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  console.log('✅ Admin authenticated')
  return data.token
}

async function createOrUpdateUser(token, userData) {
  console.log(`\n📝 Processing: ${userData.email}`)

  // Search for existing user
  const searchResponse = await fetch(
    `${POCKETBASE_URL}/api/collections/users/records?filter=(email='${encodeURIComponent(userData.email)}')`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!searchResponse.ok) {
    throw new Error(`Search failed: ${await searchResponse.text()}`)
  }

  const searchResult = await searchResponse.json()

  if (searchResult.items.length > 0) {
    const existingUser = searchResult.items[0]
    console.log(`  ⚠️  User exists (ID: ${existingUser.id}), updating...`)

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
      const error = await updateResponse.text()
      console.log(`  ❌ Update failed: ${error}`)
      return false
    }

    console.log(`  ✅ Updated successfully`)
    return true
  } else {
    console.log(`  ➕ Creating new user...`)

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
      const error = await createResponse.text()
      console.log(`  ❌ Create failed: ${error}`)
      return false
    }

    console.log(`  ✅ Created successfully`)
    return true
  }
}

async function main() {
  console.log('🚀 Creating E2E test users in production PocketBase')
  console.log(`📍 URL: ${POCKETBASE_URL}`)
  console.log('')

  try {
    // Authenticate as admin
    const token = await adminAuth()
    console.log('')

    // Create or update each test user
    let successCount = 0
    let failCount = 0

    for (const userData of TEST_USERS) {
      const success = await createOrUpdateUser(token, userData)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    if (failCount === 0) {
      console.log('🎉 All test users created/updated successfully!')
    } else {
      console.log(`⚠️  Completed: ${successCount} succeeded, ${failCount} failed`)
    }
    console.log('═══════════════════════════════════════════════════════')
    console.log('')
    console.log('📋 Test User Credentials:')
    console.log('')
    
    for (const user of TEST_USERS) {
      console.log(`  ${user.username}`)
      console.log(`    Email:    ${user.email}`)
      console.log(`    Password: ${user.password}`)
      console.log(`    Wallet:   ${user.wallet}`)
      console.log('')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Next: Run E2E tests with:')
    console.log('  bun run test:e2e --grep "Buy Egg Journey|Feed.*Hatch"')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('')
    console.error('❌ Error:', error.message)
    console.error('')
    console.error('Troubleshooting:')
    console.error('  1. Check your admin credentials')
    console.error('  2. Verify production PocketBase is accessible')
    console.error('  3. Try: curl https://pb.eggoworld.io/api/health')
    process.exit(1)
  }
}

main()
