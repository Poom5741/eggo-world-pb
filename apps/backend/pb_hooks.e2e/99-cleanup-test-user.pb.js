// ===== CLEANUP TEST USER AND UPDATE BALANCE =====
// Remove duplicate test user and set correct balance
// DELETE AFTER USE

console.log("Setting up cleanup endpoint...")

routerAdd("POST", "/api/v2/cleanup-and-set-balance", (e) => {
    console.log("=== CLEANUP ENDPOINT CALLED ===")

    try {
        const body = e.requestInfo().body
        const realUserId = body?.real_user_id
        const testUserEmail = body?.test_user_email
        const balance = body?.balance || 1000

        if (!realUserId) {
            return e.json(400, {
                success: false,
                error: { message: "real_user_id is required", code: "MISSING_PARAM" }
            })
        }

        console.log("Real user ID:", realUserId)
        console.log("Setting balance to:", balance)

        // Find real user's user_wallets record
        const realUserWallet = $app.findFirstRecordByData("user_wallets", "user_id", realUserId)
        if (!realUserWallet) {
            return e.json(404, {
                success: false,
                error: { message: "user_wallets record not found for real user", code: "WALLET_NOT_FOUND" }
            })
        }

        // Update balance
        realUserWallet.set("usdt_balance", balance)
        $app.save(realUserWallet)

        console.log("✓ Balance updated to", balance, "for user:", realUserId)

        // Delete test user if email provided
        if (testUserEmail) {
            console.log("Looking for test user with email:", testUserEmail)
            try {
                const testUser = $app.findFirstRecordByData("users", "email", testUserEmail)
                if (testUser) {
                    console.log("Found test user:", testUser.id, "- deleting...")
                    
                    // Delete test user's user_wallets record first
                    try {
                        const testUserWallet = $app.findFirstRecordByData("user_wallets", "user_id", testUser.id)
                        if (testUserWallet) {
                            $app.delete(testUserWallet)
                            console.log("✓ Deleted test user_wallets record")
                        }
                    } catch (err) {
                        console.log("Test user_wallets already deleted or not found")
                    }
                    
                    // Delete test user
                    $app.delete(testUser)
                    console.log("✓ Deleted test user:", testUser.id)
                }
            } catch (err) {
                console.log("Test user not found or already deleted")
            }
        }

        return e.json(200, {
            success: true,
            real_user_id: realUserId,
            usdt_balance: realUserWallet.get("usdt_balance"),
            wallet_address: realUserWallet.get("wallet_address")
        })

    } catch (err) {
        console.error("Cleanup error:", err)
        return e.json(500, {
            success: false,
            error: { message: String(err), code: "CLEANUP_FAILED" }
        })
    }
})

console.log("Cleanup endpoint registered")
