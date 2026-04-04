// ===== CREATE WALLET HOOK =====
// Uses dacc-js wallet service for wallet creation

console.log("Setting up create wallet hook...");

onRecordCreate((e) => {
  console.log("Create wallet hook triggered for user:", e.record.id);

  // Initialize default game fields
  e.record.set("usdt_balance", 0);
  e.record.set("usdt_total_earned", 0);
  e.record.set("total_direct_recruits", 0);
  e.record.set("lifetime_food_items", 0);
  e.record.set("highest_tier_reached", "bronze");

  console.log("Default game fields initialized");

  // Continue with record creation
  e.next();

  // After record is created, call wallet API to create and save wallet
  try {
    // Generate secure password secret key (20 chars)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let passwordSecretkey = "";
    for (let i = 0; i < 20; i++) {
      passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    console.log("Generated password secret key for user:", e.record.id);

    // Get URLs from env
    const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
    // Use internal Docker URL so wallet-api can reach PocketBase
    const pbUrl = "http://eggo-pb:8090";

    // Call wallet API to create wallet and update PB record directly
    const apiUrl = walletApiUrl + "/api/wallet/create-and-save";
    const requestBody = {
      passwordSecretkey: passwordSecretkey,
      publicEncryption: false,
      userId: e.record.id,
      pbUrl: pbUrl
    };

    console.log("Calling wallet-srv to create and save wallet...");
    console.log("Request URL:", apiUrl);

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("Wallet-srv response status:", response.statusCode);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("Wallet-srv returned status " + response.statusCode);
    }

    console.log("Wallet creation request completed");

  } catch (error) {
    console.error("Failed to create wallet:", error);
  }
}, "users");

console.log("Create wallet hook registered");
