// ===== CONFIGURATION HOOK =====
// Centralized configuration for eggo-pb PocketBase instance

console.log("Loading eggo-pb configuration...");

// Environment configuration
// Note: In production, set these via environment variables
const CONFIG = {
  // LINE OAuth Configuration
  line: {
    channelId: process.env.LINE_CHANNEL_ID || "",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "",
    authorizationUrl: "https://access.line.me/oauth2/v2.1/authorize",
    tokenUrl: "https://api.line.me/oauth2/v2.1/token",
    userInfoUrl: "https://api.line.me/oauth2/v2.1/userinfo",
    scopes: "openid profile email"
  },
  
  // Wallet Configuration
  wallet: {
    // Master key for encrypting private keys (MUST be set in production)
    // Generate with: openssl rand -hex 32
    masterKey: process.env.WALLET_MASTER_KEY || "development-key-change-in-production",
    
    // Encryption settings for Web3 Secret Storage v3
    encryption: {
      version: 3,
      cipher: "aes-128-ctr",
      kdf: "scrypt",
      // Scrypt parameters
      n: 262144,  // CPU/memory cost
      r: 8,       // block size
      p: 1,       // parallelization
      dklen: 32   // derived key length
    },
    
    // Wallet API (optional - for external wallet service)
    apiUrl: process.env.WALLET_API_URL || "",
    apiKey: process.env.WALLET_API_KEY || ""
  },
  
  // App Configuration
  app: {
    name: process.env.APP_NAME || "eggo-pb",
    url: process.env.APP_URL || "http://localhost:8090",
    environment: process.env.NODE_ENV || "development"
  }
};

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (CONFIG.app.environment === "production") {
    if (!CONFIG.wallet.masterKey || CONFIG.wallet.masterKey === "development-key-change-in-production") {
      errors.push("WALLET_MASTER_KEY must be set in production");
    }
    if (CONFIG.wallet.masterKey.length < 32) {
      errors.push("WALLET_MASTER_KEY must be at least 32 characters");
    }
  }
  
  if (errors.length > 0) {
    console.error("Configuration errors:", errors);
    throw new Error("Invalid configuration: " + errors.join(", "));
  }
  
  console.log("Configuration validated successfully");
}

// Export configuration for use in other hooks
// Note: PocketBase JS VM uses global scope
if (typeof globalThis !== 'undefined') {
  globalThis.EGGO_CONFIG = CONFIG;
}

// Initial validation
validateConfig();

console.log("eggo-pb configuration loaded successfully");
console.log("Environment:", CONFIG.app.environment);
