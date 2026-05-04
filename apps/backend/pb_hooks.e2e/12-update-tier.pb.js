// ===== UPDATE USER TIER ENDPOINT =====
// POST /api/v2/user/update-tier - Update user's highest tier reached

console.log("Setting up update tier endpoint...");

routerAdd("POST", "/api/v2/user/update-tier", (e) => {
    const requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    const body = e.parseBody();
    const { user_address, tier } = body;
    
    // Validation
    if (!user_address || !tier) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: user_address and tier required", code: "VALIDATION_ERROR" } 
        });
    }
    
    // Valid tiers
    const validTiers = ["bronze", "silver", "gold", "platinum", "diamond"];
    const normalizedTier = tier.toLowerCase().trim();
    
    if (!validTiers.includes(normalizedTier)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid tier. Must be one of: " + validTiers.join(", "), code: "INVALID_TIER" } 
        });
    }
    
    try {
        const userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User not found", code: "USER_NOT_FOUND" } 
            });
        }
        
        const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
        const currentTier = userRecord.getString("highest_tier_reached") || "bronze";
        const currentTierIndex = tiers.indexOf(currentTier);
        const newTierIndex = tiers.indexOf(normalizedTier);
        
        // Only update if new tier is higher or equal
        if (newTierIndex >= currentTierIndex) {
            userRecord.set("highest_tier_reached", normalizedTier);
            $app.save(userRecord);
            console.log("Tier updated for user:", user_address, "from:", currentTier, "to:", normalizedTier);
        } else {
            console.log("Tier downgrade attempted:", currentTier, "->", normalizedTier, "rejected");
        }
        
        e.json(200, {
            success: true,
            data: {
                highest_tier_reached: userRecord.getString("highest_tier_reached"),
                previous_tier: currentTier,
                updated: newTierIndex >= currentTierIndex
            }
        });
    } catch (error) {
        console.error("Tier update error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "TIER_UPDATE_FAILED" }
        });
    }
});

console.log("Update tier endpoint registered");
