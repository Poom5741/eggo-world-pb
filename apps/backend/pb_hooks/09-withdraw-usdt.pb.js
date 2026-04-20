routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { user_address, amount, external_wallet } = body;
    
    if (!user_address || !amount || amount <= 0) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: user_address and amount > 0 required", code: "VALIDATION_ERROR" } 
        });
    }
    
    if (!external_wallet || !external_wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Valid external wallet address required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        const userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        
        if (!walletRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        let withdrawalFeeRate = 0.05;
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
        
        walletRecord.set("usdt_balance", balance - totalRequired);
        walletRecord.set("total_withdrawn", (walletRecord.getNumber("total_withdrawn") || 0) + amount);
        walletRecord.set("last_transaction_at", new Date().toISOString());
        $app.save(walletRecord);
        
        userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"));
        $app.save(userRecord);
        
        console.log("Withdrawal:", user_address, "amount:", amount, "fee:", fee, "to:", external_wallet);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                fee: fee,
                net_amount: amount,
                new_balance: walletRecord.getNumber("usdt_balance"),
                total_withdrawn: walletRecord.getNumber("total_withdrawn"),
                external_wallet: external_wallet
            }
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "WITHDRAWAL_FAILED" }
        });
    }
});
