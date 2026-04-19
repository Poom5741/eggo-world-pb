/**
 * Tests for DACC Private Key Decryption Utility
 */

import { describe, test, expect } from 'bun:test'
import { decryptPrivateKey, isValidDaccPublickey, extractAddressFromDaccPublickey } from './dacc-decrypt.js'
import crypto from 'crypto'

describe('decryptPrivateKey', () => {
  // Helper to create AES-GCM encrypted data
  function createEncryptedData(privateKey, masterKey, identifier) {
    const ALGORITHM = 'aes-256-gcm'
    const iv = crypto.randomBytes(12)
    const key = crypto.createHash('sha256').update(masterKey + identifier).digest()
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: 16
    })
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    
    return {
      version: 4,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: encrypted
    }
  }

  // Helper to create legacy XOR encrypted data
  function createXOREncryptedData(privateKey, masterKey, identifier) {
    const keyHash = crypto.createHash('sha256').update(masterKey + identifier).digest('hex')
    const keyHex = keyHash.slice(2, 66)
    
    let ciphertext = ''
    for (let i = 0; i < privateKey.length; i++) {
      const keyByte = parseInt(keyHex[i % keyHex.length], 16)
      const plainByte = privateKey.charCodeAt(i)
      const cipherByte = plainByte ^ keyByte
      ciphertext += cipherByte.toString(16).padStart(2, '0')
    }
    
    return {
      version: 3,
      ciphertext: ciphertext
    }
  }

  test('decrypts AES-GCM encrypted private key (version 4)', () => {
    const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const masterKey = 'test-master-key-123'
    const identifier = 'daccPublickey_0x1234567890abcdef1234567890abcdef12345678_test'
    
    const encryptedData = createEncryptedData(privateKey, masterKey, identifier)
    
    const decrypted = decryptPrivateKey({
      encryptedData,
      masterKey,
      identifier
    })
    
    expect(decrypted).toBe(privateKey)
  })

  test('decrypts legacy XOR encrypted private key (version 3)', () => {
    const privateKey = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    const masterKey = 'xor-test-key'
    const identifier = 'user123'
    
    const encryptedData = createXOREncryptedData(privateKey, masterKey, identifier)
    
    const decrypted = decryptPrivateKey({
      encryptedData,
      masterKey,
      identifier
    })
    
    expect(decrypted).toBe(privateKey)
  })

  test('throws error if encryptedData is undefined', () => {
    expect(() => {
      decryptPrivateKey({ encryptedData: undefined, masterKey: 'test', identifier: 'test' })
    }).toThrow('encryptedData is required and must be an object')
  })

  test('throws error if encryptedData is not an object', () => {
    expect(() => {
      decryptPrivateKey({ encryptedData: 'string', masterKey: 'test', identifier: 'test' })
    }).toThrow('encryptedData is required and must be an object')
  })

  test('throws error if masterKey is undefined', () => {
    expect(() => {
      decryptPrivateKey({ encryptedData: { version: 4 }, masterKey: undefined, identifier: 'test' })
    }).toThrow('masterKey is required and must be a string')
  })

  test('throws error if identifier is undefined', () => {
    expect(() => {
      decryptPrivateKey({ encryptedData: { version: 4 }, masterKey: 'test', identifier: undefined })
    }).toThrow('identifier is required and must be a string')
  })

  test('throws error if encryption version is unsupported', () => {
    const encryptedData = { version: 99, ciphertext: 'test' }
    
    expect(() => {
      decryptPrivateKey({ encryptedData, masterKey: 'test', identifier: 'test' })
    }).toThrow('Unsupported encryption version: 99')
  })

  test('throws error if decryption fails (wrong key)', () => {
    const privateKey = '0x1234567890abcdef'
    const masterKey = 'correct-key'
    const identifier = 'user1'
    
    const encryptedData = createEncryptedData(privateKey, masterKey, identifier)
    
    // Try to decrypt with wrong key
    expect(() => {
      decryptPrivateKey({ encryptedData, masterKey: 'wrong-key', identifier })
    }).toThrow('Decryption failed')
  })

  test('returns consistent result for same inputs (deterministic)', () => {
    const privateKey = '0xdeterministic1234567890abcdef1234567890abcdef1234567890abcdef'
    const masterKey = 'deterministic-key'
    const identifier = 'deterministic-user'
    
    const encryptedData1 = createEncryptedData(privateKey, masterKey, identifier)
    const encryptedData2 = createEncryptedData(privateKey, masterKey, identifier)
    
    const decrypted1 = decryptPrivateKey({ encryptedData: encryptedData1, masterKey, identifier })
    const decrypted2 = decryptPrivateKey({ encryptedData: encryptedData2, masterKey, identifier })
    
    expect(decrypted1).toBe(decrypted2)
    expect(decrypted1).toBe(privateKey)
  })
})

describe('isValidDaccPublickey', () => {
  test('returns true for valid format', () => {
    expect(isValidDaccPublickey('daccPublickey_0x1234567890abcdef1234567890abcdef12345678_test')).toBe(true)
  })

  test('returns true for valid format with different suffix', () => {
    expect(isValidDaccPublickey('daccPublickey_0xabcdef1234567890abcdef1234567890abcdef12_suffix123')).toBe(true)
  })

  test('returns false for undefined', () => {
    expect(isValidDaccPublickey(undefined)).toBe(false)
  })

  test('returns false for non-string', () => {
    expect(isValidDaccPublickey(123)).toBe(false)
    expect(isValidDaccPublickey(null)).toBe(false)
  })

  test('returns false if doesn\'t start with daccPublickey_', () => {
    expect(isValidDaccPublickey('0x1234567890abcdef1234567890abcdef12345678_test')).toBe(false)
    expect(isValidDaccPublickey('DaccPublickey_0x1234_test')).toBe(false)
    expect(isValidDaccPublickey('daccpublickey_0x1234_test')).toBe(false)
  })

  test('returns false if address part is not 40 hex chars', () => {
    expect(isValidDaccPublickey('daccPublickey_0x123_test')).toBe(false)
    expect(isValidDaccPublickey('daccPublickey_0x1234567890abcdef1234567890abcdef123456789_test')).toBe(false)
  })

  test('returns false for empty string', () => {
    expect(isValidDaccPublickey('')).toBe(false)
  })
})

describe('extractAddressFromDaccPublickey', () => {
  test('extracts address from valid daccPublickey', () => {
    const daccPublickey = 'daccPublickey_0x1234567890abcdef1234567890abcdef12345678_suffix'
    expect(extractAddressFromDaccPublickey(daccPublickey)).toBe('0x1234567890abcdef1234567890abcdef12345678')
  })

  test('returns null for invalid format', () => {
    expect(extractAddressFromDaccPublickey('invalid')).toBe(null)
    expect(extractAddressFromDaccPublickey('')).toBe(null)
    expect(extractAddressFromDaccPublickey(undefined)).toBe(null)
  })

  test('returns null if address part is wrong length', () => {
    expect(extractAddressFromDaccPublickey('daccPublickey_0x123_test')).toBe(null)
  })
})

// Integration test placeholder
describe.skip('decryptPrivateKey integration', () => {
  test('decrypts real wallet from PocketBase (requires PB connection)', () => {
    console.log('Integration test skipped - requires PocketBase connection and real wallet data')
  })
})
