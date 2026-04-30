/**
 * 22-listen-nft-events.pb.js - NFT Event Listener Hook
 * 
 * Polls EggNFT and AnimalNFT contracts for Transfer events
 * and tracks NFT ownership changes in PocketBase.
 * 
 * Endpoints:
 * - GET /api/v2/nfts/listen
 * - POST /api/v2/nfts/process-transfers
 * 
 * Auth: Required (user must be authenticated)
 */

/**
 * Process Transfer events and update corresponding NFT records
 */
async function processTransferEvents(contractType) {
    const CONFIG = globalThis.EGGO_CONFIG;
    
    // Get collection name and contract address
    let collectionName, contractAddress;
    if (contractType === "EggNFT") {
        collectionName = "egg_nfts";
        contractAddress = CONFIG.blockchain.contracts.EggNFT;
    } else if (contractType === "AnimalNFT") {
        collectionName = "animal_nfts";
        contractAddress = CONFIG.blockchain.contracts.AnimalNFT;
    } else {
        throw new Error("Invalid contract type: " + contractType);
    }
    
    // Fetch current block number
    const blockResponse = await fetch(CONFIG.blockchain.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
    });
    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    
    // Define the last processed block (fall back to 0 if not set)
    let lastProcessedBlock;
    const syncStateRecords = $app.findRecordsByExpr("sync_state", "process = {:processName}", { processName: "nft_events_" + contractType.toLowerCase() });
    if (syncStateRecords.length > 0) {
        lastProcessedBlock = syncStateRecords[0].getNumber("last_block") || 0;
    } else {
        // Create sync state record if it doesn't exist
        const syncCollection = $app.findCollectionByNameOrId("sync_state");
        const syncRecord = new Record(syncCollection);
        syncRecord.set("process", "nft_events_" + contractType.toLowerCase());
        syncRecord.set("last_block", 0);
        $app.save(syncRecord);
        lastProcessedBlock = 0;
    }
    
    // Determine fromBlock: start from last processed + 1
    const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : Math.max(0, currentBlock - 1000); // Look back 1000 blocks if first time
    
    if (fromBlock > currentBlock) {
        // Nothing to process
        return {
            eventsProcessed: 0,
            lastProcessedBlock: currentBlock
        };
    }
    
    // Fetch Transfer events via RPC
    const transferSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    
    const logsResponse = await fetch(CONFIG.blockchain.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getLogs",
            params: [{
                address: contractAddress,
                fromBlock: fromBlock.toString(16).replace(/^0x/, ''),
                toBlock: currentBlock.toString(16).replace(/^0x/, ''),
                topics: [transferSignature]
            }],
            id: 1
        })
    });
    
    const logsData = await logsResponse.json();
    
    if (logsData.error) {
        throw new Error("RPC error: " + logsData.error.message);
    }
    
    const eventLogs = logsData.result || [];
    let eventsProcessed = 0;
    
    for (const eventLog of eventLogs) {
        try {
            if (eventLog.removed) {
                console.warn("Skipping removed event log:", eventLog.transactionHash);
                continue;
            }
            
            const fromAddress = "0x" + eventLog.topics[1].slice(26);
            const toAddress = "0x" + eventLog.topics[2].slice(26);
            const tokenIdRaw = eventLog.topics[3];
            const tokenId = parseInt(tokenIdRaw, 16);
            const txHash = eventLog.transactionHash;
            
            // Check if there's already a record of this event (duplicate protection)
            const existingTx = $app.findFirstRecordByData(contractType.toLowerCase() + "_nfts", "tx_hash", txHash);
            if (existingTx && existingTx.getNumber("token_id") === tokenId) {
                console.warn("Duplicate event found, skipping:", txHash, "token_id:", tokenId);
                continue;
            }
            
            // Get user owner matching the toAddress
            const userRecord = $app.findFirstRecordByData("users", "wallet", toAddress.toLowerCase());
            if (!userRecord) {
                console.warn("No user found for wallet address:", toAddress);
                continue;
            }
            
            // Check for existing NFT record with the same token_id
            let nftRecord = $app.findFirstRecordByData(collectionName, "token_id", tokenId);
            
            if (nftRecord) {
                // NFT record exists, just update the owner
                nftRecord.set("owner", userRecord.id);
                
                // If moving to a different owner
                if (fromAddress.toLowerCase() !== "0x0000000000000000000000000000000000000000") { // not a mint
                    const fromUser = $app.findFirstRecordByData("users", "wallet", fromAddress.toLowerCase());
                    if (fromUser) {
                        console.log(`Transfer detected: ${contractType} #${tokenId} from ${fromUser.get('email')} to ${userRecord.get('email')}`);
                    }
                } else {
                    console.log(`Mint detected: ${contractType} #${tokenId} to ${userRecord.get('email')}`);
                }
                
                $app.save(nftRecord);
            } else {
                // Create new NFT record based on the transfer event
                const nftCollection = $app.findCollectionByNameOrId(collectionName);
                nftRecord = new Record(nftCollection);
                
                nftRecord.set("token_id", tokenId);
                nftRecord.set("owner", userRecord.id);
                nftRecord.set("tx_hash", txHash);
                nftRecord.set("contract_address", contractAddress.toString().toLowerCase());
                nftRecord.set("minted_at", new Date(parseInt(eventLog.timeStamp, 16) * 1000).toISOString());
                
                // For animals, we can extract species and rarity from the token metadata
                if (contractType === "AnimalNFT") {
                    nftRecord.set("species", "Chicken"); // Default - would be populated from metadata in full implementation
                    nftRecord.set("rarity", "Common"); // Default - would be populated from metadata
                    nftRecord.set("generation", 0); // Default
                } else if (contractType === "EggNFT") {
                    nftRecord.set("food_count", CONFIG.game.initialFoodCount);
                    nftRecord.set("is_hatched", false);
                    nftRecord.set("is_hatching", false);
                    nftRecord.set("rarity_upgrade_count", 0);
                    nftRecord.set("generation", 0);
                }
                
                $app.save(nftRecord);
                
                console.log(`${contractType} minted: token #${tokenId} to ${userRecord.get('email')}`);
            }
            
            eventsProcessed++;
        } catch (error) {
            console.error("Error processing transfer event:", error, "log:", eventLog);
            // Continue with other events even if one fails
        }
    }
    
    // Update sync_state with the last processed block
    const syncStateRecord = $app.findFirstRecordByData("sync_state", "process", "nft_events_" + contractType.toLowerCase());
    if (syncStateRecord) {
        syncStateRecord.set("last_block", currentBlock);
        $app.save(syncStateRecord);
    }
    
    return {
        eventsProcessed: eventsProcessed,
        lastProcessedBlock: currentBlock
    };
}

