// ===== WITHDRAW USDT ENDPOINT =====
// POST /api/v2/wallet/withdraw - Withdraw USDT with platform fee

console.log("Setting up withdraw USDT endpoint...");

routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { user_address, amount } = body;
    
    // Validation
    if (!user_address || !amount || amount <= 0) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: user_address and amount > 0 required", code: "VALIDATION_ERROR" } 
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
        
        // Get withdrawal fee from config
        let withdrawalFeeRate = 0.05; // Default 5%
        try {
            const configRecord = $app.findFirstRecordByData("wallet_configs", "key", "WITHDRAWAL_FEE");
            if (configRecord) {
                withdrawalFeeRate = configRecord.getNumber("value");
            }
        } catch (configErr) {
            console.log("Using default withdrawal fee:", withdrawalFeeRate);
        }
        
        const balance = walletRecord.getNumber("usdt_balance") || 0;
        const fee = amount * withdrawalFeeRate;
        const totalRequired = amount + fee;
        
        if (balance < totalRequired) {
            return e.json(400, { 
                success: false, 
                error: { message: "Insufficient balance. Required: " + totalRequired + ", Available: " + balance, code: "INSUFFICIENT_BALANCE" } 
            });
        }
        
        // Update wallet
        walletRecord.set("usdt_balance", balance - totalRequired);
        walletRecord.set("total_withdrawn", (walletRecord.getNumber("total_withdrawn") || 0) + amount);
        walletRecord.set("last_transaction_at", new Date().toISOString());
        $app.save(walletRecord);
        
        // Update user record
        userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"));
        $app.save(userRecord);
        
        console.log("Withdrawal successful:", user_address, "amount:", amount, "fee:", fee);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                fee: fee,
                net_amount: amount,
                new_balance: walletRecord.getNumber("usdt_balance"),
                total_withdrawn: walletRecord.getNumber("total_withdrawn")
            }
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "WITHDRAWAL_FAILED" }
        });
    }
}, { "requestTimeout": 30000 });

console.log("Withdraw USDT endpoint registered");
