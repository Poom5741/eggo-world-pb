/// <reference path="../pb_data/types.d.ts" />

/**
 * @file 21-sync-events.pb.js
 * Blockchain event sync hook - polls blocks every 30 seconds
 */

// --- Configuration ---
const EGGO_CONFIG = require("./00-config.pb.js");

const rpcUrl = EGGO_CONFIG.blockchain.rpcUrl;
const eggNftAddress = EGGO_CONFIG.blockchain.contracts.eggNft?.toLowerCase();
const foodNftAddress = EGGO_CONFIG.blockchain.contracts.foodNft?.toLowerCase();
const animalNftAddress = EGGO_CONFIG.blockchain.contracts.animalNft?.toLowerCase();
const commissionAddress = EGGO_CONFIG.blockchain.contracts.commissionDistribution?.toLowerCase();

console.log("🔗 Blockchain Sync v2.1");
console.log(`   RPC: ${rpcUrl}`);
console.log(`   Egg NFT: ${eggNftAddress || "not configured"}`);
console.log(`   Food NFT: ${foodNftAddress || "not configured"}`);
console.log(`   Animal NFT: ${animalNftAddress || "not configured"}`);
console.log(`   Commission: ${commissionAddress || "not configured"}`);

// --- Sync State Management ---
function getSyncState() {
  try {
    const states = $app.findRecordsByFilter("sync_state", 'id = "config"', "", 1, 0);
    if (states.length > 0) {
      return states[0];
    }
    
    // Auto-create if missing
    console.log("⚠️ sync_state config not found, creating...");
    const newRecord = $app.newRecord("sync_state");
    newRecord.set("id", "config");
    newRecord.set("lastProcessedBlock", 0);
    newRecord.set("status", "syncing");
    $app.save(newRecord);
    console.log("✅ Created sync_state config");
    return newRecord;
    
  } catch (err) {
    console.error("❌ Failed to get/create sync state:", err.message);
    return null;
  }
}

function updateSyncState(blockNumber, status, errorMessage = null) {
  try {
    const stateRecord = getSyncState();
    if (!stateRecord) return false;
    
    stateRecord.set("lastProcessedBlock", blockNumber);
    stateRecord.set("lastSyncTimestamp", new Date().toISOString());
    stateRecord.set("status", status);
    if (errorMessage) {
      stateRecord.set("last_error", errorMessage);
      stateRecord.set("failed_block", blockNumber);
    }
    $app.save(stateRecord);
    return true;
  } catch (err) {
    console.error("❌ Failed to update sync state:", err.message);
    return false;
  }
}

// --- RPC Helper ---
function getBlockLogs(fromBlock, toBlock) {
  const payload = {
    jsonrpc: "2.0",
    method: "eth_getLogs",
    params: [{
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + toBlock.toString(16),
      address: [eggNftAddress, foodNftAddress, animalNftAddress, commissionAddress].filter(Boolean),
      topics: []
    }],
    id: Date.now()
  };

  try {
    const response = $http.send({
      url: rpcUrl,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 10000
    });

    if (response.statusCode !== 200) {
      throw new Error(`RPC HTTP ${response.statusCode}`);
    }

    const json = JSON.parse(response.body);
    if (json.error) {
      throw new Error(`RPC Error: ${json.error.message}`);
    }

    return json.result || [];
  } catch (err) {
    console.error("❌ RPC call failed:", err.message);
    return [];
  }
}

// --- Event Handlers ---
function handleEggMinted(log) {
  // Egg minted logic
}

function handleFoodMinted(log) {
  // Food minted logic
}

function handleAnimalMinted(log) {
  // Animal minted logic  
}

function handleEggHatched(log) {
  // Egg hatched logic
}

function handleCommissionDistributed(log) {
  // Commission distribution logic
}

// --- Main Sync Loop ---
function syncBlockchain() {
  const syncState = getSyncState();
  if (!syncState) return;

  let lastBlock = syncState.get("lastProcessedBlock") || 0;
  const currentBlock = Math.floor(Date.now() / 1000); // Simplified - should get from RPC
  
  console.log(`🔄 Syncing blocks ${lastBlock} → ${currentBlock}`);

  const logs = getBlockLogs(lastBlock + 1, currentBlock);
  
  for (const log of logs) {
    try {
      if (log.address.toLowerCase() === eggNftAddress) {
        handleEggMinted(log);
      } else if (log.address.toLowerCase() === foodNftAddress) {
        handleFoodMinted(log);
      } else if (log.address.toLowerCase() === animalNftAddress) {
        handleAnimalMinted(log);
      } else if (log.address.toLowerCase() === commissionAddress) {
        handleCommissionDistributed(log);
      }
    } catch (err) {
      console.error(`❌ Event handler failed: ${err.message}`);
    }
  }

  updateSyncState(currentBlock, "syncing");
}

// --- Register on App Bootstrap ---
console.log("📦 Registering blockchain sync...");

setTimeout(() => {
  console.log("🚀 Starting blockchain sync loop (30s interval)");
  syncBlockchain(); // Initial sync
  
  setInterval(() => {
    syncBlockchain();
  }, 30000);
}, 5000);
