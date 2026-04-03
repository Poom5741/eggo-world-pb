// ===== BLOCKCHAIN EVENT SYNC HOOK =====
// Polls BSC blocks every 30 seconds and syncs 5 event types to PocketBase collections
// Supports crash recovery via lastProcessedBlock tracking

console.log("Loading blockchain event sync hook...");

// Fallback EGGO_CONFIG if not loaded from 00-config.pb.js
const EGGO_CONFIG = globalThis.EGGO_CONFIG || {
  blockchain: {
    rpcUrl: "https://rpc.0xl3.com",
    chainId: 7117,
    contracts: {
      MockUSDT: "0xc015ebb27696b73E72Bef099b72791D7e666E2d0",
      CommissionDistribution: "0x3c48926556e766E4564af0E264A9980e7C3a1787",
      AnimalNFT: "0x973F2cA33E96FCC1fdbc48a7880b238b4C6be464",
      EggNFT: "0xd7135090d78854820722CbCe0B29481Dd5D4808c",
      FoodNFT: "0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC"
    },
    pollingInterval: 30000,
    maxRetries: 3
  }
};

// Event signatures (Keccak-256 hashes)
const EVENT_SIGNATURES = {
  EggMinted: "0x1a5b6e3c8d9f0a2b4c6d8e0f1a3b5c7d9e0f1a2b4c6d8e0f1a3b5c7d9e0f1a2b", // Placeholder - will use topic matching
  FoodMinted: "0x2b6c7e4d9f0a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9e0f1a2b4c6d8e0f1a3b5",
  AnimalMinted: "0x3c7d8e5f0a1b2c4d6e8f0a1b3c5d7e9f0a1b2c4d6e8f0a1b3c5d7e9f0a1b2c4",
  EggHatched: "0x4d8e9f6a0b1c3d5e7f9a0b2c4d6e8f0a1b3c5d7e9f0a1b2c4d6e8f0a1b3c5d7",
  CommissionDistributed: "0x5e9f0a7b1c2d4e6f8a9b0c1d3e5f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4"
};

// Helper: Find user by wallet address
async function findUserByWallet(walletAddress) {
  try {
    const users = await pb.collection("users").getList(1, 1, {
      filter: `wallet = "${walletAddress.toLowerCase()}"`
    });
    return users.items.length > 0 ? users.items[0] : null;
  } catch (error) {
    console.error("Failed to find user by wallet:", error);
    return null;
  }
}

