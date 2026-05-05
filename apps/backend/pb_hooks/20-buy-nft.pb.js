/**
 * Hook: 20-buy-nft.pb.js
 * Event: Router (POST /api/v2/marketplace/buy)
 * 
 * Flow:
 * 1. Authenticate user (buyer)
 * 2. Get listing from marketplace_listings collection
 * 3. Verify NFT exists and is listed for sale
 * 4. Verify buyer has sufficient USDT balance
 * 5. Call wallet-api for on-chain purchase (gas sponsored by platform)
 * 6. Wait for on-chain confirmation (12 blocks)
 * 7. After on-chain success, update PocketBase records:
 *    - Transfer NFT ownership to buyer
 *    - Update user_wallets balances
 *    - Mark listing as sold
 *    - Create commission records
 *    - Record transaction
 * 8. Return success with on-chain transaction hash
 * 
 * Request Body:
 * {
 *   "listing_id": "marketplace_listing_record_id",
 *   "buyer_address": "0x..." (optional, for logging)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "nft_token_id": 1,
 *     "nft_type": "egg",
 *     "price": "25.00",
 *     "platform_fee": "1.00",
 *     "seller_amount": "24.00",
 *     "new_owner": "buyer_user_id",
 *     "tx_hash": "0x..." (on-chain transaction hash)
 *   }
 * }
 */

