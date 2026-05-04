/**
 * Hook: 23-buy-animal.pb.js
 * Event: Router (POST /api/v2/buy-animal)
 *
 * Flow per RESALE-02, RESALE-03, RESALE-04:
 * 1. Authenticate user (buyer)
 * 2. Get listing from resale_listings
 * 3. Verify listing is active
 * 4. Check buyer USDT balance >= price
 * 5. Calculate fee breakdown:
 *    - 10% royalty total (2% G1, 1% G2, 1% G3, 1% G4 per D-10)
 *    - 4% platform fee
 *    - 1% misc
 *    - 85% seller (RESALE-04)
 * 6. Distribute royalties to referral chain wallets
 * 7. Credit seller 85%
 * 8. Deduct buyer full price
 * 9. Transfer NFT ownership
 * 10. Create commission_records with type 'resale_royalty'
 * 11. Update listing status to 'sold'
 * 12. Return success
 *
 * Request Body:
 * { "listing_id": "resale_listing_record_id" }
 *
 * Response:
 * { "success": true, "data": { "animal_id": 1, "price": 50, "seller_amount": 42.5, "royalty_total": 5 } }
 */

// Royalty splits per D-10 (RESALE-03)
// Constants defined inside routerAdd callback to avoid goja global scope conflicts

/**
 * Distribute royalties to referral chain
 * Modified from 18-breed-animals.pb.js createCommissionRecords
 * Uses RESALE royalty splits: [0.02, 0.01, 0.01, 0.01] NOT primary [0.25, 0.15, 0.10, 0.05]
 */
function distributeRoyalties(referralChain, salePrice, listingId, listingRecord) {
  const royaltyPercents = [0.02, 0.01, 0.01, 0.01] // G1-G4 per D-10

  for (let i = 0; i < Math.min(referralChain.length, 4); i++) {
    const referrerWallet = referralChain[i]
    if (!referrerWallet) continue

    const royaltyAmount = salePrice * royaltyPercents[i]
    if (royaltyAmount <= 0) continue

    // Find referrer wallet record
    const referrerWalletRecord = $app
      .dao()
      .findFirstRecordByFilter("user_wallets", "wallet = {:wallet}", { "@wallet": referrerWallet })

    if (!referrerWalletRecord) continue

    const referrerId = referrerWalletRecord.get("owner") || referrerWalletRecord.get("user_id")

    // Create commission record with type 'resale_royalty'
    const commissionCollection = $app.dao().getCollectionByNameOrId("commission_records")
    const commission = $app.dao().createRecord(commissionCollection)

    commission.set("referrer_id", referrerId)
    commission.set("referrer_wallet", referrerWallet)
    commission.set("generation", i + 1)
    commission.set("amount", royaltyAmount.toString())
    commission.set("type", "resale_royalty")
    commission.set("nft_id", listingRecord.get("nft_id"))
    commission.set("distributed_at", new Date().toISOString())

    $app.dao().saveRecord(commission)

    const currentBalance = parseFloat(referrerWalletRecord.get("usdt_balance") || "0")
    referrerWalletRecord.set("usdt_balance", (currentBalance + royaltyAmount).toString())
    referrerWalletRecord.set(
      "total_earned",
      (parseFloat(referrerWalletRecord.get("total_earned") || "0") + royaltyAmount).toString()
    )

    $app.dao().saveRecord(referrerWalletRecord)

    console.log(`Royalty distributed: G${i + 1}=${referrerWallet}, amount=${royaltyAmount}`)
  }
}

