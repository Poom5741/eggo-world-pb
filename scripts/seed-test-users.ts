/**
 * Seed E2E Test Users in Production PocketBase
 * Phase 42: Auth Mock + Blockchain Helpers
 *
 * Creates 4 test users mapped to Anvil accounts:
 * - test_buyer (Account 0)
 * - test_seller (Account 1)
 * - test_referrer (Account 2)
 * - test_admin (Account 3)
 *
 * Usage:
 *   bun run scripts/seed-test-users.ts
 *
 * Requires PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD env vars
 */

const PB_URL = process.env.POCKETBASE_URL || 'https://pb.eggoworld.io'

// Test users with wallet addresses mapped to Anvil accounts
const TEST_USERS = [
  {
    username: 'test_buyer',
    email: 'test_buyer@e2e.eggoworld.io',
    password: 'test_buyer_e2e_test_password',
    passwordConfirm: 'test_buyer_e2e_test_password',
    name: 'Test Buyer',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil Account 0
    externalId: 'test_buyer_e2e',
    verified: true,
  },
  {
    username: 'test_seller',
    email: 'test_seller@e2e.eggoworld.io',
    password: 'test_seller_e2e_test_password',
    passwordConfirm: 'test_seller_e2e_test_password',
    name: 'Test Seller',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Anvil Account 1
    externalId: 'test_seller_e2e',
    verified: true,
  },
  {
    username: 'test_referrer',
    email: 'test_referrer@e2e.eggoworld.io',
    password: 'test_referrer_e2e_test_password',
    passwordConfirm: 'test_referrer_e2e_test_password',
    name: 'Test Referrer',
    wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Anvil Account 2
    externalId: 'test_referrer_e2e',
    verified: true,
  },
  {
    username: 'test_admin',
    email: 'test_admin@e2e.eggoworld.io',
    password: 'test_admin_e2e_test_password',
    passwordConfirm: 'test_admin_e2e_test_password',
    name: 'Test Admin',
    wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Anvil Account 3
    externalId: 'test_admin_e2e',
    verified: true,
  },
]

async function seedTestUsers() {
  console.log('=== Seeding E2E Test Users ===')
  console.log(`PocketBase URL: ${PB_URL}`)

  // Check if admin credentials are provided
  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD required')
    console.error('Set these environment variables before running this script')
    process.exit(1)
  }

  // Authenticate as admin (PocketBase 0.23.x uses _superusers endpoint)
  console.log('\n1. Authenticating as admin...')
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: adminEmail,
      password: adminPassword,
    }),
  })

  if (!authRes.ok) {
    const error = await authRes.text()
    console.error(`Admin auth failed: ${error}`)
    process.exit(1)
  }

  const authData = await authRes.json()
  const adminToken = authData.token
  console.log('✓ Admin authenticated')

  // Create test users
  console.log('\n2. Creating test users...')
  for (const user of TEST_USERS) {
    // Check if user already exists
    const checkRes = await fetch(
      `${PB_URL}/api/collections/users/records?filter=(username='${user.username}')`,
      {
        headers: { Authorization: adminToken },
      }
    )

    if (checkRes.ok) {
      const checkData = await checkRes.json()
      if (checkData.items && checkData.items.length > 0) {
        console.log(`  ✓ ${user.username} already exists (id: ${checkData.items[0].id})`)
        continue
      }
    }

    // Create user
    const createRes = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: adminToken,
      },
      body: JSON.stringify(user),
    })

    if (!createRes.ok) {
      const error = await createRes.text()
      console.error(`  ✗ ${user.username} creation failed: ${error}`)
      continue
    }

    const createdUser = await createRes.json()
    console.log(`  ✓ ${user.username} created (id: ${createdUser.id})`)
  }

  // Verify all users exist
  console.log('\n3. Verifying test users...')
  for (const user of TEST_USERS) {
    const verifyRes = await fetch(
      `${PB_URL}/api/collections/users/records?filter=(username='${user.username}')&fields=id,username,wallet`,
      {
        headers: { Authorization: adminToken },
      }
    )

    if (!verifyRes.ok) {
      console.error(`  ✗ ${user.username} verification failed`)
      continue
    }

    const verifyData = await verifyRes.json()
    if (verifyData.items && verifyData.items.length > 0) {
      const found = verifyData.items[0]
      console.log(`  ✓ ${found.username}: id=${found.id}, wallet=${found.wallet}`)
    } else {
      console.error(`  ✗ ${user.username} not found`)
    }
  }

  console.log('\n=== Seed Complete ===')
}

seedTestUsers().catch(console.error)