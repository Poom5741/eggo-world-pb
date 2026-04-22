/**
 * Hook: 16-feed-egg.pb.js
 * Event: Router (POST /api/v2/feed-egg)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Verify user owns egg NFT
 * 3. Verify user owns all food NFTs
 * 4. Verify egg not hatched
 * 5. Call wallet-api feed-egg endpoint
 * 6. Update egg_nfts food_count
 * 7. Mark food_nfts as consumed
 * 8. Create egg_consumption_logs record
 * 9. Update user total_food_consumed
 * 10. Return success
 * 
 * Request Body:
 * {
 *   "egg_token_id": 1,
 *   "food_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "egg_token_id": 1,
 *     "new_food_count": 12,
 *     "ready_to_hatch": true,
 *     "tx_hash": "0x...",
 *     "food_type_distribution": {
 *       "grain": 4,
 *       "fish": 3,
 *       "insects": 2,
 *       "herb": 1
 *     }
 *   }
 * }
 */

var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"

routerAdd("POST", "/api/v2/feed-egg", (e) => {
    try {
        const user = $apis.requireAuth(e);
        
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
        
        // Verify user owns the egg
        const eggCollection = $app.dao().getCollectionByNameOrId("egg_nfts");
        const eggs = $app.dao().findRecordsByFilter(
            "egg_nfts",
            `token_id = ${egg_token_id} && owner.id = "${user.id}"`,
            "",
            1
        );
        
        if (eggs.length === 0) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'Egg not found or you do not own it',
                    code: 'EGG_NOT_FOUND'
                } 
            });
        }
        
        const egg = eggs[0];
        
        // Check if egg is already hatched
        if (egg.get('is_hatched')) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Egg already hatched',
                    code: 'EGG_ALREADY_HATCHED'
                } 
            });
        }
        
        // Check if egg is already full (fast-fail before calling wallet-api)
        const preFeedFoodCount = egg.get('food_count') || 0;
        const requestedFoodCount = food_ids.length;

        if (preFeedFoodCount + requestedFoodCount > 10) {
            return e.json(400, {
                success: false,
                error: {
                    message: 'Cannot feed this egg — it is full and ready to hatch',
                    code: 'EGG_FULL'
                }
            });
        }
        
        // Verify user owns all food NFTs and they're not consumed
        const foodCollection = $app.dao().getCollectionByNameOrId("food_nfts");
        const foodTypeDistribution = { grain: 0, fish: 0, insects: 0, herb: 0 };
        const foodRecords = [];
        
        for (const foodId of food_ids) {
            const foods = $app.dao().findRecordsByFilter(
                "food_nfts",
                `food_id = ${foodId} && owner.id = "${user.id}"`,
                "",
                1
            );
            
            if (foods.length === 0) {
                return e.json(404, { 
                    success: false, 
                    error: { 
                        message: `Food NFT ${foodId} not found or you do not own it`,
                        code: 'FOOD_NOT_FOUND'
                    } 
                });
            }
            
            const food = foods[0];
            
            if (food.get('is_consumed')) {
                return e.json(400, { 
                    success: false, 
                    error: { 
                        message: `Food NFT ${foodId} already consumed`,
                        code: 'FOOD_ALREADY_CONSUMED'
                    } 
                });
            }
            
            foodRecords.push(food);
            
            // Count food types
            const foodType = food.get('food_type');
            if (foodTypeDistribution.hasOwnProperty(foodType)) {
                foodTypeDistribution[foodType]++;
            }
        }
        
        // Get contract addresses
        const foodNftAddress = $os.getenv('FOOD_NFT_CONTRACT_ADDRESS') || '0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC';
        const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        
        if (!foodNftAddress || !eggNftAddress) {
            return e.json(500, { 
                success: false, 
                error: { 
                    message: 'Contract addresses not configured',
                    code: 'CONFIG_ERROR'
                } 
            });
        }
        
        // Call wallet API to feed egg
        const walletPayload = {
            wallet: user.get('wallet'),
            daccPublicKey: user.get('daccPublickey'),
            pin: user.get('pin'),
            egg_token_id: egg_token_id,
            food_ids: food_ids,
            foodNftAddress: foodNftAddress,
            eggNftAddress: eggNftAddress
        };
        
        const walletResponse = fetch(WALLET_SRV_URL + '/api/wallet/feed-egg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(walletPayload)
        });
        
        if (!walletResponse.ok) {
            const errorData = walletResponse.json();
            return e.json(500, { 
                success: false, 
                error: { 
                    message: errorData.error?.message || 'Wallet API error',
                    code: 'WALLET_API_ERROR'
                } 
            });
        }
        
        const walletResult = walletResponse.json();
        
        if (!walletResult.success) {
            return e.json(500, { 
                success: false, 
                error: { 
                    message: walletResult.error?.message || 'Feed failed',
                    code: 'FEED_FAILED'
                } 
            });
        }
        
        const txHash = walletResult.data.txHash;
        
        // Update egg food count
        const currentFoodCount = egg.get('food_count') || 0;
        egg.set('food_count', currentFoodCount + food_ids.length);
        $app.dao().saveRecord(egg);
        
        // Mark food NFTs as consumed
        const now = new Date().toISOString();
        for (const food of foodRecords) {
            food.set('is_consumed', true);
            food.set('consumed_by_egg', egg.id);
            $app.dao().saveRecord(food);
        }
        
        // Create consumption log
        const consumptionLog = $app.dao().createRecord($app.dao().getCollectionByNameOrId("egg_consumption_logs"));
        consumptionLog.set('egg', egg.id);
        consumptionLog.set('food_items', food_ids);
        consumptionLog.set('food_type_distribution', foodTypeDistribution);
        consumptionLog.set('total_food_count', food_ids.length);
        consumptionLog.set('fed_at', now);
        $app.dao().saveRecord(consumptionLog);
        
        // Update user total_food_consumed
        const currentTotalConsumed = user.get('total_food_consumed') || 0;
        user.set('total_food_consumed', currentTotalConsumed + food_ids.length);
        $app.dao().saveRecord(user);
        
        const newFoodCount = egg.get('food_count');
        const readyToHatch = newFoodCount >= 10;
        
        console.log(`Egg fed: user=${user.id}, egg=${egg_token_id}, food_count=${food_ids.length}, tx=${txHash}`);
        
        return e.json(200, { 
            success: true, 
            data: { 
                egg_token_id: egg_token_id,
                new_food_count: newFoodCount,
                ready_to_hatch: readyToHatch,
                tx_hash: txHash,
                food_type_distribution: foodTypeDistribution
            } 
        });
        
    } catch (error) {
        console.error("Feed egg error:", error);
        return e.json(500, { 
            success: false, 
            error: { 
                message: error.message,
                code: 'FEED_ERROR'
            } 
        });
    }
});
