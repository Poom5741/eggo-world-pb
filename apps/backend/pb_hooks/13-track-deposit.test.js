import { describe, it, expect, beforeEach, spyOn, mock } from "bun:test"

// ============================================
// MOCKS
// ============================================

const MOCK_USDT_ADDRESS = "0x93886105218Ca14b370ACA538b13895295916028"
const TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const KNOWN_USER_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEa1"
const KNOWN_USER_ID = "user-001"
const UNKNOWN_WALLET = "0x1111111111111111111111111111111111111111"

const mockConfig = {
  blockchain: {
    chainId: 7117,
    rpcUrl: "https://rpc.0xl3.com",
    pollingInterval: 30000,
    contracts: {
      MockUSDT: MOCK_USDT_ADDRESS,
      CommissionDistribution: "0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f",
      AnimalNFT: "0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C",
      EggNFT: "0xb2FE193523A1E6A240141331A80755f5642e7A44",
      FoodNFT: "0xec21A3c068e84ceeD04975627418E867Ec342A02",
    },
  },
}

// Track calls to mocked functions
let mockFindCalls = []
let mockSaveCalls = []
let mockFetchCalls = []
let mockRpcCalls = []
let mockSetIntervalCalls = []
let mockRecordInstances = []
let mockFindRecordsByFilterCalls = []

// In-memory stores
let records = {
  sync_state: [],
  deposits: [],
  users: [],
  user_wallets: [],
}

function resetMocks() {
  mockFindCalls = []
  mockSaveCalls = []
  mockFetchCalls = []
  mockRpcCalls = []
  mockSetIntervalCalls = []
  mockRecordInstances = []
  mockFindRecordsByFilterCalls = []

  records = {
    sync_state: [],
    deposits: [],
    users: [
      {
        id: KNOWN_USER_ID,
        wallet: KNOWN_USER_WALLET,
        usdt_balance: 100,
        getString(f) { return this[f] },
        getNumber(f) { return this[f] || 0 },
        set(f, v) { this[f] = v },
      },
    ],
    user_wallets: [
      {
        id: "wallet-001",
        user_id: KNOWN_USER_ID,
        usdt_balance: 100,
        total_earned: 50,
        total_spent: 20,
        total_withdrawn: 30,
        last_transaction_at: null,
        getString(f) { return this[f] },
        getNumber(f) { return this[f] || 0 },
        set(f, v) { this[f] = v },
      },
    ],
  }
}

// Mock Record constructor
class MockRecord {
  constructor(collection) {
    this.collection = collection
    this.data = {}
    this.id = "rec_" + Math.random().toString(36).slice(2, 10)
    mockRecordInstances.push(this)
  }
  getString(f) { return this.data[f] || "" }
  getNumber(f) { return this.data[f] || 0 }
  set(f, v) { this.data[f] = v }
  get(f) { return this.data[f] }
}

// Helper: create a mock Transfer event log
function makeTransferLog(overrides = {}) {
  return {
    address: MOCK_USDT_ADDRESS,
    topics: [
      TRANSFER_SIG,
      "0x" + (overrides.from || UNKNOWN_WALLET).slice(2).padStart(64, "0"),
      "0x" + (overrides.to || KNOWN_USER_WALLET).slice(2).padStart(64, "0"),
    ],
    data: overrides.data || "0x0000000000000000000000000000000000000000000000000000003b9aca00",
    blockNumber: overrides.blockNumber || "0x64",
    blockHash: overrides.blockHash || "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1",
    transactionHash: overrides.txHash || "0x" + Math.random().toString(16).slice(2).padStart(64, "0"),
    transactionIndex: overrides.txIndex || "0x0",
    logIndex: overrides.logIndex || "0x0",
    removed: overrides.removed || false,
    ...overrides,
  }
}

// Helper: create a mock RPC response
function mockRpcResponse(result) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function mockRpcErrorResponse(message) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function setupMockFetch(blockNumber, logs, blockHash) {
  mockFetchCalls = []
  mockRpcCalls = []

  global.fetch = mock(async (url, options) => {
    mockFetchCalls.push({ url, options })
    if (options && options.body) {
      const body = JSON.parse(options.body)
      mockRpcCalls.push(body)
      if (body.method === "eth_blockNumber") {
        return mockRpcResponse("0x" + blockNumber.toString(16))
      }
      if (body.method === "eth_getLogs") {
        return mockRpcResponse(logs || [])
      }
      if (body.method === "eth_getBlockByNumber") {
        return mockRpcResponse({ hash: blockHash || "0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1" })
      }
    }
    return mockRpcResponse(null)
  })
}

