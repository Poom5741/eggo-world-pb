#!/usr/bin/env node
/**
 * Reset E2E test users - delete existing and recreate with correct password
 * Run: node scripts/reset-e2e-test-users.js
 */

const POCKETBASE_URL = 'https://pb.eggoworld.io'
const ADMIN_EMAIL = 'admin@eggo.local'
const ADMIN_PASSWORD = 'admin123'

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
    throw new Error(`Admin auth failed: ${await response.text()}`)
  }

  const data = await response.json()
  console.log('✅ Admin authenticated')
  return data.token
}

async function findUserByEmail(token, email) {
  const response = await fetch(
    `${POCKETBASE_URL}/api/collections/users/records?filter=(email='${encodeURIComponent(email)}')`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    throw new Error(`Search failed: ${await response.text()}`)
  }

  const result = await response.json()
  return result.items.length > 0 ? result.items[0] : null
}

async function deleteUser(token, userId) {
  console.log(`  🗑️  Deleting user ${userId}...`)
  
  const response = await fetch(
    `${POCKETBASE_URL}/api/collections/users/records/${userId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.log(`  ❌ Delete failed: ${error}`)
    return false
  }

  console.log(`  ✅ Deleted successfully`)
  return true
}

async function createTestUser(userData) {
  console.log(`  ➕ Creating: ${userData.email}`)

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
    console.log(`  ✅ Created (ID: ${result.user_id})`)
    return true
  } else {
    console.log(`  ❌ Create failed: ${result.error}`)
    return false
  }
}

async function main() {
  console.log('🚀 Resetting E2E test users in production PocketBase')
  console.log(`📍 URL: ${POCKETBASE_URL}`)
  console.log('')

  try {
    const token = await adminAuth()
    console.log('')

    let successCount = 0
    let failCount = 0

    for (const user of TEST_USERS) {
      console.log(`\n📝 Processing: ${user.email}`)
      
      try {
        // Find existing user
        const existingUser = await findUserByEmail(token, user.email)
        
        if (existingUser) {
          console.log(`  ⚠️  User exists (ID: ${existingUser.id})`)
          
          // Delete existing user
          const deleted = await deleteUser(token, existingUser.id)
          
          if (!deleted) {
            console.log(`  ⏭️  Skipping recreation due to delete failure`)
            failCount++
            continue
          }
        }

        // Create new user with correct password
        const created = await createTestUser(user)
        
        if (created) {
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
      console.log('🎉 All test users reset successfully!')
    } else {
      console.log(`⚠️  Completed: ${successCount} succeeded, ${failCount} failed`)
    }
    console.log('═══════════════════════════════════════════════════════')
    console.log('')
    console.log('📋 All test users now have password: TestPass123!')
    console.log('')
    console.log('Users:')
    for (const user of TEST_USERS) {
      const username = user.email.split('@')[0]
      console.log(`  ✓ ${username}`)
      console.log(`    Email:    ${user.email}`)
      console.log(`    Password: TestPass123!`)
      console.log(`    Wallet:   ${user.wallet}`)
      console.log('')
    }
    console.log('  ✓ test_buyer_poor (created earlier)')
    console.log('    Email:    test_buyer_poor@e2e.eggoworld.io')
    console.log('    Password: TestPass123!')
    console.log('    Wallet:   0x15d34AAf54267DB7D7c367839Aaf71A00a2C6A65')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Ready to run E2E tests!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('')
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
