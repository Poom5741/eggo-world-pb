/**
 * 13-track-deposit.pb.js - Deposit Tracking Hook
 * 
 * Polls CommissionDistribution contract for Transfer events
 * and tracks USDT deposits to user wallets.
 * 
 * Endpoint: POST /api/v2/deposit/poll
 * Auth: Required (user must be authenticated)
 * 
 * Request: { user_address: "0x..." }
 * Response: { success: true, data: { deposits: [...], new_balance: number } }
 */

routerAdd("POST", "/api/v2/deposit/poll", async (e) => {
    e.requireAuth();
    const body = e.parseBody();
    const { user_address } = body;
    
    if (!user_address || !user_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Valid user_address required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        const CONFIG = globalThis.EGGO_CONFIG;
        
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
        
        const transferSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const toTopic = "0x" + user_address.slice(2).padStart(64, "0");
        
        const logsResponse = await fetch(CONFIG.blockchain.rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getLogs",
                params: [{
                    address: CONFIG.blockchain.contracts.CommissionDistribution,
                    fromBlock: "latest",
                    toBlock: "latest",
                    topics: [transferSignature, null, toTopic]
                }],
                id: 1
            })
        });
        
        const logsData = await logsResponse.json();
        
        if (logsData.error) {
            throw new Error("RPC error: " + logsData.error.message);
        }
        
        const eventLogs = logsData.result || [];
        const deposits = [];
        let totalDeposited = 0;
        
        for (const eventLog of eventLogs) {
            if (eventLog.removed) {
                continue;
            }
            
            const fromAddress = "0x" + eventLog.topics[1].slice(26);
            const toAddress = "0x" + eventLog.topics[2].slice(26);
            
            if (toAddress.toLowerCase() !== user_address.toLowerCase()) {
                continue;
            }
            
            const amountRaw = parseInt(eventLog.data, 16);
            const amountUSDT = amountRaw / Math.pow(10, 6);
            
            if (amountUSDT <= 0) {
                continue;
            }
            
            const txHash = eventLog.transactionHash;
            
            let existingDeposit = null;
            try {
                existingDeposit = $app.findFirstRecordByData("deposits", "tx_hash", txHash);
            } catch (err) {
            }
            
            if (existingDeposit) {
                console.log("Deposit already processed:", txHash);
                continue;
            }
            
            const currentBalance = walletRecord.getNumber("usdt_balance") || 0;
            walletRecord.set("usdt_balance", currentBalance + amountUSDT);
            walletRecord.set("total_earned", (walletRecord.getNumber("total_earned") || 0) + amountUSDT);
            walletRecord.set("last_transaction_at", new Date().toISOString());
            $app.save(walletRecord);
            
            userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"));
            $app.save(userRecord);
            
            const depositCollection = $app.findCollectionByNameOrId("deposits");
            const depositRecord = new Record(depositCollection);
            depositRecord.set("user", userRecord.id);
            depositRecord.set("amount", amountUSDT);
            depositRecord.set("tx_hash", txHash);
            depositRecord.set("from_address", fromAddress);
            depositRecord.set("status", "confirmed");
            depositRecord.set("confirmed_at", new Date().toISOString());
            $app.save(depositRecord);
            
            deposits.push({
                tx_hash: txHash,
                amount: amountUSDT,
                from_address: fromAddress,
                status: "confirmed"
            });
            
            totalDeposited += amountUSDT;
            
            console.log("Deposit tracked:", txHash, "amount:", amountUSDT, "user:", user_address);
        }
        
        const newBalance = walletRecord.getNumber("usdt_balance");
        
        e.json(200, {
            success: true,
            data: {
                deposits: deposits,
                new_balance: newBalance,
                total_deposited: totalDeposited,
                events_processed: eventLogs.length
            }
        });
        
    } catch (error) {
        console.error("Deposit poll error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "DEPOSIT_POLL_FAILED" }
        });
    }
}, { "requestTimeout": 30000 });

console.log("Deposit tracking endpoint registered: POST /api/v2/deposit/poll");
