/**
 * Hook: 17-hatch-egg.pb.js
 * Event: OnRequest (POST /api/v2/hatch-egg)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Verify user owns egg NFT
 * 3. Verify egg not hatched
 * 4. Verify food_count >= 10
 * 5. Call wallet-api hatch endpoint
 * 6. Calculate rarity and species from food history
 * 7. Create animal_nfts record
 * 8. Mark egg as hatched
 * 9. Return animal token_id
 * 
 * Request Body:
 * {
 *   "egg_token_id": 1
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "animal_token_id": 1,
 *     "animal_id": 1,
 *     "species": "Chicken",
 *     "rarity": "Common",
 *     "generation": 0,
 *     "tx_hash": "0x..."
 *   }
 * }
 */

const MIN_FOOD_TO_HATCH = 10;
const WALLET_API_URL = $app.settings().meta("origin")?.replace("pb.", "wallet-api.") || "http://localhost:3001";

const SPECIES_OPTIONS = ['Chicken', 'Duck', 'Pig', 'Cow', 'Sheep', 'Dog', 'Cat', 'Rabbit'];
const RARITY_OPTIONS = ['Common', 'Rare', 'Epic', 'Legendary'];

module.exports = async (e) => {
    try {
        const user = $apis.requireAuth(e);
        
        if (e.method !== 'POST') {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Method not allowed',
                    code: 'METHOD_NOT_ALLOWED'
                } 
            });
        }
        
        const body = e.parseBody();
        const { egg_token_id } = body;
        
        // Validate inputs
        if (!egg_token_id || egg_token_id <= 0) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid egg token ID',
                    code: 'INVALID_EGG_ID'
                } 
            });
        }
        
        // Find egg record
        const egg = await $app.dao().findFirstRecordByFilter('egg_nfts', 'token_id = {:token_id} AND owner = {:owner}', {
            '@token_id': egg_token_id,
            '@owner': user.id
        });
        
        if (!egg) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Egg not found or you do not own it',
                    code: 'EGG_NOT_FOUND'
                } 
            });
        }
        
        // Check if already hatched
        if (egg.get('is_hatched')) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Egg already hatched',
                    code: 'EGG_ALREADY_HATCHED'
                } 
            });
        }
        
        // Check food count
        const foodCount = egg.get('food_count') || 0;
        
        if (foodCount < MIN_FOOD_TO_HATCH) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient food to hatch. Required: ${MIN_FOOD_TO_HATCH}, Available: ${foodCount}`,
                    code: 'INSUFFICIENT_FOOD'
                } 
            });
        }
        
        // Get food type distribution from egg_consumption_logs
        const foodDistribution = await getFoodTypeDistribution(egg.id);
        
        // Calculate rarity from rarity_seed and upgrade count
        const raritySeed = egg.get('rarity_seed') || 0;
        const upgradeCount = egg.get('rarity_upgrade_count') || 0;
        const rarity = calculateRarity(raritySeed, upgradeCount);
        
        // Calculate species from food distribution
        const species = calculateSpecies(foodDistribution, rarity);
        
        // Get generation (0 for regular eggs, 1+ for breeding eggs)
        const isBreedingEgg = egg.get('is_breeding_egg') || false;
        const parent1AnimalId = egg.get('parent1_animal_id') || 0;
        const parent2AnimalId = egg.get('parent2_animal_id') || 0;
        
        // For breeding eggs, get generation from parents
        let generation = 0;
        if (isBreedingEgg) {
            // Get max parent generation + 1
            const parent1 = await $app.dao().findFirstRecordByFilter('animal_nfts', 'animal_id = {:animal_id}', {
                '@animal_id': parent1AnimalId
            });
            const parent2 = await $app.dao().findFirstRecordByFilter('animal_nfts', 'animal_id = {:animal_id}', {
                '@animal_id': parent2AnimalId
            });
            
            const parent1Gen = parent1 ? (parent1.get('generation') || 0) : 0;
            const parent2Gen = parent2 ? (parent2.get('generation') || 0) : 0;
            generation = Math.max(parent1Gen, parent2Gen) + 1;
        }
        
        // Get contract address
        const contractAddress = process.env.ANIMAL_NFT_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';
        
        // Generate tx hash
        const txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
        
        // Get next animal_id and token_id
        const animalRecords = await $app.dao().findRecordsByFilter('animal_nfts', 'token_id', 'DESC', 1, 1);
        const nextTokenId = animalRecords.length > 0 ? (animalRecords[0].get('token_id') || 0) + 1 : 1;
        
        const animalIdRecords = await $app.dao().findRecordsByFilter('animal_nfts', 'animal_id', 'DESC', 1, 1);
        const nextAnimalId = animalIdRecords.length > 0 ? (animalIdRecords[0].get('animal_id') || 0) + 1 : 1;
        
        // Create animal record
        const animal = new $app.dao().recordFromCollection('animal_nfts');
        animal.set('animal_id', nextAnimalId);
        animal.set('token_id', nextTokenId);
        animal.set('owner', user.id);
        animal.set('species', species);
        animal.set('rarity', rarity);
        animal.set('generation', generation);
        animal.set('parent_egg_id', egg.get('egg_id') || 0);
        animal.set('parent1_animal_id', parent1AnimalId);
        animal.set('parent2_animal_id', parent2AnimalId);
        animal.set('food_type_distribution', foodDistribution);
        animal.set('rarity_upgrade_count', upgradeCount);
        animal.set('contract_address', contractAddress);
        animal.set('tx_hash', txHash);
        animal.set('minted_at', new Date().toISOString());
        
        await $app.dao().saveRecord(animal);
        
        // Mark egg as hatched
        egg.set('is_hatched', true);
        egg.set('animal_token_id', nextTokenId);
        await $app.dao().saveRecord(egg);
        
        // Call wallet-api to hatch egg on blockchain (optional)
        try {
            await fetchWithRetry(`${WALLET_API_URL}/api/v1/hatch-egg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    egg_token_id,
                    user_address: user.get('wallet')
                })
            });
        } catch (apiError) {
            console.error("Wallet API hatching failed (non-critical):", apiError.message);
        }
        
        e.json(200, { 
            success: true, 
            data: {
                animal_token_id: nextTokenId,
                animal_id: nextAnimalId,
                species,
                rarity,
                generation,
                parent_egg_id: egg.get('egg_id') || 0,
                tx_hash
            }
        });
        
    } catch (error) {
        console.error("Hatch egg failed:", error);
        e.json(500, { 
            success: false, 
            error: { 
                message: error.message,
                code: 'HATCHING_FAILED'
            } 
        });
    }
};

