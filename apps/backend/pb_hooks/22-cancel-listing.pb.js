/**
 * Hook: 22-cancel-listing.pb.js
 * Cancel marketplace listing (seller only)
 */

routerAdd("POST", "/api/v2/cancel-listing", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const sellerId = requestInfo.auth?.id;
        if (!sellerId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        const seller = $app.findRecordById("users", sellerId);
        if (!seller) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        const body = e.parseBody();
        const { listing_id } = body;
        
        if (!listing_id) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Listing ID required',
                    code: 'INVALID_PARAMETERS'
                } 
            });
        }
        
        const listing = $app.dao().findRecordById('marketplace_listings', listing_id);
        
        if (!listing) {
            return e.json(404, { 
                success: false, 
                error: { 
                    message: 'Listing not found',
                    code: 'LISTING_NOT_FOUND'
                } 
            });
        }
        
        if (listing.getString('seller') !== seller.id) {
            return e.json(403, { 
                success: false, 
                error: { 
                    message: 'Only the seller can cancel this listing',
                    code: 'FORBIDDEN'
                } 
            });
        }
        
        const status = listing.getString('status');
        if (status !== 'active') {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Cannot cancel listing with status: ${status}`,
                    code: 'INVALID_STATUS'
                } 
            });
        }
        
        listing.set('status', 'cancelled');
        $app.dao().save(listing);
        
        const nftType = listing.getString('nft_type');
        const nftId = listing.getString('nft_id');
        
        if (nftId) {
            const collectionName = nftType === 'Egg' ? 'egg_nfts' : nftType === 'Food' ? 'food_nfts' : 'animal_nfts';
            
            try {
                const nft = $app.dao().findRecordById(collectionName, nftId);
                if (nft) {
                    nft.set('is_listed', false);
                    nft.set('listed_price', null);
                    $app.dao().save(nft);
                }
            } catch (nftError) {
                console.warn(`Could not update NFT record: ${nftError.message}`);
            }
        }
        
        console.log(`Listing cancelled: ${listing_id} by seller ${seller.id}`);
        
        return e.json(200, {
            success: true,
            data: {
                listing_id: listing_id,
                status: 'cancelled',
                nft_type: nftType,
                nft_id: nftId
            }
        });
    } catch (error) {
        console.error('Cancel listing error:', error);
        return e.json(500, {
            success: false,
            error: { 
                message: error.message, 
                code: 'CANCEL_FAILED' 
            }
        });
    }
});