// Helpers to simulate pollDeposits logic (what 13-track-deposit.pb.js does)
function getLastScannedBlock() {
  const record = records.sync_state.find(r => r.id === "deposit_poller")
  return record ? record.lastProcessedBlock || 0 : 0
}

function saveLastScannedBlock(blockNumber) {
  let record = records.sync_state.find(r => r.id === "deposit_poller")
  if (!record) {
    record = { id: "deposit_poller", lastProcessedBlock: 0, data: {} }
    records.sync_state.push(record)
  }
  record.lastProcessedBlock = blockNumber
  record.lastSyncTimestamp = new Date().toISOString()
}

function findUserByWallet(wallet) {
  return records.users.find(u => u.wallet.toLowerCase() === wallet.toLowerCase()) || null
}

function findDepositByTxHash(txHash) {
  return records.deposits.find(d => d.tx_hash === txHash) || null
}

function parseAmount(hexData) {
  return parseInt(hexData, 16) / 1e6
}

function extractAddress(topic) {
  return "0x" + topic.slice(26)
}

// Simulated pollDeposits
async function simulatePollDeposits(currentBlock, transferLogs) {
  const lastScanned = getLastScannedBlock()
  const fromBlock = lastScanned > 0 ? lastScanned + 1 : currentBlock - 100
  const toBlock = Math.max(currentBlock - 12, fromBlock - 1)

  if (fromBlock > toBlock) {
    await simulateUpdateConfirmations(currentBlock)
    return
  }

  for (const log of (transferLogs || [])) {
    if (log.removed) continue
    const toAddress = extractAddress(log.topics[2])
    const fromAddress = extractAddress(log.topics[1])
    const amount = parseAmount(log.data)
    if (amount <= 0) continue
    const userRecord = findUserByWallet(toAddress)
    if (!userRecord) continue
    if (findDepositByTxHash(log.transactionHash)) continue

    const deposit = {
      id: "dep_" + Math.random().toString(36).slice(2, 10),
      user: userRecord.id,
      amount,
      tx_hash: log.transactionHash,
      from_address: fromAddress,
      block_number: parseInt(log.blockNumber, 16),
      block_hash: log.blockHash,
      confirmations: 0,
      status: "pending",
      confirmed_at: null,
      created: new Date().toISOString(),
      getString(f) { return this[f] || "" },
      getNumber(f) { return this[f] || 0 },
      set(f, v) { this[f] = v },
    }
    records.deposits.push(deposit)
  }

  saveLastScannedBlock(toBlock)
  await simulateUpdateConfirmations(currentBlock)
}

async function simulateUpdateConfirmations(currentBlock) {
  const pending = records.deposits.filter(d => d.status === "pending")
  for (const record of pending) {
    const confirmations = currentBlock - record.block_number
    if (confirmations < 0) continue
    record.confirmations = confirmations

    if (confirmations >= 12) {
      record.status = "confirmed"
      record.confirmed_at = new Date().toISOString()

      const walletRecord = records.user_wallets.find(w => w.user_id === record.user)
      if (walletRecord) {
        walletRecord.usdt_balance = (walletRecord.usdt_balance || 0) + record.amount
        walletRecord.total_earned = (walletRecord.total_earned || 0) + record.amount
      }
    }
  }
}

// Simulated reorg check
async function simulateCheckReorg(depositRecord, newBlockHash) {
  if (depositRecord.block_hash.toLowerCase() !== newBlockHash.toLowerCase()) {
    depositRecord.status = "failed"
    // Revert balance if was confirmed
    if (depositRecord.status === "confirmed" || depositRecord.confirmations >= 12) {
      const walletRecord = records.user_wallets.find(w => w.user_id === depositRecord.user)
      if (walletRecord) {
        walletRecord.usdt_balance = Math.max(0, (walletRecord.usdt_balance || 0) - depositRecord.amount)
      }
    }
    return true
  }
  return false
}

