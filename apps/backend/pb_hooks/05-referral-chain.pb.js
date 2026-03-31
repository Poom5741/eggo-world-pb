// ===== REFERRAL CHAIN HOOK =====
// Auto-create 4-level referral chain when user signs up with referrer

console.log("Setting up referral chain hook...");

const PLATFORM_ADDRESS = '0x0000000000000000000000000000000000000000';

onRecordAfterCreateSuccess((e) => {
    const user = e.record;
    const referrerId = user.getString("referrer_id");
    
    if (!referrerId) {
        console.log("No referrer for user:", user.id);
        return;
    }
    
    console.log("Creating referral chain for user:", user.id, "with referrer:", referrerId);
    
    try {
        // Create G1 relationship (direct referrer)
        createReferralRecord(referrerId, user.id, 1);
        
        // Get referrer's referrer for G2, G3, G4
        let currentReferrerId = referrerId;
        for (let level = 2; level <= 4; level++) {
            try {
                const referrerRecord = $app.findRecordById("users", currentReferrerId);
                const nextReferrerId = referrerRecord.getString("referrer_id");
                
                if (!nextReferrerId) {
                    console.log("Chain ends at level", level - 1);
                    break;
                }
                
                createReferralRecord(nextReferrerId, user.id, level);
                console.log("Created G" + level + " referral:", nextReferrerId, "->", user.id);
                currentReferrerId = nextReferrerId;
            } catch (err) {
                console.log("Referrer not found at level", level);
                break;
            }
        }
        
        // Build and store referral_chain on user record
        const referralChain = buildReferralChain(referrerId);
        user.set("referral_chain", JSON.stringify(referralChain));
        $app.save(user);
        console.log("Stored referral_chain on user:", user.id, "chain:", referralChain);
        
        // Update referrer's direct recruit count
        const referrer = $app.findRecordById("users", referrerId);
        const currentCount = referrer.getNumber("total_direct_recruits") || 0;
        referrer.set("total_direct_recruits", currentCount + 1);
        $app.save(referrer);
        console.log("Updated direct recruits for referrer:", referrerId, "count:", currentCount + 1);
        
        // Emit UserRegistered event
        emitUserRegisteredEvent(user, referralChain);
        
    } catch (error) {
        console.error("Error creating referral chain:", error);
    }
}, "users");

function buildReferralChain(startReferrerId) {
    const chain = [];
    let currentReferrerId = startReferrerId;
    
    for (let level = 1; level <= 4; level++) {
        if (!currentReferrerId) break;
        
        chain.push(currentReferrerId);
        
        try {
            const referrerRecord = $app.findRecordById("users", currentReferrerId);
            currentReferrerId = referrerRecord.getString("referrer_id");
        } catch (err) {
            break;
        }
    }
    
    // Pad with platform address if chain < 4
    while (chain.length < 4) {
        chain.push(PLATFORM_ADDRESS);
    }
    
    return chain;
}

function createReferralRecord(referrerId, refereeId, level) {
    try {
        const collection = $app.findCollectionByNameOrId("referrals");
        const record = new Record(collection);
        record.set("referrer_id", referrerId);
        record.set("referee_id", refereeId);
        record.set("level", level);
        $app.save(record);
        console.log("Created referral record: G" + level, referrerId, "->", refereeId);
    } catch (err) {
        console.log("Error creating referral record:", err);
    }
}

function emitUserRegisteredEvent(user, referralChain) {
    console.log('EVENT:UserRegistered', JSON.stringify({
        user_address: user.getString('wallet'),
        user_id: user.id,
        referral_chain: referralChain,
        timestamp: new Date().toISOString()
    }));
}

console.log("Referral chain hook registered");
