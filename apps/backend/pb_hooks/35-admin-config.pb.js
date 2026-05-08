// Admin Game Configuration - Phase 35
// Endpoints: set-platform-fee, set-breed-cooldown, update-rarity-weights, add-species, game-config

// ========== ADMIN-01: POST /api/v2/admin/set-platform-fee ==========
routerAdd("POST", "/api/v2/admin/set-platform-fee", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } }); }
    if (user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } })
    }

    const body = e.parseBody()
    const feePercent = parseInt(body.fee_percent)

    if (isNaN(feePercent) || feePercent < 0 || feePercent > 2000) {
      return e.json(400, { success: false, error: { message: "Fee must be 0-2000 basis points", code: "VALIDATION_ERROR" } })
    }

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/admin/set-platform-fee",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee_percent: feePercent })
    })

    e.json(200, { success: true, data: { fee_percent: feePercent } })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "SET_FEE_FAILED" } })
  }
})

// ========== ADMIN-02: POST /api/v2/admin/set-breed-cooldown ==========
routerAdd("POST", "/api/v2/admin/set-breed-cooldown", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } }); }
    if (user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } })
    }

    const body = e.parseBody()
    const cooldownSeconds = parseInt(body.cooldown_seconds)

    if (isNaN(cooldownSeconds) || cooldownSeconds < 3600 || cooldownSeconds > 604800) {
      return e.json(400, { success: false, error: { message: "Cooldown must be 3600-604800 seconds", code: "VALIDATION_ERROR" } })
    }

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/admin/set-breed-cooldown",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cooldown_seconds: cooldownSeconds })
    })

    e.json(200, { success: true, data: { cooldown_seconds: cooldownSeconds } })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "SET_COOLDOWN_FAILED" } })
  }
})

// ========== ADMIN-03: POST /api/v2/admin/update-rarity-weights ==========
routerAdd("POST", "/api/v2/admin/update-rarity-weights", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } }); }
    if (user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } })
    }

    const body = e.parseBody()
    const weights = {
      common: parseInt(body.common) || 6000,
      rare: parseInt(body.rare) || 2500,
      epic: parseInt(body.epic) || 1200,
      legendary: parseInt(body.legendary) || 300
    }

    const total = weights.common + weights.rare + weights.epic + weights.legendary
    if (total !== 10000) {
      return e.json(400, { success: false, error: { message: "Weights must sum to 10000", code: "VALIDATION_ERROR" } })
    }

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/admin/update-rarity-weights",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights: weights })
    })

    e.json(200, { success: true, data: { weights: weights } })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "UPDATE_WEIGHTS_FAILED" } })
  }
})

// ========== ADMIN-04: POST /api/v2/admin/add-species ==========
routerAdd("POST", "/api/v2/admin/add-species", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } }); }
    if (user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin required", code: "ADMIN_REQUIRED" } })
    }

    const body = e.parseBody()
    const speciesId = parseInt(body.species_id)
    const name = body.name
    const weight = parseInt(body.weight) || 100

    if (!speciesId || !name) {
      return e.json(400, { success: false, error: { message: "species_id and name required", code: "VALIDATION_ERROR" } })
    }

    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/admin/add-species",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ species_id: speciesId, name: name, weight: weight })
    })

    e.json(200, { success: true, data: { species_id: speciesId, name: name } })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "ADD_SPECIES_FAILED" } })
  }
})

// ========== GET /api/v2/game-config ==========
routerAdd("GET", "/api/v2/game-config", (e) => {
  try {
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/game-config",
      method: "GET"
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

    e.json(200, { success: true, data: responseData.data })
  } catch (err) {
    e.json(500, { success: false, error: { message: err.message, code: "GET_CONFIG_FAILED" } })
  }
})