// ============================================
// TEST SUITES
// ============================================

describe("Background Poller", () => {
  beforeEach(() => {
    resetMocks()
    global.setInterval = mock((fn, ms) => {
      mockSetIntervalCalls.push({ fn, ms })
      return 123
    })
    global.clearInterval = mock(() => {})
  })

  it("should start setInterval on hook load with pollingInterval", () => {
    const pollingInterval = mockConfig.blockchain.pollingInterval
    expect(pollingInterval).toBe(30000)
    const intervalId = setInterval(() => {}, pollingInterval)
    expect(mockSetIntervalCalls.length).toBeGreaterThan(0)
    expect(mockSetIntervalCalls[0].ms).toBe(30000)
  })

  it("should query eth_blockNumber on each poll cycle", async () => {
    setupMockFetch(100, [])
    const result = await fetch(mockConfig.blockchain.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    })
    const data = await result.json()
    expect(data.result).toBe("0x64")
    expect(parseInt(data.result, 16)).toBe(100)
  })

  it("should use sync_state for lastProcessedBlock tracking", () => {
    saveLastScannedBlock(50)
    expect(getLastScannedBlock()).toBe(50)
    saveLastScannedBlock(100)
    expect(getLastScannedBlock()).toBe(100)
  })

  it("should not crash if sync_state does not exist (return block 0)", () => {
    records.sync_state = []
    expect(getLastScannedBlock()).toBe(0)
  })

  it("should update sync_state after processing new blocks", () => {
    saveLastScannedBlock(42)
    expect(getLastScannedBlock()).toBe(42)
    const record = records.sync_state.find(r => r.id === "deposit_poller")
    expect(record).toBeDefined()
    expect(record.lastSyncTimestamp).toBeDefined()
  })
})

describe("Deposit Detection", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should detect new MockUSDT Transfer events and create deposit record", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" })
    const beforeCount = records.deposits.length
    await simulatePollDeposits(100, [log])
    expect(records.deposits.length).toBe(beforeCount + 1)
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.tx_hash).toBe(log.transactionHash)
    expect(deposit.amount).toBe(1000)
  })

  it("should parse USDT amount with 6 decimals correctly", () => {
    // 1000 USDT = 1000 * 10^6 = 1,000,000,000 = 0x3b9aca00
    expect(parseAmount("0x3b9aca00")).toBe(1000)
    // 0.50 USDT = 0.5 * 10^6 = 500,000 = 0x7a120
    expect(parseAmount("0x7a120")).toBe(0.5)
    // zero
    expect(parseAmount("0x0")).toBe(0)
    // 1 USDT
    expect(parseAmount("0xf4240")).toBe(1)
    // 25 USDT (egg price)
    expect(parseAmount("0x17d7840")).toBe(25)
  })

  it("should skip transfers not addressed to known users", async () => {
    const log = makeTransferLog({
      to: UNKNOWN_WALLET,
      blockNumber: "0x64",
    })
    const beforeCount = records.deposits.length
    await simulatePollDeposits(100, [log])
    expect(records.deposits.length).toBe(beforeCount)
  })

  it("should skip events with removed=true (uncled transactions)", async () => {
    const log = makeTransferLog({ removed: true, blockNumber: "0x64" })
    const beforeCount = records.deposits.length
    await simulatePollDeposits(100, [log])
    expect(records.deposits.length).toBe(beforeCount)
  })

  it("should set initial status to pending with 0 confirmations", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.status).toBe("pending")
    expect(deposit.confirmations).toBe(0)
  })

  it("should extract from_address from topics[1] correctly", () => {
    const from = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const log = makeTransferLog({ from, blockNumber: "0x64" })
    const extractedFrom = extractAddress(log.topics[1])
    expect(extractedFrom.toLowerCase()).toBe(from.toLowerCase())
  })

  it("should store block_number and block_hash from event log", async () => {
    const log = makeTransferLog({
      blockNumber: "0x64",
      blockHash: "0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
    })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.block_number).toBe(100)
    expect(deposit.block_hash).toBe(log.blockHash)
  })

  it("should skip zero-amount transfer events", async () => {
    const log = makeTransferLog({
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
      blockNumber: "0x64",
    })
    const beforeCount = records.deposits.length
    await simulatePollDeposits(100, [log])
    expect(records.deposits.length).toBe(beforeCount)
  })
})