routerAdd("POST", "/api/v2/buy-animal", (e) => {
    // Constants must be inside routerAdd callback — goja doesn't expose top-level vars to callbacks
    const PLATFORM_FEE_PERCENT = 4 // RESALE-04
    const MISC_FEE_PERCENT = 1 // RESALE-04
    const SELLER_PERCENT = 85 // RESALE-04
    const ROYALTY_SPLITS = {
      G1: 2, // 2% of total sale price
      G2: 1, // 1% of total sale price
      G3: 1, // 1% of total sale price
      G4: 1, // 1% of total sale price (5% total to referral chain)
    }
    const ROYALTY_TOTAL_PERCENT = 10 // RESALE-02
  try {
    const requestInfo = e.requestInfo()
    const buyerId = requestInfo.auth?.id
    if (!buyerId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    let buyer;
    try { buyer = $app.findRecordById("users", buyerId); } catch (e) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }

    const body = e.parseBody()
    const { listing_id } = body

    if (!listing_id) {
      return e.json(400, {
        success: false,
        error: { message: "listing_id is required", code: "INVALID_PARAMETERS" },
      })
    }

    // Get listing from resale_listings
    const listing = $app.findRecordById("resale_listings", listing_id)

    if (!listing) {
      return e.json(404, {
        success: false,
        error: { message: "Listing not found", code: "LISTING_NOT_FOUND" },
      })
    }

    // Verify listing is active
    if (listing.get("status") !== "active") {
      return e.json(400, {
        success: false,
        error: { message: "Listing is not active", code: "LISTING_NOT_ACTIVE" },
      })
    }

    const sellerId = listing.get("seller_id")
    const price = parseFloat(listing.get("price") || "0")
    const animalId = listing.get("animal_id")
    const nftId = listing.get("nft_id")
    const royaltyRecipients = listing.get("royalty_recipients") || []

    // Prevent self-purchase
    if (sellerId === buyer.id) {
      return e.json(400, {
        success: false,
        error: { message: "Cannot purchase your own listing", code: "SELF_PURCHASE" },
      })
    }

    // Check buyer balance
    const buyerWallet = $app.dao().findFirstRecordByFilter("user_wallets", "owner = {:owner}", {
      "@owner": buyer.id,
    })

    if (!buyerWallet) {
      return e.json(400, {
        success: false,
        error: { message: "Buyer wallet not found", code: "BUYER_WALLET_NOT_FOUND" },
      })
    }

    const buyerBalance = parseFloat(buyerWallet.get("usdt_balance") || "0")
    if (buyerBalance < price) {
      return e.json(400, {
        success: false,
        error: {
          message: `Insufficient balance. Required: ${price} USDT, Available: ${buyerBalance} USDT`,
          code: "INSUFFICIENT_BALANCE",
        },
      })
    }

    // Calculate fee breakdown
    const royaltyTotal = price * (ROYALTY_TOTAL_PERCENT / 100)
    const platformFee = price * (PLATFORM_FEE_PERCENT / 100)
    const miscFee = price * (MISC_FEE_PERCENT / 100)
    const sellerAmount = price * (SELLER_PERCENT / 100)

    // Distribute royalties to referral chain (RESALE-02, RESALE-03)
    if (royaltyRecipients.length > 0) {
      distributeRoyalties(royaltyRecipients, price, listing_id, listing)
    }

    // Credit seller 85% (RESALE-04)
    const sellerWallet = $app.dao().findFirstRecordByFilter("user_wallets", "owner = {:owner}", {
      "@owner": sellerId,
    })

    if (sellerWallet) {
      const sellerBalance = parseFloat(sellerWallet.get("usdt_balance") || "0")
      sellerWallet.set("usdt_balance", (sellerBalance + sellerAmount).toString())
      sellerWallet.set(
        "total_earned",
        (parseFloat(sellerWallet.get("total_earned") || "0") + sellerAmount).toString()
      )
      sellerWallet.set("last_transaction_at", new Date().toISOString())
      $app.dao().saveRecord(sellerWallet)
    }

    // Create commission record for the sale
    const commissionCollection = $app.dao().getCollectionByNameOrId("commission_records")
    const purchaseCommission = $app.dao().createRecord(commissionCollection)
    
    purchaseCommission.set("referrer_id", sellerId)
    purchaseCommission.set("referrer_wallet", sellerWallet ? sellerWallet.get("wallet") : "")
    purchaseCommission.set("generation", 0) // Not a referral, direct sale
    purchaseCommission.set("amount", sellerAmount.toString()) // Amount received by seller
    purchaseCommission.set("type", "sale_proceeds") // Different from royalty type
    purchaseCommission.set("nft_id", nftId)
    purchaseCommission.set("distributed_at", new Date().toISOString())
    purchaseCommission.set("related_listing_id", listing_id)
    
    $app.dao().saveRecord(purchaseCommission)

    // Deduct buyer full price
    buyerWallet.set("usdt_balance", (buyerBalance - price).toString())
    buyerWallet.set(
      "total_spent",
      (parseFloat(buyerWallet.get("total_spent") || "0") + price).toString()
    )
    buyerWallet.set("last_transaction_at", new Date().toISOString())
    $app.dao().saveRecord(buyerWallet)

    // Transfer NFT ownership
    const animal = $app.findRecordById("animal_nfts", nftId)
    if (animal) {
      animal.set("owner", buyer.id)
      $app.dao().saveRecord(animal)
    }

    listing.set("status", "sold")
    listing.set("buyer_id", buyer.id)
    listing.set("sold_at", new Date().toISOString())
    $app.dao().saveRecord(listing)

    // Log successful purchase
    console.log(
      `Animal purchased: animal_id=${animalId}, price=${price}, seller=${sellerId}, buyer=${buyer.id}, royalty_total=${royaltyTotal}`
    )

    return e.json(200, {
      success: true,
      data: {
        animal_id: animalId,
        price: price,
        seller_amount: sellerAmount,
        royalty_total: royaltyTotal,
        platform_fee: platformFee,
        misc_fee: miscFee,
        royalty_distribution: {
          G1: price * 0.02,
          G2: price * 0.01,
          G3: price * 0.01,
          G4: price * 0.01,
        },
        new_owner: buyer.id,
        status: "sold",
      },
    })
  } catch (error) {
    console.error("Buy animal error:", error)
    return e.json(500, {
      success: false,
      error: { message: error.message, code: "PURCHASE_FAILED" },
    })
  }
})