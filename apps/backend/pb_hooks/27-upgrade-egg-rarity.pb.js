routerAdd("POST", "/api/v2/upgrade-egg-rarity", (e) => {
    try {
        var requestInfo = e.requestInfo();
        var userId = requestInfo.auth ? requestInfo.auth.id : null;

        if (!userId) {
            return e.json(401, {
                success: false,
                error: { message: "Authentication required", code: "AUTH_REQUIRED" }
            });
        }

        var user = $app.findRecordById("users", userId);
        if (!user) {
            return e.json(401, {
                success: false,
                error: { message: "User not found", code: "USER_NOT_FOUND" }
            });
        }

        var body = requestInfo.body || {};
        var eggTokenId = body.egg_token_id;
        var foodIds = body.food_ids;

        if (!eggTokenId) {
            return e.json(400, {
                success: false,
                error: { message: "Egg token ID required", code: "MISSING_EGG_ID" }
            });
        }

        if (!foodIds || !Array.isArray(foodIds)) {
            return e.json(400, {
                success: false,
                error: { message: "Food IDs array required", code: "INVALID_FOOD_IDS" }
            });
        }

        // Validate food count (max 490 extra items per D-04)
        if (foodIds.length > 490) {
            return e.json(400, {
                success: false,
                error: { message: "Maximum 490 food items allowed for upgrade", code: "MAX_ITEMS_EXCEEDED" }
            });
        }

        // Fetch egg properties to validate ownership and status
        var eggNftAddress = $os.getenv("EGG_NFT_ADDRESS") || "";
        
        // Call wallet-api to execute upgrade (user pays gas)
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        
        var requestBody = {
            userId: user.id,
            eggTokenId: parseInt(eggTokenId),
            foodIds: foodIds.map(function(id) { return parseInt(id); })
        };

        var response = $http.send({
            url: walletApiUrl + "/api/wallet/upgrade-egg-rarity",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        let responseData;
        if (response.json && typeof response.json === "object") {
            responseData = response.json;
        } else if (response.body) {
            var responseBody = response.body;
            if (Array.isArray(response.body)) {
                responseBody = "";
                for (var i = 0; i < response.body.length; i++) {
                    responseBody += String.fromCharCode(response.body[i]);
                }
            }
            responseData = JSON.parse(responseBody);
        }

        if (!responseData.success) {
            return e.json(400, {
                success: false,
                error: { message: responseData.error?.message || "Upgrade failed", code: "UPGRADE_FAILED" }
            });
        }

        console.log("Egg rarity upgraded successfully:", eggTokenId, foodIds.length + " items");

        return e.json(200, {
            success: true,
            data: {
                txHash: responseData.data.txHash,
                blockNumber: responseData.data.blockNumber,
                eggTokenId: parseInt(eggTokenId),
                foodCount: foodIds.length
            }
        });
    } catch (error) {
        console.error("Upgrade rarity error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "UPGRADE_FAILED" }
        });
    }
});
