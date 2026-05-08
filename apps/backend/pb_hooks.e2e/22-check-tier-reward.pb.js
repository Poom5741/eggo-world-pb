/**
 * Hook: 22-check-tier-reward.pb.js
 * Event: Router (POST /api/v2/check-tier-reward)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate tier parameter
 * 3. Check lifetime_food_items >= threshold (fast-fail)
 * 4. Check highest_tier_reached for sequential claim
 * 5. Call wallet-api tier-claim endpoint
 * 6. On success: update highest_tier_reached, create tier_claims record, create tier_badges record
 * 7. Return success with tx_hash
 * 
 * Request Body:
 * {
 *   "tier": "seedling" | "grower" | "farmer"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tier": "seedling",
 *     "usdt_amount": 5,
 *     "tx_hash": "0x...",
 *     "token_id": 1,
 *     "lifetime_food_items": 15
 *   }
 * }
 */

var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"

routerAdd("POST", "/api/v2/check-tier-reward", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const user = $app.findRecordById("users", userId);
        if (!user) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        const body = requestInfo.body || {};
        const { tier } = body;
        
        // Validate tier parameter
        const validTiers = ['seedling', 'grower', 'farmer'];
        if (!tier || !validTiers.includes(tier)) {
            return e.json(400, {
                success: false,
                error: {
                    message: 'Invalid tier. Must be one of: seedling, grower, farmer',
                    code: 'INVALID_TIER'
                }
            });
        }
        
        // Tier configuration
        const tierConfig = {
            seedling: { tokenId: 1, threshold: 10, usdtAmount: 5 },
            grower: { tokenId: 2, threshold: 100, usdtAmount: 50 },
            farmer: { tokenId: 3, threshold: 1000, usdtAmount: 500 }
        };
        
        const config = tierConfig[tier];
        
        // Get user's lifetime food items
        let lifetimeFoodItems = 0;
        let highestTierReached = '';
        
        if (user && typeof user.get === 'function') {
            lifetimeFoodItems = user.get('lifetime_food_items') || 0;
            highestTierReached = user.get('highest_tier_reached') || '';
        } else if (user) {
            lifetimeFoodItems = user.lifetime_food_items || 0;
            highestTierReached = user.highest_tier_reached || '';
        }
        
        // Check sequential claim order
        const tierOrder = ['seedling', 'grower', 'farmer'];
        const currentIndex = tierOrder.indexOf(highestTierReached);
        const requestedIndex = tierOrder.indexOf(tier);
        
        if (requestedIndex !== currentIndex + 1) {
            return e.json(400, {
                success: false,
                error: {
                    message: `Must claim tiers in order. Next available: ${tierOrder[currentIndex + 1] || 'none (all claimed)'}`,
                    code: 'INVALID_TIER_ORDER'
                }
            });
        }
        
        // Check threshold (fast-fail before calling wallet-api)
        if (lifetimeFoodItems < config.threshold) {
            return e.json(400, {
                success: false,
                error: {
                    message: `Need ${config.threshold} lifetime food items to claim ${tier}. You have ${lifetimeFoodItems}.`,
                    code: 'INSUFFICIENT_FOOD_ITEMS',
                    data: {
                        required: config.threshold,
                        current: lifetimeFoodItems,
                        remaining: config.threshold - lifetimeFoodItems
                    }
                }
            });
        }
        
        // Get user's wallet credentials
        const walletAddress = user.get('wallet');
        const daccPublicKey = user.get('daccPublickey');
        const pin = user.get('pin');
        
        if (!walletAddress || !daccPublicKey || !pin) {
            return e.json(400, {
                success: false,
                error: {
                    message: 'Wallet not configured. Please complete wallet setup.',
                    code: 'WALLET_NOT_CONFIGURED'
                }
            });
        }
        
        // Get contract addresses
        const tierBadgeAddress = $os.getenv('TIER_BADGE_CONTRACT_ADDRESS') || '';
        
        if (!tierBadgeAddress) {
            return e.json(500, {
                success: false,
                error: {
                    message: 'TierBadge contract address not configured',
                    code: 'CONFIG_ERROR'
                }
            });
        }
        
        // Call wallet-api to execute tier claim
        const walletPayload = {
            wallet: walletAddress,
            daccPublicKey: daccPublicKey,
            pin: pin,
            tier: tier,
            tokenId: config.tokenId,
            lifetimeFoodItems: lifetimeFoodItems,
            tierBadgeAddress: tierBadgeAddress
        };
        
        const walletResponse = fetch(WALLET_SRV_URL + '/api/wallet/tier-claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(walletPayload)
        });
        
        if (!walletResponse.ok) {
            const errorData = walletResponse.json();
            
            // Log error but don't rollback - per D-09
            console.error('Tier claim wallet-api error:', {
                userId: user.id,
                tier: tier,
                error: errorData
            });
            
            return e.json(500, {
                success: false,
                error: {
                    message: errorData.error?.message || 'Tier claim transaction failed',
                    code: 'TIER_CLAIM_FAILED',
                    details: errorData.error?.code
                }
            });
        }
        
        const walletResult = walletResponse.json();
        
        if (!walletResult.success) {
            console.error('Tier claim unsuccessful:', {
                userId: user.id,
                tier: tier,
                result: walletResult
            });
            
            return e.json(500, {
                success: false,
                error: {
                    message: walletResult.error?.message || 'Tier claim failed',
                    code: 'TIER_CLAIM_FAILED'
                }
            });
        }
        
        const txHash = walletResult.data.txHash;
        
        // Update user's highest_tier_reached
        if (user && typeof user.set === 'function') {
            user.set('highest_tier_reached', tier);
            $app.dao().saveRecord(user);
        }
        
        // Create tier_claims record
        const tierClaimsCollection = $app.dao().getCollectionByNameOrId("tier_claims");
        const claimRecord = $app.dao().createRecord(tierClaimsCollection);
        claimRecord.set('user', user.id);
        claimRecord.set('tier', tier);
        claimRecord.set('usdt_amount', config.usdtAmount);
        claimRecord.set('tx_hash', txHash);
        claimRecord.set('token_id', config.tokenId);
        claimRecord.set('claimed_at', new Date().toISOString());
        $app.dao().saveRecord(claimRecord);
        
        // Create tier_badges record (mirror on-chain ownership)
        const tierBadgesCollection = $app.dao().getCollectionByNameOrId("tier_badges");
        const badgeRecord = $app.dao().createRecord(tierBadgesCollection);
        badgeRecord.set('user', user.id);
        badgeRecord.set('token_id', config.tokenId);
        badgeRecord.set('tier_name', tier.charAt(0).toUpperCase() + tier.slice(1)); // Capitalize
        badgeRecord.set('contract_address', tierBadgeAddress);
        badgeRecord.set('tx_hash', txHash);
        badgeRecord.set('minted_at', new Date().toISOString());
        $app.dao().saveRecord(badgeRecord);
        
        // Log successful claim
        $app.logger().info('Tier reward claimed', {
            userId: user.id,
            tier: tier,
            tokenId: config.tokenId,
            usdtAmount: config.usdtAmount,
            txHash: txHash,
            lifetimeFoodItems: lifetimeFoodItems
        });
        
        return e.json(200, {
            success: true,
            data: {
                tier: tier,
                usdt_amount: config.usdtAmount,
                tx_hash: txHash,
                token_id: config.tokenId,
                lifetime_food_items: lifetimeFoodItems
            }
        });
        
    } catch (error) {
        console.error('Check tier reward error:', error);
        return e.json(500, {
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET endpoint to check tier eligibility without claiming
 * Returns current progress and available tiers
 */
routerAdd("GET", "/api/v2/check-tier-reward", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const user = $app.findRecordById("users", userId);
        if (!user) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        // Try to get fields from user object directly (auth record)
        let lifetimeFoodItems = 0;
        let highestTierReached = '';
        
        if (user && typeof user.get === 'function') {
            lifetimeFoodItems = user.get('lifetime_food_items') || 0;
            highestTierReached = user.get('highest_tier_reached') || '';
        } else if (user) {
            // Fallback: try direct property access
            lifetimeFoodItems = user.lifetime_food_items || 0;
            highestTierReached = user.highest_tier_reached || '';
        }
        
        const tierOrder = ['seedling', 'grower', 'farmer'];
        const tierConfig = {
            seedling: { threshold: 10, usdtAmount: 5 },
            grower: { threshold: 100, usdtAmount: 50 },
            farmer: { threshold: 1000, usdtAmount: 500 }
        };
        
        // Build tier status
        const tiers = tierOrder.map(tier => {
            const config = tierConfig[tier];
            const isClaimed = tierOrder.indexOf(tier) <= tierOrder.indexOf(highestTierReached);
            const isNext = tier === tierOrder[tierOrder.indexOf(highestTierReached) + 1];
            const canClaim = isNext && lifetimeFoodItems >= config.threshold;
            
            return {
                name: tier,
                threshold: config.threshold,
                usdt_reward: config.usdtAmount,
                claimed: isClaimed,
                is_next: isNext,
                can_claim: canClaim,
                progress: isClaimed ? 100 : Math.min(100, Math.floor((lifetimeFoodItems / config.threshold) * 100))
            };
        });
        
        const currentTierIndex = tierOrder.indexOf(highestTierReached);
        const nextTier = tierOrder[currentTierIndex + 1] || null;
        
        return e.json(200, {
            success: true,
            data: {
                lifetime_food_items: lifetimeFoodItems,
                highest_tier_reached: highestTierReached || null,
                current_tier: highestTierReached || null,
                next_tier: nextTier,
                can_claim_next: nextTier ? lifetimeFoodItems >= tierConfig[nextTier].threshold : false,
                tiers: tiers
            }
        });
        
    } catch (error) {
        console.error('Get tier status error:', error);
        return e.json(500, {
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});
