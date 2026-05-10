async function checkReorg(depositRecord) {
  const blockNumber = Math.floor(depositRecord.getNumber("block_number"))
  try {
    const blockData = await rpcCallWithRetry("eth_getBlockByNumber", ["0x" + blockNumber.toString(16), false])
    const currentHash = blockData.hash.toLowerCase()
    const storedHash = depositRecord.getString("block_hash").toLowerCase()
    if (currentHash !== storedHash) {
      depositRecord.set("status", "failed")
      $app.save(depositRecord)
      console.error("REORG: block " + blockNumber + " hash changed " + storedHash + " → " + currentHash)
      return true
    }
  } catch (e) {
    console.error("Reorg check failed for block " + blockNumber + ":", e)
  }
  return false
}

async function revertBalance(depositRecord) {
  const userId = depositRecord.getString("user")
  const amount = depositRecord.getNumber("amount")
  try {
    const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userId)
    if (walletRecord) {
      walletRecord.set("usdt_balance", Math.max(0, walletRecord.getNumber("usdt_balance") - amount))
      $app.save(walletRecord)
    }
    const userRecord = $app.findRecordById("users", userId)
    if (userRecord) {
      userRecord.set("usdt_balance", Math.max(0, userRecord.getNumber("usdt_balance") - amount))
      $app.save(userRecord)
    }
  } catch (e) {
    console.error("Failed to revert balance for deposit " + depositRecord.id + ":", e)
  }
}

// === Core: Poll deposits ===

async function pollDeposits() {
  // 1. Get current block number
  let currentBlock
  try {
    const blockHex = await rpcCallWithRetry("eth_blockNumber", [])
    currentBlock = parseInt(blockHex, 16)
  } catch (e) {
    console.error("Deposit poller: cannot get block number, skipping cycle:", e)
    return
  }

  // 2. Get last scanned block
  const lastScanned = getLastScannedBlock()
  const fromBlock = lastScanned > 0 ? lastScanned + 1 : currentBlock - 100
  const toBlock = Math.max(currentBlock - REQUIRED_CONFIRMATIONS, fromBlock - 1)

  if (fromBlock > toBlock) {
    // No new blocks to scan, still update confirmations
    await updatePendingConfirmations(currentBlock)
    return
  }

  // 3. Fetch Transfer events from MockUSDT
  let logs
  try {
    logs = await rpcCallWithRetry("eth_getLogs", [{
      address: CONFIG.blockchain.contracts.MockUSDT,
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + toBlock.toString(16),
      topics: [TRANSFER_SIGNATURE],
    }])
  } catch (e) {
    console.error("Deposit poller: eth_getLogs failed:", e)
    return
  }

  if (!logs || logs.length === 0) {
    saveLastScannedBlock(toBlock)
    await updatePendingConfirmations(currentBlock)
    return
  }

  // 4. Process each log
  for (const log of logs) {
    if (log.removed) continue

    const toAddress = extractAddress(log.topics[2])
    const fromAddress = extractAddress(log.topics[1])
    const amount = parseAmount(log.data)

    if (amount <= 0) continue

    // Check if this is a known user
    const userRecord = findUserByWallet(toAddress)
    if (!userRecord) continue

    // Check for duplicate tx_hash
    try {
      const existing = $app.findFirstRecordByData("deposits", "tx_hash", log.transactionHash)
      if (existing) continue
    } catch (e) {
      // Not found, proceed
    }

    const blockNumber = parseInt(log.blockNumber, 16)

    // Create pending deposit
    try {
      const collection = $app.findCollectionByNameOrId("deposits")
      const depositRecord = new Record(collection)
      depositRecord.set("user", userRecord.id)
      depositRecord.set("amount", amount)
      depositRecord.set("tx_hash", log.transactionHash)
      depositRecord.set("from_address", fromAddress)
      depositRecord.set("block_number", blockNumber)
      depositRecord.set("block_hash", log.blockHash)
      depositRecord.set("confirmations", 0)
      depositRecord.set("status", "pending")
      $app.save(depositRecord)
    } catch (e) {
      // Unique constraint violation or other DB error
      console.error("Failed to create deposit record:", e)
    }
  }

  saveLastScannedBlock(toBlock)

  // 5. Update confirmations for pending deposits
  await updatePendingConfirmations(currentBlock)
}

