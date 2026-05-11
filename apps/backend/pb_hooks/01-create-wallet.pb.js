// ===== CREATE WALLET HOOK =====
// Creates EVM wallet AFTER user record is committed.
// Wallet creation is async to avoid blocking OAuth2 callback.

console.log("[01-create-wallet] Setting up create wallet hook...");

// Fast hook: Set default fields only (runs before commit)
onRecordCreate((e) => {
    console.log("[01-create-wallet] onRecordCreate triggered for user:", e.record.id);

    // Initialize default game fields
    e.record.set("usdt_balance", 0);
    e.record.set("usdt_total_earned", 0);
    e.record.set("total_direct_recruits", 0);
    e.record.set("lifetime_food_items", 0);
    e.record.set("highest_tier_reached", "bronze");

    console.log("[01-create-wallet] Default game fields initialized for user:", e.record.id);
    e.next();
}, "users");

// Async hook: Create wallet AFTER commit (non-blocking)
onRecordAfterCreateSuccess("users", (e) => {
    var userId = e.record.id;
    console.log("[01-create-wallet] onRecordAfterCreateSuccess triggered for user:", userId);
    
    // Skip if wallet already exists (idempotent)
    var existingWallet = e.record.getString("wallet");
    if (existingWallet && existingWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.log("[01-create-wallet] Wallet already exists for user:", userId, "skipping creation");
        return;
    }
    
    try {
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        var apiUrl = walletApiUrl + "/api/wallet/create";
        
        // Generate random password for wallet encryption (ensure min 12 chars)
        var part1 = Math.random().toString(36).slice(-10);
        var part2 = Date.now().toString(36);
        var part3 = Math.random().toString(36).slice(-10);
        var randomPassword = part1 + part2 + part3;
        
        var requestBody = {
            passwordSecretkey: randomPassword,
            publicEncryption: false
        };

        console.log("[01-create-wallet] Calling wallet-api at", apiUrl, "for user:", userId);
        console.log("[01-create-wallet] Request body keys:", Object.keys(requestBody).join(","));

        var response = $http.send({
            url: apiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        console.log("[01-create-wallet] Wallet-api response status:", response.statusCode);

        if (response.statusCode < 200 || response.statusCode >= 300) {
            // Log response body for debugging
            var errorBody = "";
            if (response.body) {
                if (Array.isArray(response.body)) {
                    for (var i = 0; i < response.body.length; i++) {
                        errorBody += String.fromCharCode(response.body[i]);
                    }
                } else {
                    errorBody = String(response.body);
                }
            }
            throw new Error("Wallet-api returned status " + response.statusCode + ", body: " + errorBody);
        }

        // Parse response
        var responseData;
        if (response.json && typeof response.json === "object" && response.json !== null) {
            responseData = response.json;
            console.log("[01-create-wallet] Parsed response from response.json");
        } else if (response.body) {
            var responseBody = response.body;
            if (Array.isArray(response.body)) {
                responseBody = "";
                for (var j = 0; j < response.body.length; j++) {
                    responseBody += String.fromCharCode(response.body[j]);
                }
            }
            console.log("[01-create-wallet] Raw response body:", responseBody.substring(0, 500));
            try {
                responseData = JSON.parse(responseBody);
            } catch (parseError) {
                throw new Error("Failed to parse wallet-api response: " + responseBody);
            }
        } else {
            throw new Error("Wallet-api returned empty response");
        }

        console.log("[01-create-wallet] Response data success:", responseData.success);

        if (!responseData.success) {
            var errMsg = (responseData.error && responseData.error.message) ? responseData.error.message : "Unknown error";
            var errCode = (responseData.error && responseData.error.code) ? responseData.error.code : "UNKNOWN";
            throw new Error("Wallet creation failed (" + errCode + "): " + errMsg);
        }

        var address = responseData.data.address;
        var daccPublickey = responseData.data.daccPublickey;

        // Validate address format
        if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
            throw new Error("Wallet-api returned invalid address: " + address);
        }
        if (!daccPublickey || !daccPublickey.match(/^daccPublickey_/)) {
            throw new Error("Wallet-api returned invalid daccPublickey: " + daccPublickey);
        }

        console.log("[01-create-wallet] Wallet created successfully:", address, "for user:", userId);

        // Update user record with wallet
        e.record.set("wallet", address);
        e.record.set("daccPublickey", daccPublickey);
        e.record.set("pin", randomPassword);
        $app.save(e.record);
        console.log("[01-create-wallet] Wallet fields saved to user:", userId);

        // Create user_wallets record
        try {
            var userWalletsCollection = $app.findCollectionByNameOrId("user_wallets");
            var userWalletRecord = new Record(userWalletsCollection);
            
            userWalletRecord.set("user_id", userId);
            userWalletRecord.set("wallet_address", address);
            userWalletRecord.set("usdt_balance", 0);
            userWalletRecord.set("total_earned", 0);
            userWalletRecord.set("total_spent", 0);
            userWalletRecord.set("total_withdrawn", 0);
            
            $app.save(userWalletRecord);
            console.log("[01-create-wallet] user_wallets record created for user:", userId);
        } catch (walletError) {
            console.error("[01-create-wallet] Failed to create user_wallets record:", walletError);
        }

    } catch (error) {
        console.error("[01-create-wallet] Async wallet creation failed for user:", userId, "error:", error);
        console.log("[01-create-wallet] User", userId, "created without wallet - can be created later");
    }
});

// Admin endpoint to manually create wallet for a user
routerAdd("POST", "/api/v2/admin/create-wallet", (e) => {
    var requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) {
        return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } });
    }
    
    var adminId = requestInfo.auth.id;
    try {
        var adminRecord = $app.findRecordById("users", adminId);
        if (!adminRecord.getBool("admin")) {
            return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } });
        }
    } catch (err) {
        return e.json(403, { success: false, error: { message: "Admin verification failed", code: "ADMIN_REQUIRED" } });
    }
    
    var body = requestInfo.body || {};
    var targetUserId = body.user_id;
    
    if (!targetUserId) {
        return e.json(400, { success: false, error: { message: "user_id is required", code: "VALIDATION_ERROR" } });
    }
    
    try {
        var userRecord = $app.findRecordById("users", targetUserId);
        var existingWallet = userRecord.getString("wallet");
        if (existingWallet && existingWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
            return e.json(200, { success: true, data: { wallet: existingWallet, message: "Wallet already exists" } });
        }
        
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        var apiUrl = walletApiUrl + "/api/wallet/create";
        var randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36) + Math.random().toString(36).slice(-10);
        
        var response = $http.send({
            url: apiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ passwordSecretkey: randomPassword, publicEncryption: false })
        });
        
        var responseData;
        if (response.json && typeof response.json === "object" && response.json !== null) {
            responseData = response.json;
        } else if (response.body) {
            var responseBody = response.body;
            if (Array.isArray(response.body)) {
                responseBody = "";
                for (var k = 0; k < response.body.length; k++) {
                    responseBody += String.fromCharCode(response.body[k]);
                }
            }
            responseData = JSON.parse(responseBody);
        } else {
            return e.json(500, { success: false, error: { message: "Empty response from wallet-api", code: "WALLET_API_ERROR" } });
        }
        
        if (!responseData.success) {
            return e.json(500, { success: false, error: { message: responseData.error?.message || "Wallet creation failed", code: "WALLET_CREATION_FAILED" } });
        }
        
        var address = responseData.data.address;
        var daccPublickey = responseData.data.daccPublickey;
        
        userRecord.set("wallet", address);
        userRecord.set("daccPublickey", daccPublickey);
        userRecord.set("pin", randomPassword);
        $app.save(userRecord);
        
        // Create user_wallets record
        try {
            var userWalletsCollection = $app.findCollectionByNameOrId("user_wallets");
            var userWalletRecord = new Record(userWalletsCollection);
            userWalletRecord.set("user_id", targetUserId);
            userWalletRecord.set("wallet_address", address);
            userWalletRecord.set("usdt_balance", 0);
            userWalletRecord.set("total_earned", 0);
            userWalletRecord.set("total_spent", 0);
            userWalletRecord.set("total_withdrawn", 0);
            $app.save(userWalletRecord);
        } catch (walletError) {
            console.error("[01-create-wallet] Failed to create user_wallets in admin endpoint:", walletError);
        }
        
        return e.json(200, { success: true, data: { wallet: address, daccPublickey: daccPublickey, user_id: targetUserId } });
        
    } catch (error) {
        console.error("[01-create-wallet] Admin create wallet failed:", error);
        return e.json(500, { success: false, error: { message: error.message, code: "WALLET_CREATION_FAILED" } });
    }
});

