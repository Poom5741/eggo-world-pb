// ===== BACKFILL REFERRAL CODE FOR EXISTING USERS =====
// One-time migration: generates referral_code for users who were created
// before the referral code generation was added to 01-create-wallet.pb.js

console.log("Setting up referral code backfill hook...");

onRecordUpdate((e) => {
    // Only backfill if referral_code is empty
    var existingCode = e.record.get("referral_code");
    if (!existingCode || existingCode === "") {
        var refCharset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var referralCode = "";
        for (var r = 0; r < 6; r++) {
            referralCode += refCharset.charAt(Math.floor(Math.random() * refCharset.length));
        }
        e.record.set("referral_code", referralCode);
        console.log("Backfilled referral code for user:", e.record.id, "->", referralCode);
    }
}, "users");
