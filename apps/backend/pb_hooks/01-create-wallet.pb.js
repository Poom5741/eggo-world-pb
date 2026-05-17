// ===== CREATE WALLET HOOK =====
// Creates DACC and EVM wallets BEFORE committing user record to DB.
// This ensures wallets are always set on the user at creation time.

console.log("Setting up create wallet hook...");

onRecordCreate((e) => {
    console.log("Create wallet hook triggered for user:", e.record.id);

    // Initialize default game fields
    e.record.set("usdt_balance", 0);
    e.record.set("usdt_total_earned", 0);
    e.record.set("total_direct_recruits", 0);
    e.record.set("lifetime_food_items", 0);
    e.record.set("highest_tier_reached", "bronze");

    console.log("Default game fields initialized");

    var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";

    // ===== STEP 1: Create DACC wallet =====
    try {
        var daccApiUrl = walletApiUrl + "/api/wallet/create";
        
        // Generate random password for DACC wallet (20 chars with letters/numbers/special)
        var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        var randomPassword = "";
        for (var i = 0; i < 20; i++) {
            randomPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        var daccRequestBody = {
            passwordSecretkey: randomPassword,
            publicEncryption: false
        };

        console.log("Calling DACC wallet-api for user:", e.record.id);

        var daccResponse = $http.send({
            url: daccApiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(daccRequestBody)
        });

        if (daccResponse.statusCode < 200 || daccResponse.statusCode >= 300) {
            throw new Error("DACC wallet-api returned status " + daccResponse.statusCode);
        }

        var daccResponseData;
        if (daccResponse.json && typeof daccResponse.json === "object") {
            daccResponseData = daccResponse.json;
        } else if (daccResponse.body) {
            var daccResponseBodyStr = daccResponse.body;
            if (Array.isArray(daccResponse.body)) {
                daccResponseBodyStr = "";
                for (var j = 0; j < daccResponse.body.length; j++) {
                    daccResponseBodyStr += String.fromCharCode(daccResponse.body[j]);
                }
            }
            daccResponseData = JSON.parse(daccResponseBodyStr);
        } else {
            throw new Error("DACC wallet-api returned empty response");
        }

        if (!daccResponseData.success) {
            throw new Error("DACC wallet creation failed: " + (daccResponseData.error && daccResponseData.error.message ? daccResponseData.error.message : "Unknown error"));
        }

        var daccPublickey = daccResponseData.data.daccPublickey;
        console.log("DACC wallet created, daccPublickey:", daccPublickey);

    } catch (daccError) {
        console.error("Failed to create DACC wallet:", daccError);
        throw new Error("DACC wallet creation failed, aborting user creation: " + daccError.message);
    }

    // ===== STEP 2: Create EVM wallet =====
    try {
        var evmApiUrl = walletApiUrl + "/api/wallet/create-evm";
        
        var evmRequestBody = {
            userId: e.record.id
        };

        console.log("Calling EVM wallet-api for user:", e.record.id);

        var evmResponse = $http.send({
            url: evmApiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evmRequestBody)
        });

        if (evmResponse.statusCode < 200 || evmResponse.statusCode >= 300) {
            throw new Error("EVM wallet-api returned status " + evmResponse.statusCode);
        }

        var evmResponseData;
        if (evmResponse.json && typeof evmResponse.json === "object") {
            evmResponseData = evmResponse.json;
        } else if (evmResponse.body) {
            var evmResponseBodyStr = evmResponse.body;
            if (Array.isArray(evmResponse.body)) {
                evmResponseBodyStr = "";
                for (var k = 0; k < evmResponse.body.length; k++) {
                    evmResponseBodyStr += String.fromCharCode(evmResponse.body[k]);
                }
            }
            evmResponseData = JSON.parse(evmResponseBodyStr);
        } else {
            throw new Error("EVM wallet-api returned empty response");
        }

        if (!evmResponseData.success) {
            throw new Error("EVM wallet creation failed: " + (evmResponseData.error && evmResponseData.error.message ? evmResponseData.error.message : "Unknown error"));
        }

        var evmAddress = evmResponseData.data.address;
        var encryptedPrivateKey = evmResponseData.data.encrypted_private_key;
        
        console.log("EVM wallet created, address:", evmAddress);

        // Set wallet fields on record BEFORE e.next() so they are committed with the record
        // wallet = EVM address (used for USDT transactions)
        // daccPublickey = DACC public key
        // pin = random password (for DACC wallet)
        // encrypted_private_key = EVM encrypted private key (JSON string)
        e.record.set("wallet", evmAddress);
        e.record.set("daccPublickey", daccPublickey);
        e.record.set("pin", randomPassword);
        e.record.set("encrypted_private_key", JSON.stringify(encryptedPrivateKey));

        console.log("Wallet fields set on record - wallet:", evmAddress, "daccPublickey:", daccPublickey);

    } catch (evmError) {
        console.error("Failed to create EVM wallet:", evmError);
        throw new Error("EVM wallet creation failed, aborting user creation: " + evmError.message);
    }

    e.next();

    // Create user_wallets record AFTER user is committed (needs user ID)
    try {
        var userWalletsCollection = $app.findCollectionByNameOrId("user_wallets");
        var userWalletRecord = new Record(userWalletsCollection);
        
        userWalletRecord.set("user_id", e.record.id);
        userWalletRecord.set("wallet_address", e.record.get("wallet") || "");
        userWalletRecord.set("usdt_balance", 0);
        userWalletRecord.set("total_earned", 0);
        userWalletRecord.set("total_spent", 0);
        userWalletRecord.set("total_withdrawn", 0);
        
        $app.save(userWalletRecord);
        
        console.log("user_wallets record created for user:", e.record.id);
    } catch (walletError) {
        console.error("Failed to create user_wallets record:", walletError);
        // Non-fatal: user exists with wallet, just missing wallet record
        // Can be backfilled manually via /api/v2/fix-user-wallet endpoint if needed
    }

    // Build referral chain after wallet is created
    try {
        var PLATFORM_ADDRESS = $os.getenv("PLATFORM_ADDRESS") || "0x0000000000000000000000000000000000000000"
        var referrerId = e.record.get("referrer_id");
        if (referrerId && referrerId !== "") {
            console.log("Building referral chain for:", e.record.id, "referrer:", referrerId);
            createReferralRecord(referrerId, e.record.id, 1);
            var chain = buildReferralChain(referrerId);
            e.record.set("referral_chain", JSON.stringify(chain));
            $app.save(e.record);

            try {
                var ref = $app.findRecordById("users", referrerId);
                var count = parseInt(ref.get("total_direct_recruits") || 0, 10);
                ref.set("total_direct_recruits", count + 1);
                $app.save(ref);
            } catch (e2) {}

            console.log("EVENT:UserRegistered", JSON.stringify({
                user_address: e.record.get("wallet"),
                user_id: e.record.id,
                referral_chain: chain,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (chainErr) {
        console.error("Referral chain build failed:", chainErr);
    }
}, "users");

function buildReferralChain(startReferrerId) {
    var chain = [];
    var current = startReferrerId;
    var platformAddr = $os.getenv("PLATFORM_ADDRESS") || "0x0000000000000000000000000000000000000000"
    for (var level = 1; level <= 4; level++) {
        if (!current) break;
        chain.push(current);
        try {
            var rr = $app.findRecordById("users", current);
            current = rr.get("referrer_id");
        } catch (err) { break; }
    }
    while (chain.length < 4) { chain.push(platformAddr); }
    return chain;
}

function createReferralRecord(referrerId, refereeId, level) {
    try {
        var c = $app.findCollectionByNameOrId("referrals");
        var r = new Record(c);
        r.set("referrer_id", referrerId);
        r.set("referee_id", refereeId);
        r.set("level", level);
        $app.save(r);
    } catch (err) {}
}

console.log("Create wallet hook registered");
