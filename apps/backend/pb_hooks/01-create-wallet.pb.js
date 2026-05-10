// ===== CREATE WALLET HOOK =====
// Creates EVM wallet AFTER user record is committed.
// Wallet creation is async to avoid blocking OAuth2 callback.

console.log("Setting up create wallet hook...");

// Fast hook: Set default fields only (runs before commit)
onRecordCreate((e) => {
    console.log("Create wallet hook triggered for user:", e.record.id);

    // Initialize default game fields
    e.record.set("usdt_balance", 0);
    e.record.set("usdt_total_earned", 0);
    e.record.set("total_direct_recruits", 0);
    e.record.set("lifetime_food_items", 0);
    e.record.set("highest_tier_reached", "bronze");

    console.log("Default game fields initialized");
    e.next();
}, "users");

// Async hook: Create wallet AFTER commit (non-blocking)
onRecordAfterCreateSuccess("users", (e) => {
    console.log("Async wallet creation for user:", e.record.id);
    
    try {
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        var apiUrl = walletApiUrl + "/api/wallet/create";
        
        // Generate random password for wallet encryption
        var randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36) + Math.random().toString(36).slice(-10);
        
        var requestBody = {
            passwordSecretkey: randomPassword,
            publicEncryption: false
        };

        console.log("Calling wallet-api to create wallet for user:", e.record.id);

        var response = $http.send({
            url: apiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error("Wallet-api returned status " + response.statusCode);
        }

        // Parse response
        var responseData;
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
            try {
                responseData = JSON.parse(responseBody);
            } catch (parseError) {
                throw new Error("Failed to parse wallet-api response: " + responseBody);
            }
        } else {
            throw new Error("Wallet-api returned empty response");
        }

        if (!responseData.success) {
            throw new Error("Wallet creation failed: " + (responseData.error && responseData.error.message ? responseData.error.message : "Unknown error"));
        }

        var address = responseData.data.address;
        var daccPublickey = responseData.data.daccPublickey;

        console.log("Wallet created successfully:", address);

        // Update user record with wallet
        e.record.set("wallet", address);
        e.record.set("daccPublickey", daccPublickey);
        e.record.set("pin", randomPassword);
        $app.save(e.record);
        console.log("Wallet fields saved to user:", e.record.id);

        // Create user_wallets record
        try {
            var userWalletsCollection = $app.findCollectionByNameOrId("user_wallets");
            var userWalletRecord = new Record(userWalletsCollection);
            
            userWalletRecord.set("user_id", e.record.id);
            userWalletRecord.set("wallet_address", address);
            userWalletRecord.set("usdt_balance", 0);
            userWalletRecord.set("total_earned", 0);
            userWalletRecord.set("total_spent", 0);
            userWalletRecord.set("total_withdrawn", 0);
            
            $app.save(userWalletRecord);
            console.log("user_wallets record created for user:", e.record.id);
        } catch (walletError) {
            console.error("Failed to create user_wallets record:", walletError);
        }

    } catch (error) {
        console.error("Async wallet creation failed:", error);
        console.log("User created without wallet - can be created later");
    }
});

console.log("Create wallet hook registered");
