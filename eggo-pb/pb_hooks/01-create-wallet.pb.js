// ===== CREATE WALLET HOOK =====
// Generate wallet locally when user is created

console.log("Setting up create wallet hook...");

onRecordCreate((e) => {
    console.log("=== CREATE HOOK FIRED ===");
    console.log("Record ID:", e.record ? e.record.id : "no record");
    
    // Try different ways to check if this is a users record
    let isUser = false;
    
    // Method 1: Check if wallet_address field exists (unique to users)
    try {
        const test = e.record.getString("wallet_address");
        isUser = true;
        console.log("Has wallet_address field, treating as user");
    } catch (err) {}
    
    // Method 2: Check collection name
    try {
        if (e.collection && e.collection.name === "users") {
            isUser = true;
            console.log("Collection is users");
        }
    } catch (err) {}
    
    // Method 3: Check if externalId field exists
    try {
        const extId = e.record.getString("externalId");
        if (extId !== undefined) {
            isUser = true;
            console.log("Has externalId field, treating as user");
        }
    } catch (err) {}
    
    if (!isUser) {
        console.log("Not a user record, skipping");
        e.next();
        return;
    }
    
    console.log("Creating wallet for user:", e.record.id);
    
    try {
        // Generate Ethereum address
        const hexChars = "0123456789abcdef";
        let address = "0x";
        let publicKey = "0x";
        
        for (let i = 0; i < 40; i++) {
            address += hexChars[Math.floor(Math.random() * 16)];
            publicKey += hexChars[Math.floor(Math.random() * 16)];
        }
        
        console.log("Generated wallet:", address);
        
        // Set fields
        e.record.set("wallet_address", address);
        e.record.set("publicKey", publicKey);
        e.record.set("wallet_version", 1);
        e.record.set("encrypted_private_key", "{}");
        
        console.log("Wallet fields set successfully");
        
    } catch (err) {
        console.error("Error creating wallet:", err);
    }
    
    e.next();
    
}, "users");

console.log("Create wallet hook registered");