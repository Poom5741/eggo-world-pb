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
const BREED_COOLDOWN_HOURS = 48; // 48 hour cooldown per AnimalNFT.sol
var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
var INITIAL_FOOD_COUNT = parseInt($os.getenv("INITIAL_FOOD_COUNT") || "2", 10)

/**
 * Check if an animal is on breeding cooldown
 * ตรวจสอบว่าสัตว์อยู่ในระยะ cooldown หรือไม่
 */
function isOnCooldown(lastBredAt) {
    if (!lastBredAt) return false;
    
    const lastBred = new Date(lastBredAt).getTime();
    const cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000;
    const cooldownEnd = lastBred + cooldownMs;
    
    return Date.now() < cooldownEnd;
}

/**
 * Format remaining cooldown time for error messages
 */
function formatCooldownRemaining(lastBredAt) {
    if (!lastBredAt) return '';
    
    const lastBred = new Date(lastBredAt).getTime();
    const cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000;
    const cooldownEnd = lastBred + cooldownMs;
    const remainingMs = Math.max(0, cooldownEnd - Date.now());
    
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

routerAdd("POST", "/api/v2/breed-animals", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const user = $app.findRecordById("users", userId);
        if (!user) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
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
        
        // Check breeding cooldown for parent1 (fast-fail pattern per 16-feed-egg.pb.js)
        const parent1LastBred = parent1.get('last_bred_at');
        if (isOnCooldown(parent1LastBred)) {
            const remaining = formatCooldownRemaining(parent1LastBred);
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Parent 1 is on breeding cooldown. Ready in ${remaining}`,
                    code: 'PARENT1_ON_COOLDOWN',
                    cooldown_remaining_ms: new Date(parent1LastBred).getTime() + (BREED_COOLDOWN_HOURS * 60 * 60 * 1000) - Date.now()
                } 
            });
        }
        
        // Check breeding cooldown for parent2
        const parent2LastBred = parent2.get('last_bred_at');
        if (isOnCooldown(parent2LastBred)) {
            const remaining = formatCooldownRemaining(parent2LastBred);
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Parent 2 is on breeding cooldown. Ready in ${remaining}`,
                    code: 'PARENT2_ON_COOLDOWN',
                    cooldown_remaining_ms: new Date(parent2LastBred).getTime() + (BREED_COOLDOWN_HOURS * 60 * 60 * 1000) - Date.now()
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
        
        // Get contract addresses from environment
        const eggContractAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        const animalContractAddress = $os.getenv('ANIMAL_NFT_CONTRACT_ADDRESS') || '0x1234567890123456789012345678901234567890';
        
        // Call wallet-api to execute breeding on blockchain
        let txHash = null;
        let blockchainResult = null;
        
        try {
            const breedResponse = fetch(WALLET_SRV_URL + '/api/wallet/breed-animals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    parent1TokenId: parent1.get('token_id'),
                    parent2TokenId: parent2.get('token_id'),
                    animalNftAddress: animalContractAddress
                })
            });
            
            if (!breedResponse.ok) {
                const errorData = breedResponse.json();
                console.error("Wallet API breeding failed:", errorData);
                // Log but don't rollback - egg record will be created without tx_hash
                // This is intentional per requirements: "log but don't rollback"
            } else {
                blockchainResult = breedResponse.json();
                if (blockchainResult.success) {
                    txHash = blockchainResult.data.txHash;
                    console.log("Blockchain breeding successful:", txHash);
                } else {
                    console.error("Blockchain breeding returned error:", blockchainResult.error);
                }
            }
        } catch (apiError) {
            // Comprehensive error handling - log but don't rollback
            console.error("Wallet API breeding error (non-critical):", apiError.message);
            // Continue with egg creation even if blockchain call fails
            // This ensures the database state is consistent even if blockchain is temporarily unavailable
        }
        
        // Generate token_id and egg_id
        const eggRecords = $app.dao().findRecordsByFilter('egg_nfts', 'token_id', 'DESC', 1, 1);
        const nextTokenId = eggRecords.length > 0 ? (eggRecords[0].get('token_id') || 0) + 1 : 1;
        
        // Set last_bred_at for both parents to enforce cooldown
        const now = new Date().toISOString();
        parent1.set('last_bred_at', now);
        parent2.set('last_bred_at', now);
        $app.dao().saveRecord(parent1);
        $app.dao().saveRecord(parent2);
        
        // Create breeding egg record
        const breedingEgg = $app.dao().createRecord($app.dao().getCollectionByNameOrId('egg_nfts'));
        breedingEgg.set('egg_id', nextTokenId - 1);
        breedingEgg.set('owner', user.id);
        breedingEgg.set('token_id', nextTokenId);
        breedingEgg.set('contract_address', eggContractAddress);
        breedingEgg.set('food_count', INITIAL_FOOD_COUNT);
        breedingEgg.set('is_hatched', false);
        breedingEgg.set('is_breeding_egg', true);
        breedingEgg.set('generation', childGeneration);
        breedingEgg.set('parent1_animal_id', parent1_animal_id);
        breedingEgg.set('parent2_animal_id', parent2_animal_id);
        breedingEgg.set('rarity_upgrade_count', 0);
        breedingEgg.set('rarity_seed', Math.floor(Math.random() * 1000000));
        breedingEgg.set('referral_chain', referralChain.filter(r => r !== null));
        breedingEgg.set('tx_hash', txHash || '');
        
        // Store blockchain result metadata if available
        if (blockchainResult && blockchainResult.data) {
            breedingEgg.set('blockchain_parent1_token_id', blockchainResult.data.parent1TokenId);
            breedingEgg.set('blockchain_parent2_token_id', blockchainResult.data.parent2TokenId);
            if (blockchainResult.data.childTokenId) {
                breedingEgg.set('blockchain_child_token_id', blockchainResult.data.childTokenId);
            }
            if (blockchainResult.data.childGeneration) {
                breedingEgg.set('blockchain_child_generation', blockchainResult.data.childGeneration);
            }
        }
        breedingEgg.set('minted_at', now);
        
        $app.dao().saveRecord(breedingEgg);
        
        // Log breeding success for monitoring
        console.log(`Breeding completed: user=${user.id}, parent1=${parent1_animal_id}, parent2=${parent2_animal_id}, egg_token_id=${nextTokenId}, tx_hash=${txHash || 'N/A'}`);
        
        // Transaction logging for monitoring dashboard
        try {
            const transactionLogsCollection = $app.dao().getCollectionByNameOrId('transaction_logs');
            const transactionLog = $app.dao().createRecord(transactionLogsCollection);
            transactionLog.set('user', user.id);
            transactionLog.set('tx_hash', txHash || '');
            transactionLog.set('tx_type', 'breed');
            transactionLog.set('status', 'success');
            transactionLog.set('gas_used', null); // Not captured in this flow
            $app.dao().saveRecord(transactionLog);
        } catch (logErr) {
            console.error("Failed to log breeding transaction:", logErr);
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
        
        // Log breeding failure for monitoring
        try {
            const transactionLogsCollection = $app.dao().getCollectionByNameOrId('transaction_logs');
            const transactionLog = $app.dao().createRecord(transactionLogsCollection);
            transactionLog.set('user', user ? user.id : null);
            transactionLog.set('tx_hash', null);
            transactionLog.set('tx_type', 'breed');
            transactionLog.set('status', 'failed');
            transactionLog.set('error_message', error.message || String(error));
            $app.dao().saveRecord(transactionLog);
        } catch (logErr) {
            console.error("Failed to log breeding error transaction:", logErr);
        }
        
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

/**
 * Request Breed (VRF Phase 1)
 * POST /api/v2/breed-animals/request
 * 
 * Validates parents, deducts fee, requests VRF via wallet-api
 */
routerAdd("POST", "/api/v2/breed-animals/request", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const user = $app.findRecordById("users", userId);
        if (!user) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        const body = e.parseBody();
        const { parent1_token_id, parent2_token_id, referrer_address } = body;
        
        if (!parent1_token_id || !parent2_token_id) {
            return e.json(400, { success: false, error: { message: "parent1_token_id and parent2_token_id required", code: "VALIDATION_ERROR" } });
        }
        if (parent1_token_id === parent2_token_id) {
            return e.json(400, { success: false, error: { message: "Cannot breed same animal", code: "CANNOT_BREED_SAME_ANIMAL" } });
        }
        
        // Check USDT balance for breeding fee
        const wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', { '@owner': userId });
        if (!wallet) { return e.json(400, { success: false, error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } }); }
        
        const currentBalance = parseFloat(wallet.get('usdt_balance') || '0');
        if (currentBalance < BREEDING_FEE) {
            return e.json(400, { success: false, error: { message: "Insufficient balance for breeding fee (" + BREEDING_FEE + " USDT)", code: "INSUFFICIENT_BALANCE" } });
        }
        
        // Deduct fee
        wallet.set('usdt_balance', (currentBalance - BREEDING_FEE).toString());
        $app.dao().saveRecord(wallet);
        user.set('usdt_balance', (parseFloat(user.get('usdt_balance') || '0') - BREEDING_FEE).toString());
        $app.dao().saveRecord(user);
        
        // Build referral chain & create commission records
        let referralChain = [null, null, null, null];
        if (referrer_address) {
            const referrerWallet = $app.dao().findFirstRecordByFilter('user_wallets', 'wallet = {:wallet}', { '@wallet': referrer_address });
            if (referrerWallet) {
                referralChain[0] = referrerWallet.get('wallet');
                buildReferralChain($app.findRecordById('users', referrerWallet.get('owner')), referralChain, 1);
            }
        }
        if (referralChain[0]) {
            createCommissionRecords(referralChain, BREEDING_FEE, null, 'breeding');
        }
        
        // Call wallet-api to request VRF breed
        const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        const requestResponse = $http.send({
            url: WALLET_SRV_URL + '/api/wallet/request-breed',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                parent1TokenId: parent1_token_id,
                parent2TokenId: parent2_token_id,
                referrer: referrer_address || '',
                eggNftAddress: eggNftAddress
            })
        });
        
        let responseData;
        if (requestResponse.json && typeof requestResponse.json === 'object') {
            responseData = requestResponse.json;
        } else if (requestResponse.body) {
            var bodyStr = '';
            if (Array.isArray(requestResponse.body)) {
                for (var i = 0; i < requestResponse.body.length; i++) {
                    bodyStr += String.fromCharCode(requestResponse.body[i]);
                }
            } else { bodyStr = requestResponse.body; }
            responseData = JSON.parse(bodyStr);
        }
        
        if (!responseData || !responseData.success) {
            return e.json(500, { success: false, error: { message: "VRF breed request failed", code: "BREED_REQUEST_FAILED" } });
        }
        
        return e.json(200, {
            success: true,
            data: {
                request_id: responseData.data.requestId,
                tx_hash: responseData.data.txHash,
                status: "vrf_requested",
                message: "Breed requested. VRF randomness pending — call claim endpoint after ~2 minutes."
            }
        });
    } catch (error) {
        console.error("Breed request failed:", error);
        return e.json(500, { success: false, error: { message: error.message, code: "BREED_REQUEST_FAILED" } });
    }
});