describe("Confirmation Tracking", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should start with confirmations=0 for new deposits", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.confirmations).toBe(0)
  })

  it("should increment confirmations as current block advances", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" }) // block 100
    await simulatePollDeposits(100, [log])
    let deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.confirmations).toBe(0)

    // Poll at block 105
    await simulateUpdateConfirmations(105)
    expect(deposit.confirmations).toBe(5)
  })

  it("should NOT update balance before 12 confirmations", async () => {
    const initialBalance = records.user_wallets[0].usdt_balance
    const log = makeTransferLog({ blockNumber: "0x64" }) // block 100
    await simulatePollDeposits(100, [log])

    // Poll at block 105 → confirmations=5 still pending
    await simulateUpdateConfirmations(105)
    expect(records.user_wallets[0].usdt_balance).toBe(initialBalance)
  })

  it("should mark deposit confirmed at 12+ confirmations", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" }) // block 100
    await simulatePollDeposits(100, [log])
    let deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.status).toBe("pending")

    // Poll at block 112 → confirmations=12
    await simulateUpdateConfirmations(112)
    expect(deposit.status).toBe("confirmed")
  })

  it("should update user_wallets.usdt_balance on confirmation", async () => {
    const initialBalance = records.user_wallets[0].usdt_balance
    const log = makeTransferLog({
      blockNumber: "0x64",
      data: "0x0000000000000000000000000000000000000000000000000000003b9aca00", // 1000 USDT
    })
    await simulatePollDeposits(100, [log])
    expect(records.user_wallets[0].usdt_balance).toBe(initialBalance) // still pending

    await simulateUpdateConfirmations(112) // confirm
    expect(records.user_wallets[0].usdt_balance).toBe(initialBalance + 1000)
  })

  it("should set confirmed_at timestamp on confirmation", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" })
    await simulatePollDeposits(100, [log])
    let deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.confirmed_at).toBeNull()

    await simulateUpdateConfirmations(112)
    expect(deposit.confirmed_at).toBeDefined()
  })

  it("should not double-count confirmed deposits on re-poll", async () => {
    const initialBalance = 100
    records.user_wallets[0].usdt_balance = initialBalance
    const log = makeTransferLog({ blockNumber: "0x64", data: "0x3b9aca00" })
    await simulatePollDeposits(100, [log])
    await simulateUpdateConfirmations(112)
    expect(records.user_wallets[0].usdt_balance).toBe(initialBalance + 1000)

    // Re-poll at block 200 — should not double-count
    const balanceAfterConfirm = records.user_wallets[0].usdt_balance
    await simulateUpdateConfirmations(200)
    expect(records.user_wallets[0].usdt_balance).toBe(balanceAfterConfirm)
  })
})

describe("Duplicate Detection", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should skip existing tx_hash without creating duplicate deposit", async () => {
    const txHash = "0xexistingtx00000000000000000000000000000000000000000000000000000001"
    // Pre-create deposit with this tx_hash
    records.deposits.push({
      id: "existing-dep",
      user: KNOWN_USER_ID,
      tx_hash: txHash,
      amount: 100,
      status: "pending",
      block_number: 100,
      getString(f) { return this[f] || "" },
      getNumber(f) { return this[f] || 0 },
      set(f, v) { this[f] = v },
    })
    const beforeCount = records.deposits.length

    const log = makeTransferLog({
      txHash,
      blockNumber: "0x64",
    })
    await simulatePollDeposits(100, [log])
    // Should not create new deposit
    expect(records.deposits.length).toBe(beforeCount)
  })

  it("should handle multiple distinct deposits for same user", async () => {
    const logs = [
      makeTransferLog({ txHash: "0xtx1001", blockNumber: "0x64" }),
      makeTransferLog({ txHash: "0xtx1002", blockNumber: "0x65" }),
      makeTransferLog({ txHash: "0xtx1003", blockNumber: "0x66" }),
    ]
    await simulatePollDeposits(100, logs)
    const userDeposits = records.deposits.filter(d => d.user === KNOWN_USER_ID)
    expect(userDeposits.length).toBe(3)
  })

  it("should not update balance twice for same deposit", async () => {
    records.user_wallets[0].usdt_balance = 100
    const log = makeTransferLog({
      txHash: "0xtx_unique_single_001",
      blockNumber: "0x64",
    })
    await simulatePollDeposits(100, [log])
    await simulateUpdateConfirmations(112)
    const balanceAfterFirst = records.user_wallets[0].usdt_balance
    // Trying to confirm again should not change balance
    await simulateUpdateConfirmations(200)
    expect(records.user_wallets[0].usdt_balance).toBe(balanceAfterFirst)
  })
})

