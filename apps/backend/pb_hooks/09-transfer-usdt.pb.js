// ===== TRANSFER USDT ENDPOINT =====
// POST /api/v2/wallet/transfer - P2P USDT transfer between users

console.log("Setting up transfer USDT endpoint...");

routerAdd("POST", "/api/v2/wallet/transfer", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { from_address, to_address, amount } = body;
    
    // Validation
    if (!from_address || !to_address || !amount || amount <= 0) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: from_address, to_address, and amount > 0 required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        // Find sender and receiver
        const fromUser = $app.findFirstRecordByData("users", "wallet_address", from_address);
        const toUser = $app.findFirstRecordByData("users", "wallet_address", to_address);
        
        if (!fromUser || !toUser) {
            return e.json(404, { 
                success: false, 
                error: { message: "User not found", code: "USER_NOT_FOUND" } 
            });
        }
        
        // Find wallets
        const fromWallet = $app.findFirstRecordByData("user_wallets", "user_id", fromUser.id);
        const toWallet = $app.findFirstRecordByData("user_wallets", "user_id", toUser.id);
        
        if (!fromWallet || !toWallet) {
            return e.json(404, { 
                success: false, 
                error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const fromBalance = fromWallet.getNumber("usdt_balance") || 0;
        
        if (fromBalance < amount) {
            return e.json(400, { 
                success: false, 
                error: { message: "Insufficient balance. Required: " + amount + ", Available: " + fromBalance, code: "INSUFFICIENT_BALANCE" } 
            });
        }
        
        // Atomic transfer - debit sender
        fromWallet.set("usdt_balance", fromBalance - amount);
        fromWallet.set("total_spent", (fromWallet.getNumber("total_spent") || 0) + amount);
        fromWallet.set("last_transaction_at", new Date().toISOString());
        $app.save(fromWallet);
        
        // Credit receiver
        const toBalance = toWallet.getNumber("usdt_balance") || 0;
        toWallet.set("usdt_balance", toBalance + amount);
        toWallet.set("total_earned", (toWallet.getNumber("total_earned") || 0) + amount);
        toWallet.set("last_transaction_at", new Date().toISOString());
        $app.save(toWallet);
        
        // Update user records
        fromUser.set("usdt_balance", fromWallet.getNumber("usdt_balance"));
        toUser.set("usdt_balance", toWallet.getNumber("usdt_balance"));
        $app.save(fromUser);
        $app.save(toUser);
        
        console.log("Transfer successful:", from_address, "->", to_address, "amount:", amount);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                from_new_balance: fromWallet.getNumber("usdt_balance"),
                to_new_balance: toWallet.getNumber("usdt_balance"),
                from_total_spent: fromWallet.getNumber("total_spent"),
                to_total_earned: toWallet.getNumber("total_earned")
            }
        });
    } catch (error) {
        console.error("Transfer error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "TRANSFER_FAILED" }
        });
    }
}, { "requestTimeout": 30000 });

console.log("Transfer USDT endpoint registered");
