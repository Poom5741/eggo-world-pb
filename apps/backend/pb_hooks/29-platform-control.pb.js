routerAdd("GET", "/api/v2/platform/status", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id
    
    if (!userId) {
      return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } })
    }

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
    const response = $http.send({
      url: `${walletApiUrl}/api/v1/admin/status`,
      method: "GET",
    })

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

    console.log(`[Platform Status] Retrieved status: ${responseData.data?.paused}`)
    
    return e.json(200, {
      success: true,
      data: {
        paused: responseData.data?.paused || false,
        timestamp: responseData.data?.timestamp
      }
    })

  } catch (err) {
    console.error("[Platform Status] Error:", err.message)
    return e.json(500, { success: false, error: { message: err.message, code: "PLATFORM_STATUS_ERROR" } })
  }
})

routerAdd("POST", "/api/v2/platform/pause", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id
    
    if (!userId) {
      return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } }); }
    if (!user || !user.get("admin")) {
      return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } })
    }

    console.log(`[Platform Pause] Admin ${userId} requesting pause`)

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
    const response = $http.send({
      url: `${walletApiUrl}/api/v1/admin/control`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" }),
    })

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

    // Log audit trail
    const auditCollection = $app.findCollectionByNameOrId("admin_audit_logs") || 
                           $app.newRecord($app.findCollectionByNameOrId("_pb_users_auth_"))
    
    console.log(`[Platform Pause] Transaction: ${responseData.data?.transaction_hash}`)

    return e.json(200, {
      success: true,
      data: {
        action: "paused",
        transaction_hash: responseData.data?.transaction_hash,
        block_number: responseData.data?.block_number,
        timestamp: new Date().toISOString()
      }
    })

  } catch (err) {
    console.error("[Platform Pause] Error:", err.message)
    return e.json(500, { success: false, error: { message: err.message, code: "PAUSE_FAILED" } })
  }
})

routerAdd("POST", "/api/v2/platform/unpause", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id
    
    if (!userId) {
      return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } }); }
    if (!user || !user.get("admin")) {
      return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } })
    }

    console.log(`[Platform Unpause] Admin ${userId} requesting unpause`)

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001"
    const response = $http.send({
      url: `${walletApiUrl}/api/v1/admin/control`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unpause" }),
    })

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

    console.log(`[Platform Unpause] Transaction: ${responseData.data?.transaction_hash}`)

    return e.json(200, {
      success: true,
      data: {
        action: "unpaused",
        transaction_hash: responseData.data?.transaction_hash,
        block_number: responseData.data?.block_number,
        timestamp: new Date().toISOString()
      }
    })

  } catch (err) {
    console.error("[Platform Unpause] Error:", err.message)
    return e.json(500, { success: false, error: { message: err.message, code: "UNPAUSE_FAILED" } })
  }
})