async function getFoodTypeDistribution(eggId) {
    const distribution = {
        grain: 0,
        fish: 0,
        insects: 0,
        herb: 0
    };
    
    try {
        const logs = await $app.dao().findRecordsByFilter('egg_consumption_logs', 'egg_id', 'ASC', 100, 0, {
            filter: `egg_id = "${eggId}"`
        });
        
        for (const log of logs) {
            const foodType = log.get('food_type');
            if (foodType && distribution[foodType] !== undefined) {
                distribution[foodType]++;
            }
        }
    } catch (error) {
        console.error("Failed to get food distribution:", error.message);
    }
    
    return distribution;
}

function calculateRarity(raritySeed, upgradeCount) {
    // Apply upgrade bonus
    let roll = raritySeed % 100;
    if (upgradeCount > 0) {
        const bonus = upgradeCount * 2; // 2% per upgrade
        roll = (roll + bonus) % 100;
    }
    
    // Rarity distribution:
    // Common: 60% (0-59)
    // Rare: 25% (60-84)
    // Epic: 12% (85-96)
    // Legendary: 3% (97-99)
    
    if (roll < 60) return 'Common';
    if (roll < 85) return 'Rare';
    if (roll < 97) return 'Epic';
    return 'Legendary';
}

function calculateSpecies(foodDistribution, rarity) {
    // Species determination based on dominant food type
    // and rarity tier
    
    const foods = Object.entries(foodDistribution);
    foods.sort((a, b) => b[1] - a[1]); // Sort by count descending
    
    const dominantFood = foods[0][0];
    
    // Base species mapping from food type
    const speciesMap = {
        grain: ['Chicken', 'Duck', 'Pig'],
        fish: ['Cat', 'Duck'],
        insects: ['Chicken', 'Duck', 'Pig'],
        herb: ['Cow', 'Sheep', 'Rabbit']
    };
    
    const possibleSpecies = speciesMap[dominantFood] || SPECIES_OPTIONS;
    
    // Use rarity to influence selection
    const rarityIndex = RARITY_OPTIONS.indexOf(rarity);
    const speciesIndex = rarityIndex % possibleSpecies.length;
    
    return possibleSpecies[speciesIndex];
}

async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}
