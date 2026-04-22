// ===== REGISTER USER ENDPOINT =====
// Explicit registerUser(user_address, referrer_address) function with 4-level chain tracking

console.log("Setting up register user endpoint...");

// Use $os.getenv for cross-file config access (globalThis is isolated per-file in PocketBase JSVM)
var PLATFORM_ADDRESS = $os.getenv("PLATFORM_ADDRESS") || "0x0000000000000000000000000000000000000000"

routerAdd('POST', '/api/users/register', (e) => {
    console.log("=== REGISTER USER ENDPOINT CALLED ===");
    
    const body = e.parseBody();
    const user_address = body?.user_address;
    const referrer_address = body?.referrer_address;
    const email = body?.email;
    const password = body?.password;
    const name = body?.name;
    
    console.log("User address:", user_address);
    console.log("Referrer address:", referrer_address);
    
    // Validation
    if (!user_address) {
        console.log("Missing user_address");
        return e.json(400, { 
            success: false, 
            error: { message: "User address required", code: "USER_ADDRESS_REQUIRED" } 
        });
    }
    
    if (!referrer_address) {
        console.log("Missing referrer_address");
        return e.json(400, { 
            success: false, 
            error: { message: "Referrer required", code: "REFERRER_REQUIRED" } 
        });
    }
    
    // Verify referrer exists by wallet
    const referrerRecords = $app.findRecordsByFilter(
        "users",
        "wallet = {:wallet}",
        "",
        1,
        0,
        { wallet: referrer_address }
    )
    
    if (!referrerRecords || referrerRecords.length === 0) {
        console.log("Referrer not found:", referrer_address);
        return e.json(404, { 
            success: false, 
            error: { message: "Referrer not found", code: "REFERRER_NOT_FOUND" } 
        });
    }
    
    const referrer = referrerRecords[0];
    console.log("Referrer found:", referrer.id);
    
    // Check if user already exists
    const existingUsers = $app.findRecordsByFilter(
        "users",
        "wallet = {:wallet}",
        "",
        1,
        0,
        { wallet: user_address }
    )
    
    if (existingUsers && existingUsers.length > 0) {
        console.log("User already exists:", user_address);
        return e.json(409, { 
            success: false, 
            error: { message: "User already registered", code: "USER_EXISTS" } 
        });
    }
    
    // Create user record
    const userCollection = $app.findCollectionByNameOrId('users');
    const user = new Record(userCollection);
    user.set('wallet', user_address);
    user.set('email', email || `${user_address}@user.local`);
    user.set('password', password || generateRandomPassword());
    user.set('name', name || `User_${user_address.substring(2, 8)}`);
    user.set('referrer_id', referrer.id);
    
    // Build 4-level referral chain
    const referralChain = buildReferralChain(referrer);
    console.log("Referral chain:", referralChain);
    user.set('referral_chain', JSON.stringify(referralChain));
    
    $app.save(user);
    console.log("User created:", user.id);
    
    // Create referral records in referrals collection
    createReferralRecords(referrer.id, user.id, referralChain);
    
// Update referrer's direct recruit count
const currentCount = referrer.getNumber('total_direct_recruits') || 0;
const newCount = currentCount + 1;
referrer.set('total_direct_recruits', newCount);
$app.save(referrer);

console.log("Updated direct recruits for referrer:", referrer.id, "count:", newCount);

checkRecruitmentMilestones(referrer, newCount, currentCount);

// Emit UserRegistered event
emitUserRegisteredEvent(user, referralChain);
    
    return e.json(201, {
        success: true,
        data: {
            user_id: user.id,
            wallet: user_address,
            referral_chain: referralChain
        }
    });
});

function buildReferralChain(startReferrer) {
    const chain = [];
    let current = startReferrer;
    
    for (let level = 1; level <= 4; level++) {
        if (!current) break;
        
        chain.push(current.id);
        
        // Get next level referrer
        const nextReferrerId = current.getString('referrer_id');
        if (!nextReferrerId) break;
        
        try {
            current = $app.findRecordById('users', nextReferrerId);
        } catch (err) {
            console.log("Referrer not found at level", level, ":", nextReferrerId);
            break;
        }
    }
    
    // Pad with platform address if chain < 4
    while (chain.length < 4) {
        chain.push(PLATFORM_ADDRESS)
    }
    
    return chain;
}

function createReferralRecords(referrerId, userId, chain) {
    const referralCollection = $app.findCollectionByNameOrId('referrals');
    
    chain.forEach((uplineId, index) => {
        if (uplineId === PLATFORM_ADDRESS) return
        
        const record = new Record(referralCollection);
        record.set('referrer_id', uplineId);
        record.set('referee_id', userId);
        record.set('level', index + 1);
        $app.save(record);
        console.log("Created referral record: G" + (index + 1), uplineId, "->", userId);
    });
}

function emitUserRegisteredEvent(user, referralChain) {
    // Log event for external monitoring
    console.log('EVENT:UserRegistered', JSON.stringify({
        user_address: user.getString('wallet'),
        user_id: user.id,
        referral_chain: referralChain,
        timestamp: new Date().toISOString()
    }));
}

function generateRandomPassword() {
    // Use PocketBase's built-in $security API instead of Node.js crypto
    return $security.randomString(32)
}

function checkRecruitmentMilestones(user, newCount, currentCount) {
    // Define recruitment thresholds
    const thresholds = [
        { recruits: 10, foodItems: 10 },
        { recruits: 100, foodItems: 50 },
        { recruits: 1000, foodItems: 100 },
        { recruits: 10000, foodItems: 200 },
    ];
    
    // Check if new count crosses any threshold
    for (const threshold of thresholds) {
        // Only process if the new count crosses the threshold and current count was below it
        if (newCount >= threshold.recruits && currentCount < threshold.recruits) {
            console.log("Check if new count crosses any threshold for user ", user.id);
            
            // Grant Food NFTs
            grantFoodNFTs(user.id, threshold.foodItems);
        }
    }
}

function grantFoodNFTs(userId, itemCount) {
    try {
        const foodTypes = ["grain", "fish", "insects", "herbs"];
        const itemsPerType = Math.floor(itemCount / 4);
        const remainder = itemCount % 4;
        
        // Get food NFT collection
        const foodNftCollection = $app.findCollectionByNameOrId('food_nfts');
        
        for (let i = 0; i < 4; i++) {
            const count = itemsPerType + (i < remainder ? 1 : 0);
            if (count > 0) {
                // Create food NFT record
                const foodRecord = new Record(foodNftCollection);
                foodRecord.set('user_id', userId);
                foodRecord.set('food_type', foodTypes[i]);
                foodRecord.set('quantity', count);
                foodRecord.set('is_consumed', false);
                foodRecord.set('minted_at', new Date().toISOString());
                foodRecord.set('source', 'recruitment_bonus');
                
                $app.save(foodRecord);
                console.log(`Granted ${count} ${foodTypes[i]} Food NFTs to user ${userId} for recruitment milestone`);
            }
        }
        
        // Update user's total_food_recruiting_bonus field
        const updatedUser = $app.findRecordById('users', userId);
        const currentBonus = updatedUser.getNumber('total_food_recruiting_bonus') || 0;
        updatedUser.set('total_food_recruiting_bonus', currentBonus + itemCount);
        $app.save(updatedUser);
    } catch (error) {
        console.error(`Error granting Food NFTs to user ${userId}:`, error);
        // Don't fail if grant operation fails, it's not critical to registration processing
    }
}

console.log("Register user endpoint registered");
