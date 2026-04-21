/**
 * Hook: 20-buy-nft.pb.js
 * Event: Router (POST /api/v2/marketplace/buy)
 * 
 * Flow:
 * 1. Authenticate user (buyer)
 * 2. Get listing from marketplace_listings collection
 * 3. Verify NFT exists and is listed for sale
 * 4. Verify buyer has sufficient USDT balance
 * 5. Deduct USDT from buyer
 * 6. Transfer NFT ownership to buyer
 * 7. Credit USDT to seller (minus platform fee)
 * 8. Mark listing as sold
 * 9. Record transaction
 * 10. Return success with transaction hash
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
 *     "tx_hash": "txn_..."
 *   }
 * }
 */

const PLATFORM_FEE_PERCENT = 4; // 4% platform fee

routerAdd("POST", "/api/v2/marketplace/buy", (e) => {
    try {
        const buyer = $apis.requireAuth(e);
        
        const body = e.requestInfo().body;
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
        const listing = $app.findRecordById('marketplace_listings', listing_id);
        
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
        const sellerId = listing.getString('seller_id');
        
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
        const validTypes = ['egg', 'food', 'animal'];
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
        const collectionName = nftType === 'egg' ? 'egg_nfts' : nftType === 'food' ? 'food_nfts' : 'animal_nfts';
        const nft = $app.findRecordById(collectionName, nftId);
        
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
        const seller = $app.findRecordById('users', sellerId);
        
        if (!seller) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'Seller not found',
                    code: 'SELLER_NOT_FOUND'
                } 
            });
        }
        
        // Check buyer's USDT balance
        const buyerWallet = $app.findFirstRecordByFilter('user_wallets', 'user_id = {:user_id}', {
            '@user_id': buyer.id
        });
        
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
        const sellerWallet = $app.findFirstRecordByFilter('user_wallets', 'user_id = {:user_id}', {
            '@user_id': seller.id
        });
        
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
        
        // Record transaction
        const transaction = $app.newRecord('transactions');
        transaction.set('user', buyer.id);
        transaction.set('type', 'purchase');
        transaction.set('amount', price);
        transaction.set('currency', 'USDT');
        transaction.set('nft_id', nftId);
        transaction.set('nft_type', nftType);
        transaction.set('status', 'completed');
        transaction.set('metadata', {
            "listing_id": listing_id,
            "seller_id": sellerId,
            "platform_fee": platformFee,
            "seller_amount": sellerAmount
        });
        $app.save(transaction);
        
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
                tx_hash: transaction.id // Using transaction ID as hash reference
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
