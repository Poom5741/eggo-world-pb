import { describe, it, expect, beforeEach } from 'bun:test'
import PocketBase from 'pocketbase'

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'

describe('Wallet Management System', () => {
    let pb, testUser1, testUser2, testUser3, testUser4, testUser5
    
    beforeEach(async () => {
        pb = new PocketBase(PB_URL)
        
        // Login as admin for test setup
        await pb.admins.authWithPassword('test@eggo.io', 'testpassword123')
        
        // Clean up previous test data
        await cleanupTestData()
    })
    
    describe('UserWallet Creation', () => {
        it('should auto-create UserWallet on user signup with zero balance', async () => {
            // Create test user
            const userData = {
                email: `test${Date.now()}@eggo.io`,
                password: 'testpassword123',
                passwordConfirm: 'testpassword123',
                name: 'Test User'
            }
            
            const user = await pb.collection('users').create(userData)
            
            // Verify UserWallet was created
            const wallets = await pb.collection('user_wallets').getList(1, 1, {
                filter: `user_id = "${user.id}"`
            })
            
            expect(wallets.items.length).toBe(1)
            expect(wallets.items[0].usdt_balance).toBe(0)
            expect(wallets.items[0].total_earned).toBe(0)
            expect(wallets.items[0].total_spent).toBe(0)
            expect(wallets.items[0].total_withdrawn).toBe(0)
        })
        
        it('should initialize user wallet fields to zero', async () => {
            const userData = {
                email: `test2${Date.now()}@eggo.io`,
                password: 'testpassword123',
                passwordConfirm: 'testpassword123'
            }
            
            const user = await pb.collection('users').create(userData)
            
            expect(user.usdt_balance).toBe(0)
            expect(user.usdt_total_earned).toBe(0)
            expect(user.total_direct_recruits).toBe(0)
            expect(user.lifetime_food_items).toBe(0)
            expect(user.highest_tier_reached).toBe('bronze')
        })
    })
    
    describe('getWalletBalance', () => {
        beforeEach(async () => {
            testUser1 = await createTestUser('balance1@eggo.io')
        })
        
        it('should return USDT balance for user address', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(true)
            expect(result.data.usdt_balance).toBe(0)
            expect(result.data.total_earned).toBe(0)
        })
        
        it('should return WALLET_NOT_FOUND for unknown address', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: '0xUnknown1234567890123456789012345678'
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('WALLET_NOT_FOUND')
        })
    })
    
    describe('withdrawUSDT', () => {
        beforeEach(async () => {
            testUser1 = await createTestUser('withdraw1@eggo.io')
            await creditUSDT(testUser1.id, 100)
        })
        
        it('should withdraw USDT with fee deduction (5%)', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 50
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(true)
            expect(result.data.fee).toBe(2.5)
            expect(result.data.net_amount).toBe(50)
            
            // Check new balance: 100 - 50 - 2.5 = 47.5
            const wallet = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            expect(wallet.usdt_balance).toBe(47.5)
        })
        
        it('should fail with INSUFFICIENT_BALANCE', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 150
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
        })
        
        it('should update total_withdrawn after withdrawal', async () => {
            await fetch(`${PB_URL}/api/v2/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 20
                })
            })
            
            const wallet = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            expect(wallet.total_withdrawn).toBe(20)
        })
    })
    
    describe('spendUSDT', () => {
        beforeEach(async () => {
            testUser1 = await createTestUser('spend1@eggo.io')
            await creditUSDT(testUser1.id, 100)
        })
        
        it('should spend USDT for food_item', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/spend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 25,
                    purpose: 'food_item'
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(true)
            expect(result.data.amount).toBe(25)
            expect(result.data.purpose).toBe('food_item')
            
            const wallet = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            expect(wallet.usdt_balance).toBe(75)
            expect(wallet.total_spent).toBe(25)
        })
        
        it('should increment lifetime_food_items when purpose is food_item', async () => {
            await fetch(`${PB_URL}/api/v2/wallet/spend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 10,
                    purpose: 'food_item'
                })
            })
            
            const user = await pb.collection('users').getOne(testUser1.id)
            expect(user.lifetime_food_items).toBe(1)
        })
        
        it('should fail with INSUFFICIENT_BALANCE', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/spend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 150,
                    purpose: 'food_item'
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
        })
    })
    
    describe('transferUSDT', () => {
        beforeEach(async () => {
            testUser1 = await createTestUser('transfer1@eggo.io')
            testUser2 = await createTestUser('transfer2@eggo.io')
            await creditUSDT(testUser1.id, 100)
            await creditUSDT(testUser2.id, 50)
        })
        
        it('should transfer USDT between users', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    from_address: testUser1.wallet_address,
                    to_address: testUser2.wallet_address,
                    amount: 30
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(true)
            expect(result.data.amount).toBe(30)
            
            const wallet1 = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            const wallet2 = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser2.id}"`)
            
            expect(wallet1.usdt_balance).toBe(70)
            expect(wallet2.usdt_balance).toBe(80)
        })
        
        it('should update sender total_spent and receiver total_earned', async () => {
            await fetch(`${PB_URL}/api/v2/wallet/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    from_address: testUser1.wallet_address,
                    to_address: testUser2.wallet_address,
                    amount: 20
                })
            })
            
            const wallet1 = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            const wallet2 = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser2.id}"`)
            
            expect(wallet1.total_spent).toBe(20)
            expect(wallet2.total_earned).toBe(70)
        })
        
        it('should fail with INSUFFICIENT_BALANCE', async () => {
            const response = await fetch(`${PB_URL}/api/v2/wallet/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    from_address: testUser1.wallet_address,
                    to_address: testUser2.wallet_address,
                    amount: 150
                })
            })
            
            const result = await response.json()
            
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
        })
    })
    
    describe('Referral Chain (4 levels)', () => {
        it('should create 4-level referral chain (G1, G2, G3, G4)', async () => {
            // Create chain: U1 -> U2 -> U3 -> U4 -> U5
            const u1 = await createTestUser('u1@eggo.io')
            const u2 = await createTestUser('u2@eggo.io', u1.id)
            const u3 = await createTestUser('u3@eggo.io', u2.id)
            const u4 = await createTestUser('u4@eggo.io', u3.id)
            const u5 = await createTestUser('u5@eggo.io', u4.id)
            
            // Check referrals for u1 (should have 4 downlines at different levels)
            const referrals = await pb.collection('referrals').getList(1, 10, {
                filter: `referrer_id="${u1.id}"`,
                sort: 'level'
            })
            
            expect(referrals.items.length).toBe(4)
            expect(referrals.items[0].level).toBe(1)
            expect(referrals.items[0].referee_id).toBe(u2.id)
            expect(referrals.items[1].level).toBe(2)
            expect(referrals.items[1].referee_id).toBe(u3.id)
            expect(referrals.items[2].level).toBe(3)
            expect(referrals.items[2].referee_id).toBe(u4.id)
            expect(referrals.items[3].level).toBe(4)
            expect(referrals.items[3].referee_id).toBe(u5.id)
        })
        
        it('should update total_direct_recruits for referrer', async () => {
            const u1 = await createTestUser('p1@eggo.io')
            await createTestUser('p2@eggo.io', u1.id)
            await createTestUser('p3@eggo.io', u1.id)
            
            const updatedU1 = await pb.collection('users').getOne(u1.id)
            expect(updatedU1.total_direct_recruits).toBe(2)
        })
        
        it('should handle chain shorter than 4 levels', async () => {
            const u1 = await createTestUser('short1@eggo.io')
            const u2 = await createTestUser('short2@eggo.io', u1.id)
            const u3 = await createTestUser('short3@eggo.io', u2.id)
            
            // Only 2 levels in this chain
            const referrals = await pb.collection('referrals').getList(1, 10, {
                filter: `referrer_id="${u1.id}"`
            })
            
            expect(referrals.items.length).toBe(2)
        })
    })
    
    describe('No Locked States', () => {
        it('should allow immediate spend after credit', async () => {
            testUser1 = await createTestUser('locked1@eggo.io')
            await creditUSDT(testUser1.id, 100)
            
            const spendResponse = await fetch(`${PB_URL}/api/v2/wallet/spend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 100,
                    purpose: 'food_item'
                })
            })
            
            const result = await spendResponse.json()
            expect(result.success).toBe(true)
            
            const wallet = await pb.collection('user_wallets').getFirstListItem(`user_id="${testUser1.id}"`)
            expect(wallet.usdt_balance).toBe(0)
        })
        
        it('should allow immediate transfer after credit', async () => {
            testUser1 = await createTestUser('locked2@eggo.io')
            testUser2 = await createTestUser('locked3@eggo.io')
            await creditUSDT(testUser1.id, 50)
            
            const transferResponse = await fetch(`${PB_URL}/api/v2/wallet/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    from_address: testUser1.wallet_address,
                    to_address: testUser2.wallet_address,
                    amount: 50
                })
            })
            
            const result = await transferResponse.json()
            expect(result.success).toBe(true)
        })
    })
    
    describe('Tier Tracking', () => {
        beforeEach(async () => {
            testUser1 = await createTestUser('tier1@eggo.io')
        })
        
        it('should track highest tier reached', async () => {
            const response = await fetch(`${PB_URL}/api/v2/user/update-tier`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    tier: 'silver'
                })
            })
            
            const result = await response.json()
            expect(result.success).toBe(true)
            expect(result.data.highest_tier_reached).toBe('silver')
        })
        
        it('should allow tier upgrade', async () => {
            await updateTier(testUser1.wallet_address, 'silver')
            await updateTier(testUser1.wallet_address, 'gold')
            
            const user = await pb.collection('users').getOne(testUser1.id)
            expect(user.highest_tier_reached).toBe('gold')
        })
        
        it('should not allow tier downgrade', async () => {
            await updateTier(testUser1.wallet_address, 'gold')
            const response = await updateTier(testUser1.wallet_address, 'silver')
            
            expect(response.data.highest_tier_reached).toBe('gold')
            expect(response.data.updated).toBe(false)
        })
        
        it('should reject invalid tier', async () => {
            const response = await fetch(`${PB_URL}/api/v2/user/update-tier`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    tier: 'invalid_tier'
                })
            })
            
            const result = await response.json()
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('INVALID_TIER')
        })
    })
    
    describe('Withdrawal Fee Configuration', () => {
        it('should use configurable withdrawal fee from wallet_configs', async () => {
            // Default fee should be 5%
            const config = await pb.collection('wallet_configs').getFirstListItem('key="WITHDRAWAL_FEE"')
            expect(config.value).toBe(0.05)
        })
        
        it('should apply updated withdrawal fee', async () => {
            // Update fee to 10%
            const config = await pb.collection('wallet_configs').getFirstListItem('key="WITHDRAWAL_FEE"')
            await pb.collection('wallet_configs').update(config.id, { value: 0.10 })
            
            testUser1 = await createTestUser('fee1@eggo.io')
            await creditUSDT(testUser1.id, 100)
            
            const response = await fetch(`${PB_URL}/api/v2/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    user_address: testUser1.wallet_address,
                    amount: 50
                })
            })
            
            const result = await response.json()
            expect(result.data.fee).toBe(5) // 10% of 50
            
            // Reset fee
            await pb.collection('wallet_configs').update(config.id, { value: 0.05 })
        })
    })
})