// Diagnostic endpoint to test wallet-api connectivity
routerAdd("GET", "/api/v2/admin/wallet-api-health", (e) => {
    var requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) {
        return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } });
    }
    
    try {
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        var healthUrl = walletApiUrl + "/health";
        
        console.log("[01-create-wallet] Testing wallet-api connectivity:", healthUrl);
        
        var response = $http.send({
            url: healthUrl,
            method: "GET"
        });
        
        var responseData = null;
        var responseBody = "";
        if (response.body) {
            if (Array.isArray(response.body)) {
                for (var m = 0; m < response.body.length; m++) {
                    responseBody += String.fromCharCode(response.body[m]);
                }
            } else {
                responseBody = String(response.body);
            }
            try {
                responseData = JSON.parse(responseBody);
            } catch (e) {
                responseData = { raw: responseBody };
            }
        }
        
        return e.json(200, {
            success: true,
            data: {
                wallet_api_url: walletApiUrl,
                status_code: response.statusCode,
                response: responseData
            }
        });
    } catch (error) {
        console.error("[01-create-wallet] Wallet-api health check failed:", error);
        return e.json(500, {
            success: false,
            error: {
                message: error.message,
                code: "WALLET_API_HEALTH_CHECK_FAILED",
                wallet_api_url: $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
            }
        });
    }
});

console.log("[01-create-wallet] Create wallet hook registered with admin endpoints");
