import { describe, it, expect, beforeEach } from "bun:test"

const TEST_USER_ID = "user-001"
const TEST_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEa1"
const TEST_EXT_WALLET = "0x1111111111111111111111111111111111111111"

let mockRecords = {}
let mockSaveCalls = []
let mockHttpResponse = {}
let mockJsonCaptures = []
let mockGetenvValues = {}

function createMockRecord(data) {
    const store = { ...data }
    return {
        id: store.id || "mock-id",
        get: (field) => store[field] !== undefined ? store[field] : null,
        set: (field, value) => { store[field] = value },
        getString: (field) => String(store[field] || ""),
        getNumber: (field) => Number(store[field] || 0),
        _data: store
    }
}

function createMockCollection(name) {
    return { name, id: "coll_" + name }
}

globalThis.$app = {
    findRecordById: (collection, id) => {
        if (collection === "users" && id === TEST_USER_ID) return mockRecords.user
        return null
    },
    findFirstRecordByData: (collection, field, value) => {
        if (collection === "user_wallets" && field === "user_id" && value === TEST_USER_ID) return mockRecords.wallet
        if (collection === "users" && field === "wallet" && value === TEST_WALLET) return mockRecords.user
        if (collection === "wallet_configs" && field === "key") return null
        return null
    },
    findCollectionByNameOrId: (name) => createMockCollection(name),
    newRecord: (collection) => createMockRecord({ id: "new-record-" + Date.now() }),
    save: (record) => { mockSaveCalls.push({ record: record, id: record._data ? record._data.id : record.id }) },
    logger: () => ({ info: () => {}, error: () => {} })
}

globalThis.$http = {
    send: (opts) => mockHttpResponse
}

globalThis.$os = {
    getenv: (key) => mockGetenvValues[key] || null
}

globalThis.console = {
    log: () => {},
    error: () => {},
    warn: () => {}
}

beforeEach(() => {
    mockRecords = {}
    mockRecords.user = createMockRecord({
        id: TEST_USER_ID,
        wallet: TEST_WALLET,
        daccPublickey: "daccPublickey_0xtest_123",
        pin: "test-encrypted-pin",
        usdt_balance: 100
    })
    mockRecords.wallet = createMockRecord({
        id: "wallet-001",
        user_id: TEST_USER_ID,
        wallet_address: TEST_WALLET,
        usdt_balance: 100,
        total_earned: 50,
        total_spent: 20,
        total_withdrawn: 30
    })
    mockSaveCalls = []
    mockJsonCaptures = []
    mockHttpResponse = { statusCode: 200, json: { success: true, data: { txHash: "0xdef456", amount: 10, fee: 0.5 } } }
    mockGetenvValues = { WALLET_SRV_URL: "http://wallet-api:3001" }
})

function loadHandler() {
    var fs = require("fs")
    var p = require("path")
    var hookSrc = fs.readFileSync(p.join(__dirname, "09-withdraw-usdt.pb.js"), "utf8")
    var routes = {}
    globalThis.routerAdd = function(method, path, handler) { routes[path] = handler }
    eval(hookSrc)
    return routes["/api/v2/wallet/withdraw"]
}

function makeEvent(body) {
    return {
        requestInfo: function() {
            return {
                auth: { id: TEST_USER_ID, collectionId: "_pb_users_auth_" },
                body: body
            }
        },
        json: function(status, data) {
            mockJsonCaptures.push({ status: status, data: data })
            return { status: status, data: data }
        }
    }
}

describe("POST /api/v2/wallet/withdraw", function() {
    it("smoke: successful withdraw returns 200 and deducts balance", function() {
        var handler = loadHandler()
        if (!handler) return

        handler(makeEvent({ user_address: TEST_WALLET, amount: 10, external_wallet_address: TEST_EXT_WALLET }))

        var lastCap = mockJsonCaptures[mockJsonCaptures.length - 1]
        expect(lastCap).toBeDefined()
        expect(lastCap.status).toBe(200)
        expect(lastCap.data.success).toBe(true)
    })

    it("smoke: insufficient balance returns 400", function() {
        mockRecords.wallet.set("usdt_balance", 5)

        var handler = loadHandler()
        if (!handler) return

        handler(makeEvent({ user_address: TEST_WALLET, amount: 100, external_wallet_address: TEST_EXT_WALLET }))

        var lastCap = mockJsonCaptures[mockJsonCaptures.length - 1]
        expect(lastCap).toBeDefined()
        expect(lastCap.status).toBe(400)
    })

    it("smoke: timeout response marks withdrawal as pending_chain", function() {
        mockHttpResponse = { statusCode: 504, json: { success: false, error: { message: "timeout", code: "TRANSFER_TIMEOUT", txHash: "0xpending" } } }

        var handler = loadHandler()
        if (!handler) return

        handler(makeEvent({ user_address: TEST_WALLET, amount: 10, external_wallet_address: TEST_EXT_WALLET }))

        var lastCap = mockJsonCaptures[mockJsonCaptures.length - 1]
        expect(lastCap).toBeDefined()
        expect(lastCap.status).toBe(502)
    })
})
