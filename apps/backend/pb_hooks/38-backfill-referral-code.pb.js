// ===== BACKFILL REFERRAL CODE FOR EXISTING USERS =====
// One-time migration: generates referral_code for users who were created
// before the referral code generation was added to 01-create-wallet.pb.js

console.log("Setting up referral code backfill hook...");

function generateReferralCode() {
    var refCharset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var r = 0; r < 6; r++) {
        code += refCharset.charAt(Math.floor(Math.random() * refCharset.length));
    }
    return code;
}

// Auto-backfill on record update (for future updates)
onRecordUpdate(function (e) {
    var existingCode = e.record.get("referral_code");
    if (!existingCode || existingCode === "") {
        var code = generateReferralCode();
        e.record.set("referral_code", code);
        console.log("Backfilled referral code for user:", e.record.id, "->", code);
    }
}, "users");

// Admin endpoint to batch-backfill all existing users without referral codes
// Auth-protected; requires authenticated user to call.
routerAdd("POST", "/api/backfill-referral-codes", function (e) {
    try {
        if (!e.auth) {
            return e.json(401, { error: { message: "Auth required" } });
        }
        // Find all users with empty or no referral_code
        var users = $app.findRecordsByFilter(
            "users",
            "referral_code = '' || referral_code = null",
            "-created",
            10000,
            0
        );

        var updated = 0;
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            var code = generateReferralCode();
            // Ensure uniqueness - check if code already exists
            try {
                var existing = $app.findRecordsByFilter(
                    "users",
                    "referral_code = '" + code + "'",
                    "",
                    1,
                    0
                );
                while (existing.length > 0) {
                    code = generateReferralCode();
                    existing = $app.findRecordsByFilter(
                        "users",
                        "referral_code = '" + code + "'",
                        "",
                        1,
                        0
                    );
                }
            } catch (err) {
                // No existing records with this code - good
            }
            user.set("referral_code", code);
            $app.saveRecord(user);
            updated++;
            console.log("Backfilled referral code for user:", user.id, "->", code);
        }

        return e.json(200, { success: true, updated: updated });
    } catch (err) {
        console.error("Backfill error:", err);
        return e.json(500, { error: { message: err.message || "Backfill failed" } });
    }
});

console.log("Backfill endpoint registered: POST /api/backfill-referral-codes");
