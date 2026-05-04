/**
 * Hook: 17-upgrade-egg-rarity.pb.js
 * Event: Router (POST /api/v2/upgrade-egg-rarity)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Verify user owns egg NFT
 * 3. Verify egg not hatched
 * 4. Verify food_count >= 10
 * 5. Verify food_count + food_ids.length <= 20
 * 6. Call wallet-api upgrade endpoint
 * 7. Deduct upgrade fee (5 USDT per food item)
 * 8. Update egg rarity_upgrade_count and food_count
 * 9. Create commission records
 * 10. Return success
 * 
 * Request Body:
 * {
 *   "egg_token_id": 1,
 *   "food_ids": [101, 102, 103]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "egg_token_id": 1,
 *     "new_food_count": 13,
 *     "rarity_upgrade_count": 3,
 *     "rarity_bonus": 6,
 *     "tx_hash": "0x..."
 *   }
 * }
 */

const UPGRADE_FEE_PER_FOOD = 5; // 5 USDT per food item
const MAX_FOOD_COUNT = 20;
const MIN_FOOD_FOR_UPGRADE = 10;
var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"

routerAdd("POST", "/api/v2/upgrade-egg-rarity", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const user = $app.findRecordById("users", userId);
        if (!user) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        const body = e.parseBody();
        const { egg_token_id, food_ids } = body;
        
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
        
        if (!food_ids || !Array.isArray(food_ids) || food_ids.length === 0) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Food IDs array is required',
                    code: 'INVALID_FOOD_IDS'
                } 
            });
        }
        
        // Find egg record
        const egg = $app.dao().findFirstRecordByFilter('egg_nfts', 'token_id = {:token_id} AND owner = {:owner}', {
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
        const currentFoodCount = egg.get('food_count') || 0;
        
        if (currentFoodCount < MIN_FOOD_FOR_UPGRADE) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Must feed egg ${MIN_FOOD_FOR_UPGRADE} times before upgrading`,
                    code: 'MUST_FEED_10_FIRST'
                } 
            });
        }
        
        // Check max food limit
        const newFoodCount = currentFoodCount + food_ids.length;
        if (newFoodCount > MAX_FOOD_COUNT) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Max food count is ${MAX_FOOD_COUNT}. Current: ${currentFoodCount}, Adding: ${food_ids.length}`,
                    code: 'MAX_FOOD_EXCEEDED'
                } 
            });
        }
        
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
        
        // Calculate and deduct upgrade fee
        const upgradeFee = food_ids.length * UPGRADE_FEE_PER_FOOD;
        const currentBalance = parseFloat(wallet.get('usdt_balance') || '0');
        
        if (currentBalance < upgradeFee) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient USDT balance. Required: ${upgradeFee} USDT, Available: ${currentBalance} USDT`,
                    code: 'INSUFFICIENT_BALANCE'
                } 
            });
        }
        
        // Deduct fee from wallet
        wallet.set('usdt_balance', (currentBalance - upgradeFee).toString());
        $app.dao().saveRecord(wallet);
        
        // Update user's usdt_balance as well
        user.set('usdt_balance', (parseFloat(user.get('usdt_balance') || '0') - upgradeFee).toString());
        $app.dao().saveRecord(user);
        
        // Get referral chain from egg
        const referralChain = egg.get('referral_chain') || [];
        
        // Create commission records
        if (referralChain.length > 0 && referralChain[0]) {
            createCommissionRecords(referralChain, upgradeFee, egg.id, 'upgrade');
        }
        
        // Calculate rarity bonus
        const upgradeCount = newFoodCount - MIN_FOOD_FOR_UPGRADE;
        const rarityBonus = upgradeCount * 2; // 2% per extra food
        
        // Update egg record
        egg.set('food_count', newFoodCount);
        egg.set('rarity_upgrade_count', upgradeCount);
        $app.dao().saveRecord(egg);
        
        // Call wallet-api to burn food and update blockchain (optional, for sync)
        try {
            fetchWithRetry(WALLET_SRV_URL + '/api/v1/upgrade-egg-rarity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    egg_token_id,
                    food_ids,
                    user_address: wallet.get('wallet')
                })
            });
        } catch (apiError) {
            console.error("Wallet API upgrade failed (non-critical):", apiError.message);
        }
        
        return e.json(200, { 
            success: true, 
            data: {
                egg_token_id,
                new_food_count: newFoodCount,
                rarity_upgrade_count: upgradeCount,
                rarity_bonus: rarityBonus,
                fee_deducted: upgradeFee
            }
        });
        
    } catch (error) {
        console.error("Upgrade egg rarity failed:", error);
        return e.json(500, { 
            success: false, 
            error: { 
                message: error.message,
                code: 'UPGRADE_FAILED'
            } 
        });
    }
});

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
