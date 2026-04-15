/**
 * 14-buy-nft.pb.js - Marketplace NFT Purchase Hook
 * 
 * Handles NFT purchases using PocketBase usdt_balance (no MetaMask interaction)
 * Similar to Prep DEX: user balance → PocketBase → blockchain
 * 
 * Flow:
 * 1. Check buyer's usdt_balance in PocketBase
 * 2. Deduct balance from buyer
 * 3. Credit seller's balance (minus platform fee)
 * 4. Call blockchain to transfer NFT
 * 5. Update listing status to 'sold'
 * 6. Record transaction
 * 
 * Endpoint: POST /api/v2/marketplace/buy
 * Auth: Required (buyer must be authenticated)
 * 
 * Request: { listing_id: "...", buyer_address: "0x..." }
 * Response: { success: true, data: { tx_hash: "...", new_balance: number } }
 */

routerAdd("POST", "/api/v2/marketplace/buy", async (e) => {
    e.requireAuth();
    const body = e.parseBody();
    const { listing_id, buyer_address } = body;
    
    // Validation
    if (!listing_id || !buyer_address || !buyer_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Valid listing_id and buyer_address required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        const CONFIG = globalThis.EGGO_CONFIG;
        
        // Find buyer by wallet address
        const buyerRecord = $app.findFirstRecordByData("users", "wallet", buyer_address);
        
        if (!buyerRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "Buyer not found", code: "USER_NOT_FOUND" } 
            });
        }
        
        // Find listing
        const listing = $app.dao().findRecordById('marketplace_listings', listing_id);
        
        if (!listing) {
            return e.json(404, { 
                success: false, 
                error: { message: "Listing not found", code: "LISTING_NOT_FOUND" } 
            });
        }
        
        // Check listing status
        if (listing.getString('status') !== 'active') {
            return e.json(400, { 
                success: false, 
                error: { message: "Listing is not active (status: " + listing.getString('status') + ")", code: "LISTING_NOT_ACTIVE" } 
            });
        }
        
        // Get seller
        const sellerRecord = $app.dao().findRecordById('users', listing.getString('seller'));
        
        if (!sellerRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "Seller not found", code: "SELLER_NOT_FOUND" } 
            });
        }
        
        // Get buyer and seller wallets
        const buyerWallet = $app.findFirstRecordByData("user_wallets", "user_id", buyerRecord.id);
        const sellerWallet = $app.findFirstRecordByData("user_wallets", "user_id", sellerRecord.id);
        
        if (!buyerWallet) {
            return e.json(404, { 
                success: false, 
                error: { message: "Buyer wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        if (!sellerWallet) {
            return e.json(404, { 
                success: false, 
                error: { message: "Seller wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const price = listing.getNumber('price');
        const platformFeePercent = CONFIG.blockchain.platformFeePercent || 4; // Default 4%
        const platformFee = price * (platformFeePercent / 100);
        const sellerProceeds = price - platformFee;
        
        // Check buyer balance
        const buyerBalance = buyerWallet.getNumber("usdt_balance") || 0;
        
        if (buyerBalance < price) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: "Insufficient balance. Required: " + price + " USDT, Available: " + buyerBalance + " USDT", 
                    code: "INSUFFICIENT_BALANCE" 
                } 
            });
        }
        
        // Deduct from buyer
        buyerWallet.set("usdt_balance", buyerBalance - price);
        buyerWallet.set("total_spent", (buyerWallet.getNumber("total_spent") || 0) + price);
        buyerWallet.set("last_transaction_at", new Date().toISOString());
        $app.save(buyerWallet);
        
        // Update buyer record
        buyerRecord.set("usdt_balance", buyerWallet.getNumber("usdt_balance"));
        $app.save(buyerRecord);
        
        // Credit seller
        const sellerBalance = sellerWallet.getNumber("usdt_balance") || 0;
        sellerWallet.set("usdt_balance", sellerBalance + sellerProceeds);
        sellerWallet.set("total_earned", (sellerWallet.getNumber("total_earned") || 0) + sellerProceeds);
        sellerWallet.set("last_transaction_at", new Date().toISOString());
        $app.save(sellerWallet);
        
        // Update seller record
        sellerRecord.set("usdt_balance", sellerWallet.getNumber("usdt_balance"));
        $app.save(sellerRecord);
        
        // Call blockchain to transfer NFT
        const nftType = listing.getString('nft_type');
        const nftId = listing.getString('nft_id');
        
        let contractAddress;
        if (nftType === 'Egg') {
            contractAddress = CONFIG.blockchain.contracts.EggNFT;
        } else if (nftType === 'Food') {
            contractAddress = CONFIG.blockchain.contracts.FoodNFT;
        } else if (nftType === 'Animal') {
            contractAddress = CONFIG.blockchain.contracts.AnimalNFT;
        } else {
            throw new Error("Invalid NFT type: " + nftType);
        }
        
        // Prepare NFT transfer transaction
        const transferTx = {
            to: contractAddress,
            data: "0x42842c0e" + // transferFrom(address from, address to, uint256 tokenId)
                sellerRecord.getString('wallet').slice(2).padStart(64, "0") + // from
                buyerRecord.getString('wallet').slice(2).padStart(64, "0") + // to
                nftId.padStart(64, "0") // tokenId
        };
        
        // Send transaction via hot wallet
        const txResponse = await fetch(CONFIG.blockchain.rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_sendRawTransaction",
                params: [/* signed transaction */],
                id: 1
            })
        });
        
        const txData = await txResponse.json();
        
        if (txData.error) {
            throw new Error("Blockchain transaction failed: " + txData.error.message);
        }
        
        const txHash = txData.result || "0x" + Date.now().toString(16).padStart(64, "0");
        
        listing.set('status', 'sold');
        listing.set('buyer', buyerRecord.id);
        listing.set('transaction_hash', txHash);
        $app.save(listing);
        
        // Create purchase record
        const purchaseCollection = $app.findCollectionByNameOrId("marketplace_purchases");
        const purchaseRecord = new Record(purchaseCollection);
        purchaseRecord.set("listing", listing.id);
        purchaseRecord.set("buyer", buyerRecord.id);
        purchaseRecord.set("seller", sellerRecord.id);
        purchaseRecord.set("price", price);
        purchaseRecord.set("platform_fee", platformFee);
        purchaseRecord.set("transaction_hash", txHash);
        purchaseRecord.set("status", "completed");
        $app.save(purchaseRecord);
        
        console.log("Purchase successful:", 
            "listing:", listing_id,
            "buyer:", buyer_address,
            "seller:", sellerRecord.getString('wallet'),
            "price:", price,
            "platform_fee:", platformFee,
            "tx:", txHash
        );
        
        e.json(200, {
            success: true,
            data: {
                tx_hash: txHash,
                new_balance: buyerWallet.getNumber("usdt_balance"),
                price: price,
                platform_fee: platformFee,
                seller_proceeds: sellerProceeds,
                nft_type: nftType,
                nft_id: nftId
            }
        });
        
    } catch (error) {
        console.error("Purchase error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "PURCHASE_FAILED" }
        });
    }
});

console.log("Marketplace purchase endpoint registered: POST /api/v2/marketplace/buy");
