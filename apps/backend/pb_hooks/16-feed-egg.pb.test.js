/**
 * Feed Egg Hook Tests
 * Tests for 16-feed-egg.pb.js hook
 *
 * Validates foodCount fast-fail logic before wallet-api call.
 */

import { describe, it, expect, beforeEach } from 'bun:test';

// ============================================
// MOCKS
// ============================================

let capturedRoutes = [];
let mockFetchCalls = [];
let mockSavedRecords = [];
let mockCreatedRecords = [];

const createMockRecord = (data) => ({
    id: data.id || 'test-record-id',
    get: (field) => data[field] ?? null,
    set: (field, value) => { data[field] = value; },
    ...data
});

const mockUser = createMockRecord({
    id: 'user-123',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEa1',
    daccPublickey: '0xpubkey',
    pin: '1234',
    total_food_consumed: 0
});

const createMockEgg = (overrides = {}) => createMockRecord({
    id: 'egg-123',
    token_id: 1,
    egg_id: 1,
    food_count: 0,
    is_hatched: false,
    ...overrides
});

const createMockFood = (overrides = {}) => createMockRecord({
    id: 'food-123',
    food_id: 1,
    food_type: 'grain',
    is_consumed: false,
    ...overrides
});

// Mock $os global
globalThis.$os = {
    getenv: (key) => {
        if (key === 'WALLET_SRV_URL') return 'http://localhost:3001';
        if (key === 'FOOD_NFT_CONTRACT_ADDRESS') return '0xbb0E0FcB40E209f7751A784F6b8d63E9C127D8fC';
        if (key === 'EGG_NFT_CONTRACT_ADDRESS') return '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
        return null;
    }
};

// Mock $apis global
globalThis.$apis = {
    requireAuth: () => mockUser
};

// Mock $app global
globalThis.$app = {
    dao: () => ({
        findRecordsByFilter: (collection, filter) => {
            if (collection === 'egg_nfts') {
                return [createMockEgg({ food_count: globalThis.__testEggFoodCount ?? 0 })];
            }
            if (collection === 'food_nfts') {
                const foodIdMatch = filter.match(/food_id\s*=\s*(\d+)/);
                const foodId = foodIdMatch ? parseInt(foodIdMatch[1], 10) : 1;
                return [createMockFood({ food_id: foodId })];
            }
            return [];
        },
        getCollectionByNameOrId: (name) => ({ name }),
        saveRecord: (record) => {
            mockSavedRecords.push(record);
            return record;
        },
        createRecord: (collection) => {
            const rec = createMockRecord({ id: 'new-' + Math.random().toString(36).slice(2) });
            mockCreatedRecords.push({ collection, record: rec });
            return rec;
        }
    })
};

// Mock routerAdd to capture route handlers
globalThis.routerAdd = (method, path, handler) => {
    capturedRoutes.push({ method, path, handler });
};

// Mock fetch for wallet-api calls
globalThis.fetch = (url, options) => {
    mockFetchCalls.push({ url, options });
    return {
        ok: true,
        json: () => ({
            success: true,
            data: {
                txHash: '0xabc123def456',
                newFoodCount: 10
            }
        })
    };
};

// Helper to create mock event
const createMockEvent = (body = {}) => ({
    parseBody: () => body,
    json: (status, data) => ({ status, data })
});

// ============================================
// LOAD HOOK
// ============================================

// Clear any previous requires
const hookPath = import.meta.dir + '/16-feed-egg.pb.js';

// We need to evaluate the hook in this context so it registers with our mocks
// Since ES modules are cached, we read and eval to ensure fresh execution
const hookSource = await Bun.file(hookPath).text();
eval(hookSource);

const feedEggRoute = capturedRoutes.find(r => r.path === '/api/v2/feed-egg');

// ============================================
// TEST SUITE
// ============================================

describe('16-feed-egg.pb.js - Feed Egg Hook', () => {
    beforeEach(() => {
        mockFetchCalls = [];
        mockSavedRecords = [];
        mockCreatedRecords = [];
        globalThis.__testEggFoodCount = 0;
    });

    describe('Endpoint Registration', () => {
        it('should register POST /api/v2/feed-egg endpoint', () => {
            expect(feedEggRoute).toBeDefined();
            expect(feedEggRoute.method).toBe('POST');
            expect(feedEggRoute.path).toBe('/api/v2/feed-egg');
        });
    });

    describe('foodCount Fast-Fail Validation', () => {
        it('rejects feed when currentFoodCount + requestedFoodCount > 10', () => {
            globalThis.__testEggFoodCount = 8;

            const event = createMockEvent({
                egg_token_id: 1,
                food_ids: [1, 2, 3] // 8 + 3 = 11 > 10
            });

            const response = feedEggRoute.handler(event);

            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);
            expect(response.data.error.code).toBe('EGG_FULL');
            expect(response.data.error.message).toBe('Cannot feed this egg — it is full and ready to hatch');

            // Should NOT call wallet-api
            expect(mockFetchCalls.length).toBe(0);
        });

        it('allows feed when total would be exactly 10', () => {
            globalThis.__testEggFoodCount = 7;

            const event = createMockEvent({
                egg_token_id: 1,
                food_ids: [1, 2, 3] // 7 + 3 = 10
            });

            const response = feedEggRoute.handler(event);

            // Should proceed past validation (would reach wallet-api mock)
            // Since wallet-api mock returns success, we expect 200
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(mockFetchCalls.length).toBe(1);
        });

        it('allows feed when total would be less than 10', () => {
            globalThis.__testEggFoodCount = 2;

            const event = createMockEvent({
                egg_token_id: 1,
                food_ids: [1, 2] // 2 + 2 = 4
            });

            const response = feedEggRoute.handler(event);

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(mockFetchCalls.length).toBe(1);
        });

        it('rejects feed when egg is already at 10 food_count', () => {
            globalThis.__testEggFoodCount = 10;

            const event = createMockEvent({
                egg_token_id: 1,
                food_ids: [1] // 10 + 1 = 11 > 10
            });

            const response = feedEggRoute.handler(event);

            expect(response.status).toBe(400);
            expect(response.data.error.code).toBe('EGG_FULL');
        });
    });

    describe('Response Format', () => {
        it('returns correct error format for EGG_FULL', () => {
            globalThis.__testEggFoodCount = 9;

            const event = createMockEvent({
                egg_token_id: 1,
                food_ids: [1, 2] // 9 + 2 = 11 > 10
            });

            const response = feedEggRoute.handler(event);

            expect(response.data).toHaveProperty('success', false);
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toHaveProperty('message');
            expect(response.data.error).toHaveProperty('code', 'EGG_FULL');
        });
    });
});

console.log('Tests loaded: 16-feed-egg.pb.test.js');
