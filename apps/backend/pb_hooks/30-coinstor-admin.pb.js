/**
 * CoinStor Admin Dashboard Hook
 * 
 * Provides admin endpoints for CoinStor reserve management:
 * - Balance query from smart contract
 * - Liquidity injection
 * - Ecosystem rewards distribution
 * 
 * Access: Admin users only (superUser field check)
 */

const { $http } = require("pocketbase")

routerAdd("GET", "/api/v2/admin/coinstor/balance", (e) => {
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
        
        console.log(`[CoinStor] Balance: ${responseData.data?.balance} USDT`);
        
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

routerAdd("POST", "/api/v2/admin/coinstor/inject-liquidity", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id);
    
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
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        
        const response = $http.send({
            url: `${walletApiUrl}/api/v2/admin/coinstor/inject-liquidity`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amount })
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
        
        console.log(`[CoinStor] Liquidity injection: ${amount} USDT`);
        
        e.json(200, {
            success: true,
            data: responseData.data || { 
                message: "Liquidity injection initiated",
                amount: amount,
                status: "pending_blockchain_confirmation"
            }
        });
    } catch (error) {
        console.error("[CoinStor] Liquidity injection error:", error.message);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "LIQUIDITY_INJECTION_FAILED" }
        });
    }
});

routerAdd("POST", "/api/v2/admin/coinstor/rewards-distribution", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id);
    
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
        for (const recipient of recipients) {
            if (!recipient.wallet || !recipient.amount || recipient.amount <= 0) {
                return e.json(400, {
                    success: false,
                    error: { message: "Each recipient must have valid wallet and positive amount", code: "VALIDATION_ERROR" }
                });
            }
        }
        
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        
        const response = $http.send({
            url: `${walletApiUrl}/api/v2/admin/coinstor/rewards-distribution`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipients: recipients })
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
        
        console.log(`[CoinStor] Rewards distribution: ${recipients.length} recipients`);
        
        e.json(200, {
            success: true,
            data: responseData.data || {
                message: `Reward distribution for ${recipients.length} recipients initiated`,
                recipientsProcessed: recipients.length,
                status: "processing"
            }
        });
    } catch (error) {
        console.error("[CoinStor] Rewards distribution error:", error.message);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "REWARDS_DISTRIBUTION_FAILED" }
        });
    }
});

console.log("CoinStor admin hook registered");
