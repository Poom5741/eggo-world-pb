/**
 * Hook: 23-list-animal.pb.js
 * Event: Router (POST /api/v2/list-animal)
 *
 * Flow per RESALE-01:
 * 1. Authenticate user
 * 2. Validate animal_id and price
 * 3. Find animal record
 * 4. Verify ownership (D-25: required for security)
 * 5. Check breeding cooldown (D-24: required)
 * 6. Trace referral chain via parent_egg_id → egg_nfts
 * 7. Create resale_listing with royalty_recipients
 * 8. Return listing_id and status
 *
 * Request Body:
 * { "animal_id": 1, "price": 50.00 }
 *
 * Response:
 * { "success": true, "data": { "listing_id": "...", "price": 50, "status": "active" } }
 */

const BREED_COOLDOWN_HOURS = 48 // Matches 18-breed-animals.pb.js

/**
 * Check if animal is on breeding cooldown
 * Copy from 18-breed-animals.pb.js lines 47-55
 */
function isOnCooldown(lastBredAt) {
  if (!lastBredAt) return false
  const lastBred = new Date(lastBredAt).getTime()
  const cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000
  const cooldownEnd = lastBred + cooldownMs
  return Date.now() < cooldownEnd
}

/**
 * Format remaining cooldown for error message
 * Copy from 18-breed-animals.pb.js lines 60-75
 */
function formatCooldownRemaining(lastBredAt) {
  if (!lastBredAt) return ""
  const lastBred = new Date(lastBredAt).getTime()
  const cooldownMs = BREED_COOLDOWN_HOURS * 60 * 60 * 1000
  const cooldownEnd = lastBred + cooldownMs
  const remainingMs = Math.max(0, cooldownEnd - Date.now())
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

routerAdd("POST", "/api/v2/list-animal", (e) => {
  try {
    const user = $apis.requireAuth(e)

    const requestInfo = e.requestInfo()
    const body = requestInfo.body || {}
    const { animal_id, price } = body

    // Validate animal_id (RESALE-01)
    if (!animal_id || animal_id <= 0) {
      return e.json(400, {
        success: false,
        error: { message: "Invalid animal ID", code: "INVALID_ANIMAL_ID" },
      })
    }

    // Validate price (RESALE-01)
    if (!price || price <= 0) {
      return e.json(400, {
        success: false,
        error: { message: "Invalid price. Must be greater than 0", code: "INVALID_PRICE" },
      })
    }

    // Find animal record
    const animal = $app.dao().findFirstRecordByFilter("animal_nfts", "animal_id = {:animal_id}", {
      "@animal_id": animal_id,
    })

    if (!animal) {
      return e.json(400, {
        success: false,
        error: { message: "Animal not found", code: "ANIMAL_NOT_FOUND" },
      })
    }

    // Verify ownership (D-25: required for security)
    const ownerId = animal.get("owner")
    if (ownerId !== user.id) {
      return e.json(400, {
        success: false,
        error: { message: "You do not own this animal", code: "NOT_OWNER" },
      })
    }

    // Check breeding cooldown (D-24: required)
    const lastBredAt = animal.get("last_bred_at")
    if (isOnCooldown(lastBredAt)) {
      const remaining = formatCooldownRemaining(lastBredAt)
      return e.json(400, {
        success: false,
        error: {
          message: `Animal is on breeding cooldown. Ready in ${remaining}`,
          code: "ANIMAL_ON_COOLDOWN",
          cooldown_remaining: remaining,
        },
      })
    }

    // Trace referral chain via parent_egg_id → egg_nfts.referral_chain
    const parentEggId = animal.get("parent_egg_id")
    let royaltyRecipients = []

    if (parentEggId) {
      // Find the parent egg record
      const parentEgg = $app.dao().findFirstRecordByFilter("egg_nfts", "egg_id = {:egg_id}", {
        "@egg_id": parentEggId,
      })

      if (parentEgg) {
        const referralChain = parentEgg.get("referral_chain") || []
        royaltyRecipients = referralChain
      }
    }

    // Create resale_listing (D-21)
    const resaleListingsCollection = $app.dao().getCollectionByNameOrId("resale_listings")
    const listing = $app.dao().createRecord(resaleListingsCollection)

    listing.set("nft_id", animal.id)
    listing.set("animal_id", animal_id)
    listing.set("seller_id", user.id)
    listing.set("price", price)
    listing.set("rarity", animal.get("rarity"))
    listing.set("species", animal.get("species"))
    listing.set("generation", animal.get("generation"))
    listing.set("royalty_recipients", royaltyRecipients)
    listing.set("status", "active")
    listing.set("listed_at", new Date().toISOString())

    $app.dao().saveRecord(listing)

    console.log(
      `Animal listed: animal_id=${animal_id}, seller=${user.id}, price=${price}, royalty_recipients=${royaltyRecipients.length}`
    )

    return e.json(200, {
      success: true,
      data: {
        listing_id: listing.id,
        animal_id: animal_id,
        price: price,
        rarity: animal.get("rarity"),
        species: animal.get("species"),
        generation: animal.get("generation"),
        status: "active",
        royalty_recipients_count: royaltyRecipients.length,
      },
    })
  } catch (error) {
    console.error("List animal error:", error)
    return e.json(500, {
      success: false,
      error: { message: error.message, code: "LISTING_FAILED" },
    })
  }
})

/**
 * GET endpoint to retrieve user's active listings
 */
routerAdd("GET", "/api/v2/list-animal", (e) => {
  try {
    const user = $apis.requireAuth(e)

    const listings = $app
      .dao()
      .findRecordsByFilter(
        "resale_listings",
        "seller_id = {:seller_id} && status = {:status}",
        "listed_at",
        "DESC",
        100,
        0,
        { "@seller_id": user.id, "@status": "active" }
      )

    return e.json(200, {
      success: true,
      data: listings.map((l) => ({
        listing_id: l.id,
        animal_id: l.get("animal_id"),
        price: l.get("price"),
        rarity: l.get("rarity"),
        species: l.get("species"),
        generation: l.get("generation"),
        status: l.get("status"),
        listed_at: l.get("listed_at"),
      })),
    })
  } catch (error) {
    console.error("Get listings error:", error)
    return e.json(500, {
      success: false,
      error: { message: error.message, code: "GET_LISTINGS_FAILED" },
    })
  }
})