// ===== CREATE WALLET HOOK =====
// Creates EVM wallet BEFORE committing user record to DB.
// This ensures wallet is always set on the user at creation time.

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

  // Call wallet API BEFORE e.next() so wallet is set on record at commit time
  try {
    var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
    var apiUrl = walletApiUrl + "/api/wallet/create";
    var requestBody = {
      userId: e.record.id
    };

    console.log("Calling wallet-api to create wallet...");
    console.log("Request URL:", apiUrl);

    var response = $http.send({
      url: apiUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("Wallet-api response status:", response.statusCode);
    console.log("Response body type:", typeof response.body);
    console.log("Response json type:", typeof response.json);
    console.log("Response body is null:", response.body === null);
    console.log("Response body is undefined:", response.body === undefined);
    if (response.body !== null && response.body !== undefined) {
      console.log("Response body constructor:", response.body.constructor && response.body.constructor.name);
      console.log("Response body length:", response.body.length);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("Wallet-api returned status " + response.statusCode);
    }

    // Parse response body (may be byte array in PocketBase JSVM)
    var responseBody = response.body;
    if (Array.isArray(response.body)) {
      responseBody = "";
      for (var i = 0; i < response.body.length; i++) {
        responseBody += String.fromCharCode(response.body[i]);
      }
    } else if (typeof response.body === "object" && response.body !== null && typeof response.body.length !== "undefined") {
      responseBody = "";
      for (var j = 0; j < response.body.length; j++) {
        responseBody += String.fromCharCode(response.body[j]);
      }
    }

    if (!responseBody || responseBody.trim() === "") {
      throw new Error("Wallet-api returned empty response body");
    }

    var responseData;
    try {
      responseData = JSON.parse(responseBody);
    } catch (parseError) {
      throw new Error("Failed to parse wallet-api response: " + responseBody);
    }

    if (!responseData.success) {
      throw new Error("Wallet creation failed: " + (responseData.error && responseData.error.message ? responseData.error.message : "Unknown error"));
    }

    var address = responseData.data.address;
    var publicKey = responseData.data.publicKey || "";

    console.log("Wallet created successfully:", address);

    // Set wallet fields on record BEFORE e.next() so they are committed with the record
    e.record.set("wallet", address);
    e.record.set("daccPublickey", publicKey);

    console.log("Wallet fields set on record");

  } catch (error) {
    console.error("Failed to create wallet:", error);
    // Throw to prevent user record creation without a wallet
    throw new Error("Wallet creation failed, aborting user creation: " + error.message);
  }

  // Commit the record WITH wallet data
  e.next();
}, "users");

console.log("Create wallet hook registered");
