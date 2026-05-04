// Seed test animals for UAT - only runs if no animals exist
// This is a one-time setup hook that creates test data

routerAdd("POST", "/api/v2/seed-test-animals", (e) => {
    try {
        // Get user ID from request body or auth
        let userId = null;
        
        // Try to get from auth first
        try {
            const requestInfo = e.requestInfo();
            userId = requestInfo.auth ? requestInfo.auth.id : null;
            if (!userId) {
                // If no auth, check request body
                const body = requestInfo.body || {};
                userId = body.user_id;
            }
        } catch (authErr) {
            // If no auth, check request body
            const requestInfo = e.requestInfo();
            const body = requestInfo.body || {};
            userId = body.user_id;
        }
        
        if (!userId) {
            return e.json(400, {
                success: false,
                error: {
                    message: "User ID required. Provide auth token or user_id in body.",
                    code: "USER_ID_REQUIRED"
                }
            });
        }
        
        // Check if user already has animals
        const existing = $app.findRecordsByFilter(
            "animal_nfts",
            "owner = {:userId}",
            "-created",
            1,
            0,
            { userId: userId }
        );
        
        if (existing && existing.length > 0) {
            return e.json(200, {
                success: true,
                message: "User already has animals",
                count: existing.length
            });
        }
        
        // Create test animals for the user
        const now = new Date().toISOString();
        const animals = [
            {
                token_id: 999001,
                owner: userId,
                species: "Chicken",
                rarity: "Common",
                generation: 1,
                contract_address: "0x1234567890123456789012345678901234567890",
                tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                minted_at: now
            },
            {
                token_id: 999002,
                owner: userId,
                species: "Duck",
                rarity: "Rare",
                generation: 1,
                contract_address: "0x1234567890123456789012345678901234567890",
                tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891",
                minted_at: now
            },
            {
                token_id: 999003,
                owner: userId,
                species: "Pig",
                rarity: "Epic",
                generation: 2,
                contract_address: "0x1234567890123456789012345678901234567890",
                tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567892",
                minted_at: now
            }
        ];
        
        const created = [];
        for (const animalData of animals) {
            const record = new Record($app.findCollectionByNameOrId("animal_nfts"));
            for (const [key, value] of Object.entries(animalData)) {
                record.set(key, value);
            }
            $app.save(record);
            created.push(record.id);
        }
        
        return e.json(200, {
            success: true,
            message: `Created ${created.length} test animals`,
            animal_ids: created
        });
        
    } catch (err) {
        console.error("Seed test animals error:", err);
        return e.json(500, {
            success: false,
            error: {
                message: err.message || "Failed to seed test animals",
                code: "SEED_ERROR"
            }
        });
    }
});

console.log("Seed test animals endpoint registered: POST /api/v2/seed-test-animals");
