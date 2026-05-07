routerAdd("POST", "/api/v2/list-animal", (e) => {
    var BREED_COOLDOWN_HOURS = 48;

    function isOnCooldown(lastBredAt) {
        if (!lastBredAt) return false;
        var lastBred = new Date(lastBredAt).getTime();
        var cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000;
        var cooldownEnd = lastBred + cooldownMs;
        return Date.now() < cooldownEnd;
    }

    function formatCooldownRemaining(lastBredAt) {
        if (!lastBredAt) return "";
        var lastBred = new Date(lastBredAt).getTime();
        var cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000;
        var cooldownEnd = lastBred + cooldownMs;
        var remainingMs = Math.max(0, cooldownEnd - Date.now());
        var hours = Math.floor(remainingMs / (60 * 60 * 1000));
        var minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        if (hours > 0) return hours + "h " + minutes + "m";
        return minutes + "m";
    }

    try {
        var requestInfo = e.requestInfo();
        var userId = requestInfo.auth ? requestInfo.auth.id : null;

        if (!userId) {
            return e.json(401, {
                success: false,
                error: { message: "Authentication required", code: "AUTH_REQUIRED" }
            });
        }

        var user;
        try { user = $app.findRecordById("users", userId); } catch (err) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }

        var body = requestInfo.body || {};
        var animal_id = body.animal_id;
        var price = body.price;

        if (!animal_id || animal_id <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid animal ID", code: "INVALID_ANIMAL_ID" }
            });
        }

        if (!price || price <= 0) {
            return e.json(400, {
                success: false,
                error: { message: "Invalid price. Must be greater than 0", code: "INVALID_PRICE" }
            });
        }

        var animal;
        try { animal = $app.findFirstRecordByData("animal_nfts", "token_id", parseInt(animal_id)); } catch (err) { return e.json(400, { success: false, error: { message: "Animal not found", code: "ANIMAL_NOT_FOUND" } }); }

        if (!animal) {
            return e.json(400, {
                success: false,
                error: { message: "Animal not found", code: "ANIMAL_NOT_FOUND" }
            });
        }

        var ownerId = animal.get("owner");
        if (ownerId !== user.id) {
            return e.json(400, {
                success: false,
                error: { message: "You do not own this animal", code: "NOT_OWNER" }
            });
        }

        // Check for existing active listing for this animal
        var existingListing = $app.findFirstRecordByData(
            "resale_listings",
            "animal_id",
            parseInt(animal_id)
        );

        if (existingListing && existingListing.get("status") === "active") {
            return e.json(400, {
                success: false,
                error: {
                    message: "This animal already has an active listing. Cancel the existing listing first.",
                    code: "ALREADY_LISTED",
                    existing_listing_id: existingListing.id
                }
            });
        }

        var lastBredAt = animal.get("last_bred_at");
        if (isOnCooldown(lastBredAt)) {
            var remaining = formatCooldownRemaining(lastBredAt);
            return e.json(400, {
                success: false,
                error: {
                    message: "Animal is on breeding cooldown. Ready in " + remaining,
                    code: "ANIMAL_ON_COOLDOWN",
                    cooldown_remaining: remaining
                }
            });
        }

        var parentEggId = animal.get("parent_egg_id");
        var royaltyRecipients = [];

        if (parentEggId) {
            var parentEgg = $app.findFirstRecordByData("egg_nfts", "egg_id", parseInt(parentEggId));
            if (parentEgg) {
                var referralChain = parentEgg.get("referral_chain");
                if (referralChain) {
                    royaltyRecipients = referralChain;
                }
            }
        }

        // Create PocketBase listing record
        var listingCollection = $app.findCollectionByNameOrId("resale_listings");
        var listing = new Record(listingCollection);

        listing.set("nft_id", animal.id);
        listing.set("animal_id", animal_id);
        listing.set("seller_id", user.id);
        listing.set("price", price);
        listing.set("rarity", (animal.get("rarity") || "").toLowerCase());
        listing.set("species", animal.get("species"));
        listing.set("generation", animal.get("generation"));
        listing.set("royalty_recipients", royaltyRecipients);
        listing.set("status", "active");
        listing.set("listed_at", new Date().toISOString());

        $app.save(listing);

        // Call on-chain Marketplace contract via wallet-api
        var mockBlockchain = ($os.getenv("MOCK_BLOCKCHAIN") || "").toLowerCase() === "true";
        if (!mockBlockchain) {
            try {
                var walletApiUrl = $os.getenv("WALLET_API_URL");
                var marketplaceContractAddress = $os.getenv("MARKETPLACE_CONTRACT_ADDRESS");
                var animalTokenId = animal.get("token_id");
                var nftContractAddress = $os.getenv("ANIMAL_NFT_CONTRACT_ADDRESS");
    
                if (!walletApiUrl) {
                    console.error("WALLET_API_URL not configured");
                    return e.json(500, { success: false, error: { message: "WALLET_API_URL not configured", code: "CONFIG_ERROR" } });
                }
                if (marketplaceContractAddress && nftContractAddress) {
                    console.log("Listing on Marketplace contract: animal_id=" + animal_id + ", token_id=" + animalTokenId);

                    var walletApiResponse = $http.send({
                        url: walletApiUrl + "/api/v1/marketplace/list",
                        method: "POST",
                        body: JSON.stringify({
                            userId: user.id,
                            nftContract: nftContractAddress,
                            tokenId: parseInt(animalTokenId),
                            price: price,
                            nftType: 2, // NFT_TYPE_ANIMAL
                            marketplaceAddress: marketplaceContractAddress
                        }),
                        headers: { "Content-Type": "application/json" },
                        timeout: 120
                    });

                    if (walletApiResponse.statusCode === 200) {
                        console.log("On-chain listing confirmed for animal_id=" + animal_id);
                    } else {
                        console.error("On-chain listing failed (non-fatal): " + walletApiResponse.content);
                    }
                }
            } catch (chainError) {
                console.error("On-chain listing error (non-fatal): " + String(chainError));
            }
        }

        console.log("Animal listed: animal_id=" + animal_id + ", seller=" + user.id + ", price=" + price);

        return e.json(200, {
            success: true,
            data: {
                listing_id: listing.id,
                animal_id: animal_id,
                price: price,
                rarity: animal.get("rarity"),
                species: animal.get("species"),
                generation: animal.get("generation"),
                status: "active",
                royalty_recipients_count: royaltyRecipients.length
            }
        });
    } catch (error) {
        console.error("List animal error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "LISTING_FAILED" }
        });
    }
});

routerAdd("GET", "/api/v2/list-animal", (e) => {
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
            "resale_listings",
            "seller_id = '" + userId + "' && status = 'active'",
            "-listed_at",
            100,
            0
        );

        var result = [];
        for (var i = 0; i < listings.length; i++) {
            var l = listings[i];
            result.push({
                listing_id: l.id,
                animal_id: l.get("animal_id"),
                price: l.get("price"),
                rarity: l.get("rarity"),
                species: l.get("species"),
                generation: l.get("generation"),
                status: l.get("status"),
                listed_at: l.get("listed_at")
            });
        }

        return e.json(200, {
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Get listings error:", error);
        return e.json(500, {
            success: false,
            error: { message: error.message, code: "GET_LISTINGS_FAILED" }
        });
    }
});