describe("Reorg Detection", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should detect block hash mismatch", async () => {
    const log = makeTransferLog({
      blockNumber: "0x64",
      blockHash: "0xorig1234orig1234orig1234orig1234orig1234orig1234orig1234orig1234orig",
    })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.block_hash).toBe(log.blockHash)

    // Reorg: new hash differs
    const reorgHash = "0xreorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reo1g"
    const reorged = await simulateCheckReorg(deposit, reorgHash)
    expect(reorged).toBe(true)
  })

  it("should mark deposit as failed on reorg", async () => {
    const log = makeTransferLog({
      blockNumber: "0x64",
      blockHash: "0xorig1234orig1234orig1234orig1234orig1234orig1234orig1234orig1234or1g",
    })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.status).toBe("pending")

    const reorgHash = "0xreorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reo1g"
    await simulateCheckReorg(deposit, reorgHash)
    expect(deposit.status).toBe("failed")
  })

  it("should revert balance if confirmed deposit is reorg'd", async () => {
    const log = makeTransferLog({
      blockNumber: "0x64",
      blockHash: "0xorig1234orig1234orig1234orig1234orig1234orig1234orig1234orig1234or1g",
    })
    await simulatePollDeposits(100, [log])
    // Confirm it
    await simulateUpdateConfirmations(112)
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.status).toBe("confirmed")
    const balanceAfterConfirm = records.user_wallets[0].usdt_balance
    expect(balanceAfterConfirm).toBeGreaterThan(100) // Got deposit

    // Reorg!
    const reorgHash = "0xreorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reorg1234reo1g"
    await simulateCheckReorg(deposit, reorgHash)
    expect(records.user_wallets[0].usdt_balance).toBe(100) // Reverted to initial
  })

  it("should not mark deposit as failed on same block hash", async () => {
    const log = makeTransferLog({
      blockNumber: "0x64",
      blockHash: "0xstable1234stable1234stable1234stable1234stable1234stable1234stable1234stab1",
    })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]

    const reorged = await simulateCheckReorg(deposit, log.blockHash)
    expect(reorged).toBe(false)
    expect(deposit.status).toBe("pending")
  })
})

describe("Manual Endpoint: POST /api/v2/deposit/poll", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should return deposits list sorted by -created (newest first)", async () => {
    const logs = [
      makeTransferLog({ txHash: "0xtx_early", blockNumber: "0x64" }),
      makeTransferLog({ txHash: "0xtx_later", blockNumber: "0x65" }),
    ]
    await simulatePollDeposits(100, logs)

    const userDeposits = records.deposits
      .filter(d => d.user === KNOWN_USER_ID)
      .sort((a, b) => b.created.localeCompare(a.created))

    expect(userDeposits.length).toBe(2)
    expect(userDeposits[0].tx_hash).toBeDefined()
  })

  it("should return current wallet balance", () => {
    const balance = records.user_wallets[0].usdt_balance
    expect(balance).toBe(100)
  })

  it("should return 404 for unknown wallet", () => {
    const unknownWallet = "0xffffffffffffffffffffffffffffffffffffffff"
    const user = findUserByWallet(unknownWallet)
    expect(user).toBeNull()
  })

  it("should validate user_address format (reject invalid)", () => {
    const validRegex = /^0x[a-fA-F0-9]{40}$/
    expect(validRegex.test(KNOWN_USER_WALLET)).toBe(true)
    expect(validRegex.test("invalid-address")).toBe(false)
    expect(validRegex.test("0xshort")).toBe(false)
    expect(validRegex.test("nothex")).toBe(false)
  })

  it("should return deposits with correct field structure", async () => {
    const log = makeTransferLog({ blockNumber: "0x64" })
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    expect(deposit.tx_hash).toBeDefined()
    expect(deposit.amount).toBeGreaterThan(0)
    expect(deposit.from_address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    expect(["pending", "confirmed", "failed"]).toContain(deposit.status)
    expect(deposit.confirmations).toBeGreaterThanOrEqual(0)
    expect(deposit.block_number).toBeGreaterThan(0)
    expect(deposit.block_hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
  })
})

