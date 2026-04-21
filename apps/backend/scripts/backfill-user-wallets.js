#!/usr/bin/env node
/**
 * Backfill script: Create user_wallets records for existing users
 * 
 * Run this ONCE after deploying the wallet hook fix to ensure all
 * existing users have user_wallets records.
 * 
 * Usage:
 *   cd apps/backend
 *   node scripts/backfill-user-wallets.js
 */

const PocketBase = require('pocketbase/cjs')

const PB_URL = process.env.PB_URL || 'http://localhost:8090'
const PB_EMAIL = process.env.PB_EMAIL || 'test@example.com'
const PB_PASSWORD = process.env.PB_PASSWORD || 'testpassword123'

async function backfillUserWallets() {
  console.log('=== Backfill user_wallets records ===')
  console.log(`PocketBase URL: ${PB_URL}`)
  
  const pb = new PocketBase(PB_URL)
  
  // Login as admin
  try {
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD)
    console.log('✓ Admin authenticated')
  } catch (err) {
    console.error('✗ Admin login failed:', err.message)
    console.log('Set PB_EMAIL and PB_PASSWORD environment variables')
    process.exit(1)
  }
  
  // Get all users with wallets but no user_wallets record
  console.log('\nFetching users...')
  const users = await pb.collection('users').getFullList({
    filter: 'wallet != ""'
  })
  
  console.log(`Found ${users.length} users with wallets`)
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  for (const user of users) {
    try {
      // Check if user_wallets record already exists
      const existingWallets = await pb.collection('user_wallets').getFullList({
        filter: `user_id = "${user.id}"`
      })
      
      if (existingWallets.length > 0) {
        skipped++
        continue
      }
      
      // Create user_wallets record
      await pb.collection('user_wallets').create({
        user_id: user.id,
        wallet_address: user.wallet || '',
        usdt_balance: user.usdt_balance || 0,
        total_earned: user.usdt_total_earned || 0,
        total_spent: 0,
        total_withdrawn: 0
      })
      
      created++
      console.log(`✓ Created user_wallets for user ${user.id.slice(0, 8)}...`)
      
    } catch (err) {
      errors++
      console.error(`✗ Failed for user ${user.id.slice(0, 8)}...:`, err.message)
    }
  }
  
  console.log('\n=== Backfill Complete ===')
  console.log(`Created: ${created}`)
  console.log(`Skipped (already exists): ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total processed: ${users.length}`)
}

backfillUserWallets().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
