import { describe, it, expect, beforeAll } from 'bun:test'

// Integration tests for wallet API endpoints
// Note: These tests assume the wallet API is running on port 3001
const API_BASE = 'http://localhost:3001'
let serverAvailable = false

beforeAll(async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
    serverAvailable = response.ok
  } catch {
    serverAvailable = false
  }
})

describe('Wallet Creation API Integration', () => {
  beforeAll(() => {
    if (!serverAvailable) {
      console.log('Skipping integration tests - wallet-api server not running on localhost:3001')
    }
  })

  describe('POST /api/wallet/create', () => {
    it('should create wallet with valid password', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: 'TestPassword123!@#',
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(data.data.daccPublickey).toMatch(/^daccPublickey_/)
    })

    it('should reject request without password', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should reject password too short (< 12 chars)', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: 'Short1!',
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should reject password too long (> 120 chars)', async () => {
      if (!serverAvailable) return
      const longPassword = 'a'.repeat(121)
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: longPassword,
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should accept minimum length password (12 chars)', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: 'Password123!',
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.address).toBeDefined()
      expect(data.data.daccPublickey).toBeDefined()
    })

    it('should accept maximum length password (120 chars)', async () => {
      if (!serverAvailable) return
      const maxPassword = 'a'.repeat(120)
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: maxPassword,
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.address).toBeDefined()
    })

    it('should handle special characters in password', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordSecretkey: 'P@ssw0rd!#$%^&*()123',
          publicEncryption: false,
        }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('GET /api/wallet/create-info', () => {
    it('should return wallet creation configuration', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/api/wallet/create-info`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.minPasswordLength).toBe('12')
      expect(data.data.maxPasswordLength).toBe('120')
      expect(Array.isArray(data.data.supportedNetworks)).toBe(true)
      expect(data.data.supportedNetworks.length).toBeGreaterThan(0)
      expect(typeof data.data.publicEncryptionEnabled).toBe('boolean')
    })
  })

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      if (!serverAvailable) return
      const response = await fetch(`${API_BASE}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('OK')
      expect(data.service).toBe('wallet-api')
      expect(data.version).toBe('2.0.0')
    })
  })
})

describe('Wallet Format Validation', () => {
  it('should return valid EVM address format', async () => {
    if (!serverAvailable) return
    const response = await fetch(`${API_BASE}/api/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passwordSecretkey: 'ValidPassword123!',
        publicEncryption: false,
      }),
    })

    const data = await response.json()
    const address = data.data.address
    
    // Validate EVM address format (40 hex chars with 0x prefix)
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    
    // Validate dacc public key format
    expect(data.data.daccPublickey).toMatch(/^daccPublickey_0x[a-fA-F0-9]{40}_/)
    expect(data.data.daccPublickey.length).toBeGreaterThan(100) // Should include signature
  })

  it('should return consistent address from public key', async () => {
    if (!serverAvailable) return
    const response = await fetch(`${API_BASE}/api/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passwordSecretkey: 'ConsistentTest123!',
        publicEncryption: false,
      }),
    })

    const data = await response.json()
    const { address, daccPublickey } = data.data
    
    // DACC public key should contain the address (case-insensitive check)
    expect(daccPublickey.toLowerCase()).toContain(address.substring(2).toLowerCase())
  })
})

describe('Error Handling', () => {
  it('should handle malformed JSON', async () => {
    if (!serverAvailable) return
    const response = await fetch(`${API_BASE}/api/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    })

    // Express should return 400 for malformed JSON
    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  it('should handle empty body', async () => {
    if (!serverAvailable) return
    const response = await fetch(`${API_BASE}/api/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    })

    const data = await response.json()
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(data.success).toBe(false)
  })
})
