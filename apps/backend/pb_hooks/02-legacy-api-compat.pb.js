// ===== LEGACY API COMPATIBILITY LAYER =====
// Maintains backward compatibility with existing frontend

console.log("Setting up legacy API compatibility layer...");

// Use EGGO_CONFIG.wallet.srvUrl instead of declaring WALLET_SRV_URL locally

// Legacy: /api/wallet/create
routerAdd("POST", "/api/wallet/create", (e) => {
  console.log("Legacy wallet create endpoint called");

  try {
    // Parse request
    let requestBody;
    try {
      const bodyStr = toString(e.request.body);
      requestBody = JSON.parse(bodyStr);
    } catch (parseError) {
      throw new Error("Invalid JSON in request body");
    }

    // Generate random password if not provided
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let passwordSecretkey = requestBody.password;
    
    if (!passwordSecretkey) {
      passwordSecretkey = "";
      for (let i = 0; i < 20; i++) {
        passwordSecretkey += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }

    // Forward to wallet-srv
    const response = $http.send({
      url: `${EGGO_CONFIG.wallet.srvUrl}/api/v1/wallet/create`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: passwordSecretkey,
        publicEncryption: false
      })
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Wallet-srv returned status ${response.statusCode}`);
    }

    let responseBody = response.body;
    if (typeof response.body === 'object' && response.body.length !== undefined) {
      responseBody = String.fromCharCode.apply(null, response.body);
    }

    const responseData = JSON.parse(responseBody);

    if (!responseData.success) {
      throw new Error(responseData.error?.message || "Wallet creation failed");
    }

    // Transform to legacy response format
    return e.json(200, {
      success: true,
      data: {
        address: responseData.data.address,
        publicKey: responseData.data.daccPublickey.substring(0, 42),
        wallet_version: 1
      }
    });

  } catch (error) {
    console.error("Legacy wallet creation error:", error);
    return e.json(400, {
      success: false,
      error: {
        message: error.message,
        code: "WALLET_CREATION_FAILED"
      }
    });
  }
});

console.log("Legacy API compatibility layer registered");
