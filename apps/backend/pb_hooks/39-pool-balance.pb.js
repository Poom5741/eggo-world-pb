/// <hook-req>
/// type: route
/// path: /api/v2/admin/pool-balances
/// method: GET
/// </hook-req>

routerAdd("GET", "/api/v2/admin/pool-balances", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const wallet = requestInfo.query?.wallet

    // Extract wallet parameter from query string
    if (!wallet) {
      return e.json(401, {
        success: false,
        error: { message: "Wallet address is required", code: "AUTH_REQUIRED" }
      })
    }

    // Get wallet-api URL from environment or use default
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"

    console.log(`[Pool Balance] Proxying request for wallet: ${wallet}`)

    // Forward request to wallet-api
    const response = $http.send({
      url: `${walletApiUrl}/api/v1/admin/pool-balances?wallet=${encodeURIComponent(wallet)}`,
      method: "GET",
      headers: { "Content-Type": "application/json" }
    })

    // Parse response body (handle both binary buffer and parsed JSON)
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

    // Forward the exact response from wallet-api
    const statusCode = response.status_code || 200
    console.log(`[Pool Balance] Response status: ${statusCode}`)
    return e.json(statusCode, responseData)

  } catch (err) {
    console.error("[Pool Balance] Error:", err.message)
    return e.json(500, {
      success: false,
      error: { message: "Failed to fetch pool balances", code: "POOL_BALANCE_ERROR" }
    })
  }
})

console.log("Pool balance proxy endpoint registered: GET /api/v2/admin/pool-balances")