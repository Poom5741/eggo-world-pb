// ===== APPLY REFERRAL ENDPOINT =====
// POST /api/referrals/apply - Apply referral code to user account

console.log("Setting up apply referral endpoint...");

// Endpoint to apply a referral code to the authenticated user
routerAdd('POST', '/api/referrals/apply', function(e) {
    // Require authentication
    var auth = e.requireAuth();
    var users = auth.users;
    
    // Parse body
    var body = e.parseBody();
    var referralCode = body.referral_code;
    var userId = body.user_id || users.id;
    
    console.log("Apply referral request - userId:", userId, "referralCode:", referralCode);
    
    // Validation 1: Check referral code exists and is string
    if (!referralCode || typeof referralCode !== 'string') {
        console.log("Validation failed: Referral code required");
        return e.json(400, {
            success: false,
            error: {
                message: "Referral code required",
                code: "REFERRAL_REQUIRED"
            }
        });
    }
    
    // Validation 2: Verify user_id matches authenticated user (prevent spoofing)
    if (userId !== users.id) {
        console.log("Validation failed: Unauthorized userId mismatch");
        return e.json(403, {
            success: false,
            error: {
                message: "Unauthorized",
                code: "UNAUTHORIZED"
            }
        });
    }
    
    // Find user record
    var user;
    try {
        user = $app.findRecordById("users", userId);
    } catch (err) {
        console.log("Error finding user:", err);
        return e.json(500, {
            success: false,
            error: {
                message: "User not found",
                code: "USER_NOT_FOUND"
            }
        });
    }
    
    // Validation 3: Check user doesn't already have referrer_id set
    var existingReferrer = user.getString("referrer_id");
    if (existingReferrer) {
        console.log("Validation failed: Referral already applied for user:", userId);
        return e.json(400, {
            success: false,
            error: {
                message: "Referral already applied",
                code: "REFERRAL_EXISTS"
            }
        });
    }
    
    // Validation 4: Find referrer by wallet address (referral_code = wallet)
    var cleanCode = referralCode.trim().toLowerCase();
    console.log("Looking for referrer with wallet:", cleanCode);
    
    var referrerRecords;
    try {
        referrerRecords = $app.findRecordsByFilter("users", "wallet = {:wallet}", "", 1, 0, { wallet: cleanCode });
    } catch (err) {
        console.log("Error finding referrer:", err);
        return e.json(500, {
            success: false,
            error: {
                message: "Database query failed",
                code: "QUERY_FAILED"
            }
        });
    }
    
    if (!referrerRecords || referrerRecords.length === 0) {
        console.log("Validation failed: Invalid referral code - not found");
        return e.json(404, {
            success: false,
            error: {
                message: "Invalid referral code",
                code: "REFERRAL_NOT_FOUND"
            }
        });
    }
    
    var referrer = referrerRecords[0];
    
    // Validation 5: Prevent self-referral (referrer.id !== userId)
    if (referrer.id === userId) {
        console.log("Validation failed: Self-referral detected");
        return e.json(400, {
            success: false,
            error: {
                message: "Cannot refer yourself",
                code: "SELF_REFERRAL"
            }
        });
    }
    
    // Apply referral: Set user.referrer_id = referrer.id
    try {
        user.set("referrer_id", referrer.id);
        $app.save(user);
        console.log("Referral applied successfully - user:", userId, "referrer:", referrer.id);
    } catch (err) {
        console.log("Error saving referral:", err);
        return e.json(500, {
            success: false,
            error: {
                message: "Failed to apply referral",
                code: "SAVE_FAILED"
            }
        });
    }
    
    // Get referrer info for response
    var referrerName = "";
    var referrerWallet = "";
    try {
        var referrerRecord = $app.findRecordById("users", referrer.id);
        referrerName = referrerRecord.getString("name") || "";
        referrerWallet = referrerRecord.getString("wallet") || "";
    } catch (err) {
        console.log("Could not fetch full referrer info:", err);
        referrerWallet = referrer.getString("wallet") || "";
    }
    
    // Success response
    return e.json(200, {
        success: true,
        data: {
            referrer_id: referrer.id,
            referrer_name: referrerName,
            referrer_wallet: referrerWallet,
            message: "Referral applied successfully"
        }
    });
});

console.log("Apply referral endpoint registered");