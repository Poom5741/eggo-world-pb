/**
 * Hook: 24-list-egg.pb.js
 * Event: Router (POST /api/v2/list-egg, GET /api/v2/list-egg)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate egg_id and price
 * 3. Verify egg exists in egg_nfts collection
 * 4. Verify user owns the egg
 * 5. Check no active listing exists
 * 6. Create marketplace listing record
 * 7. Call wallet-api for on-chain listing (with MOCK_BLOCKCHAIN flag support)
 * 8. Return listing_id, egg_id, price
 * 
 * Request Body (POST):
 * {
 *   "egg_id": 123,
 *   "price": 50
 * }
 * 
 * Response (POST):
 * {
 *   "success": true,
 *   "data": {
 *     "listing_id": "...",
 *     "egg_id": 123,
 *     "price": 50,
 *     "token_id": 456,
 *     "status": "active"
 *   }
 * }
 */

routerAdd("POST", "/api/v2/list-egg", (e) => {
    try {
        var requestInfo = e.requestInfo();
        var userId = requestInfo.auth ? requestInfo.auth.id : null;

        if (!userId) {
            return e.json(401, {
                success: false,
                error: { message: "Authentication required", code: "AUTH_REQUIRED" }
            });
        }

        var user = $app.findRecordById("users", userId);
        if (!user) {
            return e.json(401, {
                success: false,
                error: { message: "User not found", code: "USER_NOT_FOUND" }
            });
        }

        var body = requestInfo.body || {};
        var egg_id = body.egg_id;
        var price = body.price;

        if (!egg_id || egg_id <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid egg ID", code: "INVALID_EGG_ID" }
            });
        }

        if (!price || price <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid price. Must be greater than 0", code: "INVALID_PRICE" }
            });
        }

        var egg = $app.findFirstRecordByData("egg_nfts", "egg_id", parseInt(egg_id));

        if (!egg) {
            return e.json(400, {
                success: false,
                error: { message: "Egg not found", code: "EGG_NOT_FOUND" }
            });
        }

        var ownerId = egg.get("owner");
        if (ownerId !== user.id) {
            return e.json(400, {
                success: false,
                error: { message: "You do not own this egg", code: "NOT_OWNER" }
            });
        }

        // Check for existing active listing for this egg in marketplace_listings
        var existingListings = $app.findRecordsByFilter(
            "marketplace_listings",
            "nft_id = '" + egg.id + "' && status = 'active'",
            "-created",
            1,
            0
        );

        if (existingListings && existingListings.length > 0) {
            return e.json(400, {
                success: false,
                error: {
                    message: "This egg already has an active listing. Cancel the existing listing first.",
                    code: "ALREADY_LISTED",
                    existing_listing_id: existingListings[0].id
                }
            });
        }

        // Also check is_listed field if it exists on the egg record
        var isListed = egg.get("is_listed");
        if (isListed) {
            return e.json(400, {
                success: false,
                error: {
                    message: "This egg is already marked as listed. Cancel the existing listing first.",
                    code: "ALREADY_LISTED"
                }
            });
        }

        // Create marketplace listing record
        var listingCollection = $app.findCollectionByNameOrId("marketplace_listings");
        var listing = new Record(listingCollection);

        listing.set("nft_id", egg.id);
        listing.set("nft_type", "Egg");
        listing.set("name", "Egg #" + egg_id);
        listing.set("rarity", String(egg.get("rarity_seed") || "0"));
        listing.set("price", price);
        listing.set("price_symbol", "USDT");
        listing.set("seller", user.id);
        listing.set("status", "active");

        $app.save(listing);

        // Update egg as listed (non-fatal if field doesn't exist)
        try {
            egg.set("is_listed", true);
            egg.set("listed_price", price);
            $app.save(egg);
        } catch (saveErr) {
            console.log("Could not update is_listed on egg (field may not exist): " + String(saveErr));
        }

        // Call on-chain Marketplace contract via wallet-api
        var mockBlockchain = ($os.getenv("MOCK_BLOCKCHAIN") || "").toLowerCase() === "true";
        if (!mockBlockchain) {
            try {
                var walletApiUrl = $os.getenv("WALLET_API_URL") || "http://localhost:3001";
                var marketplaceContractAddress = $os.getenv("MARKETPLACE_CONTRACT_ADDRESS");
                var eggTokenId = egg.get("token_id");
                var nftContractAddress = $os.getenv("EGG_NFT_CONTRACT_ADDRESS");

                if (marketplaceContractAddress && nftContractAddress) {
                    console.log("Listing on Marketplace contract: egg_id=" + egg_id + ", token_id=" + eggTokenId);

                    var walletApiResponse = $http.send({
                        url: walletApiUrl + "/api/v1/marketplace/list",
                        method: "POST",
                        body: JSON.stringify({
                            userId: user.id,
                            nftContract: nftContractAddress,
                            tokenId: parseInt(eggTokenId),
                            price: price,
                            nftType: 0, // NFT_TYPE_EGG
                            marketplaceAddress: marketplaceContractAddress
                        }),
                        headers: { "Content-Type": "application/json" },
                        timeout: 120
                    });

                    if (walletApiResponse.statusCode === 200) {
                        console.log("On-chain listing confirmed for egg_id=" + egg_id);
                    } else {
                        console.error("On-chain listing failed (non-fatal): " + walletApiResponse.content);
                    }
                }
            } catch (chainError) {
                console.error("On-chain listing error (non-fatal): " + String(chainError));
            }
        }

        console.log("Egg listed: egg_id=" + egg_id + ", seller=" + user.id + ", price=" + price);

        return e.json(200, {
            success: true,
            data: {
                listing_id: listing.id,
                egg_id: parseInt(egg_id),
                price: price,
                token_id: egg.get("token_id"),
                status: "active"
            }
        });
    } catch (error) {
        console.error("List egg error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "LISTING_FAILED" }
        });
    }
});

routerAdd("GET", "/api/v2/list-egg", (e) => {
    try {
        var requestInfo = e.requestInfo();
        var userId = requestInfo.auth ? requestInfo.auth.id : null;

        if (!userId) {
            return e.json(401, {
                success: false,
                error: { message: "Authentication required", code: "AUTH_REQUIRED" }
            });
        }

        var listings = $app.findRecordsByFilter(
            "marketplace_listings",
            "seller = '" + userId + "' && nft_type = 'Egg' && status = 'active'",
            "-created",
            100,
            0
        );

        var result = [];
        for (var i = 0; i < listings.length; i++) {
            var l = listings[i];
            result.push({
                listing_id: l.id,
                nft_id: l.get("nft_id"),
                name: l.get("name"),
                price: l.get("price"),
                rarity: l.get("rarity"),
                status: l.get("status")
            });
        }

        return e.json(200, {
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get egg listings error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "GET_LISTINGS_FAILED" }
        });
    }
});

console.log("List egg endpoint registered");
