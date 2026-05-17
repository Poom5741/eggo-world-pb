/**
 * Hook: 17-claim-checkin.pb.js
 * Event: Router (POST /api/v2/check-in)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Get or create user_stats record
 * 3. Validate 24-hour cooldown
 * 4. Calculate streak (increment or reset)
 * 5. Determine reward based on streak length
 * 6. Call wallet-api to mint Food NFT(s)
 * 7. Update user_stats with new streak and timestamp
 * 8. Return success with reward details
 * 
 * Request Body: {} (empty, user from auth)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "streak": 14,
 *     "reward_count": 1,
 *     "tx_hash": "0x...",
 *     "message": "Daily check-in successful!"
 *   }
 * }
 */

var WALLET_SRV_URL = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"

routerAdd("POST", "/api/v2/check-in", async (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        let user;
        try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        // Get or create user_stats record
        let stats
        try {
            stats = $app.findFirstRecordByData(
                "user_stats",
                "user",
                user.id
            );
        } catch (err) {
            // Create new user_stats if doesn't exist
            const statsCollection = $app.findCollectionByNameOrId("user_stats");
            stats = new Record(statsCollection);
            stats.set("user", user.id);
            stats.set("check_in_streak", 0);
            stats.set("last_check_in", null);
            stats.set("check_in_count", 0);
        }
        
        // Check cooldown (24 hours)
        const lastCheckIn = stats.get("last_check_in");
        if (lastCheckIn) {
            const lastCheckInTime = new Date(lastCheckIn).getTime();
            const now = new Date().getTime();
            const hoursSinceLast = (now - lastCheckInTime) / (1000 * 60 * 60);
            
            if (hoursSinceLast < 24) {
                return e.json(400, { 
                    success: false, 
                    error: { 
                        message: 'Check-in not available yet. Please wait 24 hours between check-ins.',
                        code: 'COOLDOWN_ACTIVE',
                        hours_remaining: Math.ceil(24 - hoursSinceLast)
                    } 
                });
            }
            
            // Check if streak should reset (more than 48 hours = missed a day)
            if (hoursSinceLast >= 48) {
                stats.set("check_in_streak", 0);
            }
        }
        
        // Calculate new streak
        const currentStreak = stats.get("check_in_streak") || 0;
        const newStreak = currentStreak + 1;
        
        // Determine reward based on streak
        let rewardCount = 1; // Default: 1 Food NFT
        let bonusType = "daily";
        
        if (newStreak >= 30) {
            rewardCount = 5;
            bonusType = "30-day-master";
        } else if (newStreak >= 7) {
            rewardCount = 2;
            bonusType = "7-day-warrior";
        }
        
        // Call wallet-api to mint Food NFT(s)
        const mintResults = [];
        let error = null;
        
        for (let i = 0; i < rewardCount; i++) {
            try {
                const mintResponse = await $http.send({
                    url: WALLET_SRV_URL + "/mint-food",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_address: user.get("wallet"),
                        food_type: "grain",
                        quantity: 1,
                    }),
                    timeout: 30,
                });
                
                const mintData = JSON.parse(mintResponse.body);
                
                if (mintData.success) {
                    mintResults.push({
                        index: i + 1,
                        success: true,
                        tx_hash: mintData.data?.tx_hash,
                    });
                    
                    // Create food_nfts record
                    const foodCollection = $app.findCollectionByNameOrId("food_nfts");
                    const foodRecord = new Record(foodCollection);
                    foodRecord.set("owner", user.id);
                    foodRecord.set("token_id", mintData.data?.token_id || 0);
                    foodRecord.set("tx_hash", mintData.data?.tx_hash || "");
                    foodRecord.set("food_type", "grain");
                    $app.save(foodRecord);
                } else {
                    mintResults.push({
                        index: i + 1,
                        success: false,
                        error: mintData.error?.message,
                    });
                }
            } catch (mintErr) {
                console.error("Failed to mint food NFT #" + (i + 1) + ":", mintErr);
                mintResults.push({
                    index: i + 1,
                    success: false,
                    error: mintErr.message,
                });
            }
        }
        
        // Update user_stats
        const now = new Date().toISOString();
        stats.set("check_in_streak", newStreak);
        stats.set("last_check_in", now);
        stats.set("check_in_count", (stats.get("check_in_count") || 0) + 1);
        $app.save(stats);
        
        // Calculate success count
        const successCount = mintResults.filter(r => r.success).length;
        
        // Return success
        return e.json(200, {
            success: true,
            data: {
                streak: newStreak,
                reward_count: rewardCount,
                success_count: successCount,
                bonus_type: bonusType,
                mint_results: mintResults,
                next_check_in: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                message: successCount === rewardCount 
                    ? `Daily check-in successful! +${rewardCount} Food NFT${rewardCount > 1 ? 's' : ''}`
                    : `Check-in recorded, but ${rewardCount - successCount} mint(s) failed`
            }
        });
        
    } catch (error) {
        console.error("Check-in error:", error);
        return e.json(500, { 
            success: false, 
            error: { 
                message: error.message || 'Failed to process check-in',
                code: 'CHECK_IN_ERROR'
            } 
        });
    }
});
