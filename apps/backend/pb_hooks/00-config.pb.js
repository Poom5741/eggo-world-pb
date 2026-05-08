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
    apiKey: process.env.WALLET_API_KEY || "",
    
    // Wallet service URL for hooks (DACC migration)
    srvUrl: process.env.WALLET_SRV_URL || "http://wallet-api:3001"
  },
  
  // App Configuration
  app: {
    name: process.env.APP_NAME || "eggo-pb",
    url: process.env.APP_URL || "http://localhost:8090",
    environment: process.env.NODE_ENV || "development"
  },
  
  // Blockchain Configuration
  blockchain: {
    // RPC Configuration
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
    rpcWssUrl: process.env.BSC_RPC_WSS_URL || "",
    chainId: parseInt(process.env.BSC_CHAIN_ID || "7117"),
    
    // Platform settings
    platformAddress: process.env.PLATFORM_ADDRESS || "0x0000000000000000000000000000000000000000", // Platform fee recipient
    platformFeePercent: 4, // 4% CoinStor fee
    
// Deployed contract addresses (v0.6.0 deployment - chain 7117)
    // Can be overridden per-environment via env vars (E2E uses local Anvil addresses)
    contracts: {
      MockUSDT: process.env.MOCK_USDT_ADDRESS || "0xCcA613d42D72592615289b888E29c2eB218cfDC9",
      CommissionDistribution: process.env.COMMISSION_DISTRIBUTION_ADDRESS || "0x9A1411db0344Bb1fDC6f3B6f04419B05C48dD7EF",
      AnimalNFT: process.env.ANIMAL_NFT_ADDRESS || "0xfd8FaEe6aaB9A2e84F5AaDBf4917fF69CC4411a3",
      EggNFT: process.env.EGG_NFT_ADDRESS || "0xaEF5bd8f90edB4532E39017746Fe6904d96A90E3",
      FoodNFT: process.env.FOOD_NFT_ADDRESS || "0xACb93BD52b9520A58bCD24AB0CAd8149Da7C91dB",
      Marketplace: process.env.MARKETPLACE_ADDRESS || "0x35B1B840b8907c2b87cBf87753524b7ef07A1935"
    },

    // E2E / local testing mode – when true, hooks skip on-chain verification
    // and trust PocketBase as source of truth. Enables full local E2E runs
    // without a funded, real-chain RPC.
    mockBlockchain: (process.env.MOCK_BLOCKCHAIN || "").toLowerCase() === "true",
    
    // Sync settings
    pollingInterval: 30000, // 30 seconds
    maxRetries: 3
  },
  
  // Game Configuration
  game: {
    initialFoodCount: 2, // Bonus food when minting egg
    eggPrice: 25, // 25 USDT
    foodPrice: 0.50, // 0.50 USDT
    maxEggFood: 10 // Max food items to hatch
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
