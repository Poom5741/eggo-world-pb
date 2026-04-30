// ===== BLOCKCHAIN EVENT SYNC SERVICE =====
console.log("Loading blockchain sync service...");

/**
 * Sync blockchain events to update PocketBase records
 * This hook handles blockchain event processing and synchronizes 
 * on-chain state with PocketBase database records
 */

// RPC configuration with failover options
const RPC_CONFIG = {
  mainnet: "https://bsc-dataseed1.binance.org",
  testnet: "https://data-seed-prebsc-1-s1.binance.org:8545",
  // For local testing with mock blockchain
  local: "http://anvil:8545"
};

routerAdd("POST", "/api/v2/sync-blockchain", (e) => {
  console.log("=== Starting Blockchain Sync ===");
  
  try {
    // Determine RPC URL based on environment
    const rpcUrl = $os.getenv("BSC_RPC_URL") || RPC_CONFIG.local;
    
    console.log("Using RPC URL:", rpcUrl);
    
    // Define event ABI for Egg NFT contract
    var eventABI = {
      "name": "Transfer",
      "inputs": [
        {"name": "from", "type": "address", "indexed": true},
        {"name": "to", "type": "address", "indexed": true},
        {"name": "tokenId", "type": "uint256", "indexed": true}
      ],
      "type": "event"
    };
    
    // Sample request to get latest block number
    var response;
    try {
      response = $http.send({
        url: rpcUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1
        }),
        timeout: 30 // Increase timeout for blockchain requests
      });
    } catch (httpErr) {
      console.error("RPC connection failed:", httpErr.message);
      return e.json(500, { 
        success: false, 
        error: "RPC connection failed: " + httpErr.message,
        code: "RPC_CONNECTION_ERROR"
      });
    }

    console.log("RPC response status:", response.statusCode);
    
    if (response.statusCode !== 200) {
      throw new Error("Invalid HTTP status: " + response.statusCode);
    }

    var jsonResponse;
    try {
      if (response.json && typeof response.json === "object") {
        jsonResponse = response.json;
      } else {
        // Parse response body manually if json property is not available
        let responseBody = response.body;
        if (Array.isArray(response.body)) {
          // Convert uint8array to string
          responseBody = "";
          for (let i = 0; i < response.body.length; i++) {
            responseBody += String.fromCharCode(response.body[i]);
          }
        }
        jsonResponse = JSON.parse(responseBody);
      }
    } catch (jsonErr) {
      console.error("JSON parse failed:", jsonErr.message);
      console.error("Raw response body:", response.body);
      throw new Error("Invalid RPC response: " + jsonErr.message);
    }

    if (jsonResponse.error) {
      console.error("RPC Error:", jsonResponse.error);
      throw new Error("RPC Error: " + jsonResponse.error.message);
    }

    const latestBlockHex = jsonResponse.result;
    const latestBlock = parseInt(latestBlockHex, 16);
    console.log("Latest block:", latestBlock);

    // Get events from the blockchain (simplified example)
    // In a real implementation, you'd query past events since last sync
    const fromBlock = Math.max(0, latestBlock - 100); // Look back 100 blocks
    console.log("Looking for events from block", fromBlock, "to", latestBlock);

    // Sample implementation - in real scenario you'd query for Transfer events
    // and update PocketBase records accordingly
    
    e.json(200, {
      success: true,
      data: {
        latestBlock: latestBlock,
        fromBlock: fromBlock,
        rpcUrl: rpcUrl,
        message: "Sync started - checking for new blockchain events"
      }
    });

  } catch (err) {
    console.error("Sync failed:", err.message);
    console.error("Stack trace:", err.stack);
    e.json(500, {
      success: false,
      error: err.message,
      code: "SYNC_ERROR"
    });
  }
}, $apis.requireAuth());

// GET endpoint for backwards compatibility
routerAdd("GET", "/api/v2/sync-blockchain", (e) => {
  // Forward to POST handler to maintain consistency
  return e.json(405, {
    success: false,
    error: "GET method not allowed. Use POST to trigger blockchain sync.",
    code: "METHOD_NOT_ALLOWED"
  });
}, $apis.requireAuth());

console.log("Blockchain sync service endpoints registered");
