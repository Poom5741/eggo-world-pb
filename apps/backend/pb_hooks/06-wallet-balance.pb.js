// ===== WALLET BALANCE ENDPOINT =====
// GET /api/v2/wallet/balance - Get user's USDT balance

console.log("Setting up wallet balance endpoint...");

routerAdd("POST", "/api/v2/wallet/balance", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { user_address } = body;
    
    if (!user_address) {
        return e.json(400, { 
            success: false, 
            error: { message: "user_address is required", code: "VALIDATION_ERROR" } 
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
        
        e.json(200, {
            success: true,
            data: {
                usdt_balance: walletRecord.getNumber("usdt_balance") || 0,
                total_earned: walletRecord.getNumber("total_earned") || 0,
                total_spent: walletRecord.getNumber("total_spent") || 0,
                total_withdrawn: walletRecord.getNumber("total_withdrawn") || 0,
                user_id: userRecord.id,
                wallet_address: userRecord.getString("wallet_address")
            }
        });
    } catch (error) {
        console.error("Balance fetch error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "BALANCE_FETCH_FAILED" }
        });
    }
});

console.log("Wallet balance endpoint registered");