// === Update pending confirmations ===

async function updatePendingConfirmations(currentBlock) {
  let pendingRecords
  try {
    pendingRecords = $app.findRecordsByFilter("deposits", "status = 'pending'", "-created", 500)
  } catch (e) {
    return
  }

  for (const record of pendingRecords) {
    // Check for reorg first
    try {
      const reorged = await checkReorg(record)
      if (reorged) continue
    } catch (e) {
      continue
    }

    const blockNumber = Math.floor(record.getNumber("block_number"))
    const confirmations = currentBlock - blockNumber

    if (confirmations < 0) continue

    if (record.getNumber("confirmations") !== confirmations) {
      record.set("confirmations", confirmations)
    }

    if (confirmations >= REQUIRED_CONFIRMATIONS && record.getString("status") !== "confirmed") {
      // Transition to confirmed
      record.set("status", "confirmed")
      record.set("confirmed_at", new Date().toISOString())

      // Update balances
      const userId = record.getString("user")
      const amount = record.getNumber("amount")
      try {
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userId)
        if (walletRecord) {
          const currentBalance = walletRecord.getNumber("usdt_balance") || 0
          walletRecord.set("usdt_balance", currentBalance + amount)
          walletRecord.set("total_earned", (walletRecord.getNumber("total_earned") || 0) + amount)
          walletRecord.set("last_transaction_at", new Date().toISOString())
          $app.save(walletRecord)

          // Sync to user record
          const userRecord = $app.findRecordById("users", userId)
          if (userRecord) {
            userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"))
            $app.save(userRecord)
          }
        }
      } catch (e) {
        console.error("Failed to update balances for deposit " + record.id + ":", e)
      }
    }

    try {
      $app.save(record)
    } catch (e) {
      console.error("Failed to save deposit record " + record.id + ":", e)
    }
  }
}

// === Reorg check for recent confirmed deposits ===

async function checkRecentConfirmedReorgs(currentBlock) {
  let recentConfirmed
  try {
    recentConfirmed = $app.findRecordsByFilter(
      "deposits",
      "status = 'confirmed' && confirmations <= " + REQUIRED_CONFIRMATIONS,
      "-created",
      100
    )
  } catch (e) {
    return
  }

  for (const record of recentConfirmed) {
    const reorged = await checkReorg(record)
    if (reorged) {
      await revertBalance(record)
    }
  }
}

// === Background poller ===

const POLLING_INTERVAL = (CONFIG && CONFIG.blockchain && CONFIG.blockchain.pollingInterval) || 30000
let poller = null

function startBackgroundPoller() {
  if (poller) clearInterval(poller)
  poller = setInterval(async () => {
    try {
      await pollDeposits()
      // Also check recent confirmed deposits for reorgs
      let currentBlock
      try {
        const blockHex = await rpcCall("eth_blockNumber", [])
        currentBlock = parseInt(blockHex, 16)
        await checkRecentConfirmedReorgs(currentBlock)
      } catch (e) {
        // Non-critical
      }
    } catch (error) {
      console.error("Deposit poller unhandled error:", error)
    }
  }, POLLING_INTERVAL)
}

startBackgroundPoller()

// === Manual trigger endpoint ===

/**
 * Check pending deposit confirmations and transition status.
 * Returns array of newly confirmed deposits.
 */
