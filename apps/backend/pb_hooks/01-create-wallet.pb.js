// ===== CREATE WALLET HOOK (EVM Only) =====
// Creates EVM wallet BEFORE committing user record to DB.
// DACC wallet creation removed - only EVM used for deposits/withdraws.

console.log("Setting up create wallet hook (EVM only)...");

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

    // ===== STEP 1: Generate pin for DACC compatibility (random 20-char password) =====
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    var pin = "";
    for (var i = 0; i < 20; i++) {
        pin += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    e.record.set("pin", pin);
    console.log("Pin generated for DACC compatibility");

    // ===== STEP 1b: Generate referral code (6-char, no ambiguous chars) =====
    var refCharset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var referralCode = "";
    for (var r = 0; r < 6; r++) {
        referralCode += refCharset.charAt(Math.floor(Math.random() * refCharset.length));
    }
    e.record.set("referral_code", referralCode);
    console.log("Referral code generated:", referralCode);

    // ===== STEP 2: Create DACC wallet =====
    try {
        var evmApiUrl = walletApiUrl + "/api/wallet/create";
        
        var evmRequestBody = {
            passwordSecretkey: pin,
            publicEncryption: false
        };

        console.log("Calling wallet-api for user:", e.record.id);

        var evmResponse = $http.send({
            url: evmApiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evmRequestBody)
        });

        if (evmResponse.statusCode < 200 || evmResponse.statusCode >= 300) {
            throw new Error("wallet-api returned status " + evmResponse.statusCode);
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
            throw new Error("wallet-api returned empty response");
        }

        if (!evmResponseData.success) {
            throw new Error("Wallet creation failed: " + (evmResponseData.error && evmResponseData.error.message ? evmResponseData.error.message : "Unknown error"));
        }

        var evmAddress = evmResponseData.data.address;
        var daccPublickey = evmResponseData.data.daccPublickey;
        
        console.log("Wallet created, address:", evmAddress);

        // Set wallet fields on record BEFORE e.next() so they are committed with the record
        e.record.set("wallet", evmAddress);
        e.record.set("daccPublickey", daccPublickey);
        e.record.set("encrypted_private_key", JSON.stringify(evmResponseData.data));

        console.log("Wallet fields set on record - wallet:", evmAddress);

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

console.log("Create wallet hook registered (EVM only)");
