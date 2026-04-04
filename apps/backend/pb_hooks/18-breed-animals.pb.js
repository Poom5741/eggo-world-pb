/**
 * Hook: 18-breed-animals.pb.js
 * Event: Router (POST /api/v2/breed-animals)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Verify parent1 ownership
 * 3. Verify parent2 ownership
 * 4. Verify parent1 != parent2
 * 5. Get parent generations and calculate child generation
 * 6. Call wallet-api breed endpoint
 * 7. Deduct breeding fee (5 USDT)
 * 8. Create breeding egg record
 * 9. Create commission records
 * 10. Return breeding egg token_id
 * 
 * Request Body:
 * {
 *   "parent1_animal_id": 1,
 *   "parent2_animal_id": 2,
 *   "referrer_id": "user_id" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "breeding_egg_id": "record_id",
 *     "token_id": 3,
 *     "generation": 1,
 *     "parent1_animal_id": 1,
 *     "parent2_animal_id": 2,
 *     "tx_hash": "0x..."
 *   }
 * }
 */

const BREEDING_FEE = 5; // 5 USDT
var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
var INITIAL_FOOD_COUNT = parseInt($os.getenv("INITIAL_FOOD_COUNT") || "2", 10)

routerAdd("POST", "/api/v2/breed-animals", (e) => {
    try {
        const user = $apis.requireAuth(e);
        
        const body = e.parseBody();
        const { parent1_animal_id, parent2_animal_id, referrer_id } = body;
        
        // Validate inputs
        if (!parent1_animal_id || parent1_animal_id <= 0) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid parent1 animal ID',
                    code: 'INVALID_PARENT1_ID'
                } 
            });
        }
        
        if (!parent2_animal_id || parent2_animal_id <= 0) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid parent2 animal ID',
                    code: 'INVALID_PARENT2_ID'
                } 
            });
        }
        
        // Check cannot breed same animal
        if (parent1_animal_id === parent2_animal_id) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Cannot breed the same animal',
                    code: 'CANNOT_BREED_SAME_ANIMAL'
                } 
            });
        }
        
        // Find parent1 animal
        const parent1 = $app.dao().findFirstRecordByFilter('animal_nfts', 'animal_id = {:animal_id}', {
            '@animal_id': parent1_animal_id
        });
        
        if (!parent1) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Parent1 animal not found',
                    code: 'PARENT1_NOT_FOUND'
                } 
            });
        }
        
        // Find parent2 animal
        const parent2 = $app.dao().findFirstRecordByFilter('animal_nfts', 'animal_id = {:animal_id}', {
            '@animal_id': parent2_animal_id
        });
        
        if (!parent2) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Parent2 animal not found',
                    code: 'PARENT2_NOT_FOUND'
                } 
            });
        }
        
        // Verify ownership of parent1
        if (parent1.get('owner') !== user.id) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'You do not own parent1 animal',
                    code: 'NOT_OWNER_OF_PARENT1'
                } 
            });
        }
        
        // Verify ownership of parent2
        if (parent2.get('owner') !== user.id) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'You do not own parent2 animal',
                    code: 'NOT_OWNER_OF_PARENT2'
                } 
            });
        }
        
        // Get parent generations
        const parent1Gen = parent1.get('generation') || 0;
        const parent2Gen = parent2.get('generation') || 0;
        
        // Calculate child generation: max(parent1, parent2) + 1
        const childGeneration = Math.max(parent1Gen, parent2Gen) + 1;
        
        // Get user wallet
        const wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
            '@owner': user.id
        });
        
        if (!wallet) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Wallet not found',
                    code: 'WALLET_NOT_FOUND'
                } 
            });
        }
        
        // Check and deduct breeding fee
        const currentBalance = parseFloat(wallet.get('usdt_balance') || '0');
        
        if (currentBalance < BREEDING_FEE) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient USDT balance. Required: ${BREEDING_FEE} USDT, Available: ${currentBalance} USDT`,
                    code: 'INSUFFICIENT_BALANCE'
                } 
            });
        }
        
        // Deduct breeding fee
        wallet.set('usdt_balance', (currentBalance - BREEDING_FEE).toString());
        $app.dao().saveRecord(wallet);
        
        // Update user's usdt_balance
        user.set('usdt_balance', (parseFloat(user.get('usdt_balance') || '0') - BREEDING_FEE).toString());
        $app.dao().saveRecord(user);
        
        // Build referral chain
        let referralChain = [null, null, null, null];
        
        if (referrer_id) {
            const referrer = $app.dao().findRecordById('users', referrer_id);
            if (referrer) {
                const referrerWallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
                    '@owner': referrer.id
                });
                
                if (referrerWallet) {
                    referralChain[0] = referrerWallet.get('wallet');
                    
                    // Build G2-G4 chain
                    buildReferralChain(referrer, referralChain, 1);
                }
            }
        }
        
        // Create commission records
        if (referralChain[0]) {
            createCommissionRecords(referralChain, BREEDING_FEE, null, 'breeding');
        }
        
        // Get contract address from environment or use default
        const contractAddress = process.env.EGG_NFT_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';
        
        // Generate tx hash (mock for now, should come from blockchain)
        const txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
        
        // Generate token_id and egg_id
        const eggRecords = $app.dao().findRecordsByFilter('egg_nfts', 'token_id', 'DESC', 1, 1);
        const nextTokenId = eggRecords.length > 0 ? (eggRecords[0].get('token_id') || 0) + 1 : 1;
        
        // Create breeding egg record
        const breedingEgg = $app.dao().createRecord($app.dao().getCollectionByNameOrId('egg_nfts'));
        breedingEgg.set('egg_id', nextTokenId - 1);
        breedingEgg.set('owner', user.id);
        breedingEgg.set('token_id', nextTokenId);
        breedingEgg.set('contract_address', contractAddress);
        breedingEgg.set('food_count', INITIAL_FOOD_COUNT);
        breedingEgg.set('is_hatched', false);
        breedingEgg.set('is_breeding_egg', true);
        breedingEgg.set('generation', childGeneration);
        breedingEgg.set('parent1_animal_id', parent1_animal_id);
        breedingEgg.set('parent2_animal_id', parent2_animal_id);
        breedingEgg.set('rarity_upgrade_count', 0);
        breedingEgg.set('rarity_seed', Math.floor(Math.random() * 1000000));
        breedingEgg.set('referral_chain', referralChain.filter(r => r !== null));
        breedingEgg.set('tx_hash', txHash);
        breedingEgg.set('minted_at', new Date().toISOString());
        
        $app.dao().saveRecord(breedingEgg);
        
        // Call wallet-api to create breeding egg on blockchain (optional)
        try {
            fetchWithRetry(WALLET_SRV_URL + '/api/v1/breed-animals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parent1_token_id: parent1.get('token_id'),
                    parent2_token_id: parent2.get('token_id'),
                    referrer: referralChain[0] || null,
                    user_address: wallet.get('wallet')
                })
            });
        } catch (apiError) {
            console.error("Wallet API breeding failed (non-critical):", apiError.message);
        }
        
        return e.json(200, { 
            success: true, 
            data: {
                breeding_egg_id: breedingEgg.id,
                token_id: nextTokenId,
                generation: childGeneration,
                parent1_animal_id,
                parent2_animal_id,
                tx_hash,
                fee_deducted: BREEDING_FEE
            }
        });
        
    } catch (error) {
        console.error("Breed animals failed:", error);
        return e.json(500, { 
            success: false, 
            error: { 
                message: error.message,
                code: 'BREEDING_FAILED'
            } 
        });
    }
});

function buildReferralChain(user, chain, level) {
    if (level >= 4) return;
    
    const referrerId = user.get('referrer_id');
    if (!referrerId) return;
    
    const referrer = $app.dao().findRecordById('users', referrerId);
    if (!referrer) return;
    
    const referrerWallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
        '@owner': referrer.id
    });
    
    if (referrerWallet) {
        chain[level] = referrerWallet.get('wallet');
        buildReferralChain(referrer, chain, level + 1);
    }
}

function createCommissionRecords(referralChain, totalAmount, eggId, type) {
    const commissionSplits = [0.25, 0.15, 0.10, 0.05]; // G1, G2, G3, G4
    
    for (let i = 0; i < Math.min(referralChain.length, 4); i++) {
        const referrerWallet = referralChain[i];
        if (!referrerWallet) continue;
        
        const commissionAmount = totalAmount * commissionSplits[i];
        if (commissionAmount <= 0) continue;
        
        // Find referrer by wallet
        const referrerWalletRecord = $app.dao().findFirstRecordByFilter('user_wallets', 'wallet = {:wallet}', {
            '@wallet': referrerWallet
        });
        
        if (!referrerWalletRecord) continue;
        
        const referrerId = referrerWalletRecord.get('owner');
        
        // Create commission record
        const commission = $app.dao().createRecord($app.dao().getCollectionByNameOrId('commission_records'));
        commission.set('egg_id', eggId);
        commission.set('referrer_id', referrerId);
        commission.set('referrer_wallet', referrerWallet);
        commission.set('generation', i + 1);
        commission.set('amount', commissionAmount.toString());
        commission.set('type', type);
        commission.set('distributed_at', new Date().toISOString());
        
        $app.dao().saveRecord(commission);
        
        // Update referrer wallet balance
        const currentBalance = parseFloat(referrerWalletRecord.get('usdt_balance') || '0');
        referrerWalletRecord.set('usdt_balance', (currentBalance + commissionAmount).toString());
        referrerWalletRecord.set('total_earned', (parseFloat(referrerWalletRecord.get('total_earned') || '0') + commissionAmount).toString());
        $app.dao().saveRecord(referrerWalletRecord);
    }
}

function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = fetch(url, options);
            return response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
        }
    }
}
