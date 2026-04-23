routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    const { user_address, amount, external_wallet_address } = body;
    
    if (!user_address || !amount || amount <= 0) {
        return e.json(400, { 
            success: false, 
            error: { message: "Invalid parameters: user_address and amount > 0 required", code: "VALIDATION_ERROR" } 
        });
    }
    
    if (!external_wallet_address || !external_wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
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
        
        const kycVerified = userRecord.get("kyc_verified") || false;
        if (!kycVerified) {
            return e.json(403, { 
                success: false, 
                error: { message: "KYC verification required for withdrawals. Please complete your KYC first.", code: "KYC_REQUIRED" } 
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
                withdrawalFeeRate = configRecord.getNumber("value") || 0.05;
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
        
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        const walletApiResponse = $http.send({
            url: walletApiUrl + "/api/v1/wallet/transfer",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                from_address: user_address,
                to_address: external_wallet_address,
                amount: amount,
                fee: fee,
                user_id: userRecord.id
            })
        });
        
        let txResponse;
        if (walletApiResponse.json && typeof walletApiResponse.json === "object") {
            txResponse = walletApiResponse.json;
        } else {
            let responseBody = walletApiResponse.body;
            if (Array.isArray(walletApiResponse.body)) {
                responseBody = "";
                for (let i = 0; i < walletApiResponse.body.length; i++) {
                    responseBody += String.fromCharCode(walletApiResponse.body[i]);
                }
            }
            txResponse = JSON.parse(responseBody);
        }
        
        if (walletApiResponse.statusCode < 200 || walletApiResponse.statusCode >= 300) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: txResponse.error || "Blockchain transfer failed", 
                    code: txResponse.error?.code || "TRANSFER_FAILED" 
                } 
            });
        }
        
        if (!txResponse.success) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: txResponse.error?.message || "Blockchain transfer failed", 
                    code: txResponse.error?.code || "TRANSFER_FAILED" 
                } 
            });
        }
        
        const newBalance = balance - totalRequired;
        walletRecord.set("usdt_balance", newBalance);
        walletRecord.set("total_withdrawn", (walletRecord.getNumber("total_withdrawn") || 0) + amount);
        walletRecord.set("last_transaction_at", new Date().toISOString());
        $app.save(walletRecord);
        
        userRecord.set("usdt_balance", newBalance);
        $app.save(userRecord);
        
        const withdrawalRecord = $app.newRecord($app.findCollectionByNameOrId("withdrawals"));
        withdrawalRecord.set("user_id", userRecord.id);
        withdrawalRecord.set("amount", amount);
        withdrawalRecord.set("fee", fee);
        withdrawalRecord.set("external_wallet_address", external_wallet_address);
        withdrawalRecord.set("status", "completed");
        withdrawalRecord.set("tx_hash", txResponse.data?.txHash || null);
        $app.save(withdrawalRecord);
        
        console.log("Successful withdrawal:", user_address, "amount:", amount, "fee:", fee, "to:", external_wallet_address, "tx:", txResponse.data?.txHash);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                fee: fee,
                net_amount: amount,
                new_balance: newBalance,
                total_withdrawn: walletRecord.getNumber("total_withdrawn"),
                external_wallet_address: external_wallet_address,
                tx_hash: txResponse.data?.txHash
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

// KYC Management hook for user verification
routerAdd("PUT", "/api/v2/kyc/submit", (e) => {
    const { users } = e.requireAuth();
    const body = e.parseBody();
    
    try {
        users.set("kyc_verified", false);
        users.set("kyc_status", "pending");  
        users.set("kyc_submitted_date", new Date().toISOString());
        users.set("kyc_documents", JSON.stringify(body.documents || {}));
        users.set("kyc_country_residence", body.country || "");
        
        $app.save(users);
        
        e.json(200, {
            success: true,
            data: {
                message: "KYC submission recorded",
                status: "pending",
                next_review_eta: "3-5 business days"
            }
        });
    } catch (error) {
        console.error("KYC submission error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "KYC_SUBMISSION_FAILED" }
        });
    }
});

