/**
 * Script to manually create wallet for existing users
 * Run with: bun run apps/web/scripts/create-wallet-manual.ts
 */

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
const WALLET_API_URL = process.env.WALLET_API_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || ''

async function createWalletForUser(userId: string) {
  console.log(`Creating wallet for user: ${userId}`)
  
  try {
    // Call wallet API to generate wallet
    const walletResponse = await fetch(`${WALLET_API_URL}/api/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    
    const walletData = await walletResponse.json()
    
    if (!walletData.success) {
      const errorMsg = walletData.error?.message && typeof walletData.error.message === 'object' 
        ? JSON.stringify(walletData.error.message)
        : String(walletData.error?.message || 'Unknown error')
      throw new Error(`Wallet API error: ${errorMsg}`)
    }
    
    console.log('Wallet generated:', {
      address: walletData.data.address,
      daccPublickey: walletData.data.daccPublickey
    })
    
    // Admin login to PocketBase
    const adminAuth = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    })
    
    const adminData = await adminAuth.json()
    if (!adminData.token) {
      throw new Error('Failed to authenticate as admin')
    }
    
    // Update user record with wallet
    const updateUser = await fetch(`${POCKETBASE_URL}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminData.token}`
      },
      body: JSON.stringify({
        wallet: walletData.data.address,
        daccPublickey: walletData.data.daccPublickey,
        pin: '' // You may want to set this
      })
    })
    
    const userData = await updateUser.json()
    if (userData.id) {
      console.log('✅ Wallet successfully created for user!')
      console.log('User wallet address:', userData.wallet)
    } else {
      const errorMsg = userData.message && typeof userData.message === 'object'
        ? JSON.stringify(userData.message)
        : String(userData.message || 'Unknown error')
      throw new Error(`Failed to update user: ${errorMsg}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Get user ID from command line or use current authenticated user
const userId = process.argv[2]
if (!userId) {
  console.log('Usage: bun run apps/web/scripts/create-wallet-manual.ts <user-id>')
  console.log('')
  console.log('Example:')
  console.log('  bun run apps/web/scripts/create-wallet-manual.ts 1hwjfl9w99v1dij')
  process.exit(1)
}

createWalletForUser(userId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
