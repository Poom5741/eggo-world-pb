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
    
    // Deployed contract addresses (Phase 1 deployment)
    // Can be overridden per-environment via env vars (E2E uses local Anvil addresses)
    contracts: {
      MockUSDT: process.env.MOCK_USDT_ADDRESS || "0xd4E10E3d006DDcfE76478D0B5eD8f81b43a798aD",
      CommissionDistribution: process.env.COMMISSION_DISTRIBUTION_ADDRESS || "0xd0e6DDb30c22A3f6f97CdB3E87f778729dCA9982",
      AnimalNFT: process.env.ANIMAL_NFT_ADDRESS || "0xfffead66182f0c40e9B2A506f1C15e4D8F7Fda72",
      EggNFT: process.env.EGG_NFT_ADDRESS || "0xc4F507877d829dBEEE92cE27dbe9CfEFAd944D8C",
      FoodNFT: process.env.FOOD_NFT_ADDRESS || "0xc1544FB4Db60A57F20de56cA170232791Adc1c8E"
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
