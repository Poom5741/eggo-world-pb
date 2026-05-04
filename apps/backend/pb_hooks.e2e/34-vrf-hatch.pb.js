// VRF Integration for Randomness - Phase 34
// Endpoints: hatch-egg-vrf, hatch-status

// ========== VRF-01: POST /api/v2/hatch-egg-vrf ==========
routerAdd("POST", "/api/v2/hatch-egg-vrf", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" }
      })
    }

    const body = e.parseBody()
    const eggId = body.egg_id

    if (!eggId) {
      return e.json(400, {
        success: false,
        error: { message: "egg_id required", code: "VALIDATION_ERROR" }
      })
    }

    // Call wallet-api to initiate VRF hatch
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/hatch-egg-vrf",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        egg_id: eggId
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
      throw new Error("VRF hatch failed: " + JSON.stringify(responseData))
    }

    e.json(200, {
      success: true,
      data: {
        request_id: responseData.data.request_id,
        egg_id: eggId,
        status: "vrf_requested",
        message: "VRF randomness requested. Animal will be minted in 1-3 minutes."
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "VRF_HATCH_FAILED" }
    })
  }
})

// ========== GET /api/v2/hatch-status/:egg_id ==========
routerAdd("GET", "/api/v2/hatch-status/{egg_id}", (e) => {
  try {
    const eggId = e.request.pathValue("egg_id")

    // Query egg_nfts collection for status
    const egg = $app.findRecordById("egg_nfts", eggId)

    if (!egg) {
      return e.json(404, {
        success: false,
        error: { message: "Egg not found", code: "EGG_NOT_FOUND" }
      })
    }

    e.json(200, {
      success: true,
      data: {
        egg_id: eggId,
        is_hatched: egg.get("is_hatched") || false,
        is_hatching: egg.get("is_hatching") || false,
        animal_id: egg.get("animal_id") || null,
        vrf_request_id: egg.get("vrf_request_id") || null
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "HATCH_STATUS_FAILED" }
    })
  }
})
