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
    var passwordRandom = e.record.getString('password');
    var requestBody = {
      passwordSecretkey: passwordRandom,
      publicEncryption: false
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

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("Wallet-api returned status " + response.statusCode);
    }

    // In PocketBase JSVM, $http.send() with JSON response auto-parses into response.json
    // response.body may be undefined for JSON content-type responses
    var responseData;
    if (response.json && typeof response.json === "object") {
      responseData = response.json;
    } else if (response.body) {
      // Fallback: parse body if it's a string or byte array
      var responseBody = response.body;
      if (Array.isArray(response.body)) {
        responseBody = "";
        for (var i = 0; i < response.body.length; i++) {
          responseBody += String.fromCharCode(response.body[i]);
        }
      }
      try {
        responseData = JSON.parse(responseBody);
      } catch (parseError) {
        throw new Error("Failed to parse wallet-api response: " + responseBody);
      }
    } else {
      throw new Error("Wallet-api returned empty response");
    }

    if (!responseData.success) {
      throw new Error("Wallet creation failed: " + (responseData.error && responseData.error.message ? responseData.error.message : "Unknown error"));
    }

    var address = responseData.data.address;

    console.log("Wallet created successfully:", address);

    // Set wallet fields on record BEFORE e.next() so they are committed with the record
    // Field names match the dacc-js schema: wallet, daccPublickey, pin
    var daccPublickey = responseData.data.daccPublickey || address;
    e.record.set("wallet", address);
    e.record.set("daccPublickey", daccPublickey);
    e.record.set("pin", passwordRandom);

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
