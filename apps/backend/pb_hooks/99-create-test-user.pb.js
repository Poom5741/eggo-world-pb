// ===== CREATE TEST USER ENDPOINT =====
// Temporary endpoint to create test user with wallet
// REMOVE AFTER TESTING

console.log("Setting up create test user endpoint...")

routerAdd("POST", "/api/v2/create-test-user", (e) => {
    console.log("=== CREATE TEST USER ENDPOINT CALLED ===")

    try {
        const body = e.requestInfo().body
        const walletAddress = body?.wallet_address || "0xe62Ce373AB6265f74A10a5055933b2BC78506DBb"
        const name = body?.name || "Test User"
        const email = body?.email || "test-" + Date.now() + "@line.eggo"

        console.log("Creating test user with wallet:", walletAddress)

        // Create user record
        const usersCollection = $app.findCollectionByNameOrId("users")
        const user = new Record(usersCollection)
        
        user.set("name", name)
        user.set("email", email)
        user.set("externalId", "line_test_" + Date.now())
        user.set("password", "TestPass123!")
        user.set("passwordConfirm", "TestPass123!")
        user.set("emailVisibility", false)
        user.set("wallet", walletAddress)
        user.set("daccPublickey", "daccPublickey_" + walletAddress + "_testkey123")
        user.set("pin", "TestPassword123!@#")
        
        $app.save(user)
        
        console.log("User created:", user.id)

        // Create user_wallets record
        const userWalletsCollection = $app.findCollectionByNameOrId("user_wallets")
        const userWallet = new Record(userWalletsCollection)
        
        userWallet.set("user_id", user.id)
        userWallet.set("wallet_address", walletAddress)
        userWallet.set("usdt_balance", 1000)
        userWallet.set("total_earned", 0)
        userWallet.set("total_spent", 0)
        userWallet.set("last_deposit_amount", 0)
        userWallet.set("last_deposit_tx", "")
        userWallet.set("last_deposit_block", 0)
        
        $app.save(userWallet)
        
        console.log("user_wallets created for user:", user.id)

        return e.json(200, {
            success: true,
            user_id: user.id,
            email: email,
            wallet: walletAddress,
            usdt_balance: 1000,
            message: "Test user created successfully"
        })

    } catch (error) {
        console.error("Create test user error:", error)
        return e.json(500, {
            success: false,
            error: String(error),
            code: "CREATE_TEST_USER_FAILED"
        })
    }
})

console.log("Create test user endpoint registered")