async function checkPendingConfirmations(userId) {
    const CONFIG = globalThis.EGGO_CONFIG;
    const newlyConfirmed = [];
    
    const pendingDeposits = $app.findAllRecords("deposits", $app.filter("user = {:userId} && status = 'pending'").bind({userId: userId}));
    
    if (pendingDeposits.length === 0) {
        return newlyConfirmed;
    }
    
    // Fetch current block number
    const blockResponse = await fetch(CONFIG.blockchain.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
    });
    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    
    for (const depositRecord of pendingDeposits) {
        const confirmations = currentBlock - depositRecord.getNumber("block_number");
        
        if (confirmations >= 12) {
            // Verify block hash (reorg detection)
            const verifyBlockResponse = await fetch(CONFIG.blockchain.rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBlockByNumber", params: ["0x" + depositRecord.getNumber("block_number").toString(16), false], id: 1 })
            });
            const verifyBlockData = await verifyBlockResponse.json();
            
            if (verifyBlockData.result && verifyBlockData.result.hash === depositRecord.getString("block_hash")) {
                // Block still valid — mark confirmed
                depositRecord.set("status", "confirmed");
                depositRecord.set("confirmations", confirmations);
                depositRecord.set("confirmed_at", new Date().toISOString());
                $app.save(depositRecord);
                newlyConfirmed.push(depositRecord);
            } else {
                // Reorg detected — mark failed
                depositRecord.set("status", "failed");
                $app.save(depositRecord);
                console.error("Reorg detected for deposit:", depositRecord.id, "block_hash mismatch");
            }
        } else {
            // Update confirmations count
            depositRecord.set("confirmations", confirmations);
            $app.save(depositRecord);
        }
    }
    
    return newlyConfirmed;
}