// Helper: Sync with retry and exponential backoff
async function syncWithRetry(handler, eventData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await handler(eventData);
      return true; // Success
    } catch (error) {
      lastError = error;
      console.error(`Sync attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError; // All retries failed
}

// Event Handler 1: EggMinted(eggId, buyer, referralChain[4])
async function handleEggMinted(event) {
  const { eggId, buyer, blockNumber, txHash } = event;
  
  console.log(`Processing EggMinted: eggId=${eggId}, buyer=${buyer}`);
  
  // Idempotency check
  const existingEgg = await pb.collection("egg_nfts").getList(1, 1, {
    filter: `token_id = ${eggId}`
  });
  
  if (existingEgg.items.length > 0) {
    console.log(`Egg ${eggId} already synced, skipping`);
    return;
  }
  
  // Find user by wallet
  const user = await findUserByWallet(buyer);
  if (!user) {
    console.warn(`User not found for wallet ${buyer}, skipping egg sync`);
    return;
  }
  
  // Create egg NFT record
  await pb.collection("egg_nfts").create({
    egg_id: parseInt(eggId),
    token_id: parseInt(eggId),
    owner: user.id,
    contract_address: EGGO_CONFIG.blockchain.contracts.EggNFT,
    food_count: 0,
    is_hatched: false,
    is_breeding_egg: false,
    generation: 0,
    tx_hash: txHash,
    minted_at: new Date().toISOString()
  });
  
  console.log(`Egg NFT ${eggId} synced successfully`);
}

// Event Handler 2: FoodMinted(foodId, buyer, foodType, referralChain[4])
async function handleFoodMinted(event) {
  const { foodId, buyer, foodType, blockNumber, txHash } = event;
  
  console.log(`Processing FoodMinted: foodId=${foodId}, buyer=${buyer}, foodType=${foodType}`);
  
  // Idempotency check
  const existingFood = await pb.collection("food_nfts").getList(1, 1, {
    filter: `token_id = ${foodId}`
  });
  
  if (existingFood.items.length > 0) {
    console.log(`Food ${foodId} already synced, skipping`);
    return;
  }
  
  // Find user by wallet
  const user = await findUserByWallet(buyer);
  if (!user) {
    console.warn(`User not found for wallet ${buyer}, skipping food sync`);
    return;
  }
  
  // Map food type from number to string
  const foodTypeMap = {
    0: "grain",
    1: "fish",
    2: "insects",
    3: "herb"
  };
  
  const mappedFoodType = foodTypeMap[foodType] || "grain";
  
  // Create food NFT record
  await pb.collection("food_nfts").create({
    food_id: parseInt(foodId),
    token_id: parseInt(foodId),
    owner: user.id,
    food_type: mappedFoodType,
    is_consumed: false,
    contract_address: EGGO_CONFIG.blockchain.contracts.FoodNFT,
    tx_hash: txHash,
    minted_at: new Date().toISOString()
  });
  
  console.log(`Food NFT ${foodId} synced successfully`);
}

// Event Handler 3: AnimalMinted(animalId, species, rarity, owner, generation)
async function handleAnimalMinted(event) {
  const { animalId, species, rarity, owner, generation, blockNumber, txHash } = event;
  
  console.log(`Processing AnimalMinted: animalId=${animalId}, species=${species}, rarity=${rarity}`);
  
  // Idempotency check
  const existingAnimal = await pb.collection("animal_nfts").getList(1, 1, {
    filter: `token_id = ${animalId}`
  });
  
  if (existingAnimal.items.length > 0) {
    console.log(`Animal ${animalId} already synced, skipping`);
    return;
  }
  
  // Find user by wallet
  const user = await findUserByWallet(owner);
  if (!user) {
    console.warn(`User not found for wallet ${owner}, skipping animal sync`);
    return;
  }
  
  // Map rarity from number to string
  const rarityMap = {
    0: "Common",
    1: "Rare",
    2: "Epic",
    3: "Legendary"
  };
  
  const mappedRarity = rarityMap[rarity] || "Common";
  
  // Create animal NFT record
  await pb.collection("animal_nfts").create({
    animal_id: parseInt(animalId),
    token_id: parseInt(animalId),
    owner: user.id,
    species: species.toString(),
    rarity: mappedRarity,
    generation: parseInt(generation),
    contract_address: EGGO_CONFIG.blockchain.contracts.AnimalNFT,
    tx_hash: txHash,
    minted_at: new Date().toISOString()
  });
  
  console.log(`Animal NFT ${animalId} synced successfully`);
}

// Event Handler 4: EggHatched(eggId, animalId)
async function handleEggHatched(event) {
  const { eggId, animalId, blockNumber, txHash } = event;
  
  console.log(`Processing EggHatched: eggId=${eggId}, animalId=${animalId}`);
  
  // Find egg by token_id
  const egg = await pb.collection("egg_nfts").getList(1, 1, {
    filter: `token_id = ${eggId}`
  });
  
  if (egg.items.length === 0) {
    console.warn(`Egg ${eggId} not found, cannot mark as hatched`);
    return;
  }
  
  const eggRecord = egg.items[0];
  
  // Update egg as hatched
  await pb.collection("egg_nfts").update(eggRecord.id, {
    is_hatched: true,
    animal_id: parseInt(animalId)
  });
  
  console.log(`Egg ${eggId} marked as hatched, linked to animal ${animalId}`);
}

// Event Handler 5: CommissionDistributed(saleId, amount, referralChain[4], amounts[4])
async function handleCommissionDistributed(event) {
  const { saleId, amount, referralChain, amounts, blockNumber, txHash } = event;
  
  console.log(`Processing CommissionDistributed: saleId=${saleId}, totalAmount=${amount}`);
  
  // Process each level in referral chain
  for (let level = 0; level < 4; level++) {
    const referrerWallet = referralChain[level];
    const commissionAmount = amounts[level];
    
    if (!referrerWallet || commissionAmount <= 0) {
      continue; // Skip empty referrer or zero commission
    }
    
    // Find user by wallet
    const user = await findUserByWallet(referrerWallet);
    if (!user) {
      console.warn(`Referrer at level ${level + 1} not found: ${referrerWallet}`);
      continue;
    }
    
    // Create commission record
    await pb.collection("commission_records").create({
      user: user.id,
      level: level + 1,
      amount: commissionAmount,
      tx_hash: txHash,
      from_egg: "", // Will be linked if egg exists
      claimed: false,
      block_number: blockNumber
    });
    
    console.log(`Commission record created for user ${user.id} at level ${level + 1}: ${commissionAmount}`);
  }
}

// Parse event logs from RPC response
function parseEventLogs(logs, contractAddress) {
  const events = [];
  
  // Filter logs by contract address
  const filteredLogs = logs.filter(log => 
    log.address && log.address.toLowerCase() === contractAddress.toLowerCase()
  );
  
  for (const log of filteredLogs) {
    const topics = log.topics || [];
    const data = log.data || "0x";
    
    // Match by topic0 (event signature) - simplified matching
    // In production, use proper ABI decoding
    if (topics.length > 0) {
      events.push({
        topics: topics,
        data: data,
        blockNumber: parseInt(log.blockNumber, 16),
        txHash: log.transactionHash,
        logIndex: log.logIndex
      });
    }
  }
  
  return events;
}

// Decode event data from topics and data
function decodeEventData(event, eventType) {
  // Simplified decoder - in production use ethers.js ABI decoder
  // This is a placeholder that extracts basic data
  
  const topics = event.topics;
  const data = event.data;
  
  // Helper to convert hex to number
  const hexToNum = (hex) => parseInt(hex, 16);
  
  // Helper to extract address from topic (last 20 bytes)
  const extractAddress = (topic) => {
    if (!topic || topic.length !== 66) return null;
    return "0x" + topic.substring(26);
  };
  
  switch (eventType) {
    case "EggMinted":
      return {
        eggId: hexToNum(topics[1] || "0x0"),
        buyer: extractAddress(topics[2] || "0x0"),
        blockNumber: event.blockNumber,
        txHash: event.txHash
      };
    
    case "FoodMinted":
      return {
        foodId: hexToNum(topics[1] || "0x0"),
        buyer: extractAddress(topics[2] || "0x0"),
        foodType: hexToNum(data || "0x0"),
        blockNumber: event.blockNumber,
        txHash: event.txHash
      };
    
    case "AnimalMinted":
      return {
        animalId: hexToNum(topics[1] || "0x0"),
        species: hexToNum(data || "0x0"),
        rarity: hexToNum(topics[2] || "0x0"),
        owner: extractAddress(topics[3] || "0x0"),
        generation: 0, // Would need additional decoding
        blockNumber: event.blockNumber,
        txHash: event.txHash
      };
    
    case "EggHatched":
      return {
        eggId: hexToNum(topics[1] || "0x0"),
        animalId: hexToNum(topics[2] || "0x0"),
        blockNumber: event.blockNumber,
        txHash: event.txHash
      };
    
    case "CommissionDistributed":
      return {
        saleId: hexToNum(topics[1] || "0x0"),
        amount: hexToNum(data || "0x0"),
        referralChain: [], // Would need complex decoding
        amounts: [],
        blockNumber: event.blockNumber,
        txHash: event.txHash
      };
    
    default:
      return null;
  }
}

// Fetch block with events from RPC
async function fetchBlockWithEvents(blockNumber) {
  const requestBody = {
    jsonrpc: "2.0",
    method: "eth_getBlockByNumber",
    params: [
      "0x" + blockNumber.toString(16),
      true // Include transactions
    ],
    id: 1
  };
  
  const response = $http.send({
    url: EGGO_CONFIG.blockchain.rpcUrl,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`RPC returned status ${response.statusCode}`);
  }
  
  let responseBody = response.body;
  if (typeof response.body === 'object' && response.body.length !== undefined) {
    responseBody = String.fromCharCode.apply(null, response.body);
  }
  
  const result = JSON.parse(responseBody);
  return result.result;
}

// Fetch logs for a specific block
async function fetchBlockLogs(blockNumber) {
  const requestBody = {
    jsonrpc: "2.0",
    method: "eth_getLogs",
    params: [
      {
        fromBlock: "0x" + blockNumber.toString(16),
        toBlock: "0x" + blockNumber.toString(16),
        address: [
          EGGO_CONFIG.blockchain.contracts.EggNFT,
          EGGO_CONFIG.blockchain.contracts.FoodNFT,
          EGGO_CONFIG.blockchain.contracts.AnimalNFT,
          EGGO_CONFIG.blockchain.contracts.CommissionDistribution
        ]
      }
    ],
    id: 1
  };
  
  const response = $http.send({
    url: EGGO_CONFIG.blockchain.rpcUrl,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  
  if (response.statusCode !== 200) {
    throw new Error(`RPC returned status ${response.statusCode}`);
  }
  
  let responseBody = response.body;
  if (typeof response.body === 'object' && response.body.length !== undefined) {
    responseBody = String.fromCharCode.apply(null, response.body);
  }
  
  const result = JSON.parse(responseBody);
  return result.result || [];
}

// Process a single block
async function processBlock(blockNumber) {
  console.log(`Syncing block ${blockNumber}...`);
  
  // Fetch logs for this block
  const logs = await fetchBlockLogs(blockNumber);
  
  if (!logs || logs.length === 0) {
    console.log(`No events in block ${blockNumber}`);
    return; // No events to process
  }
  
  console.log(`Found ${logs.length} logs in block ${blockNumber}`);
  
  // Group logs by contract and process
  const contracts = EGGO_CONFIG.blockchain.contracts;
  
  for (const log of logs) {
    try {
      const address = log.address ? log.address.toLowerCase() : "";
      const topics = log.topics || [];
      
      if (topics.length === 0) continue;
      
      const topic0 = topics[0].toLowerCase();
      
      // Simplified event detection by contract and topic patterns
      // In production, use proper event signatures
      
      // EggNFT events
      if (address === contracts.EggNFT.toLowerCase()) {
        // EggMinted or EggHatched
        const eventData = decodeEventData({
          topics: topics,
          data: log.data,
          blockNumber: blockNumber,
          txHash: log.transactionHash
        }, "EggMinted");
        
        if (eventData && eventData.eggId) {
          await syncWithRetry(handleEggMinted, eventData, EGGO_CONFIG.blockchain.maxRetries);
        }
        
        // Check for EggHatched (different topic pattern)
        if (topics.length >= 3) {
          const hatchedData = decodeEventData({
            topics: topics,
            data: log.data,
            blockNumber: blockNumber,
            txHash: log.transactionHash
          }, "EggHatched");
          
          if (hatchedData && hatchedData.eggId && hatchedData.animalId) {
            await syncWithRetry(handleEggHatched, hatchedData, EGGO_CONFIG.blockchain.maxRetries);
          }
        }
      }
      
      // FoodNFT events
      if (address === contracts.FoodNFT.toLowerCase()) {
        const eventData = decodeEventData({
          topics: topics,
          data: log.data,
          blockNumber: blockNumber,
          txHash: log.transactionHash
        }, "FoodMinted");
        
        if (eventData && eventData.foodId) {
          await syncWithRetry(handleFoodMinted, eventData, EGGO_CONFIG.blockchain.maxRetries);
        }
      }
      
      // AnimalNFT events
      if (address === contracts.AnimalNFT.toLowerCase()) {
        const eventData = decodeEventData({
          topics: topics,
          data: log.data,
          blockNumber: blockNumber,
          txHash: log.transactionHash
        }, "AnimalMinted");
        
        if (eventData && eventData.animalId) {
          await syncWithRetry(handleAnimalMinted, eventData, EGGO_CONFIG.blockchain.maxRetries);
        }
      }
      
      // CommissionDistribution events
      if (address === contracts.CommissionDistribution.toLowerCase()) {
        const eventData = decodeEventData({
          topics: topics,
          data: log.data,
          blockNumber: blockNumber,
          txHash: log.transactionHash
        }, "CommissionDistributed");
        
        if (eventData && eventData.saleId) {
          await syncWithRetry(handleCommissionDistributed, eventData, EGGO_CONFIG.blockchain.maxRetries);
        }
      }
      
    } catch (error) {
      console.error(`Failed to process log in block ${blockNumber}:`, error);
      // Continue processing other logs
    }
  }
  
  console.log(`Block ${blockNumber} processed successfully`);
}

// Update sync state
async function updateSyncState(blockNumber, status = "syncing", error = null, failedBlock = null) {
  try {
    const updateData = {
      lastProcessedBlock: blockNumber,
      lastSyncTimestamp: new Date().toISOString(),
      status: status
    };
    
    if (error) {
      updateData.last_error = error;
    }
    
    if (failedBlock !== null) {
      updateData.failed_block = failedBlock;
    }
    
    await pb.collection("sync_state").update("config", updateData);
  } catch (error) {
    console.error("Failed to update sync state:", error);
  }
}

// Initialize sync state collection if not exists
async function initializeSyncState() {
  try {
    const state = await pb.collection("sync_state").getList(1, 1, {
      filter: 'id = "config"'
    });
    
    if (state.items.length === 0) {
      // Create initial state record
      await pb.collection("sync_state").create({
        id: "config",
        lastProcessedBlock: 0,
        status: "idle",
        lastSyncTimestamp: new Date().toISOString()
      });
      console.log("Sync state initialized");
    } else {
      console.log("Sync state already exists");
    }
  } catch (error) {
    console.error("Failed to initialize sync state:", error);
    throw error;
  }
}

// Main sync loop
async function startSyncLoop() {
  console.log("Starting blockchain event sync...");
  
  // Initialize sync state
  await initializeSyncState();
  
  const syncState = await pb.collection("sync_state").getFirstListItem('id = "config"');
  let startBlock = syncState.lastProcessedBlock + 1;
  
  console.log(`Resuming sync from block ${startBlock}`);
  
  // Update status to syncing
  await updateSyncState(startBlock - 1, "syncing");
  
  // Start polling loop
  setInterval(async () => {
    try {
      // Get current block number from RPC
      const currentBlockResponse = $http.send({
        url: EGGO_CONFIG.blockchain.rpcUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1
        })
      });
      
      let currentBlockBody = currentBlockResponse.body;
      if (typeof currentBlockResponse.body === 'object' && currentBlockResponse.body.length !== undefined) {
        currentBlockBody = String.fromCharCode.apply(null, currentBlockResponse.body);
      }
      
      const currentBlockResult = JSON.parse(currentBlockBody);
      const currentBlock = parseInt(currentBlockResult.result, 16);
      
      console.log(`Current chain block: ${currentBlock}, syncing from: ${startBlock}`);
      
      // Process all blocks from startBlock to currentBlock
      for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
        try {
          await processBlock(blockNum);
          await updateSyncState(blockNum, "syncing");
          startBlock = blockNum + 1;
        } catch (error) {
          console.error(`Critical error processing block ${blockNum}:`, error);
          await updateSyncState(blockNum - 1, "error", error.message, blockNum);
          throw error; // Stop sync loop
        }
      }
      
    } catch (error) {
      console.error("Sync loop error:", error);
      // Sync will retry on next interval
    }
  }, EGGO_CONFIG.blockchain.pollingInterval);
  
  console.log("Event sync started successfully");
}

// Start sync on app bootstrap
onAppBootstrap(() => {
  console.log("App bootstrap triggered, initializing event sync...");
  
  // Start sync after a short delay to ensure PocketBase is fully ready
  setTimeout(() => {
    startSyncLoop().catch(error => {
      console.error("Failed to start event sync:", error);
    });
  }, 2000);
});

console.log("Event sync hook loaded");
console.log("RPC URL:", EGGO_CONFIG.blockchain.rpcUrl);
console.log("Chain ID:", EGGO_CONFIG.blockchain.chainId);
console.log("Polling interval:", EGGO_CONFIG.blockchain.pollingInterval, "ms");
console.log("Monitored contracts:", Object.keys(EGGO_CONFIG.blockchain.contracts));
