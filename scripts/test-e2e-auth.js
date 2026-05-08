#!/usr/bin/env node
/**
 * Test authentication for E2E test users
 * Try both password patterns to see which one works
 */

const POCKETBASE_URL = 'https://pb.eggoworld.io'

const TEST_USERS = [
  'test_buyer',
  'test_seller', 
  'test_referrer',
  'test_admin',
  'test_buyer_poor',
]

async function testAuth(username, password) {
  const email = `${username}@e2e.eggoworld.io`
  
  const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: email,
      password: password,
    }),
  })

  if (response.ok) {
    const data = await response.json()
    return {
      success: true,
      userId: data.record?.id || 'unknown',
      email: data.record?.email || email,
      wallet: data.record?.wallet || 'not set',
    }
  } else {
    const error = await response.text()
    return { success: false, error }
  }
}

async function main() {
  console.log('🔐 Testing E2E user authentication\n')

  for (const username of TEST_USERS) {
    console.log(`\n📝 Testing: ${username}`)

    // Try old password pattern
    const oldPassword = `${username}_e2e_test_password`
    const oldResult = await testAuth(username, oldPassword)
    
    if (oldResult.success) {
      console.log(`  ✅ OLD password works: ${oldPassword}`)
      console.log(`     User ID: ${oldResult.userId}`)
      console.log(`     Wallet: ${oldResult.wallet}`)
    } else {
      console.log(`  ❌ OLD password failed`)
    }

    // Try new password pattern
    const newPassword = 'TestPass123!'
    const newResult = await testAuth(username, newPassword)
    
    if (newResult.success) {
      console.log(`  ✅ NEW password works: ${newPassword}`)
      console.log(`     User ID: ${newResult.userId}`)
      console.log(`     Wallet: ${newResult.wallet}`)
    } else {
      console.log(`  ❌ NEW password failed`)
    }

    if (!oldResult.success && !newResult.success) {
      console.log(`  ⚠️  BOTH passwords failed!`)
      console.log(`     Error: ${oldResult.error}`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch(console.error)
