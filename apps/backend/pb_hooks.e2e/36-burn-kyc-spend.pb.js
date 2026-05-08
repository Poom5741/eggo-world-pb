// NFT Burn & KYC Toggle - Phase 36
// Endpoints: burn-nft, set-kyc-required, kyc-status, spend-usdt

// ========== BURN-01: POST /api/v2/burn-nft ==========
routerAdd("POST", "/api/v2/burn-nft", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    const body = e.parseBody()
    const nftId = body.nft_id
    const nftType = body.nft_type // "egg", "food", "animal"

    if (!nftId || !nftType) {
      return e.json(400, { success: false, error: { message: "nft_id and nft_type required", code: "VALIDATION_ERROR" } })
    }

    // Get user's wallet
    const user = $app.findRecordById("users", userId)
    const userWallet = user.get("wallet")

    // Verify ownership via wallet-api
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/burn-nft",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_address: userWallet,
        nft_id: nftId,
        nft_type: nftType
      })
    })

    // Parse response
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
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("Burn failed: " + JSON.stringify(responseData))
    }

    // Update PocketBase record (mark as burned)
    let collectionName = ""
    if (nftType === "egg") collectionName = "egg_nfts"
    else if (nftType === "food") collectionName = "food_nfts"
    else if (nftType === "animal") collectionName = "animal_nfts"

    if (collectionName) {
      const record = $app.findRecordById(collectionName, nftId)
      if (record) {
        record.set("is_burned", true)
        record.set("burned_at", new Date().toISOString())
        $app.save(record)
      }
    }

    e.json(200, {
      success: true,
      data: {
        nft_id: nftId,
        nft_type: nftType,
        transaction_hash: responseData.data.transaction_hash
      }
    })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "BURN_NFT_FAILED" } })
  }
})

// ========== KYC-01: POST /api/v2/admin/set-kyc-required ==========
routerAdd("POST", "/api/v2/admin/set-kyc-required", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    const user = $app.findRecordById("users", userId)
    if (user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } })
    }

    const body = e.parseBody()
    const kycRequired = body.kyc_required === true

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/admin/set-kyc-required",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kyc_required: kycRequired })
    })

    e.json(200, { success: true, data: { kyc_required: kycRequired } })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "SET_KYC_FAILED" } })
  }
})

// ========== KYC-01: GET /api/v2/kyc-status ==========
routerAdd("GET", "/api/v2/kyc-status", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    const user = $app.findRecordById("users", userId)

    e.json(200, {
      success: true,
      data: {
        kyc_verified: user.get("kyc_verified") || false,
        kyc_required_globally: user.get("kyc_required_globally") || false,
        can_withdraw: !(user.get("kyc_required_globally") && !user.get("kyc_verified"))
      }
    })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "KYC_STATUS_FAILED" } })
  }
})

// ========== SPEND-01: POST /api/v2/spend-usdt ==========
routerAdd("POST", "/api/v2/spend-usdt", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    const body = e.parseBody()
    const amount = parseFloat(body.amount)
    const purpose = body.purpose

    if (!amount || !purpose) {
      return e.json(400, { success: false, error: { message: "amount and purpose required", code: "VALIDATION_ERROR" } })
    }

    const user = $app.findRecordById("users", userId)
    const wallet = $app.findFirstRecordByData("user_wallets", "user_id", userId)

    if (!wallet) {
      return e.json(404, { success: false, error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } })
    }

    const currentBalance = wallet.get("usdt_balance") || 0
    if (currentBalance < amount) {
      return e.json(400, { success: false, error: { message: "Insufficient balance", code: "INSUFFICIENT_BALANCE" } })
    }

    // Update wallet balance
    wallet.set("usdt_balance", currentBalance - amount)
    wallet.set("total_spent", (wallet.get("total_spent") || 0) + amount)
    $app.save(wallet)

    // Log transaction
    const txCollection = $app.getCollection("transaction_logs")
    const txRecord = $app.newRecord(txCollection)
    txRecord.set("user_id", userId)
    txRecord.set("type", "spend")
    txRecord.set("amount", amount)
    txRecord.set("purpose", purpose)
    txRecord.set("created", new Date().toISOString())
    $app.save(txRecord)

    e.json(200, {
      success: true,
      data: {
        amount_spent: amount,
        remaining_balance: currentBalance - amount,
        purpose: purpose
      }
    })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "SPEND_USDT_FAILED" } })
  }
})
