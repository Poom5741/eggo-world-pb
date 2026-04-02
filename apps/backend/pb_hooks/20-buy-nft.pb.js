/**
 * Hook: 20-buy-nft.pb.js
 * Event: OnRequest (POST /api/v2/buy-nft)
 * 
 * Flow:
 * 1. Authenticate user (buyer)
 * 2. Verify NFT exists and is listed for sale
 * 3. Verify buyer has sufficient USDT balance
 * 4. Deduct USDT from buyer
 * 5. Transfer NFT ownership to buyer
 * 6. Credit USDT to seller (minus platform fee)
 * 7. Record transaction
 * 8. Return success with transaction hash
 * 
 * Request Body:
 * {
 *   "nft_id": "nft_record_id",
 *   "nft_type": "egg|food|animal"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "nft_token_id": 1,
 *     "price": "25.00",
 *     "tx_hash": "0x...",
 *     "new_owner": "buyer_user_id"
 *   }
 * }
 */

const PLATFORM_FEE_PERCENT = 4; // 4% platform fee

module.exports = async (e) => {
    try {
        const buyer = $apis.requireAuth(e);
        
        if (e.method !== 'POST') {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Method not allowed',
                    code: 'METHOD_NOT_ALLOWED'
                } 
            });
        }
        
        const body = e.parseBody();
        const { nft_id, nft_type } = body;
        
        // Validate inputs
        if (!nft_id || !nft_type) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'NFT ID and type required',
                    code: 'INVALID_PARAMETERS'
                } 
            });
        }
        
        const validTypes = ['egg', 'food', 'animal'];
        if (!validTypes.includes(nft_type)) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid NFT type. Must be: egg, food, or animal',
                    code: 'INVALID_NFT_TYPE'
                } 
            });
        }
        
        // Determine collection name
        const collectionName = nft_type === 'egg' ? 'egg_nfts' : nft_type === 'food' ? 'food_nfts' : 'animal_nfts';
        
        // Find NFT record
        const nft = await $app.dao().findRecordById(collectionName, nft_id);
        
        if (!nft) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'NFT not found',
                    code: 'NFT_NOT_FOUND'
                } 
            });
        }
        
        // Verify NFT is listed for sale
        if (!nft.getBool('is_listed')) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'NFT is not listed for sale',
                    code: 'NFT_NOT_LISTED'
                } 
            });
        }
        
        const price = nft.getNumber('listed_price');
        if (!price || price <= 0) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Invalid listing price',
                    code: 'INVALID_PRICE'
                } 
            });
        }
        
        // Get seller info
        const sellerId = nft.getString('owner');
        const seller = await $app.dao().findRecordById('users', sellerId);
        
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
        const buyerWallet = await $app.dao().findFirstRecordByFilter('user_wallets', 'user_id = {:user_id}', {
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
        
        const buyerBalance = buyerWallet.getNumber('usdt_balance') || 0;
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
        buyerWallet.set('total_spent', (buyerWallet.getNumber('total_spent') || 0) + price);
        buyerWallet.set('last_transaction_at', new Date().toISOString());
        await $app.dao().save(buyerWallet);
        
        // Update buyer's user record
        buyer.set('usdt_balance', buyerWallet.getNumber('usdt_balance'));
        await $app.dao().save(buyer);
        
        // Credit seller (find or create seller wallet)
        const sellerWallet = await $app.dao().findFirstRecordByFilter('user_wallets', 'user_id = {:user_id}', {
            '@user_id': seller.id
        });
        
        if (sellerWallet) {
            const currentBalance = sellerWallet.getNumber('usdt_balance') || 0;
            sellerWallet.set('usdt_balance', currentBalance + sellerAmount);
            sellerWallet.set('total_earned', (sellerWallet.getNumber('total_earned') || 0) + sellerAmount);
            sellerWallet.set('last_transaction_at', new Date().toISOString());
            await $app.dao().save(sellerWallet);
            
            // Update seller's user record
            seller.set('usdt_balance', sellerWallet.getNumber('usdt_balance'));
            await $app.dao().save(seller);
        }
        
        // Transfer NFT ownership
        nft.set('owner', buyer.id);
        nft.set('is_listed', false);
        nft.set('listed_price', null);
        await $app.dao().save(nft);
        
        // Record transaction
        const transaction = $app.dao().createRecord('transactions', {
            "user": buyer.id,
            "type": "purchase",
            "amount": price,
            "currency": "USDT",
            "nft_id": nft.id,
            "nft_type": nft_type,
            "status": "completed",
            "metadata": {
                "seller_id": seller.id,
                "platform_fee": platformFee,
                "seller_amount": sellerAmount
            }
        });
        await $app.dao().save(transaction);
        
        console.log(`NFT purchased: ${nft_type} ${nft.id} sold for ${price} USDT from ${seller.id} to ${buyer.id}`);
        
        e.json(200, {
            success: true,
            data: {
                nft_token_id: nft.get('token_id') || nft.id,
                nft_type: nft_type,
                price: price,
                platform_fee: platformFee,
                seller_amount: sellerAmount,
                new_owner: buyer.id,
                tx_hash: transaction.id // Using transaction ID as hash reference
            }
        });
    } catch (error) {
        console.error('Buy NFT error:', error);
        e.json(500, {
            success: false,
            error: { 
                message: error.message, 
                code: 'PURCHASE_FAILED' 
            }
        });
    }
};
