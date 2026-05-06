// ===== DEPOSIT TRACKING HOOK =====
// Background polling + manual trigger for MockUSDT Transfer events
// USDT Contract: 0x93886105218Ca14b370ACA538b13895295916028 (Phase 12 deployment)

const CONFIG = globalThis.EGGO_CONFIG
const USDT_DECIMALS = 6
const REQUIRED_CONFIRMATIONS = 12
const TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

// === Helpers ===

function getLastScannedBlock() {
  try {
    const record = $app.findFirstRecordByData("sync_state", "id", "deposit_poller")
    return record ? Math.floor(record.getNumber("lastProcessedBlock") || 0) : 0
  } catch (e) {
    return 0
  }
}

function saveLastScannedBlock(blockNumber) {
  try {
    let record
    try {
      record = $app.findFirstRecordByData("sync_state", "id", "deposit_poller")
    } catch (e) {
      record = null
    }
    if (!record) {
      const collection = $app.findCollectionByNameOrId("sync_state")
      record = new Record(collection)
      record.set("id", "deposit_poller")
    }
    record.set("lastProcessedBlock", blockNumber)
    record.set("lastSyncTimestamp", new Date().toISOString())
    record.set("status", "syncing")
    $app.save(record)
  } catch (e) {
    console.error("Failed to save sync state:", e)
  }
}

async function rpcCall(method, params) {
  const response = await fetch(CONFIG.blockchain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  })
  const data = await response.json()
  if (data.error) throw new Error("RPC error: " + data.error.message)
  return data.result
}

async function rpcCallWithRetry(method, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await rpcCall(method, params)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}

function extractAddress(topic) {
  return "0x" + topic.slice(26)
}

function parseAmount(hexData) {
  const raw = parseInt(hexData, 16)
  return raw / Math.pow(10, USDT_DECIMALS)
}

function findUserByWallet(walletAddress) {
  try {
    return $app.findFirstRecordByData("users", "wallet", walletAddress)
  } catch (e) {
    return null
  }
}

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

routerAdd("POST", "/api/v2/deposit/poll", async (e) => {
  e.requireAuth()
  const body = e.parseBody()
  const { user_address } = body

  if (!user_address || !user_address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return e.json(400, {
      success: false,
      error: { message: "Valid user_address required", code: "VALIDATION_ERROR" }
    })
  }

  try {
    await pollDeposits()

    const userRecord = $app.findFirstRecordByData("users", "wallet", user_address)
    if (!userRecord) {
      return e.json(404, {
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" }
      })
    }

    const walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id)

    let deposits = []
    try {
      deposits = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "'", "-created", 50)
    } catch (e) {
      // No deposits
    }

    e.json(200, {
      success: true,
      data: {
        deposits: deposits.map(d => ({
          id: d.id,
          amount: d.getNumber("amount"),
          tx_hash: d.getString("tx_hash"),
          from_address: d.getString("from_address"),
          status: d.getString("status"),
          confirmations: d.getNumber("confirmations"),
          created: d.getString("created")
        })),
        new_balance: walletRecord ? walletRecord.getNumber("usdt_balance") : 0
      }
    })
  } catch (error) {
    console.error("Deposit poll error:", error)
    e.json(500, {
      success: false,
      error: { message: error.message, code: "DEPOSIT_POLL_FAILED" }
    })
  }
})

console.log("Deposit tracking hook registered: background poller (" + POLLING_INTERVAL + "ms) + POST /api/v2/deposit/poll")