// Helper functions
async function createTestUser(email, referrerId = null) {
    const userData = {
        email: email,
        password: 'testpassword123',
        passwordConfirm: 'testpassword123',
        name: 'Test User'
    }
    
    if (referrerId) {
        userData.referrer_id = referrerId
    }
    
    return await pb.collection('users').create(userData)
}

async function creditUSDT(userId, amount) {
    // Direct database update for testing
    const wallet = await pb.collection('user_wallets').getFirstListItem(`user_id="${userId}"`)
    await pb.collection('user_wallets').update(wallet.id, {
        usdt_balance: (wallet.usdt_balance || 0) + amount,
        total_earned: (wallet.total_earned || 0) + amount
    })
    
    const user = await pb.collection('users').getOne(userId)
    await pb.collection('users').update(user.id, {
        usdt_balance: (user.usdt_balance || 0) + amount
    })
}

async function updateTier(walletAddress, tier) {
    const response = await fetch(`${PB_URL}/api/v2/user/update-tier`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pb.authStore.token}`
        },
        body: JSON.stringify({
            user_address: walletAddress,
            tier: tier
        })
    })
    
    return await response.json()
}

async function cleanupTestData() {
    try {
        const users = await pb.collection('users').getList(1, 100, {
            filter: 'email ~ "@eggo.io"'
        })
        
        for (const user of users.items) {
            if (user.email.includes('test') || user.email.includes('eggo.io')) {
                try {
                    await pb.collection('users').delete(user.id)
                } catch (e) {
                    // Ignore delete errors
                }
            }
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}
