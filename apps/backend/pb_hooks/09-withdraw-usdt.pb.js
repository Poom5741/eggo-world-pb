routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
    const requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    const body = requestInfo.body || {};
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
        // Get user record
        const userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        // KYC check disabled for MVP (D-08: KYC toggle optional, default false)
        // TODO: Enable KYC check when KYC system is implemented
        // const kycVerified = userRecord.get("kyc_verified") || false;
        // if (!kycVerified) {
        //     return e.json(403, { 
        //         success: false, 
        //         error: { message: "KYC verification required for withdrawals. Please complete your KYC first.", code: "KYC_REQUIRED" } 
        //     });
        // }
        
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        
        if (!walletRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        // Get withdrawal fee
        let withdrawalFeeRate = 0.05;
        try {
            const configRecord = $app.findFirstRecordByData("wallet_configs", "key", "WITHDRAWAL_FEE");
            if (configRecord) {
                withdrawalFeeRate = configRecord.get("value") || 0.05;
            }
        } catch (configErr) {
            console.log("Using default withdrawal fee:", withdrawalFeeRate);
        }
        
        const balance = walletRecord.get("usdt_balance") || 0;
        const fee = amount * withdrawalFeeRate;
        const totalRequired = amount + fee;
        
        if (balance < totalRequired) {
            return e.json(400, { 
                success: false, 
                error: { message: "Insufficient balance. Required: " + totalRequired + ", Available: " + balance, code: "INSUFFICIENT_BALANCE" } 
            });
        }
        
const withdrawalRecord = $app.newRecord($app.findCollectionByNameOrId("withdrawals"));
        withdrawalRecord.set("user_id", userRecord.id);
        withdrawalRecord.set("amount", amount);
        withdrawalRecord.set("fee", fee);
        withdrawalRecord.set("external_wallet_address", external_wallet_address);
        withdrawalRecord.set("status", "pending");
        $app.save(withdrawalRecord);

        // Attempt real blockchain transaction via wallet-api
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
            // Handle response as text
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
            // Timeout or server error: tx status unknown (may complete on-chain)
            if (walletApiResponse.statusCode >= 500 || walletApiResponse.statusCode === 0) {
                const pendingTxHash = txResponse?.txHash || txResponse?.data?.txHash || txResponse?.error?.txHash || null;
                withdrawalRecord.set("status", "pending_chain");
                withdrawalRecord.set("tx_hash", pendingTxHash);
                $app.save(withdrawalRecord);
                return e.json(502, {
                    success: false,
                    error: {
                        message: "Transaction submitted but confirmation pending. Check status later.",
                        code: "TRANSFER_PENDING_CONFIRMATION",
                        tx_hash: pendingTxHash
                    }
                });
            }
            // Client error or clear failure
            withdrawalRecord.set("status", "failed");
            withdrawalRecord.set("tx_hash", null);
            $app.save(withdrawalRecord);
            return e.json(400, {
                success: false,
                error: {
                    message: txResponse.error || "Blockchain transfer failed",
                    code: txResponse.error?.code || "TRANSFER_FAILED"
                }
            });
        }

        if (!txResponse.success) {
            withdrawalRecord.set("status", "failed");
            withdrawalRecord.set("tx_hash", null);
            $app.save(withdrawalRecord);
            return e.json(400, {
                success: false,
                error: {
                    message: txResponse.error?.message || "Blockchain transfer failed",
                    code: txResponse.error?.code || "TRANSFER_FAILED"
                }
            });
        }

        // Blockchain transaction succeeded. Update withdrawal to completed and deduct balances.
        withdrawalRecord.set("status", "completed");
        withdrawalRecord.set("tx_hash", txResponse.data?.txHash || null);
        $app.save(withdrawalRecord);

        const newBalance = balance - totalRequired;
        walletRecord.set("usdt_balance", newBalance);
        walletRecord.set("total_withdrawn", (walletRecord.get("total_withdrawn") || 0) + amount);
        walletRecord.set("last_transaction_at", new Date().toISOString());
        $app.save(walletRecord);

        userRecord.set("usdt_balance", newBalance);
        $app.save(userRecord);

        // Log withdrawal for monitoring
        console.log("Successful withdrawal:", user_address, "amount:", amount, "fee:", fee, "to:", external_wallet_address, "tx:", txResponse.data?.txHash);
        
        e.json(200, {
            success: true,
            data: {
                amount: amount,
                fee: fee,
                net_amount: amount,
                new_balance: newBalance,
                total_withdrawn: walletRecord.get("total_withdrawn"),
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