routerAdd("POST", "/api/v2/marketplace/buy", (e) => {
    // Constants must be inside routerAdd callback — goja doesn't expose top-level vars to callbacks
    const PLATFORM_FEE_PERCENT = 4; // 4% platform fee
    try {
        const requestInfo = e.requestInfo()
        const buyerRecord = requestInfo.auth
        if (!buyerRecord) {
            return e.json(401, { success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } })
        }
        let buyer;
        try { buyer = $app.findRecordById("users", buyerRecord.id); } catch (err) { return e.json(401, { success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } }); }
        
        const body = requestInfo.body;
        const { listing_id, buyer_address } = body || {};
        
        // Validate inputs
        if (!listing_id) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'listing_id is required',
                    code: 'INVALID_PARAMETERS'
                } 
            });
        }
        
        // Find the marketplace listing
        let listing;
        try { listing = $app.findRecordById('marketplace_listings', listing_id); } catch (err) { return e.json(404, { success: false, error: { message: 'Listing not found', code: 'LISTING_NOT_FOUND' } }); }
        
        if (!listing) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'Listing not found',
                    code: 'LISTING_NOT_FOUND'
                } 
            });
        }
        
        // Verify listing is active
        if (listing.getString('status') !== 'active') {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Listing is not active',
                    code: 'LISTING_NOT_ACTIVE'
                } 
            });
        }
        
        // Get listing details
        const nftId = listing.getString('nft_id');
        const nftType = listing.getString('nft_type');
        const price = parseFloat(listing.get('price') || '0');
        const sellerId = listing.getString('seller') || listing.getString('seller_id');
        
        if (!nftId || !nftType || !price || !sellerId) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid listing data',
                    code: 'INVALID_LISTING'
                } 
            });
        }
        
        // Validate NFT type
        const validTypes = ['egg', 'food', 'animal', 'Egg', 'Food', 'Animal'];
        const normalizedNftType = nftType.toLowerCase();
        if (!validTypes.includes(nftType)) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid NFT type. Must be: egg, food, or animal',
                    code: 'INVALID_NFT_TYPE'
                } 
            });
        }
        
        // Determine collection name and find NFT record
        const collectionName = normalizedNftType === 'egg' ? 'egg_nfts' : normalizedNftType === 'food' ? 'food_nfts' : 'animal_nfts';
        let nft;
        try { nft = $app.findRecordById(collectionName, nftId); } catch (err) { return e.json(404, { success: false, error: { message: 'NFT not found', code: 'NFT_NOT_FOUND' } }); }
        
        if (!nft) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'NFT not found',
                    code: 'NFT_NOT_FOUND'
                } 
            });
        }
        
        // Verify NFT is still owned by seller
        const currentOwner = nft.getString('owner');
        if (currentOwner !== sellerId) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'NFT ownership mismatch',
                    code: 'OWNERSHIP_MISMATCH'
                } 
            });
        }
        
        // Get seller info
        let seller;
        try { seller = $app.findRecordById('users', sellerId); } catch (err) { return e.json(404, { success: false, error: { message: 'Seller not found', code: 'SELLER_NOT_FOUND' } }); }
        
        // Check buyer's USDT balance
        const buyerWallet = $app.findFirstRecordByData('user_wallets', 'user_id', buyer.id);
        
        if (!buyerWallet) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Buyer wallet not found',
                    code: 'BUYER_WALLET_NOT_FOUND'
                } 
            });
        }
        
        const buyerBalance = parseFloat(buyerWallet.get('usdt_balance') || '0');
        if (buyerBalance < price) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient balance. Required: ${price} USDT, Available: ${buyerBalance} USDT`,
                    code: 'INSUFFICIENT_BALANCE'
                } 
            });
        }
        
        var mockBlockchain = ($os.getenv("MOCK_BLOCKCHAIN") || "").toLowerCase() === "true";
        var txHash = "0xMOCK_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
        
        if (!mockBlockchain) {
            // Call wallet-api for on-chain purchase (gas sponsored by platform)
            const walletApiUrl = $os.getenv("WALLET_API_URL") || "http://localhost:3001"
            const marketplaceContractAddress = $os.getenv("MARKETPLACE_CONTRACT_ADDRESS")
            
            if (!marketplaceContractAddress) {
                return e.json(500, {
                    success: false,
                    error: {
                        message: "Marketplace contract address not configured",
                        code: "CONFIG_ERROR"
                    }
                })
            }
            
            console.log("Calling wallet-api for on-chain purchase: nftType=" + nftType + ", nftId=" + nftId)
            
            // Resolve NFT contract address from type
            var nftContractAddress = "";
            if (normalizedNftType === "egg") {
                nftContractAddress = $os.getenv("EGG_NFT_CONTRACT_ADDRESS") || "";
            } else if (normalizedNftType === "food") {
                nftContractAddress = $os.getenv("FOOD_NFT_CONTRACT_ADDRESS") || "";
            } else if (normalizedNftType === "animal") {
                nftContractAddress = $os.getenv("ANIMAL_NFT_CONTRACT_ADDRESS") || "";
            }
            
            if (!nftContractAddress) {
                return e.json(500, {
                    success: false,
                    error: {
                        message: "NFT contract address not configured for type: " + nftType,
                        code: "CONFIG_ERROR"
                    }
                })
            }
            
            var nftTokenId = nft.get("token_id") || nftId;
            
            const walletApiResponse = $http.send({
                url: walletApiUrl + "/api/wallet/buy-nft",
                method: "POST",
                body: JSON.stringify({
                    buyerUserId: buyer.id,
                    nftContract: nftContractAddress,
                    tokenId: parseInt(nftTokenId),
                    marketplaceAddress: marketplaceContractAddress,
                    listingPrice: price
                }),
                headers: { "Content-Type": "application/json" },
                timeout: 120
            })
            
            if (walletApiResponse.statusCode !== 200) {
                console.log("wallet-api error: " + JSON.stringify(walletApiResponse.body || walletApiResponse.content))
                return e.json(500, {
                    success: false,
                    error: {
                        message: "On-chain purchase failed",
                        code: "ON_CHAIN_BUY_FAILED",
                        details: walletApiResponse.content
                    }
                })
            }
            
            var walletApiResult;
            if (walletApiResponse.json && typeof walletApiResponse.json === "object") {
                walletApiResult = walletApiResponse.json;
            } else {
                var responseBody = walletApiResponse.body;
                if (Array.isArray(responseBody)) {
                    var bodyStr = "";
                    for (var i = 0; i < responseBody.length; i++) {
                        bodyStr += String.fromCharCode(responseBody[i]);
                    }
                    walletApiResult = JSON.parse(bodyStr);
                } else {
                    walletApiResult = JSON.parse(responseBody);
                }
            }
            if (!walletApiResult.success) {
                return e.json(500, {
                    success: false,
                    error: {
                        message: walletApiResult.error ? walletApiResult.error.message : "Unknown error",
                        code: walletApiResult.error ? walletApiResult.error.code : "UNKNOWN"
                    }
                })
            }
            
            txHash = walletApiResult.data.txHash
            console.log("On-chain purchase confirmed: " + txHash)
        } else {
            console.log("[MOCK] Skipping on-chain purchase, using mock txHash: " + txHash)
        }
        
        // Calculate platform fee and seller amount
        const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
        const sellerAmount = price - platformFee;
        
        // Deduct USDT from buyer
        buyerWallet.set('usdt_balance', buyerBalance - price);
        buyerWallet.set('total_spent', (parseFloat(buyerWallet.get('total_spent') || '0')) + price);
        buyerWallet.set('last_transaction_at', new Date().toISOString());
        $app.save(buyerWallet);
        
        // Update buyer's user record
        buyer.set('usdt_balance', buyerWallet.get('usdt_balance'));
        $app.save(buyer);
        
        // Credit seller (find or create seller wallet)
        const sellerWallet = $app.findFirstRecordByData('user_wallets', 'user_id', seller.id);
        
        if (sellerWallet) {
            const currentBalance = parseFloat(sellerWallet.get('usdt_balance') || '0');
            sellerWallet.set('usdt_balance', currentBalance + sellerAmount);
            sellerWallet.set('total_earned', (parseFloat(sellerWallet.get('total_earned') || '0')) + sellerAmount);
            sellerWallet.set('last_transaction_at', new Date().toISOString());
            $app.save(sellerWallet);
            
            // Update seller's user record
            seller.set('usdt_balance', sellerWallet.get('usdt_balance'));
            $app.save(seller);
        }
        
        // Transfer NFT ownership
        nft.set('owner', buyer.id);
        nft.set('is_listed', false);
        nft.set('listed_price', null);
        $app.save(nft);
        
        // Record transaction (non-blocking - skip if collection doesn't match or doesn't exist)
        try {
            const transactionsCollection = $app.findCollectionByNameOrId("transactions");
            const transaction = new Record(transactionsCollection);
            transaction.set("user", buyer.id);
            transaction.set("amount_usdt", price);
            transaction.set("nft_id", nftId);
            transaction.set("nft_type", nftType);
            transaction.set("status", "completed");
            transaction.set("type", "purchase");
            $app.save(transaction);
        } catch (txError) {
            console.error("Failed to record transaction (non-critical):", String(txError));
        }
        
        // Mark listing as sold
        listing.set('status', 'sold');
        listing.set('buyer_id', buyer.id);
        listing.set('sold_at', new Date().toISOString());
        $app.save(listing);
        
        console.log(`NFT purchased: ${nftType} ${nftId} sold for ${price} USDT from ${sellerId} to ${buyer.id} via listing ${listing_id}`);
        
        return e.json(200, {
            success: true,
            data: {
                nft_token_id: nft.get('token_id') || nftId,
                nft_type: nftType,
                price: price,
                platform_fee: platformFee,
                seller_amount: sellerAmount,
                new_owner: buyer.id,
                tx_hash: txHash // On-chain transaction hash
            }
        });
    } catch (error) {
        console.error('Buy NFT error:', error);
        return e.json(500, {
            success: false,
            error: { 
                message: error.message, 
                code: 'PURCHASE_FAILED' 
            }
        });
    }
});