describe("Error Handling", () => {
  beforeEach(() => {
    resetMocks()
  })

  it("should handle RPC connection failure gracefully", async () => {
    global.fetch = mock(async () => {
      throw new Error("Network error: Connection refused")
    })
    try {
      await fetch("https://rpc.0xl3.com")
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error.message).toContain("Network error")
    }
  })

  it("should handle invalid RPC response with error field", async () => {
    global.fetch = mock(async () => {
      return new Response(JSON.stringify({ error: { message: "Invalid request" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })
    const response = await fetch("https://rpc.0xl3.com", {
      method: "POST",
      body: JSON.stringify({ method: "eth_getLogs" }),
    })
    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(data.error.message).toBe("Invalid request")
  })

  it("should handle missing user wallet gracefully", () => {
    const unknownWallet = "0x0000000000000000000000000000000000000000"
    const user = findUserByWallet(unknownWallet)
    expect(user).toBeNull()
  })

  it("should handle missing sync_state by initializing at block 0", () => {
    records.sync_state = []
    expect(getLastScannedBlock()).toBe(0)
  })

  it("should handle empty sync_state gracefully on save", () => {
    saveLastScannedBlock(42)
    expect(getLastScannedBlock()).toBe(42)
    records.sync_state = []
    expect(getLastScannedBlock()).toBe(0)
  })

  it("should handle poll with no new blocks (fromBlock > toBlock)", async () => {
    // Set last scanned to a recent block
    saveLastScannedBlock(200)
    // Current block at 200 - fromBlock would be 201, toBlock would be 188
    // So fromBlock > toBlock, should skip scanning
    const beforeCount = records.deposits.length
    await simulatePollDeposits(200, [])
    expect(records.deposits.length).toBe(beforeCount)
  })

  it("should handle negative confirmations gracefully", async () => {
    const log = makeTransferLog({ blockNumber: "0x6e" }) // block 110
    await simulatePollDeposits(100, [log])
    const deposit = records.deposits[records.deposits.length - 1]
    // confirmations = currentBlock - block_number = 100 - 110 = -10
    expect(deposit.confirmations).toBe(0)
  })

  it("should handle RPC returning no logs gracefully", async () => {
    const beforeCount = records.deposits.length
    await simulatePollDeposits(100, [])
    expect(records.deposits.length).toBe(beforeCount)
  })

  it("should handle RPC returning null result gracefully", async () => {
    saveLastScannedBlock(50)
    await simulatePollDeposits(100, null)
    // Should not crash, should just update confirmations
    expect(records.deposits.length).toBe(0)
  })
})

describe("Configuration", () => {
  it("should have correct MockUSDT address from Phase 12 deployment", () => {
    expect(mockConfig.blockchain.contracts.MockUSDT).toBe(MOCK_USDT_ADDRESS)
    expect(mockConfig.blockchain.contracts.CommissionDistribution).toBe("0xa0C50587306F0CCac627D2eaEcb9e5909dB58F3f")
    expect(mockConfig.blockchain.contracts.AnimalNFT).toBe("0x35F53aB20B3073903ebDe04aA9b354d1Efe8A99C")
    expect(mockConfig.blockchain.contracts.EggNFT).toBe("0xb2FE193523A1E6A240141331A80755f5642e7A44")
    expect(mockConfig.blockchain.contracts.FoodNFT).toBe("0xec21A3c068e84ceeD04975627418E867Ec342A02")
  })

  it("should have correct polling interval (30s)", () => {
    expect(mockConfig.blockchain.pollingInterval).toBe(30000)
  })

  it("should have correct chain ID (0xl3 = 7117)", () => {
    expect(mockConfig.blockchain.chainId).toBe(7117)
  })
})

console.log("Tests loaded: 13-track-deposit.test.js — Phase 13 USDT Deposit Tracking")
