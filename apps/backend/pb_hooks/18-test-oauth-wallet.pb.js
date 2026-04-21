// ===== TEST OAUTH WALLET CREATION ENDPOINT =====
// Debug endpoint to verify wallet creation on user signup (Phase 18)
// REMOVE AFTER VERIFICATION

console.log("Setting up test OAuth wallet endpoint...")

routerAdd("POST", "/api/v2/test-oauth-wallet", (e) => {
    console.log("=== TEST OAUTH WALLET ENDPOINT CALLED ===")

    try {
        // Generate unique test email
        var timestamp = Date.now()
        var testEmail = "test-oauth-" + timestamp + "@line.eggo"
        var testUsername = "line_test_" + timestamp
        var testPassword = "TestPass123!"

        console.log("Creating test user with email:", testEmail)

        // Create user record
        var record = $app.newRecord("users")
        record.set("name", "Test OAuth User")
        record.set("email", testEmail)
        record.set("username", testUsername)
        record.set("password", testPassword)
        record.set("passwordConfirm", testPassword)
        record.set("emailVisibility", false)

        // Save user (triggers onRecordBeforeCreate hook)
        $app.save(record)

        console.log("Test user created:", record.id)

        // Fetch user to verify wallet fields
        var createdUser = $app.findRecordById("users", record.id)

        var wallet = createdUser.get("wallet")
        var daccPublickey = createdUser.get("daccPublickey")
        var pin = createdUser.get("pin")
        var usdtBalance = createdUser.get("usdt_balance")

        console.log("Wallet:", wallet)
        console.log("daccPublickey:", daccPublickey)
        console.log("PIN exists:", pin ? "yes" : "no")
        console.log("USDT balance:", usdtBalance)

        return e.json(200, {
            success: true,
            user_id: record.id,
            email: testEmail,
            wallet: wallet || null,
            daccPublickey: daccPublickey || null,
            pin_exists: pin ? true : false,
            usdt_balance: usdtBalance || 0,
            wallet_valid: wallet && typeof wallet === "string" && wallet.startsWith("0x"),
            dacc_publickey_valid: daccPublickey && typeof daccPublickey === "string" && daccPublickey.startsWith("daccPublickey_"),
        })
    } catch (error) {
        console.error("Test endpoint error:", error)
        return e.json(500, {
            success: false,
            error: String(error),
        })
    }
})

console.log("Test OAuth wallet endpoint registered")
