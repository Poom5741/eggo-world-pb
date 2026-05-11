/**
 * Hook: 13-mint-egg-nft.pb.js
 * Event: Router (POST /api/v2/mint-egg)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate USDT balance (25 USDT required)
 * 3. Build referral chain (G1-G4) from referral_chain field
 * 4. Call EggNFT contract mintEgg(referrerChain)
 * 5. On success:
 *    - Create egg_nfts record
 *    - Deduct 25 USDT from buyer
 *    - Create commission_records for G1-G4
 *    - Update user usdt_balance
 *    - Emit event log
 * 
 * Request Body:
 * {
 *   "referrer_id": "user_id" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token_id": 1,
 *     "egg_id": 1,
 *     "tx_hash": "0x...",
 *     "food_count": 2,
 *     "referral_chain": [...]
 *   }
 * }
 */

routerAdd("POST", "/api/v2/mint-egg", (e) => {
    // Constants must be inside routerAdd callback — goja doesn't expose top-level vars to callbacks
    var INITIAL_FOOD_COUNT = parseInt($os.getenv("INITIAL_FOOD_COUNT") || "2", 10);
    var MINT_PRICE = "25000000000000000000"; // 25 USDT in wei (18 decimals)

    // Inline helper: call wallet-api to mint on chain
    // Defined here to avoid goja scope issues with top-level function declarations
    function callMintEggContract(userId, eggId, walletAddress, daccPublicKey, pin, referralChain, eggNftAddress) {
        var walletSrvUrl = $os.getenv('WALLET_SRV_URL') || 'http://wallet-api:3001';
        var response = $http.send({
            url: walletSrvUrl + '/api/wallet/mint-egg',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                eggId: eggId,
                wallet: walletAddress,
                daccPublicKey: daccPublicKey,
                pin: pin,
                referralChain: referralChain,
                eggNftAddress: eggNftAddress
            })
        });

        var responseData;
        if (response.json && typeof response.json === 'object') {
            responseData = response.json;
        } else if (response.body) {
            var responseBody = response.body;
            if (Array.isArray(response.body)) {
                responseBody = '';
                for (var bi = 0; bi < response.body.length; bi++) {
                    responseBody += String.fromCharCode(response.body[bi]);
                }
            }
            responseData = JSON.parse(responseBody);
        }

        // Log network errors with status code for debugging
        if (response.statusCode < 200 || response.statusCode >= 300) {
            console.error('[Mint] Wallet API error:', response.statusCode, JSON.stringify(responseData));
            
            // Map wallet-api error codes to PB hook error codes
            var errorCode = 'MINT_FAILED';
            if (responseData && responseData.error) {
                var walletError = responseData.error;
                var walletErrorCode = walletError.code || '';
                
                // Map specific error codes from wallet-api
                if (walletErrorCode === 'GAS_ESTIMATION_FAILED') {
                    errorCode = 'GAS_ESTIMATION_FAILED';
                } else if (walletErrorCode === 'TRANSACTION_REVERTED') {
                    errorCode = 'TRANSACTION_REVERTED';
                } else if (walletErrorCode === 'INSUFFICIENT_FUNDS_FOR_GAS') {
                    errorCode = 'INSUFFICIENT_FUNDS_FOR_GAS';
                } else if (walletErrorCode === 'INSUFFICIENT_FUNDS') {
                    errorCode = 'INSUFFICIENT_BALANCE';
                }
            }
            
            var errorMsg = 'Contract call failed';
            if (responseData && responseData.error) {
                errorMsg = responseData.error.message || String(responseData.error);
            } else if (responseData && responseData.message) {
                errorMsg = responseData.message;
            }
            
            var networkError = new Error(typeof errorMsg === 'string' ? errorMsg : String(errorMsg));
            networkError.code = errorCode;
            networkError.statusCode = response.statusCode;
            throw networkError;
        }

        if (!responseData || !responseData.data || !responseData.data.txHash) {
            console.error('[Mint] Invalid wallet-api response:', JSON.stringify(responseData));
            throw new Error('Wallet API returned invalid response: missing txHash');
        }

        return responseData.data.txHash;
    }

    // Inline helper: create commission records for referral chain
    function createCommissionRecords(buyerId, referralChain, txHash, eggRecordId) {
        var commissionPercents = [25, 15, 10, 5];
        var mintPrice = 25;
        var commissionCollection = $app.findCollectionByNameOrId('commission_records');

        for (var ci = 0; ci < referralChain.length; ci++) {
            if (referralChain[ci] === null) continue;

            var referrerWallet = null;
            try {
                referrerWallet = $app.findFirstRecordByData('user_wallets', 'wallet_address', referralChain[ci]);
            } catch (refErr) {
                console.log('[Mint] findFirstRecordByData referrer error:', String(refErr));
            }
            if (!referrerWallet) continue;

            var commissionAmount = (mintPrice * commissionPercents[ci]) / 100;
            var commRecord = new Record(commissionCollection);
            commRecord.set('user', referrerWallet.get('user_id'));
            commRecord.set('level', ci + 1);
            commRecord.set('amount', commissionAmount);
            commRecord.set('tx_hash', txHash.toLowerCase());
            commRecord.set('from_egg', eggRecordId);
            commRecord.set('claimed', false);
            commRecord.set('claimed_at', null);
            $app.save(commRecord);
        }
    }
    try {
        // Use requestInfo which has auth data parsed by PocketBase
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        const collectionId = requestInfo.auth?.collectionId;
        
        console.log('[Mint] Auth userId:', userId, 'collectionId:', collectionId);
        
        if (!userId) {
            return e.json(401, { 
                success: false, 
                error: { 
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                } 
            });
        }
        
        // Get user record
        let user = null;
        try {
            console.log('[Mint] Trying users collection...');
            user = $app.findRecordById('users', userId);
            console.log('[Mint] Found in users:', user ? user.id : 'NULL');
            console.log('[Mint] user type:', typeof user);
            console.log('[Mint] user.get type:', typeof user?.get);
            console.log('[Mint] user constructor:', user?.constructor?.name);
        } catch (err) {
            console.log('[Mint] users collection failed, trying collectionId:', collectionId);
            try {
                user = $app.findRecordById(collectionId, userId);
                console.log('[Mint] Found in collectionId:', user ? user.id : 'NULL');
            } catch (err2) {
                console.log('[Mint] collectionId also failed:', err2);
            }
        }
        
        if (!user) {
            return e.json(401, { 
                success: false, 
                error: { 
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                } 
            });
        }
        
        const body = requestInfo.body || {};
        const referrerId = body.referrer_id || null;

        let wallet = null;
        try {
            wallet = $app.findFirstRecordByData('user_wallets', 'user_id', user.id);
        } catch (walletErr) {
            console.log('[Mint] findFirstRecordByData wallet error:', String(walletErr));
        }
        
        console.log('[Mint] wallet record:', wallet ? wallet.id : 'NULL');
        console.log('[Mint] wallet type:', typeof wallet);

        if (!wallet) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Wallet not found',
                    code: 'WALLET_NOT_FOUND'
                } 
            });
        }
        
        const usdtBalanceRaw = wallet.get('usdt_balance');
        console.log('[Mint] usdt_balance raw:', usdtBalanceRaw);
        console.log('[Mint] usdt_balance type:', typeof usdtBalanceRaw);
        
        const usdtBalance = parseFloat(usdtBalanceRaw || '0');
        console.log('[Mint] usdtBalance parsed:', usdtBalance);
        const mintPriceUsdt = 25;
        console.log('[Mint] mintPriceUsdt:', mintPriceUsdt, 'type:', typeof mintPriceUsdt);
        console.log('[Mint] Comparison:', usdtBalance, '<', mintPriceUsdt, '=', usdtBalance < mintPriceUsdt);

        if (usdtBalance < mintPriceUsdt) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient USDT balance. Required: ${mintPriceUsdt} USDT, Available: ${usdtBalance} USDT`,
                    code: 'INSUFFICIENT_BALANCE'
                } 
            });
        }

        // Get wallet fields from the user record
        console.log('[Mint] Getting wallet fields from user...');
        const walletAddress = user.get('wallet');
        console.log('[Mint] walletAddress:', walletAddress);
        const daccPublicKey = user.get('daccPublickey');
        console.log('[Mint] daccPublicKey:', daccPublicKey ? 'PRESENT' : 'MISSING');
        const pin = user.get('pin');
        console.log('[Mint] pin:', pin ? 'PRESENT' : 'MISSING');

        let referralChain = [null, null, null, null];
        
        // Build referral chain from users.referral_chain field
        if (referrerId) {
            let referrer;
            try {
                referrer = $app.findRecordById('users', referrerId);
            } catch (e) {
                try {
                    referrer = $app.findFirstRecordByData('users', 'name', referrerId);
                } catch (e2) {
                    referrer = null;
                }
            }
            if (!referrer) {
                return e.json(400, { success: false, error: { message: 'Referrer not found', code: 'REFERRER_NOT_FOUND' } });
            }

            referralChain[0] = referrer.get('wallet');
            
            // Get G2-G4 from referrer's referral_chain array
            const referrerChain = referrer.get('referral_chain') || [];
            for (let i = 0; i < Math.min(referrerChain.length, 3); i++) {
                if (referrerChain[i]) {
                    let genUser;
                    try { genUser = $app.findRecordById('users', referrerChain[i]); } catch (e) { genUser = null; }
                    if (genUser) {
                        referralChain[i + 1] = genUser.get('wallet');
                    }
                }
            }
        }

        const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xaEF5bd8f90edB4532E39017746Fe6904d96A90E3';
        if (!eggNftAddress) {
            return e.json(500, { 
                success: false, 
                error: { 
                    message: 'EggNFT contract address not configured',
                    code: 'CONFIG_ERROR'
                } 
            });
        }

        var eggId = Date.now();
        const txHash = callMintEggContract(
            user.id,
            eggId,
            walletAddress,
            daccPublicKey,
            pin,
            referralChain,
            eggNftAddress
        );

        const eggNftsCollection = $app.findCollectionByNameOrId('egg_nfts');
        const record = new Record(eggNftsCollection);
        
        const raritySeed = Math.floor(Math.random() * 1000000);
        
        record.set('egg_id', eggId);
        record.set('owner', user.id);
        record.set('token_id', parseInt(txHash.slice(-8), 16) % 1000000);
        record.set('contract_address', eggNftAddress.toLowerCase());
        record.set('food_count', INITIAL_FOOD_COUNT);
        record.set('is_hatched', false);
        record.set('generation', 0);
        record.set('is_breeding_egg', false);
        record.set('parent1_animal_id', 0);
        record.set('parent2_animal_id', 0);
        record.set('rarity_upgrade_count', 0);
        record.set('rarity_seed', raritySeed);
        record.set('referral_chain', referralChain.filter(addr => addr !== null));
        record.set('tx_hash', txHash.toLowerCase());
        record.set('minted_at', new Date().toISOString());

        $app.save(record);

        wallet.set('usdt_balance', (usdtBalance - mintPriceUsdt).toFixed(2));
        $app.save(wallet);

        createCommissionRecords(user.id, referralChain, txHash, record.id);

        // Transaction logging for monitoring dashboard
        try {
            const transactionLogsCollection = $app.findCollectionByNameOrId('transaction_logs');
            const transactionLog = new Record(transactionLogsCollection);
            transactionLog.set('user', user.id);
            transactionLog.set('tx_hash', txHash.toLowerCase());
            transactionLog.set('tx_type', 'mint');
            transactionLog.set('status', 'success');
            transactionLog.set('gas_used', null); // Not captured in this flow
            $app.save(transactionLog);
        } catch (logErr) {
            console.error('Failed to log mint transaction:', logErr);
        }

        $app.logger().info('Egg NFT minted', {
            userId: user.id,
            tokenId: record.get('token_id'),
            eggId: record.get('egg_id'),
            txHash: txHash,
            referralChain: referralChain.filter(addr => addr !== null)
        });

        return e.json(200, { 
            success: true, 
            data: { 
                token_id: record.get('token_id'),
                egg_id: record.get('egg_id'),
                tx_hash: txHash,
                food_count: INITIAL_FOOD_COUNT,
                is_hatched: false,
                generation: 0,
                rarity_seed: raritySeed,
                referral_chain: referralChain.filter(addr => addr !== null)
            } 
        });

    } catch (err) {
        console.error("[Mint] ERROR:", err);
        console.error("[Mint] ERROR stack:", err.stack);
        $app.logger().error("Mint egg NFT failed", err);

        // Safely extract error message and code
        let errorMessage = "Mint failed";
        let errorCode = "MINT_FAILED";

        if (err && typeof err === "object") {
            // Use error code if present (from network errors)
            if (err.code) {
                errorCode = err.code;
            }

            const msg = err.message || err.error || String(err);
            errorMessage = typeof msg === "string" ? msg : String(msg);
        } else if (typeof err === "string") {
            errorMessage = err;
        } else {
            errorMessage = String(err);
        }

        // Transaction logging for monitoring dashboard - error case
        try {
            const transactionLogsCollection =
                $app.findCollectionByNameOrId("transaction_logs");
            const transactionLog = new Record(transactionLogsCollection);
            transactionLog.set("user", user ? user.id : null);
            transactionLog.set("tx_hash", null);
            transactionLog.set("tx_type", "mint");
            transactionLog.set("status", "failed");
            transactionLog.set("error_message", errorMessage);
            $app.save(transactionLog);
        } catch (logErr) {
            console.error("Failed to log mint error transaction:", logErr);
        }

        return e.json(500, {
            success: false,
            error: {
                message: errorMessage,
                code: errorCode,
            },
        });
    }
});

console.log("Mint egg endpoint registered")

/**
 * GET /api/v2/tx-status/:hash
 * Checks if a tx_hash exists in egg_nfts — used by frontend polling.
 * Returns confirmed:true as soon as the record is saved (mock flow).
 */
routerAdd("GET", "/api/v2/tx-status/{hash}", (e) => {
    try {
        var hash = e.request.pathValue("hash");
        if (!hash) {
            return e.json(400, { success: false, error: { message: "Missing hash", code: "MISSING_HASH" } });
        }

        // Normalize: PocketBase stores lowercase
        var normalizedHash = hash.toLowerCase();

        var record = null;
        try {
            record = $app.findFirstRecordByData('egg_nfts', 'tx_hash', normalizedHash);
        } catch (lookupErr) {
            // Not found — still pending
        }

        if (record) {
            return e.json(200, {
                success: true,
                status: 'confirmed',
                confirmed: true,
                confirmations: 12,
                egg_id: record.id,
                token_id: record.get('token_id')
            });
        }

        // Not found yet — return pending
        return e.json(200, {
            success: true,
            status: 'pending',
            confirmed: false,
            confirmations: 0
        });
    } catch (err) {
        console.error('[tx-status] ERROR:', err);
        return e.json(500, { success: false, error: { message: String(err.message || err), code: 'TX_STATUS_ERROR' } });
    }
});

console.log("TX status endpoint registered")
