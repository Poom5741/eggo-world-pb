import crypto from 'crypto';

/**
 * Encrypts a private key using AES-256-GCM encryption
 * @param {string} privateKey The private key string to encrypt
 * @param {string} masterKey The master key from environment variable
 * @returns {Object} Encrypted data with versioning information
 */
function encryptPrivateKey(privateKey, masterKey) {
  // Validate inputs
  if (!privateKey || typeof privateKey !== 'string') {
    throw new Error('Private key must be a non-empty string');
  }
  
  if (!masterKey || typeof masterKey !== 'string') {
    throw new Error('Master key must be a non-empty string');
  }

  const key = crypto.createHash('sha256').update(masterKey).digest();
  const iv = crypto.randomBytes(12);
  
  // Create cipher with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the private key  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return encrypted data in the specified format
  return {
    version: 4, // Version 4 for AES-GCM
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: encrypted
  };
}

/**
 * Decrypts a private key, supporting multiple encryption versions
 * @param {Object} encryptedData The encrypted data object
 * @param {string} masterKey The master key from environment variable
 * @returns {string} The decrypted private key
 */
function decryptPrivateKey(encryptedData, masterKey) {
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('Encrypted data must be an object');
  }
  
  if (!masterKey || typeof masterKey !== 'string') {
    throw new Error('Master key must be a non-empty string');
  }
  
  // Detect version and handle accordingly
  const version = encryptedData.version;
  
  switch(version) {
    case 4:
      // AES-256-GCM decryption (current version)
      return decryptPrivateKeyVersion4(encryptedData, masterKey);
    case 3:
      // Legacy XOR decryption
      return decryptPrivateKeyVersion3(encryptedData, masterKey);
    default:
      throw new Error(`Unsupported encryption version: ${version}`);
  }
}

/**
 * Decrypts private key using AES-256-GCM (version 4)
 * @param {Object} encryptedData The encrypted data object
 * @param {string} masterKey The master key from environment variable
 * @returns {string} The decrypted private key
 */
function decryptPrivateKeyVersion4(encryptedData, masterKey) {
  // Validate encrypted data structure
  if (!encryptedData.iv || !encryptedData.authTag || !encryptedData.ciphertext) {
    throw new Error('Invalid encrypted data format for AES-GCM version 4');
  }
  
  const key = crypto.createHash('sha256').update(masterKey).digest();
  
  // Convert hex strings back to buffers
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'hex');
  
  // Create decipher with AES-256-GCM
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Actually decrypt and return the result
  let decrypted = decipher.update(ciphertext, null, 'utf8');
  try {
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Authentication failed during decryption: ' + err.message);
  }
}

/**
 * Decrypts private key using legacy XOR encryption (version 3)
 * @param {Object} encryptedData The encrypted data object
 * @param {string} masterKey The master key from environment variable
 * @returns {string} The decrypted private key
 */
function decryptPrivateKeyVersion3(encryptedData, masterKey) {
  if (!encryptedData.data) {
    throw new Error('Invalid encrypted data format for XOR version 3');
  }
  
  // For backward compatibility with old XOR encryption
  const encryptedBuffer = Buffer.from(encryptedData.data, 'hex');
  const keyBuffer = Buffer.from(masterKey);
  const decryptedChunks = [];
  
  for (let i = 0; i < encryptedBuffer.length; i++) {
    decryptedChunks.push(encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length]);
  }
  
  try {
    return Buffer.from(decryptedChunks).toString('utf8');
  } catch (err) {
    throw new Error('Failed to decrypt XOR version 3 data: ' + err.message);
  }
}

export {
  encryptPrivateKey,
  decryptPrivateKey
};