/**
 * Hook: 37-update-listing-price.pb.js
 * Event: Router (POST /api/v2/update-listing-price)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate listing_id and new_price
 * 3. Verify listing exists and belongs to user
 * 4. Verify listing status is "active"
 * 5. Call wallet-api for on-chain update
 * 6. Update marketplace_listings record price
 * 7. Return new price info
 * 
 * Request Body:
 * {
 *   "listing_id": "record_id",
 *   "new_price": 75
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "listing_id": "...",
 *     "old_price": 50,
 *     "new_price": 75,
 *     "tx_hash": "0x..."
 *   }
 * }
 */

routerAdd("POST", "/api/v2/update-listing-price", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) {
            return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } });
        }
        let user;
        try { user = $app.findRecordById("users", userId); } catch (err) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }

        const body = e.parseBody();
        const { listing_id, new_price } = body;

        if (!listing_id) {
            return e.json(400, {
                success: false,
                error: { message: "Listing ID required", code: "INVALID_PARAMETERS" }
            });
        }

        if (typeof new_price !== 'number' || isNaN(new_price) || new_price <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "New price must be a positive number", code: "INVALID_PARAMETERS" }
            });
        }

        const listing = $app.dao().findRecordById('marketplace_listings', listing_id);
        if (!listing) {
            return e.json(404, {
                success: false,
                error: { message: "Listing not found", code: "LISTING_NOT_FOUND" }
            });
        }

        if (listing.getString('seller') !== user.id) {
            return e.json(403, {
                success: false,
                error: { message: "Only the seller can update this listing price", code: "FORBIDDEN" }
            });
        }

        const status = listing.getString('status');
        if (status !== 'active') {
            return e.json(400, {
                success: false,
                error: { message: "Cannot update price for listing with status: " + status, code: "INVALID_STATUS" }
            });
        }

        const oldPrice = listing.getFloat('price');
        if (Math.abs(oldPrice - new_price) < 0.000001) {
            return e.json(400, {
                success: false,
                error: { message: "New price must differ from current price", code: "PRICE_UNCHANGED" }
            });
        }

        const nftContract = listing.getString('nft_contract');
        const tokenId = listing.getInt('token_id');

        // Update PocketBase record first (optimistic)
        listing.set('price', new_price);
        $app.dao().save(listing);

        // Call on-chain Marketplace contract via wallet-api
        var txHash = null;
        var mockBlockchain = ($os.getenv("MOCK_BLOCKCHAIN") || "").toLowerCase() === "true";
        if (!mockBlockchain) {
            try {
                var walletApiUrl = $os.getenv("WALLET_API_URL") || "http://localhost:3001";
                var marketplaceContractAddress = $os.getenv("MARKETPLACE_CONTRACT_ADDRESS");

                if (marketplaceContractAddress) {
                    const response = $http.send({
                        url: walletApiUrl + "/api/v1/marketplace/update-price",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user.id,
                            nftContract: nftContract,
                            tokenId: tokenId,
                            newPrice: new_price.toString(),
                            marketplaceAddress: marketplaceContractAddress
                        })
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
                        try { responseData = JSON.parse(responseBody); } catch (err) { responseData = null; }
                    }

                    if (responseData && responseData.success && responseData.data) {
                        txHash = responseData.data.txHash || null;
                    } else {
                        console.error("[Update Listing Price] wallet-api error:", responseData);
                    }
                } else {
                    console.error("[Update Listing Price] MARKETPLACE_CONTRACT_ADDRESS not configured");
                }
            } catch (err) {
                console.error("[Update Listing Price] wallet-api call failed:", err.message);
                // Don't revert - PB was updated. On-chain will sync later.
            }
        }

        console.log("[Update Listing Price] Price updated: listing=" + listing_id + ", old=" + oldPrice + ", new=" + new_price + ", tx=" + txHash);

        return e.json(200, {
            success: true,
            data: {
                listing_id: listing_id,
                old_price: oldPrice,
                new_price: new_price,
                tx_hash: txHash,
                status: "active"
            }
        });
    } catch (err) {
        console.error("[Update Listing Price] Error:", err.message);
        return e.json(500, {
            success: false,
            error: { message: err.message || "Update listing price failed", code: "UPDATE_PRICE_FAILED" }
        });
    }
});
