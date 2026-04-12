// ===== BLOCKCHAIN EVENT SYNC ENDPOINT =====
console.log("Loading blockchain sync endpoint...");

routerAdd("GET", "/api/sync-blockchain", (e) => {
  console.log("=== Blockchain Sync Triggered ===");
  
  try {
    var response;
    try {
      response = $http.send({
        url: "https://rpc.0xl3.com",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}"
      });
    } catch (httpErr) {
      console.error("HTTP send failed:", httpErr.message);
      return e.json(500, { 
        success: false, 
        error: "RPC connection failed: " + httpErr.message 
      });
    }
    
    console.log("RPC status:", response.statusCode);
    
    if (response.statusCode !== 200) {
      return e.json(500, { 
        success: false, 
        error: "RPC failed: " + response.statusCode 
      });
    }
    
    // Convert byte array to string
    var responseBody = "";
    if (Array.isArray(response.body)) {
      for (var i = 0; i < response.body.length; i++) {
        responseBody += String.fromCharCode(response.body[i]);
      }
    } else {
      responseBody = response.body;
    }
    
    console.log("RPC response:", responseBody);
    
    var result;
    try {
      result = JSON.parse(responseBody);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr.message);
      return e.json(500, { 
        success: false, 
        error: "Invalid RPC response: " + parseErr.message 
      });
    }
    
    if (!result.result) {
      console.error("No result in RPC response:", result);
      return e.json(500, { 
        success: false, 
        error: "Invalid RPC response structure" 
      });
    }
    
    const currentBlock = parseInt(result.result, 16);
    console.log("Current block:", currentBlock);
    
    var lastBlock = 0;
    try {
      var states = $app.findRecordsByFilter("sync_state", 'id = "config"', "", 1, 0);
      if (states.length > 0) {
        lastBlock = states[0].get("lastProcessedBlock");
      }
    } catch (err) {
      console.log("No sync state");
    }
    
    var synced = 0;
    while (lastBlock < currentBlock && synced < 100) {
      lastBlock = lastBlock + 1;
      synced = synced + 1;
      
      try {
        var stateRecords = $app.findRecordsByFilter("sync_state", 'id = "config"', "", 1, 0);
        var stateRecord;
        
        if (stateRecords.length === 0) {
          stateRecord = $app.newRecord("sync_state");
          stateRecord.set("id", "config");
        } else {
          stateRecord = stateRecords[0];
        }
        
        stateRecord.set("lastProcessedBlock", lastBlock);
        stateRecord.set("status", "syncing");
        stateRecord.set("lastSyncTimestamp", new Date().toISOString());
        $app.save(stateRecord);
      } catch (err) {
        console.log("State error:", err.message);
      }
    }
    
    console.log("Synced", synced, "blocks");
    
    return e.json(200, {
      success: true,
      data: {
        currentBlock: currentBlock,
        lastProcessed: lastBlock,
        blocksSynced: synced
      }
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return e.json(500, {
      success: false,
      error: error.message
    });
  }
});

console.log("Blockchain sync endpoint registered");