/**
 * Claim Breed (VRF Phase 2)
 * POST /api/v2/breed-animals/claim
 * 
 * Claims breed after VRF fulfillment, creates egg record
 */
routerAdd("POST", "/api/v2/breed-animals/claim", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        
        const body = e.parseBody();
        const { request_id } = body;
        if (!request_id) { return e.json(400, { success: false, error: { message: "request_id required", code: "VALIDATION_ERROR" } }); }
        
        // Call wallet-api to claim breed (VRF phase 2)
        const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        const claimResponse = $http.send({
            url: WALLET_SRV_URL + '/api/wallet/claim-breed',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                requestId: request_id,
                eggNftAddress: eggNftAddress
            })
        });
        
        let responseData;
        if (claimResponse.json && typeof claimResponse.json === 'object') {
            responseData = claimResponse.json;
        } else if (claimResponse.body) {
            var bodyStr2 = '';
            if (Array.isArray(claimResponse.body)) {
                for (var j = 0; j < claimResponse.body.length; j++) {
                    bodyStr2 += String.fromCharCode(claimResponse.body[j]);
                }
            } else { bodyStr2 = claimResponse.body; }
            responseData = JSON.parse(bodyStr2);
        }
        
        if (!responseData || !responseData.success) {
            return e.json(400, { success: false, error: { message: "VRF not yet fulfilled or claim failed", code: "BREED_CLAIM_FAILED" } });
        }
        
        const eggTokenId = responseData.data.egg_token_id;
        const txHash = responseData.data.txHash;
        
        // Get parent info from pending breed (stored in request)
        // Calculate generation and other properties
        const parent1TokenId = body.parent1_token_id;
        const parent2TokenId = body.parent2_token_id;
        const childGeneration = body.child_generation || 1;
        
        // Create breeding egg record in PocketBase
        const eggRecords = $app.dao().findRecordsByFilter('egg_nfts', 'token_id', 'DESC', 1, 1);
        const nextTokenId = eggRecords.length > 0 ? (eggRecords[0].get('token_id') || 0) + 1 : 1;
        const now = new Date().toISOString();
        
        var breedingEgg;
        try {
            breedingEgg = $app.createRecord('egg_nfts');
        } catch (err) {
            breedingEgg = $app.dao().createRecord($app.dao().getCollectionByNameOrId('egg_nfts'));
        }
        breedingEgg.set('egg_id', nextTokenId - 1);
        breedingEgg.set('owner', userId);
        breedingEgg.set('token_id', nextTokenId);
        breedingEgg.set('contract_address', eggNftAddress);
        breedingEgg.set('food_count', INITIAL_FOOD_COUNT);
        breedingEgg.set('is_hatched', false);
        breedingEgg.set('is_breeding_egg', true);
        breedingEgg.set('generation', childGeneration);
        breedingEgg.set('parent1_animal_id', parent1TokenId);
        breedingEgg.set('parent2_animal_id', parent2TokenId);
        breedingEgg.set('rarity_upgrade_count', 0);
        breedingEgg.set('tx_hash', txHash || '');
        breedingEgg.set('minted_at', now);
        $app.save(breedingEgg);
        
        // Set parent cooldowns
        if (body.parent1_record_id) {
            var parent1 = $app.findRecordById('animal_nfts', body.parent1_record_id);
            if (parent1) {
                parent1.set('last_bred_at', now);
                $app.save(parent1);
            }
        }
        if (body.parent2_record_id) {
            var parent2 = $app.findRecordById('animal_nfts', body.parent2_record_id);
            if (parent2) {
                parent2.set('last_bred_at', now);
                $app.save(parent2);
            }
        }
        
        return e.json(200, {
            success: true,
            data: {
                egg_id: breedingEgg.id,
                token_id: nextTokenId,
                generation: childGeneration,
                parent1_animal_id: parent1TokenId,
                parent2_animal_id: parent2TokenId,
                tx_hash: txHash,
                status: "confirmed"
            }
        });
    } catch (error) {
        console.error("Breed claim failed:", error);
        return e.json(500, { success: false, error: { message: error.message, code: "BREED_CLAIM_FAILED" } });
    }
});