// Admin hook for reviewing KYC
routerAdd("POST", "/api/v2/admin/kyc-review", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id) !== null;
    
    if (!isAdmin) {
        return e.json(401, {
            success: false,
            error: { message: "Administrator access required", code: "ADMIN_ACCESS_REQUIRED" }
        });
    }
    
    const body = e.parseBody();
    const { user_id, action, reason } = body;
    
    if (!user_id || !action) {
        return e.json(400, {
            success: false,
            error: { message: "user_id and action are required", code: "VALIDATION_ERROR" }
        });
    }
    
    if (!['approve', 'reject'].includes(action)) {
        return e.json(400, {
            success: false,
            error: { message: "action must be 'approve' or 'reject'", code: "VALIDATION_ERROR" }
        });
    }
    
    try {
        const userToReview = $app.findRecordById("users", user_id);
        if (!userToReview) {
            return e.json(404, {
                success: false,
                error: { message: "User not found", code: "USER_NOT_FOUND" }
            });
        }
        
        if (action === 'approve') {
            userToReview.set("kyc_verified", true);
            userToReview.set("kyc_status", "approved");
        } else {
            userToReview.set("kyc_verified", false);
            userToReview.set("kyc_status", "rejected");
            userToReview.set("kyc_rejection_reason", reason);
        }
        
        userToReview.set("kyc_reviewed_date", new Date().toISOString());
        userToReview.set("kyc_account_level", action === 'approve' ? "verified" : "basic");
        
        $app.save(userToReview);
        
        e.json(200, {
            success: true,
            data: {
                message: `KYC ${action}d successfully`,
                user_id: user_id,
                status: action === 'approve' ? 'approved' : 'rejected'
            }
        });
    } catch (error) {
        console.error("KYC admin review error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "KYC_REVIEW_FAILED" }
        });
    }
});

// CoinStor Admin functions
routerAdd("GET", "/api/v2/admin/coinstor/balance", async (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id);
    
    if (!isAdmin) {
        return e.json(401, {
            success: false,
            error: { message: "Administrator access required", code: "ADMIN_ACCESS_REQUIRED" }
        });
    }
    
    try {
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        
        // Query CoinStor balance from smart contract via wallet-api
        const response = $http.send({
            url: `${walletApiUrl}/api/v2/admin/coinstor/balance`,
            method: "GET"
        });
        
        let responseData;
        if (response.json && typeof response.json === "object") {
            responseData = response.json;
        } else if (response.body) {
            let responseBody = response.body;
            if (Array.isArray(response.body)) {
                responseBody = "";
                for (let i = 0; i < response.body.length; i++) {
                    responseBody += String.fromCharCode(response.body[i]);
                }
            }
            responseData = JSON.parse(responseBody);
        }
        
        console.log(`[CoinStor] Balance: ${responseData.data?.balance}`);
        
        e.json(200, {
            success: true,
            data: responseData.data || { balance: 0, coinStorAddress: "0x..." }
        });
    } catch (error) {
        console.error("[CoinStor] Balance error:", error.message);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "COINSTOR_BALANCE_FETCH_FAILED" }
        });
    }
});

// Function to handle CoinStor liquidity injection
routerAdd("POST", "/api/v2/admin/coinstor/inject-liquidity", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id) !== null;
    
    if (!isAdmin) {
        return e.json(401, {
            success: false,
            error: { message: "Administrator access required", code: "ADMIN_ACCESS_REQUIRED" }
        });
    }
    
    const body = e.parseBody();
    const { amount } = body;
    
    if (!amount || amount <= 0) {
        return e.json(400, {
            success: false,
            error: { message: "Valid amount is required", code: "VALIDATION_ERROR" }
        });
    }
    
    try {
        console.log(`CoinStor liquidity injection requested: ${amount} USDT`);
        
        e.json(200, {
            success: true,
            data: {
                message: "Liquidity injection initiated",
                amount: amount,
                status: "pending_blockchain_confirmation"
            }
        });
    } catch (error) {
        console.error("CoinStor liquidity injection error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "LIQUIDITY_INJECTION_FAILED" }
        });
    }
});

// Function to handle ecosystem rewards distribution
routerAdd("POST", "/api/v2/admin/coinstor/rewards-distribution", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id) !== null;
    
    if (!isAdmin) {
        return e.json(401, {
            success: false,
            error: { message: "Administrator access required", code: "ADMIN_ACCESS_REQUIRED" }
        });
    }
    
    const body = e.parseBody();
    const { recipients } = body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return e.json(400, {
            success: false,
            error: { message: "Recipients array is required", code: "VALIDATION_ERROR" }
        });
    }
    
    try {
        console.log(`Reward distribution to ${recipients.length} recipients initiated`);
        
        for (const recipient of recipients) {
            if (!recipient.wallet || !recipient.amount || recipient.amount <= 0) {
                return e.json(400, {
                    success: false,
                    error: { message: "Each recipient must have valid wallet and positive amount", code: "VALIDATION_ERROR" }
                });
            }
        }
        
        e.json(200, {
            success: true,
            data: {
                message: `Reward distribution for ${recipients.length} recipients initiated`,
                recipientsProcessed: recipients.length,
                status: "processing"
            }
        });
    } catch (error) {
        console.error("Ecosystem rewards distribution error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "REWARDS_DISTRIBUTION_FAILED" }
        });
    }
});