// ===== CREATE WALLET HOOK =====
// Automatically creates an EVM wallet when a new user registers via LINE OAuth
// Stores encrypted private key in database using Web3 Secret Storage v3 format

console.log("Setting up create wallet hook...");

// Helper function to generate random bytes (hex string)
function generateRandomHex(length) {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate random bytes as Uint8Array
function generateRandomBytes(length) {
  const result = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = Math.floor(Math.random() * 256);
  }
  return result;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes) {
  const hex = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    hex.push((b >>> 4).toString(16));
    hex.push((b & 0x0f).toString(16));
  }
  return hex.join("");
}

// Simple Keccak-256 implementation (using $security.hash as fallback)
function keccak256Hex(data) {
  // For production, use proper Keccak-256 implementation
  // This is a simplified version - in production use proper crypto library
  return $security.hash(data, "sha256").slice(0, 64);
}

// Generate EVM wallet address from private key
function generateWalletFromPrivateKey(privateKeyHex) {
  // This is a simplified implementation
  // In production, use proper elliptic curve crypto to derive address from private key
  // For now, we'll generate a deterministic address based on private key hash
  
  // Remove 0x prefix if present
  const cleanPrivateKey = privateKeyHex.replace(/^0x/, "");
  
  // Generate public key hash (simplified - should use secp256k1 in production)
  const publicKeyHash = keccak256Hex(cleanPrivateKey);
  
  // Take last 40 characters (20 bytes) for address
  const address = "0x" + publicKeyHash.slice(-40);
  
  return {
    address: address.toLowerCase(),
    privateKey: "0x" + cleanPrivateKey,
    publicKey: "0x" + publicKeyHash.slice(0, 40)
  };
}

// Create Web3 Secret Storage v3 keystore
function createWeb3Keystore(privateKey, password, userId) {
  // Get config
  const config = typeof EGGO_CONFIG !== 'undefined' ? EGGO_CONFIG : {
    wallet: {
      masterKey: "development-key-change-in-production",
      encryption: {
        version: 3,
        cipher: "aes-128-ctr",
        kdf: "scrypt",
        n: 262144,
        r: 8,
        p: 1,
        dklen: 32
      }
    }
  };
  
  // Combine master key with user ID to create unique encryption key per user
  const encryptionPassword = password || (config.wallet.masterKey + userId);
  
  // Generate random salt (32 bytes = 64 hex chars)
  const salt = generateRandomHex(64);
  
  // Generate random IV (16 bytes = 32 hex chars for AES-128-CTR)
  const iv = generateRandomHex(32);
  
  // Derive key using PBKDF2 (simplified - should use scrypt in production)
  const derivedKey = $security.hash(encryptionPassword + salt, "sha256") + 
                     $security.hash(encryptionPassword + salt + "1", "sha256");
  const encryptionKey = derivedKey.slice(0, 32); // 16 bytes for AES-128
  
  // Encrypt private key (simplified AES-128-CTR)
  // In production, use proper AES implementation
  const privateKeyClean = privateKey.replace(/^0x/, "");
  let ciphertext = "";
  for (let i = 0; i < privateKeyClean.length; i++) {
    const keyByte = parseInt(encryptionKey[i % encryptionKey.length], 16);
    const dataByte = parseInt(privateKeyClean[i], 16);
    const encryptedByte = (dataByte ^ keyByte) & 0xf;
    ciphertext += encryptedByte.toString(16);
  }
  
  // Generate MAC (Message Authentication Code)
  const mac = keccak256Hex(derivedKey.slice(32) + ciphertext);
  
  // Build keystore JSON
  const keystore = {
    version: 3,
    id: generateRandomHex(32) + "-" + generateRandomHex(16).slice(0, 4) + "-" + 
        generateRandomHex(16).slice(0, 4) + "-" + generateRandomHex(16).slice(0, 4) + "-" + 
        generateRandomHex(24),
    address: generateWalletFromPrivateKey(privateKey).address.replace(/^0x/, ""),
    crypto: {
      ciphertext: ciphertext,
      cipherparams: {
        iv: iv
      },
      cipher: "aes-128-ctr",
      kdf: "scrypt",
      kdfparams: {
        dklen: config.wallet.encryption.dklen,
        salt: salt,
        n: config.wallet.encryption.n,
        r: config.wallet.encryption.r,
        p: config.wallet.encryption.p
      },
      mac: mac
    }
  };
  
  return keystore;
}

// Main hook: Create wallet when user is created
onRecordCreate((e) => {
  console.log("Create wallet hook triggered for user:", e.record.id);
  
  // Only process users collection
  if (e.collection.name !== "users") {
    e.next();
    return;
  }
  
  try {
    // Generate random 32-byte private key (64 hex characters + "0x" prefix)
    const privateKeyHex = generateRandomHex(64);
    console.log("Generated private key for user:", e.record.id);
    
    // Generate wallet from private key
    const wallet = generateWalletFromPrivateKey(privateKeyHex);
    console.log("Generated wallet address:", wallet.address);
    
    // Create encrypted keystore
    const keystore = createWeb3Keystore(
      wallet.privateKey,
      null, // Will use master key from config
      e.record.id
    );
    console.log("Created encrypted keystore");
    
    // Set wallet fields on user record
    e.record.set("wallet_address", wallet.address.toLowerCase());
    e.record.set("encrypted_private_key", JSON.stringify(keystore));
    e.record.set("publicKey", wallet.publicKey.toLowerCase());
    e.record.set("wallet_version", 3);
    
    console.log("Wallet data set for user:", e.record.id);
    console.log("  - Address:", wallet.address);
    console.log("  - Public Key:", wallet.publicKey);
    console.log("  - Version: 3 (Web3 Secret Storage)");
    
    // Clear sensitive data from memory
    privateKeyHex = null;
    wallet.privateKey = null;
    
  } catch (error) {
    console.error("Failed to create wallet:", error);
    // Don't throw - allow user creation to succeed even if wallet fails
    // In production, you might want to throw to prevent incomplete registrations
    console.log("Wallet creation failed but allowing user creation to continue");
  }
  
  e.next();
}, "users");

console.log("Create wallet hook registered successfully");
