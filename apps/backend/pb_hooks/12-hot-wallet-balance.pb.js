routerAdd("POST", "/api/v2/hot-wallet/balance", (e) => {
    const requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    const body = requestInfo.body || {};
    const { user_address } = body;
    
    if (!user_address || !user_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Valid wallet address required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        const userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User not found", code: "USER_NOT_FOUND" } 
            });
        }
        
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        
        if (!walletRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const withdrawable = walletRecord.get("usdt_balance") || 0;

        let withdrawalFeeRate = 0.05;
        try {
            const configRecord = $app.findFirstRecordByData("wallet_configs", "key", "WITHDRAWAL_FEE");
            if (configRecord) {
                withdrawalFeeRate = configRecord.get("value") || 0.05;
            }
        } catch (configErr) {
            console.log("Using default withdrawal fee:", withdrawalFeeRate);
        }

        e.json(200, {
            success: true,
            data: {
                withdrawable: withdrawable,
                usdt_balance: withdrawable,
                total_earned: walletRecord.get("total_earned") || 0,
                total_spent: walletRecord.get("total_spent") || 0,
                total_withdrawn: walletRecord.get("total_withdrawn") || 0,
                user_id: userRecord.id,
                wallet: userRecord.getString("wallet"),
                withdrawal_fee_rate: withdrawalFeeRate
            }
        });
    } catch (error) {
        console.error("Hot wallet balance error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "HOT_WALLET_BALANCE_FAILED" }
        });
    }
});

