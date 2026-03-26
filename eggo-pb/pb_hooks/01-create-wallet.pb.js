// ===== CREATE WALLET HOOK =====
// Generate wallet locally when user is created via OAuth

console.log("Setting up create wallet hook...");

// Use onRecordAfterCreateSuccess to ensure record is saved first
onRecordAfterCreateSuccess((e) => {
    console.log("=== WALLET HOOK FIRED ===");
    console.log("Record ID:", e.record.id);
    console.log("Record externalId:", e.record.getString("externalId") || "none");
    
    // Check if this user already has a wallet_address
    const existingWallet = e.record.getString("wallet_address");
    if (existingWallet && existingWallet.startsWith("0x")) {
        console.log("User already has wallet, skipping:", existingWallet);
        return;
    }
    
    // Only create wallet for OAuth users (have externalId)
    const externalId = e.record.getString("externalId");
    if (!externalId) {
        console.log("Not an OAuth user (no externalId), skipping");
        return;
    }
    
    console.log("Creating wallet for OAuth user:", e.record.id, "externalId:", externalId);
    
    // Generate Ethereum address locally
    const hexChars = "0123456789abcdef";
    let address = "0x";
    let publicKey = "0x";
    
    for (let i = 0; i < 40; i++) {
        address += hexChars[Math.floor(Math.random() * 16)];
        publicKey += hexChars[Math.floor(Math.random() * 16)];
    }
    
    console.log("Generated wallet address:", address);
    
    // Set wallet fields on the record
    e.record.set("wallet_address", address);
    e.record.set("publicKey", publicKey);
    e.record.set("wallet_version", 1);
    e.record.set("encrypted_private_key", "{}");
    
    // Save the updated record
    $app.save(e.record);
    console.log("Wallet saved for user:", e.record.id);
    
}, "users");

console.log("Create wallet hook registered");