// ===== BLOCKCHAIN EVENT SYNC ENDPOINT =====
console.log("Loading blockchain sync endpoint...");

routerAdd("GET", "/api/sync-blockchain", (e) => {
  console.log("=== Blockchain Sync Triggered ===");
  
  try {
    // Use working RPC endpoint
    const rpcUrl = "https://bsc-dataseed1.binance.org";
    
    var response;
    try {
      response = $http.send({
        url: rpcUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}",
        timeout: 10
      });
    } catch (httpErr) {
      console.error("HTTP send failed:", httpErr.message);
      return e.json(500, { 
        success: false, 
        error: "RPC connection failed: " + httpErr.message
      });
    }

    console.log("RPC status:", response.statusCode);
    console.log("RPC response:", response.body.substring(0, 100));
    
    if (response.statusCode !== 200) {
      throw new Error("Invalid HTTP status: " + response.statusCode);
    }

    var jsonResponse;
    try {
      jsonResponse = JSON.parse(response.body);
    } catch (jsonErr) {
      console.error("JSON parse failed:", jsonErr.message);
      console.error("Response was:", response.body);
      throw new Error("Invalid RPC response: " + jsonErr.message);
    }

    if (jsonResponse.error) {
      throw new Error("RPC Error: " + jsonResponse.error.message);
    }

    const latestBlock = parseInt(jsonResponse.result, 16);
    console.log("Latest block:", latestBlock);

    e.json(200, {
      success: true,
      data: {
        latestBlock: latestBlock,
        rpcUrl: rpcUrl
      }
    });

  } catch (err) {
    console.error("Sync failed:", err.message);
    e.json(500, {
      success: false,
      error: err.message
    });
  }
}, $apis.requireAuth());

console.log("Blockchain sync endpoint registered");
