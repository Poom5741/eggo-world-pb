import { describe, test, expect, beforeEach } from 'bun:test'
import PocketBase from 'pocketbase'

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'

describe('Animal NFT Breeding & Upgrade System', () => {
    let pb, testUser, eggRecord, animalRecord1, animalRecord2

    beforeEach(async () => {
        pb = new PocketBase(PB_URL)
        
        // Login as admin for test setup
        await pb.admins.authWithPassword('test@eggo.io', 'testpassword123')
        
        // Clean up previous test data
        await cleanupTestData()
        
        // Create test user with wallet
        testUser = await createTestUserWithWallet(`test${Date.now()}@eggo.io`)
        
        // Login as test user
        await pb.collection('users').authWithPassword(testUser.email, 'testpassword123')
    })

    describe('Egg Rarity Upgrade', () => {
        test('should have generation field (default 0 for regular eggs)', async () => {
            // Setup: Create regular egg
            eggRecord = await createEggWithFood(2)
            
            // Assert: Generation should be 0 for regular eggs
            expect(eggRecord.generation).toBe(0)
        })

        test('should upgrade egg rarity with extra food items', async () => {
            // Setup: Create egg and feed 10 times first
            eggRecord = await createEggWithFood(10)
            
            // Verify egg has generation field (0 for regular eggs)
            expect(eggRecord.generation).toBe(0)
            
            // Act: Upgrade with 3 extra food items
            const response = await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101, 102, 103] // Mock food IDs
                })
            })
            
            const result = await response.json()
            
            // Assert: Should succeed
            expect(result.success).toBe(true)
            expect(result.data.new_food_count).toBe(13)
            expect(result.data.rarity_upgrade_count).toBe(3)
            expect(result.data.rarity_bonus).toBe(6) // 3 * 2%
        })

        test('should revert when egg already hatched', async () => {
            // Setup: Create hatched egg
            eggRecord = await createEggWithFood(10, true) // true = is_hatched
            
            // Act: Try to upgrade
            const response = await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101]
                })
            })
            
            const result = await response.json()
            
            // Assert: Should fail
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('EGG_ALREADY_HATCHED')
        })

        test('should revert when food_count < 10', async () => {
            // Setup: Create egg with only 5 food
            eggRecord = await createEggWithFood(5)
            
            // Act: Try to upgrade
            const response = await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101]
                })
            })
            
            const result = await response.json()
            
            // Assert: Should fail
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('MUST_FEED_10_FIRST')
        })

        test('should revert when total food would exceed 20', async () => {
            // Setup: Create egg with 18 food
            eggRecord = await createEggWithFood(18)
            
            // Act: Try to add 5 more (would be 23, exceeds 20)
            const response = await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101, 102, 103, 104, 105]
                })
            })
            
            const result = await response.json()
            
            // Assert: Should fail
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('MAX_FOOD_EXCEEDED')
        })

        test('should deduct upgrade fee (5 USDT per food item)', async () => {
            // Setup: Create egg and feed 10 times
            eggRecord = await createEggWithFood(10)
            
            const walletBefore = await pb.collection('user_wallets').getFirstListItem(`owner = "${testUser.id}"`)
            const balanceBefore = walletBefore.usdt_balance
            
            // Act: Upgrade with 3 food items (15 USDT fee)
            await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101, 102, 103]
                })
            })
            
            // Assert: Check balance deduction
            const walletAfter = await pb.collection('user_wallets').getFirstListItem(`owner = "${testUser.id}"`)
            expect(walletAfter.usdt_balance).toBe(balanceBefore - 15) // 3 * 5 USDT
        })

        test('should create commission records for referral chain', async () => {
            // Setup: Create user with referrer
            const referrer = await createTestUserWithWallet(`referrer${Date.now()}@eggo.io`)
            testUser = await createTestUserWithWallet(`referee${Date.now()}@eggo.io`, referrer.id)
            await pb.collection('users').authWithPassword(testUser.email, 'testpassword123')
            
            eggRecord = await createEggWithFood(10)
            
            // Act: Upgrade egg
            await fetch(`${PB_URL}/api/v2/upgrade-egg-rarity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id,
                    food_ids: [101]
                })
            })
            
            // Assert: Commission records created
            const commissions = await pb.collection('commission_records').getList(1, 10, {
                filter: `egg_id = "${eggRecord.id}"`
            })
            expect(commissions.items.length).toBeGreaterThan(0)
        })
    })

    describe('Animal Breeding', () => {
        test('should create breeding egg from two Gen 0 animals', async () => {
            // Setup: Create two animals
            animalRecord1 = await createGen0Animal(testUser.id, 0)
            animalRecord2 = await createGen0Animal(testUser.id, 0)
            
            // Act: Breed them
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(true)
            expect(result.data.breeding_egg_id).toBeDefined()
            expect(result.data.generation).toBe(1)
            
            // Verify breeding egg has generation field
            const breedingEgg = await pb.collection('egg_nfts').getOne(result.data.breeding_egg_id)
            expect(breedingEgg.generation).toBe(1)
        })

        test('should calculate child generation as max(parents) + 1', async () => {
            // Setup: Create two Gen 1 animals
            animalRecord1 = await createGen0Animal(testUser.id, 1)
            animalRecord2 = await createGen0Animal(testUser.id, 2)
            
            // Act: Breed them
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert: Child should be Gen 3 (max(1, 2) + 1)
            expect(result.data.generation).toBe(3)
        })

        test('should revert when breeding same animal', async () => {
            // Setup: Create one animal
            animalRecord1 = await createGen0Animal(testUser.id, 0)
            
            // Act: Try to breed with itself
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord1.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('CANNOT_BREED_SAME_ANIMAL')
        })

        test('should revert when not owning parent1', async () => {
            // Setup: Create animals for different users
            const otherUser = await createTestUserWithWallet(`other${Date.now()}@eggo.io`)
            animalRecord1 = await createGen0Animal(otherUser.id, 0)
            animalRecord2 = await createGen0Animal(testUser.id, 0)
            
            // Act: Try to breed (user doesn't own parent1)
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('NOT_OWNER_OF_PARENT1')
        })

        test('should revert when not owning parent2', async () => {
            // Setup: Create animals for different users
            const otherUser = await createTestUserWithWallet(`other${Date.now()}@eggo.io`)
            animalRecord1 = await createGen0Animal(testUser.id, 0)
            animalRecord2 = await createGen0Animal(otherUser.id, 0)
            
            // Act: Try to breed (user doesn't own parent2)
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('NOT_OWNER_OF_PARENT2')
        })

        test('should deduct breeding fee (5 USDT)', async () => {
            // Setup: Create two animals
            animalRecord1 = await createGen0Animal(testUser.id, 0)
            animalRecord2 = await createGen0Animal(testUser.id, 0)
            
            const walletBefore = await pb.collection('user_wallets').getFirstListItem(`owner = "${testUser.id}"`)
            const balanceBefore = walletBefore.usdt_balance
            
            // Act: Breed them
            await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            // Assert
            const walletAfter = await pb.collection('user_wallets').getFirstListItem(`owner = "${testUser.id}"`)
            expect(walletAfter.usdt_balance).toBe(balanceBefore - 5)
        })

        test('should store parent lineage in breeding egg', async () => {
            // Setup: Create two animals
            animalRecord1 = await createGen0Animal(testUser.id, 0)
            animalRecord2 = await createGen0Animal(testUser.id, 0)
            
            // Act: Breed them
            const response = await fetch(`${PB_URL}/api/v2/breed-animals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    parent1_animal_id: animalRecord1.animal_id,
                    parent2_animal_id: animalRecord2.animal_id,
                    referrer_id: null
                })
            })
            
            const result = await response.json()
            
            // Assert: Check egg record
            const egg = await pb.collection('egg_nfts').getOne(result.data.breeding_egg_id)
            expect(egg.is_breeding_egg).toBe(true)
            expect(egg.parent1_animal_id).toBe(animalRecord1.animal_id)
            expect(egg.parent2_animal_id).toBe(animalRecord2.animal_id)
        })
    })

    describe('Egg Hatching', () => {
        test('should hatch egg with 10+ food into animal', async () => {
            // Setup: Create egg with 10 food
            eggRecord = await createEggWithFood(10)
            
            // Act: Hatch egg
            const response = await fetch(`${PB_URL}/api/v2/hatch-egg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(true)
            expect(result.data.animal_token_id).toBeDefined()
        })

        test('should revert when food_count < 10', async () => {
            // Setup: Create egg with only 5 food
            eggRecord = await createEggWithFood(5)
            
            // Act: Try to hatch
            const response = await fetch(`${PB_URL}/api/v2/hatch-egg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('INSUFFICIENT_FOOD')
        })

        test('should revert when egg already hatched', async () => {
            // Setup: Create hatched egg
            eggRecord = await createEggWithFood(10, true)
            
            // Act: Try to hatch again
            const response = await fetch(`${PB_URL}/api/v2/hatch-egg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id
                })
            })
            
            const result = await response.json()
            
            // Assert
            expect(result.success).toBe(false)
            expect(result.error.code).toBe('EGG_ALREADY_HATCHED')
        })

        test('should create animal_nfts record on hatch', async () => {
            // Setup: Create egg with 10 food
            eggRecord = await createEggWithFood(10)
            
            // Act: Hatch egg
            const response = await fetch(`${PB_URL}/api/v2/hatch-egg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id
                })
            })
            
            const result = await response.json()
            
            // Assert: Check animal record created
            const animals = await pb.collection('animal_nfts').getList(1, 1, {
                filter: `token_id = ${result.data.animal_token_id}`
            })
            expect(animals.items.length).toBe(1)
            expect(animals.items[0].generation).toBe(0)
        })

        test('should mark egg as hatched', async () => {
            // Setup: Create egg with 10 food
            eggRecord = await createEggWithFood(10)
            
            // Act: Hatch egg
            await fetch(`${PB_URL}/api/v2/hatch-egg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pb.authStore.token}`
                },
                body: JSON.stringify({
                    egg_token_id: eggRecord.token_id
                })
            })
            
            // Assert: Check egg updated
            const egg = await pb.collection('egg_nfts').getOne(eggRecord.id)
            expect(egg.is_hatched).toBe(true)
        })
    })

    // Helper functions
    async function cleanupTestData() {
        try {
            const eggs = await pb.collection('egg_nfts').getList(1, 100)
            for (const egg of eggs.items) {
                await pb.collection('egg_nfts').delete(egg.id)
            }
        } catch (e) { /* ignore */ }
        
        try {
            const animals = await pb.collection('animal_nfts').getList(1, 100)
            for (const animal of animals.items) {
                await pb.collection('animal_nfts').delete(animal.id)
            }
        } catch (e) { /* ignore */ }
    }

    async function createTestUserWithWallet(email, referrerId = null) {
        const userData = {
            email,
            password: 'testpassword123',
            passwordConfirm: 'testpassword123',
            name: 'Test User',
            referral_code: referrerId ? null : `REF${Date.now()}`
        }
        
        if (referrerId) {
            userData.referrer_id = referrerId
        }
        
        const user = await pb.collection('users').create(userData)
        
        // Ensure wallet exists
        await pb.collection('user_wallets').create({
            owner: user.id,
            usdt_balance: 1000, // Give enough for tests
            wallet: `0x${Date.now().toString(16).padStart(40, '0')}`,
            daccPublickey: `pub${Date.now()}`
        })
        
        return user
    }

    async function createEggWithFood(foodCount, isHatched = false, isBreedingEgg = false, generation = 0) {
        const eggData = {
            egg_id: Date.now(),
            owner: testUser.id,
            token_id: Date.now(),
            contract_address: '0x1234567890123456789012345678901234567890',
            food_count: foodCount,
            is_hatched: isHatched,
            is_breeding_egg: isBreedingEgg,
            generation: generation,
            parent1_animal_id: 0,
            parent2_animal_id: 0,
            rarity_upgrade_count: 0,
            rarity_seed: Math.floor(Math.random() * 1000000),
            tx_hash: `0x${Date.now().toString(16).padStart(64, '0')}`,
            minted_at: new Date().toISOString()
        }
        
        return await pb.collection('egg_nfts').create(eggData)
    }

    async function createGen0Animal(ownerId, generation) {
        const animalData = {
            animal_id: Date.now(),
            token_id: Date.now(),
            owner: ownerId,
            species: 'Chicken',
            rarity: 'Common',
            generation: generation,
            parent_egg_id: 0,
            parent1_animal_id: 0,
            parent2_animal_id: 0,
            food_type_distribution: { grain: 4, fish: 3, insects: 2, herb: 1 },
            rarity_upgrade_count: 0,
            contract_address: '0x1234567890123456789012345678901234567890',
            tx_hash: `0x${Date.now().toString(16).padStart(64, '0')}`,
            minted_at: new Date().toISOString()
        }
        
        return await pb.collection('animal_nfts').create(animalData)
    }
})
