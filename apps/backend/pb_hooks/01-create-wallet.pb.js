// ===== CREATE WALLET HOOK =====
// Uses dacc-js wallet service for wallet creation

console.log("Setting up create wallet hook...");

const WALLET_SRV_URL = process.env.WALLET_SRV_URL || "http://wallet-api:3001";

onRecordCreate((e) => {
  console.log("Create wallet hook triggered for user:", e.record.id);

  try {
    // Generate secure password secret key (20 chars with special chars)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let passwordSecretkey = "";
    for (let i = 0; i < 20; i++) {
      passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    console.log("Generated password secret key for user:", e.record.id);

    // Call wallet-srv to create wallet
    const apiUrl = `${WALLET_SRV_URL}/api/wallet/create`;
    const requestBody = {
      passwordSecretkey: passwordSecretkey,
      publicEncryption: false
    };

    console.log("Calling wallet-srv to create wallet...");
    console.log("Request URL:", apiUrl);

    const response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("Wallet-srv response status:", response.statusCode);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}: ${response.body}`);
    }

    // Convert byte array to string if needed
    let responseBody = response.body;
    if (typeof response.body === 'object' && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body);
    }

    if (!responseBody || responseBody.trim() === "") {
      throw new Error("Wallet-srv returned empty response body");
    }

    let responseData;
    try {
      responseData = JSON.parse(responseBody);
    } catch (parseError) {
      throw new Error(`Failed to parse wallet-srv response: ${responseBody}`);
    }

    console.log("Wallet-srv parsed response:", responseData);

    if (!responseData.success) {
      throw new Error(`Wallet creation failed: ${responseData.error?.message || 'Unknown error'}`);
    }

    // Set NEW field names (matching reference implementation)
    e.record.set("wallet", responseData.data.address);
    e.record.set("pin", passwordSecretkey);  // NEW: pin field
    e.record.set("daccPublickey", responseData.data.daccPublickey);  // NEW: daccPublickey

    // Initialize EIP-7702 fields (NEW)
    e.record.set("eip7702_enabled", false);
    e.record.set("eip7702_hash", "");

    // Initialize game-related fields
    e.record.set("usdt_balance", 0);
    e.record.set("usdt_total_earned", 0);
    e.record.set("total_direct_recruits", 0);
    e.record.set("lifetime_food_items", 0);
    e.record.set("highest_tier_reached", "bronze");

    console.log("Wallet data saved to user record");

  } catch (error) {
    console.error("Failed to create wallet:", error);
    throw new Error(`Wallet creation failed: ${error.message}`);
  }

  e.next();
}, "users");

console.log("Create wallet hook registered");
console.log("Wallet-srv URL:", WALLET_SRV_URL);
