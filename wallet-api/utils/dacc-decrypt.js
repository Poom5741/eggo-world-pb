/**
 * DACC Private Key Decryption Utility
 * 
 * Decrypts private key from PocketBase encrypted storage using dacc public key and password.
 * Supports AES-256-GCM encrypted wallets (version 4) and legacy XOR (version 3).
 * 
 * Reference: /resources/pkbase-wallet/wallet-srv/src/utils/dacc-wallet.ts
 */

const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_LENGTH = 16

/**
 * Decrypt private key from encrypted PocketBase storage
 * 
 * @param {Object} params - Decryption parameters
 * @param {Object} params.encryptedData - Encrypted private key object from PocketBase
 * @param {string} params.masterKey - Master encryption key (from WALLET_MASTER_KEY env)
 * @param {string} params.identifier - User identifier (daccPublickey or userId) for key derivation
 * @returns {string} - Decrypted private key (0x-prefixed hex string)
 * 
 * @throws {Error} If encryption version is unsupported
 * @throws {Error} If decryption fails (wrong key, corrupted data)
 */
export function decryptPrivateKey({ encryptedData, masterKey, identifier }) {
  // Validate inputs
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('encryptedData is required and must be an object')
  }

  if (!masterKey || typeof masterKey !== 'string') {
    throw new Error('masterKey is required and must be a string')
  }

  if (!identifier || typeof identifier !== 'string') {
    throw new Error('identifier is required and must be a string')
  }

  // Handle legacy XOR encryption (version 3)
  if (encryptedData.version === 3 || encryptedData.kdf === 'simple-xor') {
    return decryptLegacyXOR(encryptedData, masterKey, identifier)
  }

  // Handle AES-GCM encryption (version 4)
  if (encryptedData.version !== 4) {
    throw new Error(`Unsupported encryption version: ${encryptedData.version}. Expected 3 (XOR) or 4 (AES-GCM)`)
  }

  try {
    // Derive encryption key from master key + identifier
    const key = crypto.createHash('sha256').update(masterKey + identifier).digest()
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const authTag = Buffer.from(encryptedData.authTag, 'hex')
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    })

    // Set auth tag before decryption (validates integrity)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, null, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * Legacy XOR decryption for migration support
 * 
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} masterKey - Master encryption key
 * @param {string} identifier - User identifier for key derivation
 * @returns {string} - Decrypted private key
 */
function decryptLegacyXOR(encryptedData, masterKey, identifier) {
  const keyHash = crypto.createHash('sha256').update(masterKey + identifier).digest('hex')
  const keyHex = keyHash.slice(2, 66)
  const ciphertext = encryptedData.ciphertext

  let decrypted = ''
  for (let i = 0; i < ciphertext.length; i += 2) {
    const keyByte = parseInt(keyHex[(i / 2) % keyHex.length], 16)
    const cipherByte = parseInt(ciphertext.substr(i, 2), 16)
    const plainByte = cipherByte ^ keyByte
    decrypted += String.fromCharCode(plainByte)
  }

  return decrypted
}

/**
 * Validate DACC public key format
 * 
 * @param {string} daccPublickey - Public key to validate
 * @returns {boolean} - True if valid format
 */
export function isValidDaccPublickey(daccPublickey) {
  if (!daccPublickey || typeof daccPublickey !== 'string') {
    return false
  }

  // Format: daccPublickey_0x{40}_{...}
  const pattern = /^daccPublickey_0x[a-fA-F0-9]{40}_.*$/
  return pattern.test(daccPublickey)
}

/**
 * Extract Ethereum address from DACC public key
 * 
 * @param {string} daccPublickey - DACC public key (format: daccPublickey_0x...)
 * @returns {string|null} - Ethereum address (0x...) or null if invalid
 */
export function extractAddressFromDaccPublickey(daccPublickey) {
  if (!isValidDaccPublickey(daccPublickey)) {
    return null
  }

  // Extract address from: daccPublickey_0x{address}_{...}
  const match = daccPublickey.match(/^daccPublickey_(0x[a-fA-F0-9]{40})_.*$/)
  return match ? match[1] : null
}
