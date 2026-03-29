// ===== SPEND USDT ENDPOINT =====
// POST /api/v2/wallet/spend - Spend USDT for purchases (food items, etc.)

console.log("Setting up spend USDT endpoint...");

routerAdd("POST", "/api/v2/wallet/spend", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { user_address, amount, purpose } = body;
    
    // Validation
    if (!user_address || !amount || amount <= 0 || !purpose) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: user_address, amount > 0, and purpose required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        // Find user by wallet address
        const userRecord = $app.findFirstRecordByData("users", "wallet_address", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        // Find user's wallet record
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        
        if (!walletRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const balance = walletRecord.getNumber("usdt_balance") || 0;
        
        if (balance < amount) {
            return e.json(400, { 
                success: false, 
                error: { message: "Insufficient balance. Required: " + amount + ", Available: " + balance, code: "INSUFFICIENT_BALANCE" } 
            });
        }
        
        // Update wallet
        walletRecord.set("usdt_balance", balance - amount);
        walletRecord.set("total_spent", (walletRecord.getNumber("total_spent") || 0) + amount);
        walletRecord.set("last_transaction_at", new Date().toISOString());
        $app.save(walletRecord);
        
        // Update user record
        userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"));
        
        // Track food items if applicable
        if (purpose === "food_item") {
            userRecord.set("lifetime_food_items", (userRecord.getNumber("lifetime_food_items") || 0) + 1);
        }
        
        $app.save(userRecord);
        
        console.log("Spend successful:", user_address, "amount:", amount, "purpose:", purpose);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                purpose: purpose,
                new_balance: walletRecord.getNumber("usdt_balance"),
                total_spent: walletRecord.getNumber("total_spent")
            }
        });
    } catch (error) {
        console.error("Spend error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "SPEND_FAILED" }
        });
    }
});

console.log("Spend USDT endpoint registered");
