/**
 * Hook: 15-mint-food-nft.pb.js
 * Event: Router (POST /api/v2/mint-food)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate USDT balance (quantity × 0.50 USDT)
 * 3. Build referral chain
 * 4. Call wallet-api mint-food endpoint
 * 5. Create food_nfts records (one per food item)
 * 6. Deduct USDT from buyer
 * 7. Create commission_records
 * 8. Update user food_nft_count
 * 9. Return success with food IDs
 * 
 * Request Body:
 * {
 *   "quantity": 10,
 *   "referrer_id": "user_id" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "food_ids": [1, 2, 3, 4, 5],
 *     "tx_hash": "0x...",
 *     "total_cost": "5.00",
 *     "food_type_distribution": {
 *       "grain": 2,
 *       "fish": 2,
 *       "insects": 1,
 *       "herb": 0
 *     }
 *   }
 * }
 */

const FOOD_MINT_PRICE = "500000000000000000"; // 0.50 USDT in wei (18 decimals)
var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"

routerAdd("POST", "/api/v2/mint-food", (e) => {
    try {
        const user = $apis.requireAuth(e);
        
        const body = e.parseBody();
        const { quantity, referrer_id } = body;
        
        // Validate quantity
        if (!quantity || quantity <= 0 || quantity > 100) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Quantity must be between 1 and 100',
                    code: 'INVALID_QUANTITY'
                } 
            });
        }
        
        // Calculate total cost
        const totalCost = BigInt(FOOD_MINT_PRICE) * BigInt(quantity);
        const userBalance = BigInt(user.get('usdt_balance') || 0);
        
        if (userBalance < totalCost) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Insufficient USDT balance',
                    code: 'INSUFFICIENT_BALANCE',
                    required: totalCost.toString(),
                    available: userBalance.toString()
                } 
            });
        }
        
        // Build referral chain
        let referralChain = [];
        if (referrer_id) {
            const referrer = $app.dao().findRecordById("users", referrer_id);
            if (referrer) {
                referralChain.push(referrer.get('wallet'));
                
                // Get up to 3 more levels from referrer's chain
                const referrerChain = referrer.get('referral_chain') || '';
                if (referrerChain) {
                    const chainAddresses = referrerChain.split(',');
                    for (let i = 0; i < Math.min(3, chainAddresses.length); i++) {
                        if (chainAddresses[i]) {
                            referralChain.push(chainAddresses[i]);
                        }
                    }
                }
            }
        }
        
        // Fill remaining slots with zeros
        while (referralChain.length < 4) {
            referralChain.push("0x0000000000000000000000000000000000000000");
        }
        
        // Get contract addresses from settings
        const foodNftAddress = $os.getenv('FOOD_NFT_CONTRACT_ADDRESS') || '0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC';
        const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        
        if (!foodNftAddress) {
            return e.json(500, { 
                success: false, 
                error: { 
                    message: 'Food NFT contract address not configured',
                    code: 'CONFIG_ERROR'
                } 
            });
        }
        
        // Call wallet API to mint food
        const walletPayload = {
            wallet: user.get('wallet'),
            daccPublicKey: user.get('daccPublickey'),
            pin: user.get('pin'),
            quantity: quantity,
            referrer: referralChain[0],
            foodNftAddress: foodNftAddress
        };
        
        const walletResponse = fetch(WALLET_SRV_URL + '/api/wallet/mint-food', {
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
                    message: walletResult.error?.message || 'Mint failed',
                    code: 'MINT_FAILED'
                } 
            });
        }
        
        const txHash = walletResult.data.txHash;
        const foodIds = walletResult.data.food_ids || [];
        
        // Create food NFT records
        const now = new Date().toISOString();
        const foodRecords = [];
        const foodTypeDistribution = { grain: 0, fish: 0, insects: 0, herb: 0 };
        
        for (let i = 0; i < foodIds.length; i++) {
            const foodId = foodIds[i];
            // Random food type assignment (same distribution as contract)
            const random = Math.floor(Math.random() * 100);
            let foodType;
            if (random < 40) {
                foodType = 'grain';
                foodTypeDistribution.grain++;
            } else if (random < 70) {
                foodType = 'fish';
                foodTypeDistribution.fish++;
            } else if (random < 90) {
                foodType = 'insects';
                foodTypeDistribution.insects++;
            } else {
                foodType = 'herb';
                foodTypeDistribution.herb++;
            }
            
            const foodRecord = $app.dao().createRecord($app.dao().getCollectionByNameOrId("food_nfts"));
            foodRecord.set('food_id', foodId);
            foodRecord.set('token_id', foodId);
            foodRecord.set('owner', user.id);
            foodRecord.set('food_type', foodType);
            foodRecord.set('is_consumed', false);
            foodRecord.set('contract_address', foodNftAddress);
            foodRecord.set('tx_hash', txHash);
            foodRecord.set('minted_at', now);
            
            $app.dao().saveRecord(foodRecord);
            foodRecords.push(foodRecord);
        }
        
        // Deduct USDT from buyer
        const newBalance = Number(userBalance - totalCost) / 1e18;
        user.set('usdt_balance', newBalance);
        
        // Update food_nft_count
        const currentFoodCount = user.get('food_nft_count') || 0;
        user.set('food_nft_count', currentFoodCount + quantity);
        
        $app.dao().saveRecord(user);
        
        // Create commission records
        if (referrer_id && referralChain[0] !== "0x0000000000000000000000000000000000000000") {
            const commissionRecord = $app.dao().createRecord($app.dao().getCollectionByNameOrId("commission_records"));
            commissionRecord.set('payer', user.id);
            commissionRecord.set('amount', Number(totalCost) / 1e18);
            commissionRecord.set('type', 'food_mint');
            commissionRecord.set('tx_hash', txHash);
            commissionRecord.set('created_at', now);
            $app.dao().saveRecord(commissionRecord);
        }
        
        console.log(`Food minted: user=${user.id}, quantity=${quantity}, tx=${txHash}`);
        
        return e.json(200, { 
            success: true, 
            data: { 
                food_ids: foodIds.map(id => Number(id)),
                tx_hash: txHash,
                total_cost: (Number(totalCost) / 1e18).toFixed(2),
                food_type_distribution: foodTypeDistribution
            } 
        });
        
    } catch (error) {
        console.error("Mint food error:", error);
        return e.json(500, { 
            success: false, 
            error: { 
                message: error.message,
                code: 'MINT_ERROR'
            } 
        });
    }
});
