/**
 * Hook: 26-list-food.pb.js
 * Event: Router (POST /api/v2/list-food, GET /api/v2/list-food)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate food_id, quantity, and price
 * 3. Verify food exists in food_nfts collection
 * 4. Verify user owns the food
 * 5. Check no active listing exists
 * 6. Create marketplace listing record
 * 7. Call wallet-api for on-chain listing (with MOCK_BLOCKCHAIN flag support)
 * 8. Return listing_id, food_id, quantity, price
 * 
 * Request Body (POST):
 * {
 *   "food_id": 456,
 *   "quantity": 1,
 *   "price": 5
 * }
 * 
 * Response (POST):
 * {
 *   "success": true,
 *   "data": {
 *     "listing_id": "...",
 *     "food_id": 456,
 *     "quantity": 1,
 *     "price": 5,
 *     "food_type": "grain",
 *     "status": "active"
 *   }
 * }
 */

routerAdd("POST", "/api/v2/list-food", (e) => {
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
        var food_id = body.food_id;
        var quantity = body.quantity !== undefined ? body.quantity : 1;
        var price = body.price;

        if (!food_id || food_id <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid food ID", code: "INVALID_FOOD_ID" }
            });
        }

        if (!quantity || quantity <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid quantity. Must be greater than 0", code: "INVALID_QUANTITY" }
            });
        }

        if (!price || price <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid price. Must be greater than 0", code: "INVALID_PRICE" }
            });
        }

        var food = $app.findFirstRecordByData("food_nfts", "food_id", parseInt(food_id));

        if (!food) {
            return e.json(400, {
                success: false,
                error: { message: "Food not found", code: "FOOD_NOT_FOUND" }
            });
        }

        var ownerId = food.get("owner");
        if (ownerId !== user.id) {
            return e.json(400, {
                success: false,
                error: { message: "You do not own this food item", code: "NOT_OWNER" }
            });
        }

        // Verify food is not consumed
        var isConsumed = food.get("is_consumed");
        if (isConsumed) {
            return e.json(400, {
                success: false,
                error: { message: "This food item has already been consumed", code: "FOOD_ALREADY_CONSUMED" }
            });
        }

        // Check for existing active listing for this food in marketplace_listings
        var existingListings = $app.findRecordsByFilter(
            "marketplace_listings",
            "nft_id = '" + food.id + "' && status = 'active'",
            "-created",
            1,
            0
        );

        if (existingListings && existingListings.length > 0) {
            return e.json(400, {
                success: false,
                error: {
                    message: "This food item already has an active listing. Cancel the existing listing first.",
                    code: "ALREADY_LISTED",
                    existing_listing_id: existingListings[0].id
                }
            });
        }

        // Also check is_listed field if it exists on the food record
        var isListed = food.get("is_listed");
        if (isListed) {
            return e.json(400, {
                success: false,
                error: {
                    message: "This food item is already marked as listed. Cancel the existing listing first.",
                    code: "ALREADY_LISTED"
                }
            });
        }

        // Create marketplace listing record
        var listingCollection = $app.findCollectionByNameOrId("marketplace_listings");
        var listing = new Record(listingCollection);

        var foodType = food.get("food_type") || "";
        var quantityInfo = quantity > 1 ? " (qty: " + quantity + ")" : "";

        listing.set("nft_id", food.id);
        listing.set("nft_type", "Food");
        listing.set("name", "Food #" + food_id + quantityInfo);
        listing.set("rarity", foodType);
        listing.set("price", price);
        listing.set("price_symbol", "USDT");
        listing.set("seller", user.id);
        listing.set("status", "active");
        listing.set("description", JSON.stringify({
            food_id: parseInt(food_id),
            food_type: foodType,
            quantity: quantity
        }));

        $app.save(listing);

        // Update food as listed (non-fatal if field doesn't exist)
        try {
            food.set("is_listed", true);
            food.set("listed_price", price);
            $app.save(food);
        } catch (saveErr) {
            console.log("Could not update is_listed on food (field may not exist): " + String(saveErr));
        }

        // Call on-chain Marketplace contract via wallet-api
        var mockBlockchain = ($os.getenv("MOCK_BLOCKCHAIN") || "").toLowerCase() === "true";
        if (!mockBlockchain) {
            try {
                var walletApiUrl = $os.getenv("WALLET_API_URL") || "http://localhost:3001";
                var marketplaceContractAddress = $os.getenv("MARKETPLACE_CONTRACT_ADDRESS");
                var foodTokenId = food.get("token_id");
                var nftContractAddress = $os.getenv("FOOD_NFT_CONTRACT_ADDRESS");

                if (marketplaceContractAddress && nftContractAddress) {
                    console.log("Listing on Marketplace contract: food_id=" + food_id + ", token_id=" + foodTokenId);

                    var walletApiResponse = $http.send({
                        url: walletApiUrl + "/api/v1/marketplace/list",
                        method: "POST",
                        body: JSON.stringify({
                            userId: user.id,
                            nftContract: nftContractAddress,
                            tokenId: parseInt(foodTokenId),
                            price: price,
                            nftType: 1, // NFT_TYPE_FOOD
                            marketplaceAddress: marketplaceContractAddress
                        }),
                        headers: { "Content-Type": "application/json" },
                        timeout: 120
                    });

                    if (walletApiResponse.statusCode === 200) {
                        console.log("On-chain listing confirmed for food_id=" + food_id);
                    } else {
                        console.error("On-chain listing failed (non-fatal): " + walletApiResponse.content);
                    }
                }
            } catch (chainError) {
                console.error("On-chain listing error (non-fatal): " + String(chainError));
            }
        }

        console.log("Food listed: food_id=" + food_id + ", seller=" + user.id + ", price=" + price + ", quantity=" + quantity);

        return e.json(200, {
            success: true,
            data: {
                listing_id: listing.id,
                food_id: parseInt(food_id),
                quantity: quantity,
                price: price,
                food_type: foodType,
                status: "active"
            }
        });
    } catch (error) {
        console.error("List food error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "LISTING_FAILED" }
        });
    }
});

routerAdd("GET", "/api/v2/list-food", (e) => {
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
            "seller = '" + userId + "' && nft_type = 'Food' && status = 'active'",
            "-created",
            100,
            0
        );

        var result = [];
        for (var i = 0; i < listings.length; i++) {
            var l = listings[i];
            var description = l.get("description");
            var quantity = 1;
            if (description) {
                try {
                    var parsed = JSON.parse(description);
                    if (parsed && parsed.quantity) {
                        quantity = parsed.quantity;
                    }
                } catch (parseErr) {
                    // Ignore parse errors, keep default quantity
                }
            }
            result.push({
                listing_id: l.id,
                nft_id: l.get("nft_id"),
                name: l.get("name"),
                price: l.get("price"),
                rarity: l.get("rarity"),
                quantity: quantity,
                status: l.get("status")
            });
        }

        return e.json(200, {
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get food listings error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "GET_LISTINGS_FAILED" }
        });
    }
});

console.log("List food endpoint registered");
