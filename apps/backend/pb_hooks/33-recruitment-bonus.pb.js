// Recruitment Bonus USDT Rewards - Phase 33
// Endpoints: claim-recruitment-bonus, recruitment-bonus-status

// ========== RECRUIT-01: POST /api/v2/claim-recruitment-bonus ==========
routerAdd("POST", "/api/v2/claim-recruitment-bonus", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" }
      })
    }

    const user = $app.findRecordById("users", userId)

    // Count direct recruits
    const allUsers = $app.findRecordsByFilter("users", "", "-created", 10000, 0)
    let directRecruitCount = 0

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      if (u.id === userId) continue
      if (u.get("upline_G1") === userId) {
        directRecruitCount++
      }
    }

    // Determine tier
    const tiers = [
      { min: 10, food: 1, multiplier: 2, usdt: 10 },
      { min: 100, food: 1, multiplier: 4, usdt: 20 },
      { min: 1000, food: 1, multiplier: 6, usdt: 30 },
      { min: 10000, food: 1, multiplier: 10, usdt: 50 }
    ]

    let eligibleTier = null
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (directRecruitCount >= tiers[i].min) {
        eligibleTier = tiers[i]
        eligibleTier.tierNumber = i + 1
        break
      }
    }

    if (!eligibleTier) {
      return e.json(400, {
        success: false,
        error: {
          message: "Need at least 10 direct recruits. You have " + directRecruitCount,
          code: "TIER_NOT_REACHED"
        }
      })
    }

    // Check if already claimed this tier
    const claimedTier = user.get("claimed_recruitment_tier") || 0
    if (claimedTier >= eligibleTier.tierNumber) {
      return e.json(400, {
        success: false,
        error: { message: "Already claimed this tier bonus", code: "ALREADY_CLAIMED" }
      })
    }

    // Call wallet-api to mint food NFTs and credit USDT
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://localhost:3001"
    const response = $http.send({
      url: walletApiUrl + "/api/v1/wallet/claim-recruitment-bonus",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_address: user.get("wallet"),
        tier: eligibleTier.tierNumber,
        food_count: eligibleTier.food * eligibleTier.multiplier,
        usdt_bonus: eligibleTier.usdt
      })
    })

    // Update user's claimed tier
    user.set("claimed_recruitment_tier", eligibleTier.tierNumber)
    $app.save(user)

    e.json(200, {
      success: true,
      data: {
        tier: eligibleTier.tierNumber,
        food_rewarded: eligibleTier.food * eligibleTier.multiplier,
        usdt_bonus: eligibleTier.usdt,
        direct_recruits: directRecruitCount
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "RECRUITMENT_BONUS_FAILED" }
    })
  }
})

// ========== GET /api/v2/recruitment-bonus-status ==========
routerAdd("GET", "/api/v2/recruitment-bonus-status", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" }
      })
    }

    const user = $app.findRecordById("users", userId)

    // Count direct recruits
    const allUsers = $app.findRecordsByFilter("users", "", "-created", 10000, 0)
    let directRecruitCount = 0

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      if (u.id === userId) continue
      if (u.get("upline_G1") === userId) {
        directRecruitCount++
      }
    }

    const tiers = [
      { tier: 1, min: 10, food: 2, usdt: 10 },
      { tier: 2, min: 100, food: 4, usdt: 20 },
      { tier: 3, min: 1000, food: 6, usdt: 30 },
      { tier: 4, min: 10000, food: 10, usdt: 50 }
    ]

    let currentTier = 0
    let nextTier = null

    for (let i = 0; i < tiers.length; i++) {
      if (directRecruitCount >= tiers[i].min) {
        currentTier = tiers[i].tier
      } else if (!nextTier) {
        nextTier = tiers[i]
      }
    }

    const claimedTier = user.get("claimed_recruitment_tier") || 0

    e.json(200, {
      success: true,
      data: {
        direct_recruits: directRecruitCount,
        current_tier: currentTier,
        claimed_tier: claimedTier,
        can_claim: currentTier > claimedTier,
        next_tier: nextTier
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "BONUS_STATUS_FAILED" }
    })
  }
})