routerAdd("GET", "/api/v2/nfts/listen", async (e) => {
    try {
        const eggResult = await processTransferEvents("EggNFT");
        const animalResult = await processTransferEvents("AnimalNFT");
        
        e.json(200, {
            success: true,
            data: {
                egg_nfts: {
                    processed: eggResult.eventsProcessed,
                    lastBlock: eggResult.lastProcessedBlock
                },
                animal_nfts: {
                    processed: animalResult.eventsProcessed,
                    lastBlock: animalResult.lastProcessedBlock
                },
                totalProcessed: eggResult.eventsProcessed + animalResult.eventsProcessed,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("NFT event listener error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "NFT_LISTEN_FAILED" }
        });
    }
});

// Manual trigger endpoint for processing transfers
routerAdd("POST", "/api/v2/nfts/process-transfers", async (e) => {
    try {
        e.requireAuth(); // Require authentication
        
        const body = e.parseBody();
        const { contract_types } = body;
        
        let results = {};
        const typesToProcess = contract_types || ["EggNFT", "AnimalNFT"];
        
        for (const contractType of typesToProcess) {
            if (["EggNFT", "AnimalNFT"].includes(contractType)) {
                results[contractType.toLowerCase()] = await processTransferEvents(contractType);
            }
        }
        
        e.json(200, {
            success: true,
            data: results
        });
    } catch (error) {
        console.error("Process NFT transfers error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "PROCESS_TRANSFERS_FAILED" }
        });
    }
});

// Run NFT listening in the background every 60 seconds
(function() {
    const intervalId = setInterval(async () => {
        try {
            const result = await processTransferEvents("EggNFT");
            console.log("Background EggNFT sync:", result);
            
            const animalResult = await processTransferEvents("AnimalNFT");
            console.log("Background AnimalNFT sync:", animalResult);
        } catch (error) {
            console.error("Background NFT sync error:", error);
        }
    }, 60000); // 60 seconds
    
    // Keep reference to interval to allow cleanup if needed
    globalThis.nftEventListenerInterval = intervalId;
    console.log("NFT event listener started: polls every 60s for Transfer events");
})();

console.log("NFT event listener endpoints registered: GET /api/v2/nfts/listen, POST /api/v2/nfts/process-transfers");