routerAdd("POST", "/api/v2/deposit/poll", async (e) => {
    const requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    const body = e.parseBody();
    const { user_address } = body;
    
    if (!user_address || !user_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { 
            success: false, 
            error: { message: "Valid user_address required", code: "VALIDATION_ERROR" } 
        });
    }
    
    try {
        const CONFIG = globalThis.EGGO_CONFIG;
        
        const userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
        
        if (!userRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User not found", code: "USER_NOT_FOUND" } 
            });
        }
        
        const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        
        if (!walletRecord) {
            return e.json(404, { 
                success: false, 
                error: { message: "User wallet not found", code: "WALLET_NOT_FOUND" } 
            });
        }
        
        const newlyConfirmed = await checkPendingConfirmations(userRecord.id);
        
        const lastPolledBlock = walletRecord.getNumber("last_polled_block") || 0;
        
        const blockResponse = await fetch(CONFIG.blockchain.rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
        });
        const blockData = await blockResponse.json();
        const currentBlock = parseInt(blockData.result, 16);
        
        // Determine fromBlock: look back 100 blocks on first poll
        const fromBlock = lastPolledBlock === 0 ? currentBlock - 100 : lastPolledBlock + 1;
        
        const transferSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const toTopic = "0x" + user_address.slice(2).padStart(64, "0");
        
        const logsResponse = await fetch(CONFIG.blockchain.rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getLogs",
                params: [{
                    address: CONFIG.blockchain.contracts.CommissionDistribution,
                    fromBlock: fromBlock.toString(16).replace(/^0x/, ''),
                    toBlock: currentBlock.toString(16).replace(/^0x/, ''),
                    topics: [transferSignature, null, toTopic]
                }],
                id: 1
            })
        });
        
        const logsData = await logsResponse.json();
        
        if (logsData.error) {
            throw new Error("RPC error: " + logsData.error.message);
        }
        
        const eventLogs = logsData.result || [];
        const deposits = [];
        let totalDeposited = 0;
        
        for (const eventLog of eventLogs) {
            if (eventLog.removed) {
                continue;
            }
            
            const fromAddress = "0x" + eventLog.topics[1].slice(26);
            const toAddress = "0x" + eventLog.topics[2].slice(26);
            
            if (toAddress.toLowerCase() !== user_address.toLowerCase()) {
                continue;
            }
            
            const amountRaw = parseInt(eventLog.data, 16);
            const amountUSDT = amountRaw / Math.pow(10, 6);
            
            if (amountUSDT <= 0) {
                continue;
            }
            
            const txHash = eventLog.transactionHash;
            
            // Create deposit record with status "pending" and block data (SEC-06)
            const depositCollection = $app.findCollectionByNameOrId("deposits");
            const depositRecord = new Record(depositCollection);
            depositRecord.set("user", userRecord.id);
            depositRecord.set("amount", amountUSDT);
            depositRecord.set("tx_hash", txHash);
            depositRecord.set("from_address", fromAddress);
            depositRecord.set("status", "pending");
            depositRecord.set("block_number", parseInt(eventLog.blockNumber, 16));
            depositRecord.set("block_hash", eventLog.blockHash);
            depositRecord.set("confirmations", 0);
            depositRecord.set("log_index", parseInt(eventLog.logIndex || eventLog.log_index, 16));
            
            // Try to save — if duplicate constraint violation, skip (SEC-07)
            try {
                $app.save(depositRecord);
            } catch (err) {
                console.warn("Duplicate deposit attempt for tx_hash:", txHash);
                continue;
            }
            
            // Only update balance AFTER successful deposit save
            const currentBalance = walletRecord.getNumber("usdt_balance") || 0;
            walletRecord.set("usdt_balance", currentBalance + amountUSDT);
            walletRecord.set("total_earned", (walletRecord.getNumber("total_earned") || 0) + amountUSDT);
            walletRecord.set("last_transaction_at", new Date().toISOString());
            $app.save(walletRecord);
            
            userRecord.set("usdt_balance", walletRecord.getNumber("usdt_balance"));
            $app.save(userRecord);
            
            deposits.push({
                tx_hash: txHash,
                amount: amountUSDT,
                from_address: fromAddress,
                status: "pending"
            });
            
            totalDeposited += amountUSDT;
        }
        
        // Update last_polled_block after successful poll
        walletRecord.set("last_polled_block", currentBlock);
        $app.save(walletRecord);
        
        // Query pending/confirmed counts
        const pendingDeposits = $app.findAllRecords("deposits", $app.filter("user = {:userId} && status = 'pending'").bind({userId: userRecord.id}));
        const confirmedDeposits = $app.findAllRecords("deposits", $app.filter("user = {:userId} && status = 'confirmed'").bind({userId: userRecord.id}));
        
        const newBalance = walletRecord.getNumber("usdt_balance");
        
        e.json(200, {
            success: true,
            data: {
                deposits: deposits,
                new_balance: newBalance,
                total_deposited: totalDeposited,
                events_processed: eventLogs.length,
                pending_count: pendingDeposits.length,
                confirmed_count: confirmedDeposits.length,
                newly_confirmed: newlyConfirmed.map(d => ({ tx_hash: d.getString("tx_hash"), amount: d.getNumber("amount") }))
            }
        });
        
    } catch (error) {
        console.error("Deposit poll error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "DEPOSIT_POLL_FAILED" }
        });
    }
});

// Confirmation checker endpoint
routerAdd("POST", "/api/v2/deposit/check-confirmations", async (e) => {
    const requestInfo = e.requestInfo();
    const userId = requestInfo.auth?.id;
    if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    
    try {
        const newlyConfirmed = await checkPendingConfirmations(userId);
        
        e.json(200, {
            success: true,
            data: {
                confirmed: newlyConfirmed.map(d => ({ tx_hash: d.getString("tx_hash"), amount: d.getNumber("amount") }))
            }
        });
    } catch (error) {
        console.error("Confirmation check error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "CONFIRMATION_CHECK_FAILED" }
        });
    }
});

console.log("Deposit tracking endpoints registered: POST /api/v2/deposit/poll, POST /api/v2/deposit/check-confirmations");
