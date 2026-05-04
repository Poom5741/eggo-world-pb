// Marketplace Stats API - Phase 32
// Endpoints: market-stats, platform-stats, referral-stats

// ========== MSTAT-01: GET /api/v2/market-stats ==========
routerAdd("GET", "/api/v2/market-stats", (e) => {
  try {
    // Query resale_listings collection for active listings
    const listings = $app.findRecordsByFilter(
      "resale_listings",
      "status = 'active'",
      "-created",
      1000,
      0
    )

    // Calculate floor price (minimum price across all active listings)
    let floorPrice = null
    let activeCount = 0

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i]
      const price = listing.get("price") || 0
      const status = listing.get("status")

      if (status === "active") {
        activeCount++
        if (floorPrice === null || price < floorPrice) {
          floorPrice = price
        }
      }
    }

    // Query transaction_logs for 24h volume
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentTransactions = $app.findRecordsByFilter(
      "transaction_logs",
      `created >= '${twentyFourHoursAgo}' && type = 'sale'`,
      "-created",
      1000,
      0
    )

    let totalVolume = 0
    for (let i = 0; i < recentTransactions.length; i++) {
      const tx = recentTransactions[i]
      totalVolume += tx.get("amount") || 0
    }

    e.json(200, {
      success: true,
      data: {
        floor_price: floorPrice || 0,
        volume_24h: totalVolume,
        active_listings: activeCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "MARKET_STATS_FAILED" }
    })
  }
})

// ========== STATS-01: GET /api/v2/platform-stats ==========
routerAdd("GET", "/api/v2/platform-stats", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" }
      })
    }

    // Verify user is admin
    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(403, { success: false, error: { message: "Admin access required", code: "ADMIN_REQUIRED" } }); }
    const isAdmin = user.get("role") === "admin" || user.get("is_admin") === true

    if (!isAdmin) {
      return e.json(403, {
        success: false,
        error: { message: "Admin access required", code: "ADMIN_REQUIRED" }
      })
    }

    // Count total users (estimate via pagination)
    const allUsers = $app.findRecordsByFilter("users", "", "-created", 10000, 0)
    const totalUsers = allUsers.length

    // Count NFTs
    const eggNfts = $app.findRecordsByFilter("egg_nfts", "", "-created", 1, 0).length
    const animalNfts = $app.findRecordsByFilter("animal_nfts", "", "-created", 1, 0).length
    const foodNfts = $app.findRecordsByFilter("food_nfts", "", "-created", 1, 0).length

    // Get all transaction logs for totals
    const allTransactions = $app.findRecordsByFilter(
      "transaction_logs",
      "",
      "-created",
      10000,
      0
    )

    let totalRevenue = 0
    let totalVolume = 0
    let totalCommissionsPaid = 0
    let coinstorBalance = 0

    for (let i = 0; i < allTransactions.length; i++) {
      const tx = allTransactions[i]
      const amount = tx.get("amount") || 0
      const type = tx.get("type")

      if (type === "sale" || type === "mint") {
        totalRevenue += amount
      }
      if (type === "sale") {
        totalVolume += amount
      }
      if (type === "commission") {
        totalCommissionsPaid += amount
      }
      if (type === "coinstor_deposit") {
        coinstorBalance += amount
      }
    }

    e.json(200, {
      success: true,
      data: {
        total_users: totalUsers,
        total_eggs_minted: eggNfts,
        total_animals_hatched: animalNfts,
        total_food_minted: foodNfts,
        total_revenue: totalRevenue,
        total_volume: totalVolume,
        total_commissions_paid: totalCommissionsPaid,
        coinstor_balance: coinstorBalance,
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "PLATFORM_STATS_FAILED" }
    })
  }
})

// ========== STATS-02: GET /api/v2/referral-stats ==========
routerAdd("GET", "/api/v2/referral-stats", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const userId = requestInfo.auth?.id

    if (!userId) {
      return e.json(401, {
        success: false,
        error: { message: "Authentication required", code: "AUTH_REQUIRED" }
      })
    }

    let user;
    try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(500, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }

    // Get user's referral chain (who referred them)
    const referralChain = {
      g1: user.get("upline_G1") || null,
      g2: user.get("upline_G2") || null,
      g3: user.get("upline_G3") || null,
      g4: user.get("upline_G4") || null
    }

    // Find all users where this user is their G1 (direct recruits)
    const allUsers = $app.findRecordsByFilter("users", "", "-created", 10000, 0)
    let directRecruits = []
    let totalDownline = 0

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      if (u.id === userId) continue

      const uG1 = u.get("upline_G1")
      const uG2 = u.get("upline_G2")
      const uG3 = u.get("upline_G3")
      const uG4 = u.get("upline_G4")

      // Count direct recruits (G1 = this user)
      if (uG1 === userId) {
        directRecruits.push({
          id: u.id,
          username: u.get("username") || "",
          email: u.get("email") || "",
          created: u.get("created")
        })
      }

      // Count total downline (any level)
      if (uG1 === userId || uG2 === userId || uG3 === userId || uG4 === userId) {
        totalDownline++
      }
    }

    // Calculate referral earnings from transaction_logs
    const transactions = $app.findRecordsByFilter(
      "transaction_logs",
      `type = 'commission'`,
      "-created",
      10000,
      0
    )

    let referralEarnings = 0
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      // Check if this user was a recipient
      if (tx.get("recipient") === userId ||
          tx.get("recipient_g1") === userId ||
          tx.get("recipient_g2") === userId ||
          tx.get("recipient_g3") === userId ||
          tx.get("recipient_g4") === userId) {
        referralEarnings += tx.get("amount") || 0
      }
    }

    e.json(200, {
      success: true,
      data: {
        referral_chain: referralChain,
        direct_recruits: directRecruits,
        direct_recruit_count: directRecruits.length,
        total_downline: totalDownline,
        referral_earnings: referralEarnings,
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    e.json(500, {
      success: false,
      error: { message: err.message, code: "REFERRAL_STATS_FAILED" }
    })
  }
})
