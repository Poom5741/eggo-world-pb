import { describe, it, expect, beforeEach } from "bun:test"

const TEST_USER_ID = "user-001"
const TEST_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEa1"

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
        if (collection === "egg_nfts" && field === "owner") return null
        if (collection === "wallet_configs") return null
        return null
    },
    findCollectionByNameOrId: (name) => createMockCollection(name),
    newRecord: (collection) => createMockRecord({ id: "new-record-" + Date.now() }),
    save: (record) => { mockSaveCalls.push({ record, id: record._data ? record._data.id : record.id }) },
    findRecordsByFilter: () => [],
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
        usdt_balance: 100,
        referral_chain: []
    })
    mockRecords.wallet = createMockRecord({
        id: "wallet-001",
        user_id: TEST_USER_ID,
        wallet_address: TEST_WALLET,
        usdt_balance: 100,
        total_earned: 50,
        total_spent: 20
    })
    mockSaveCalls = []
    mockJsonCaptures = []
    mockHttpResponse = { statusCode: 200, json: { success: true, data: { txHash: "0xabc123", tokenId: "1" } }, body: null }
    mockGetenvValues = { WALLET_SRV_URL: "http://wallet-api:3001", INITIAL_FOOD_COUNT: "2" }
})

function makeEvent(authId, body) {
    return {
        requestInfo: function() {
            return {
                auth: authId ? { id: authId, collectionId: "_pb_users_auth_" } : null,
                body: body || {}
            }
        },
        json: function(status, data) {
            mockJsonCaptures.push({ status: status, data: data })
            return { status: status, data: data }
        }
    }
}

describe("POST /api/v2/mint-egg", function() {
    it("smoke: hook loads and routes register without error", function() {
        var fs = require("fs")
        var p = require("path")
        var hookSrc = fs.readFileSync(p.join(__dirname, "13-mint-egg-nft.pb.js"), "utf8")
        var routes = {}
        globalThis.routerAdd = function(method, path, handler) { routes[path] = handler }
        expect(function() { eval(hookSrc) }).not.toThrow()
        expect(routes["/api/v2/mint-egg"]).toBeDefined()
    })

    it("smoke: insufficient balance returns 400", function() {
        mockRecords.wallet.set("usdt_balance", 0)

        var fs = require("fs")
        var p = require("path")
        var hookSrc = fs.readFileSync(p.join(__dirname, "13-mint-egg-nft.pb.js"), "utf8")
        var routes = {}
        globalThis.routerAdd = function(method, path, handler) { routes[path] = handler }
        eval(hookSrc)

        routes["/api/v2/mint-egg"](makeEvent(TEST_USER_ID, { referrer_id: null }))

        var lastCap = mockJsonCaptures[mockJsonCaptures.length - 1]
        expect(lastCap).toBeDefined()
        expect(lastCap.status).toBe(400)
    })

    it("smoke: unauthenticated request returns 401", function() {
        var fs = require("fs")
        var p = require("path")
        var hookSrc = fs.readFileSync(p.join(__dirname, "13-mint-egg-nft.pb.js"), "utf8")
        var routes = {}
        globalThis.routerAdd = function(method, path, handler) { routes[path] = handler }
        eval(hookSrc)

        routes["/api/v2/mint-egg"](makeEvent(null, {}))

        var lastCap = mockJsonCaptures[mockJsonCaptures.length - 1]
        expect(lastCap).toBeDefined()
        expect(lastCap.status).toBe(401)
    })
})
