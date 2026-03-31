// ===== REGISTER USER ENDPOINT =====
// Explicit registerUser(user_address, referrer_address) function with 4-level chain tracking

console.log("Setting up register user endpoint...");

const PLATFORM_ADDRESS = '0x0000000000000000000000000000000000000000';

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
        'users',
        `wallet = "${referrer_address}"`,
        '',
        1
    );
    
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
        'users',
        `wallet = "${user_address}"`,
        '',
        1
    );
    
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
    referrer.set('total_direct_recruits', currentCount + 1);
    $app.save(referrer);
    console.log("Updated direct recruits for referrer:", referrer.id, "count:", currentCount + 1);
    
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
        chain.push(PLATFORM_ADDRESS);
    }
    
    return chain;
}

function createReferralRecords(referrerId, userId, chain) {
    const referralCollection = $app.findCollectionByNameOrId('referrals');
    
    chain.forEach((uplineId, index) => {
        if (uplineId === PLATFORM_ADDRESS) return;
        
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
}

console.log("Register user endpoint registered");
