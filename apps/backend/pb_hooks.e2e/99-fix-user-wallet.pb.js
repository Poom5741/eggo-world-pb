// ===== FIX EXISTING USER WALLET =====
// Call this once to create wallet for existing user
// REMOVE AFTER USE

console.log("Setting up fix user wallet endpoint...")

routerAdd("POST", "/api/v2/fix-user-wallet", (e) => {
    console.log("=== FIX USER WALLET ENDPOINT CALLED ===")

    try {
        // Get user ID from request body
        const body = e.requestInfo().body
        const userId = body?.user_id

        if (!userId) {
            return e.json(400, {
                success: false,
                error: { message: "user_id is required", code: "MISSING_PARAM" }
            })
        }

        console.log("Fixing wallet for user:", userId)

        // Get the user record
        const user = $app.findRecordById("users", userId)
        if (!user) {
            return e.json(404, {
                success: false,
                error: { message: "User not found", code: "USER_NOT_FOUND" }
            })
        }

        // Check if wallet already exists
        const existingWallet = user.get("wallet")
        const existingDacc = user.get("daccPublickey")
        const existingPin = user.get("pin")
        
        console.log('Existing wallet:', existingWallet)
        console.log('Existing dacc:', JSON.stringify(existingDacc))
        console.log('Existing pin:', JSON.stringify(existingPin))
        console.log('Existing dacc type:', typeof existingDacc)
        console.log('Existing pin type:', typeof existingPin)
        
        const hasCompleteWallet = existingWallet && existingWallet.startsWith("0x") && existingDacc && existingPin
        
        // Check if user_wallets record exists (do this before early return)
        let userWalletsRecord = null
        try {
            userWalletsRecord = $app.findFirstRecordByData("user_wallets", "user_id", user.id)
            console.log("user_wallets record found:", userWalletsRecord.id)
        } catch (err) {
            console.log("user_wallets record not found, will create")
        }
        
        // Create user_wallets record if missing
        if (!userWalletsRecord && existingWallet) {
            console.log("Creating user_wallets record for user:", user.id)
            const userWalletsCollection = $app.findCollectionByNameOrId("user_wallets")
            userWalletsRecord = new Record(userWalletsCollection)
            
            userWalletsRecord.set("user_id", user.id)
            userWalletsRecord.set("wallet_address", existingWallet || "")
            userWalletsRecord.set("usdt_balance", 0)
            userWalletsRecord.set("total_earned", 0)
            userWalletsRecord.set("total_spent", 0)
            userWalletsRecord.set("total_withdrawn", 0)
            
            $app.save(userWalletsRecord)
            
            console.log("user_wallets record created:", userWalletsRecord.id)
        }
        
        if (hasCompleteWallet && userWalletsRecord) {
            return e.json(200, {
                success: true,
                message: "User already has a complete wallet setup",
                wallet: existingWallet
            })
        }
        
        // If wallet exists but missing dacc/pin, generate them
        if (existingWallet && existingWallet.startsWith("0x")) {
            console.log("Wallet exists but missing dacc/pin, generating...")
            const randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36) + Math.random().toString(36).slice(-10)
            
            user.set("daccPublickey", "daccPublickey_" + existingWallet + "_" + Math.random().toString(36).substring(2, 15))
            user.set("pin", randomPassword)
            
            $app.save(user)
            
            console.log("User dacc/pin fields updated")
            
            return e.json(200, {
                success: true,
                user_id: userId,
                wallet: existingWallet,
                daccPublickey: user.get("daccPublickey"),
                message: "Wallet dacc/pin fields added"
            })
        }

        // Call wallet-api to create new wallet
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
        const apiUrl = walletApiUrl + "/api/wallet/create"
        
        const randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36) + Math.random().toString(36).slice(-10)
        
        const requestBody = {
            passwordSecretkey: randomPassword,
            publicEncryption: false
        }

        console.log("Calling wallet-api for user:", userId)

        const response = $http.send({
            url: apiUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        })

        console.log("Wallet-api response status:", response.statusCode)

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error("Wallet-api returned status " + response.statusCode)
        }

        let responseData
        if (response.json && typeof response.json === "object") {
            responseData = response.json
        } else if (response.body) {
            let responseBody = response.body
            if (Array.isArray(response.body)) {
                responseBody = ""
                for (let i = 0; i < response.body.length; i++) {
                    responseBody += String.fromCharCode(response.body[i])
                }
            }
            responseData = JSON.parse(responseBody)
        } else {
            throw new Error("Wallet-api returned empty response")
        }

        if (!responseData.success) {
            throw new Error("Wallet creation failed: " + (responseData.error?.message || "Unknown error"))
        }

        const address = responseData.data.address
        const daccPublickey = responseData.data.daccPublickey

        console.log("Wallet created:", address)

        // Update user record
        user.set("wallet", address)
        user.set("daccPublickey", daccPublickey)
        user.set("pin", randomPassword)
        
        $app.save(user)

        console.log("User wallet fields updated")

        // Create user_wallets record
        try {
            const userWalletsCollection = $app.findCollectionByNameOrId("user_wallets")
            const userWalletRecord = new Record(userWalletsCollection)
            
            userWalletRecord.set("user_id", userId)
            userWalletRecord.set("wallet_address", address)
            userWalletRecord.set("usdt_balance", 0)
            userWalletRecord.set("total_earned", 0)
            userWalletRecord.set("total_spent", 0)
            userWalletRecord.set("last_deposit_amount", 0)
            userWalletRecord.set("last_deposit_tx", "")
            userWalletRecord.set("last_deposit_block", 0)
            
            $app.save(userWalletRecord)
            
            console.log("user_wallets record created")
        } catch (walletErr) {
            console.log("user_wallets creation error (may already exist):", walletErr)
        }

        return e.json(200, {
            success: true,
            user_id: userId,
            wallet: address,
            daccPublickey: daccPublickey,
            message: "Wallet created successfully"
        })

    } catch (error) {
        console.error("Fix wallet error:", error)
        return e.json(500, {
            success: false,
            error: String(error),
            code: "FIX_WALLET_FAILED"
        })
    }
})

console.log("Fix user wallet endpoint registered")
