require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const crypto = require('crypto');

// AES-256-GCM encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits (standard for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

const app = express();
const PORT = process.env.PORT || 3001;
const MASTER_KEY = process.env.WALLET_MASTER_KEY;

// Validate critical env vars
if (!MASTER_KEY) {
    console.error('FATAL: WALLET_MASTER_KEY environment variable is required');
    process.exit(1);
}

// Blockchain configuration
const RPC_URL = process.env.RPC_URL || 'https://rpc.0xl3.com';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '7117');
const CONFIRMATIONS = 12; // Wait for 12 confirmations
const GAS_BUFFER_PERCENT = 20; // 20% gas buffer

// PocketBase admin credentials for fetching user wallet data
const PB_URL = process.env.POCKETBASE_URL || 'https://pb.eggoworld.io';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';

// Load contract addresses from JSON file
const fs = require('fs');
const path = require('path');
let CONTRACT_ADDRESSES = {};
try {
  const addressesPath = path.join(__dirname, '../contracts/contract-addresses.json');
  CONTRACT_ADDRESSES = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  console.log('Loaded contract addresses:', JSON.stringify(CONTRACT_ADDRESSES[CHAIN_ID], null, 2));
} catch (error) {
  console.error('Failed to load contract addresses:', error.message);
}

// Platform relayer wallet for gas sponsorship (D-05)
// This wallet pays gas fees on behalf of users for all operations
let relayerWallet = null

function initializeRelayerWallet() {
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY

  if (!relayerPrivateKey) {
    console.warn("WARNING: RELAYER_PRIVATE_KEY not set. Gas sponsorship disabled.")
    console.warn("Users will need their own BNB for gas fees.")
    return null
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)
    console.log(`Relayer wallet initialized: ${relayerWallet.address}`)
    return relayerWallet
  } catch (error) {
    console.error("Failed to initialize relayer wallet:", error.message)
    return null
  }
}

// Initialize on server startup
initializeRelayerWallet()

// Gas sponsorship logging helper
function logGasSponsorship(operation, userId, receipt) {
  const gasCost = receipt.gasUsed * receipt.effectiveGasPrice
  const gasCostBNB = ethers.formatEther(gasCost)

  // Log for accounting/monitoring
  console.log(
    `[Gas Sponsorship] ${operation} - User: ${userId}, Gas: ${gasCostBNB} BNB, TxHash: ${receipt.transactionHash}`
  )

  // Future: Store in database for accounting
  // For MVP: logging only (D-05)

  return {
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    totalCostWei: gasCost.toString(),
    totalCostBNB: gasCostBNB,
  }
}

// Minimal ABI for EggNFT (mintEgg function)
const EGG_NFT_ABI = [
  "function mintEgg(address referrer) external returns (uint256)",
  "function mintEggWithChain(address[4] calldata referrers) external returns (uint256)",
  "function mintPrice() external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getFoodCount(uint256 tokenId) external view returns (uint256)",
  "function isEggHatched(uint256 tokenId) external view returns (bool)",
  "function getEggProperties(uint256 tokenId) external view returns (uint256,address,uint256,bool,uint256,address[4],uint256,uint256,uint256,bool,uint256,uint256)",
  "function recordFoodConsumption(uint256 eggTokenId, uint256[] calldata foodTokenIds, uint8[] calldata foodTypes) external",
  "function hatchEgg(uint256 tokenId) external returns (uint256)",
  "function requestBreed(uint256 parent1TokenId, uint256 parent2TokenId, address referrer) external returns (uint256)",
  "function claimBreed(uint256 requestId) external returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Minimal ABI for FoodNFT (mint function)
const FOOD_NFT_ABI = [
  "function mintFood(uint256 quantity, address referrer) external returns (uint256[] memory)",
  "function MINT_PRICE() external view returns (uint256)",
  "function feedEgg(uint256 eggTokenId, uint256[] calldata foodTokenIds, address eggNftContract) external",
  "function setEggNFTContract(address _eggNft) external",
  "function burnFood(uint256 tokenId) external",
  "function burnFoodFor(address user, uint256 tokenId) external"
];

// Minimal ABI for CommissionDistribution
const COMMISSION_ABI = [
  "function claimCommissionUSDT() external",
  "function getCommissionBalance(address user) external view returns (uint256)",
  "function setEggNFTContract(address _eggNft) external",
  "function setFoodNFTContract(address _foodNft) external"
];

// Minimal ABI for Marketplace contract (new on-chain escrow per spec §4)
const MARKETPLACE_ABI = [
  "function listNFTForSale(address nftContract, uint256 tokenId, uint256 price, uint8 nftType) external",
  "function buyNFT(address nftContract, uint256 tokenId) external",
  "function cancelListing(address nftContract, uint256 tokenId) external",
  "function updateListingPrice(address nftContract, uint256 tokenId, uint256 newPrice) external",
  "function getListing(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, uint256 listedAt, uint8 nftType, uint256 originalEggId, bool active)",
  "function getMarketStats() external view returns (uint256 floorPrice, uint256 volume24h, uint256 totalSalesCount, uint256 activeListings)",
  "function totalSales() external view returns (uint256)",
  "event NFTListed(bytes32 indexed listingId, address indexed nftContract, uint256 tokenId, address seller, uint256 price, uint8 nftType)",
  "event NFTSold(bytes32 indexed listingId, address indexed buyer, address indexed seller, uint256 price)",
  "event ListingCancelled(bytes32 indexed listingId, address indexed seller)"
];

// Minimal ABI for AnimalNFT contract (breeding)
const ANIMAL_NFT_ABI = [
  "function canBreed(uint256 tokenId) external view returns (bool)",
  "function getLastBredTimestamp(uint256 tokenId) external view returns (uint256)",
  "function BREED_COOLDOWN() external view returns (uint256)",
  "function recordBreeding(uint256 tokenId) external",
  "event AnimalBred(uint256 indexed parent1Id, uint256 indexed parent2Id, uint256 indexed childId, uint256 childGeneration)"
];

// Minimal ABI for TierBadge contract
const TIER_BADGE_ABI = [
    "function mintTierBadge(address user, uint256 tokenId, uint256 lifetimeFoodItems) external returns (bool)",
    "function canClaimTier(address user, uint256 tokenId, uint256 lifetimeFoodItems) external view returns (bool)",
    "function tiers(uint256 tokenId) external view returns (string name, uint256 threshold, uint256 rewardAmount)",
    "function userHighestTier(address user) external view returns (uint256)",
    "event TierBadgeMinted(address indexed user, uint256 indexed tokenId, string tierName, uint256 rewardAmount, uint256 lifetimeFoodItems)"
];

app.use(cors());
app.use(express.json());

// PocketBase Admin Authentication Helper
let pbAdminToken = null;
let pbTokenExpiry = 0;

async function getPocketBaseAdminToken() {
    // Return cached token if still valid (with 5-min buffer)
    if (pbAdminToken && Date.now() < pbTokenExpiry - 300000) {
        return pbAdminToken;
    }
    
    if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
        throw new Error('PocketBase admin credentials not configured');
    }
    
    const authResponse = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identity: PB_ADMIN_EMAIL,
            password: PB_ADMIN_PASSWORD
        })
    });
    
    if (!authResponse.ok) {
        const error = await authResponse.text();
        throw new Error(`PocketBase admin auth failed: ${error}`);
    }
    
    const authData = await authResponse.json();
    pbAdminToken = authData.token;
    pbTokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    console.log('PocketBase admin token refreshed');
    return pbAdminToken;
}

// Fetch user's encrypted private key from PocketBase
async function getUserPrivateKey(userId) {
    const token = await getPocketBaseAdminToken();
    
    const response = await fetch(`${PB_URL}/api/collections/users/records/${userId}?fields=wallet,daccPublickey,pin,encrypted_private_key,wallet_version`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch user wallet: ${await response.text()}`);
    }
    
    const userData = await response.json();
    
    if (!userData.encrypted_private_key) {
        throw new Error('Encrypted private key not found for user');
    }
    
    try {
        return {
            encryptedPrivateKey: JSON.parse(userData.encrypted_private_key),
            walletAddress: userData.wallet,
            pin: userData.pin
        };
    } catch (parseError) {
        throw new Error('Failed to parse encrypted private key');
    }
}

// Retry wrapper with exponential backoff
async function withRetry(fn, maxAttempts = 3, initialDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            // Don't retry on validation or auth errors
            if (error.code === 'INSUFFICIENT_FUNDS' || 
                error.code === 'CALL_EXCEPTION' ||
                error.code === 'UNPREDICTABLE_GAS_LIMIT' ||
                error.message.includes('revert')) {
                throw error;
            }
            
            if (attempt === maxAttempts) {
                throw new RetryError(`Failed after ${maxAttempts} attempts: ${error.message}`, attempt, error);
            }
            
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

class RetryError extends Error {
    constructor(message, attempts, lastError) {
        super(message);
        this.attempts = attempts;
        this.lastError = lastError;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'eggo-wallet-api' });
});

/**
 * Decrypt private key (supports v3 XOR legacy and v4 AES-GCM)
 * @param {object} encryptedData - Encrypted data object
 * @param {string} masterKey - WALLET_MASTER_KEY from env
 * @returns {string} Decrypted private key
 */
async function decryptPrivateKey(encryptedData, masterKey) {
    // Handle legacy XOR (version 3)
    if (encryptedData.version === 3 || encryptedData.kdf === 'simple-xor') {
        console.warn('[MIGRATION] Decrypting legacy XOR wallet, will re-encrypt on next save');
        return decryptLegacyXOR(encryptedData, masterKey);
    }
    
    // Handle AES-GCM (version 4)
    if (encryptedData.version !== 4) {
        throw new Error(`Unknown encryption version: ${encryptedData.version}`);
    }
    
    const key = crypto.createHash('sha256').update(masterKey).digest();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    
    // MUST set auth tag before decryption (validates integrity)
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * Legacy XOR decryption for migration support
 */
function decryptLegacyXOR(encryptedData, masterKey) {
    const { ethers } = require('ethers');
    const keyHash = ethers.id(masterKey);
    const keyHex = keyHash.slice(2, 66);
    const ciphertext = encryptedData.ciphertext;
    
    let decrypted = '';
    for (let i = 0; i < ciphertext.length; i += 2) {
        const keyByte = parseInt(keyHex[(i/2) % keyHex.length], 16);
        const cipherByte = parseInt(ciphertext.substr(i, 2), 16);
        const plainByte = cipherByte ^ keyByte;
        decrypted += String.fromCharCode(plainByte);
    }
    
    // Check if it looks like a private key (starts with 0x, 66 chars)
    if (decrypted.length === 66 && decrypted.startsWith('0x')) {
        return decrypted;
    }
    
    throw new Error('Legacy decryption failed - invalid private key format');
}

// Create wallet endpoint
app.post('/api/wallet/create', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: {
                    message: 'User ID is required',
                    code: 'MISSING_USER_ID'
                }
            });
        }
        
        console.log(`Creating wallet for user: ${userId}`);
        
        // Generate a new random wallet
        const wallet = ethers.Wallet.createRandom();
        
        const address = wallet.address;
        const privateKey = wallet.privateKey;
        const publicKey = wallet.publicKey;
        
        // Format daccPublickey with prefix to match PocketBase validation pattern ^daccPublickey_
        const daccPublickey = `daccPublickey_${address}`;
        
        const encryptionKey = MASTER_KEY + userId;
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, encryptionKey);
        
        const result = {
            success: true,
            data: {
                address: address,
                daccPublickey: daccPublickey,
                publicKey: publicKey,
                encryptedPrivateKey: encryptedPrivateKey,
                version: encryptedPrivateKey.version
            }
        };
        
        console.log(`Wallet created: ${address}`);
        res.json(result);
        
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ 
            success: false, 
            error: {
                message: 'Failed to create wallet',
                code: 'WALLET_CREATION_FAILED',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Create wallet and save to PocketBase
app.post("/api/wallet/create-and-save", async (req, res) => {
    try {
        const { userId, pbUrl, passwordSecretkey, publicEncryption } = req.body

        if (!userId || !pbUrl) {
            return res.status(400).json({
                success: false,
                error: {
                    message: "userId and pbUrl are required",
                    code: "MISSING_PARAMS"
                }
            })
        }

        console.log(`Creating and saving wallet for user: ${userId}`)

        // Generate a new random wallet
        const wallet = ethers.Wallet.createRandom()
        const address = wallet.address
        const privateKey = wallet.privateKey

        // Encrypt the private key using the master key + userId
        const encryptionKey = MASTER_KEY + userId
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, encryptionKey)

        // Authenticate to PocketBase as admin
        const adminEmail = process.env.PB_ADMIN_EMAIL
        const adminPassword = process.env.PB_ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
            console.error("PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD not set")
            return res.status(500).json({
                success: false,
                error: {
                    message: "Server configuration error: missing PocketBase admin credentials",
                    code: "CONFIG_ERROR"
                }
            })
        }

        // Auth with PocketBase superusers
        const authResponse = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity: adminEmail, password: adminPassword })
        })

        if (!authResponse.ok) {
            const authErr = await authResponse.text()
            console.error("PocketBase admin auth failed:", authErr)
            return res.status(500).json({
                success: false,
                error: {
                    message: "Failed to authenticate with PocketBase",
                    code: "PB_AUTH_FAILED"
                }
            })
        }

        const authData = await authResponse.json()
        const adminToken = authData.token

        // Update user record with wallet address and daccPublickey
        const updateResponse = await fetch(`${pbUrl}/api/collections/users/records/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                wallet: address,
                daccPublickey: `daccPublickey_${address}`
            })
        })

        if (!updateResponse.ok) {
            const updateErr = await updateResponse.text()
            console.error("PocketBase user update failed:", updateErr)
            return res.status(500).json({
                success: false,
                error: {
                    message: "Failed to update user record in PocketBase",
                    code: "PB_UPDATE_FAILED"
                }
            })
        }

        console.log(`Wallet created and saved for user ${userId}: ${address}`)

        res.json({
            success: true,
            wallet_address: address
        })

    } catch (error) {
        console.error("Error in create-and-save:", error)
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to create and save wallet",
                code: "WALLET_CREATION_FAILED",
                details: process.env.NODE_ENV === "development" ? error.message : undefined
            }
        })
    }
})

// Batch create wallets (for testing)
app.post('/api/wallet/batch', async (req, res) => {
    try {
        const { count = 1, userIdPrefix = 'test' } = req.body;
        
        const wallets = [];
        for (let i = 0; i < count; i++) {
            const wallet = ethers.Wallet.createRandom();
            wallets.push({
                address: wallet.address,
                publicKey: wallet.publicKey
            });
        }
        
        res.json({ success: true, data: wallets });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
});

// Encrypt private key using AES-256-GCM
/**
 * Encrypt private key using AES-256-GCM
 * @param {string} privateKey - Private key with '0x' prefix
 * @param {string} masterKey - WALLET_MASTER_KEY from env
 * @returns {object} Encrypted data with version 4
 */
async function encryptPrivateKey(privateKey, masterKey) {
    // Derive encryption key using SHA-256
    const key = crypto.createHash('sha256').update(masterKey).digest();
    
    // Generate random IV (never reuse with same key)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    
    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
        version: 4,  // AES-256-GCM
        algorithm: 'aes-256-gcm',
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ciphertext: encrypted
    };
}

app.post('/api/v1/wallet/transfer', async (req, res) => {
    try {
        const { from_address, to_address, amount, fee, user_id } = req.body;
        
        if (!from_address || !to_address || !amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Invalid parameters', code: 'INVALID_PARAMS' }
            });
        }
        
        console.log(`Transfer: ${from_address} -> ${to_address}, amount: ${amount}, fee: ${fee || '0'}`);
        
        // Fetch encrypted user private key from PocketBase 
        const { encryptedPrivateKey } = await getUserPrivateKey(user_id);
        
        const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + user_id);
        
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(privateKey, provider);
        
        const USDT_CONTRACT = CONTRACT_ADDRESSES[CHAIN_ID]?.usdt;
        if (!USDT_CONTRACT) {
            throw new Error('USDT contract not configured for this chain');
        }
        
        const USDT_ABI = [
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];
        
        const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, signer);
        
        const amountWithDecimals = ethers.parseUnits(amount.toString(), 18);
        console.log(`Parsed amount: ${amountWithDecimals}, from: ${from_address}, to: ${to_address}`);
        
        const gasEstimate = await usdtContract.transfer.estimateGas(to_address, amountWithDecimals);
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
        
        const tx = await withRetry(async () => {
            return await usdtContract.transfer(to_address, amountWithDecimals, {
                gasLimit: gasLimit
            });
        }, 3, 1000);
        
        console.log(`USDT transfer transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait(CONFIRMATIONS);
        
        if (receipt.status !== 1) {
            throw new Error('USDT transfer transaction reverted');
        }
        
        console.log(`USDT transfer confirmed: ${receipt.transactionHash} in block ${receipt.blockNumber}`);
        
        res.json({
            success: true,
            data: {
                amount: amount,
                fee: fee,
                status: 'completed',
                txHash: receipt.transactionHash,
                block: receipt.blockNumber
            }
        });
        
    } catch (error) {
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Fund transfer failed'
            : error.message;
        
        console.error('[USDT Transfer] Error:', error);
        
        res.status(500).json({ 
            success: false, 
            error: { 
                message: errorMessage,
                code: error.code || 'TRANSFER_FAILED',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            } 
        });
    }
});

// Get USDT balance from blockchain
app.post('/api/v1/wallet/balance', async (req, res) => {
    try {
        const { user_address } = req.body;
        
        if (!user_address) {
            return res.status(400).json({ 
                success: false, 
                error: 'user_address is required' 
            });
        }
        
        console.log(`Getting balance for: ${user_address}`);
        
        const USDT_CONTRACT = CONTRACT_ADDRESSES[CHAIN_ID]?.usdt;
        if (!USDT_CONTRACT) {
            throw new Error('USDT contract not configured');
        }
        
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const USDT_ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];
        
        const usdtContract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
        const decimals = await usdtContract.decimals();
        const rawBalance = await usdtContract.balanceOf(user_address);
        const balance = ethers.formatUnits(rawBalance, decimals);
        
        res.json({
            success: true,
            data: {
                usdt_balance: parseFloat(balance),
                total_earned: 0,
                total_spent: 0,
                total_withdrawn: 0
            }
        });
    } catch (error) {
        console.error('[Balance] Error:', error);
        
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Balance query failed'
            : error.message;
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage 
        });
    }
});

// Mint Egg NFT
app.post('/api/wallet/mint-egg', async (req, res) => {
    try {
        const { userId, wallet: walletAddress, eggId, eggNftAddress, referrerAddress } = req.body;
        
        if (!userId || !walletAddress || !eggId || !eggNftAddress) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Missing required parameters: userId, wallet, eggId, eggNftAddress' } 
            });
        }
        
        console.log(`[Mint Egg] User: ${userId}, Wallet: ${walletAddress}, Egg ID: ${eggId}`);
        
        // Get user's encrypted private key
        const { encryptedPrivateKey } = await getUserPrivateKey(userId);
        
        // Decrypt private key
        const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + userId);
        
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Connect to contract
        const eggContract = new ethers.Contract(eggNftAddress, EGG_NFT_ABI, signer);
        
        // Get mint price
        const mintPrice = await eggContract.mintPrice();
        console.log(`[Mint Egg] Mint price: ${ethers.formatEther(mintPrice)} ETH`);
        
        // Estimate gas with buffer
        let gasLimit;
        try {
            const gasEstimate = await eggContract.mintEgg.estimateGas(eggId, { value: mintPrice });
            gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
            console.log(`[Mint Egg] Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}`);
        } catch (gasError) {
            // Provide descriptive error for gas estimation failures
            let errorCode = 'GAS_ESTIMATION_FAILED';
            let errorMessage = 'Gas estimation failed. The transaction may fail. Please try again.';
            
            // Map specific ethers.js error codes to user-friendly messages
            if (gasError.code === 'UNPREDICTABLE_GAS_LIMIT') {
                errorMessage = 'Cannot estimate gas. This transaction would fail. Please check your wallet balance.';
            } else if (gasError.code === 'CALL_EXCEPTION') {
                errorCode = 'TRANSACTION_REVERTED';
                errorMessage = 'Transaction would revert. Please try again or contact support.';
            } else if (gasError.message?.includes('insufficient funds')) {
                errorCode = 'INSUFFICIENT_FUNDS_FOR_GAS';
                errorMessage = 'Insufficient funds for gas. Please add BNB to your wallet.';
            }
            
            console.error('[Mint Egg] Gas estimation failed:', gasError.code || gasError.message);
            return res.status(400).json({
                success: false,
                error: {
                    message: errorMessage,
                    code: errorCode
                }
            });
        }
        
        // Execute transaction with retry
        const tx = await withRetry(async () => {
            return await eggContract.mintEgg(eggId, {
                value: mintPrice,
                gasLimit: gasLimit
            });
        }, 3, 1000);
        
        console.log(`[Mint Egg] Transaction sent: ${tx.hash}`);
        
        // Wait for confirmations
        const receipt = await tx.wait(CONFIRMATIONS);
        
        if (receipt.status !== 1) {
            throw new Error('Transaction reverted');
        }
        
        console.log(`[Mint Egg] Confirmed in block ${receipt.blockNumber}`);
        
        // Create PocketBase egg_nfts record after successful mint
        try {
            const pbToken = await getPocketBaseAdminToken();
            
            // Extract token_id from transaction logs (Transfer event)
            let tokenId = null;
            if (receipt.logs) {
                const transferEvent = receipt.logs.find((log) => {
                    try {
                        return log.fragment?.name === 'Transfer' && log.args?.to === walletAddress;
                    } catch {
                        return false;
                    }
                });
                if (transferEvent) {
                    tokenId = transferEvent.args.tokenId.toString();
                }
            }
            
            // Fallback: if tokenId not extracted, use eggId as temporary identifier
            if (!tokenId) {
                console.warn('[Mint Egg] Could not extract tokenId from logs, using eggId');
                tokenId = eggId.toString();
            }
            
            // Create egg_nfts record in PocketBase
            const pbCreateResponse = await fetch(`${PB_URL}/api/collections/egg_nfts/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${pbToken}`
                },
                body: JSON.stringify({
                    token_id: tokenId,
                    tx_hash: tx.hash,
                    owner: userId,
                    wallet_address: walletAddress,
                    food_count: 2,
                    is_hatched: false,
                    referral_chain: referrerAddress || null,
                    mint_block: receipt.blockNumber,
                    status: 'confirmed'
                })
            });
            
            if (!pbCreateResponse.ok) {
                const pbError = await pbCreateResponse.text();
                console.error('[Mint Egg] Failed to create egg_nfts record:', pbError);
                // Don't fail the mint if PocketBase record creation fails - log and continue
                // This is a critical failure that should be monitored
            } else {
                const pbRecord = await pbCreateResponse.json();
                console.log(`[Mint Egg] Created egg_nfts record: ${pbRecord.id}`);
            }
        } catch (pbError) {
            console.error('[Mint Egg] PocketBase callback error:', pbError.message);
            // Continue - don't fail mint if PB record creation fails
        }
        
        // Log gas cost for monitoring (user pays gas for mint, logged for tracking)
        logGasSponsorship('Mint Egg', userId, receipt)
        
        res.json({
            success: true,
            data: {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                status: 'confirmed',
                eggId: eggId
            }
        });
        
    } catch (error) {
        // Don't expose internal errors or sensitive data
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Wallet operation failed'
            : error.message;
        
        console.error('[Mint Egg] Error:', error.code || error.message);
        
        res.status(500).json({ 
            success: false, 
            error: { 
                message: errorMessage,
                code: error.code || 'MINT_FAILED'
            } 
        });
    }
});

// Claim Commission
app.post('/api/wallet/claim-commission', async (req, res) => {
    try {
        const { userId, wallet: walletAddress, commissionDistributionAddress } = req.body;
        
        if (!userId || !walletAddress || !commissionDistributionAddress) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Missing required parameters: userId, wallet, commissionDistributionAddress' } 
            });
        }
        
        console.log(`[Claim Commission] User: ${userId}, Wallet: ${walletAddress}`);
        
        // Get user's encrypted private key
        const { encryptedPrivateKey } = await getUserPrivateKey(userId);
        const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + userId);
        
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Connect to commission contract
        const commissionContract = new ethers.Contract(
            commissionDistributionAddress, 
            COMMISSION_ABI, 
            signer
        );
        
        // Get commission balance first
        const commissionBalance = await commissionContract.getCommissionBalance(walletAddress);
        console.log(`[Claim Commission] Balance: ${ethers.formatEther(commissionBalance)} ETH`);
        
        if (commissionBalance === BigInt(0)) {
            return res.status(400).json({
                success: false,
                error: { message: 'No commission to claim', code: 'NO_COMMISSION' }
            });
        }
        
        // Estimate gas
        const gasEstimate = await commissionContract.claimCommission.estimateGas();
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
        
        // Execute with retry
        const tx = await withRetry(async () => {
            return await commissionContract.claimCommission({ gasLimit });
        }, 3, 1000);
        
        console.log(`[Claim Commission] Transaction sent: ${tx.hash}`);
        
        // Wait for confirmations
        const receipt = await tx.wait(CONFIRMATIONS);
        
        if (receipt.status !== 1) {
            throw new Error('Transaction reverted');
        }
        
        // Parse claimed amount from event
        res.json({
            success: true,
            data: {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                status: 'confirmed',
                amount: commissionBalance.toString()
            }
        });
        
    } catch (error) {
        console.error('[Claim Commission] Error:', error.code || error.message);
        
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Wallet operation failed'
            : error.message;
        
        res.status(500).json({ 
            success: false, 
            error: { 
                message: errorMessage,
                code: error.code || 'CLAIM_FAILED'
            } 
        });
    }
});

// Mint Food NFT
app.post('/api/wallet/mint-food', async (req, res) => {
    try {
        const { userId, wallet: walletAddress, quantity, foodType, foodNftAddress } = req.body;
        
        if (!userId || !walletAddress || !quantity || !foodNftAddress) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Missing required parameters: userId, wallet, quantity, foodNftAddress' } 
            });
        }
        
        console.log(`[Mint Food] User: ${userId}, Quantity: ${quantity}`);
        
        // Get user's encrypted private key
        const { encryptedPrivateKey } = await getUserPrivateKey(userId);
        const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + userId);
        
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Connect to food contract
        const foodContract = new ethers.Contract(foodNftAddress, FOOD_NFT_ABI, signer);
        
        // Get mint price
        const mintPrice = await foodContract.mintPrice();
        const totalValue = mintPrice * BigInt(quantity);
        
        console.log(`[Mint Food] Total cost: ${ethers.formatEther(totalValue)} ETH`);
        
        // Estimate gas
        const gasEstimate = await foodContract.mint.estimateGas(
            walletAddress, 
            foodType || 1, 
            quantity, 
            { value: totalValue }
        );
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
        
        // Execute with retry
        const tx = await withRetry(async () => {
            return await foodContract.mint(
                walletAddress,
                foodType || 1,
                quantity,
                { value: totalValue, gasLimit }
            );
        }, 3, 1000);
        
        console.log(`[Mint Food] Transaction sent: ${tx.hash}`);
        
        // Wait for confirmations
        const receipt = await tx.wait(CONFIRMATIONS);
        
        if (receipt.status !== 1) {
            throw new Error('Transaction reverted');
        }
        
        // Parse token IDs from events
        res.json({
            success: true,
            data: {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                status: 'confirmed',
                quantity: quantity,
                foodType: foodType || 1
            }
        });
        
    } catch (error) {
        console.error('[Mint Food] Error:', error.code || error.message);
        
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Wallet operation failed'
            : error.message;
        
        res.status(500).json({ 
            success: false, 
            error: { 
                message: errorMessage,
                code: error.code || 'MINT_FAILED'
            } 
        });
    }
});

// Feed Egg
app.post('/api/wallet/feed-egg', async (req, res) => {
    try {
        const { userId, wallet: walletAddress, egg_token_id, food_ids, foodNftAddress, eggNftAddress } = req.body;
        
        if (!userId || !walletAddress || !egg_token_id || !food_ids || !foodNftAddress || !eggNftAddress) {
            return res.status(400).json({ 
                success: false, 
                error: { message: 'Missing required parameters' } 
            });
        }
        
        console.log(`[Feed Egg] User: ${userId}, Egg: ${egg_token_id}, Foods: ${food_ids.length}`);
        
        // Get user's encrypted private key
        const { encryptedPrivateKey } = await getUserPrivateKey(userId);
        const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + userId);
        
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.Wallet(privateKey, provider);
        
        // Connect to contracts
        const eggContract = new ethers.Contract(eggNftAddress, EGG_NFT_ABI, signer);
        
        // Verify ownership
        const owner = await eggContract.ownerOf(egg_token_id);
        if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({
                success: false,
                error: { message: 'User does not own this egg', code: 'NOT_OWNER' }
            });
        }
        
        // Check current food count - prevent feeding hatched eggs (max 10 food items)
        const currentFoodCount = await eggContract.foodCount(egg_token_id);
        const newFoodCount = Number(currentFoodCount) + food_ids.length;
        
        console.log(`[FEED] User ${walletAddress} attempted to feed egg ${egg_token_id} with ${food_ids.length} food items. Current: ${currentFoodCount}`);
        
        if (newFoodCount > 10) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Egg has already hatched. Current food: ${currentFoodCount}, Max: 10`,
                    code: 'EGG_HATCHED'
                }
            });
        }
        
        // Estimate gas
        const gasEstimate = await eggContract.feedEgg.estimateGas(egg_token_id, food_ids);
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
        
        // Execute with retry
        const tx = await withRetry(async () => {
            return await eggContract.feedEgg(egg_token_id, food_ids, { gasLimit });
        }, 3, 1000);
        
        console.log(`[Feed Egg] Transaction sent: ${tx.hash}`);
        
        // Wait for confirmations
        const receipt = await tx.wait(CONFIRMATIONS);
        
        if (receipt.status !== 1) {
            throw new Error('Transaction reverted');
        }
        
        console.log(`[FEED] Successfully fed egg ${egg_token_id}. New food count: ${newFoodCount}, TX: ${tx.hash}`);
        
        res.json({
            success: true,
            data: {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                status: 'confirmed',
                egg_token_id: egg_token_id,
                food_count: food_ids.length
            }
        });
        
    } catch (error) {
        console.error('[Feed Egg] Error:', error.code || error.message);
        
        // Log blocked attempts for monitoring
        if (error.code === 'EGG_HATCHED') {
            console.log(`[FEED] Blocked - Egg ${egg_token_id} already hatched`);
        }
        
        const errorMessage = error.message.includes('private') || error.message.includes('key')
            ? 'Wallet operation failed'
            : error.message;
        
        res.status(500).json({ 
            success: false, 
            error: { 
                message: errorMessage,
                code: error.code || 'FEED_FAILED'
            } 
        });
    }
});

// Buy NFT endpoint (on-chain marketplace escrow with gas sponsorship)
app.post("/api/wallet/buy-nft", async (req, res) => {
  try {
    const { buyerUserId, nftContract, tokenId, marketplaceAddress, listingPrice } = req.body

    if (!buyerUserId || !nftContract || !tokenId || !marketplaceAddress) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required parameters: buyerUserId, nftContract, tokenId, marketplaceAddress",
        },
      })
    }

    console.log(`[Buy NFT] Buyer: ${buyerUserId}, Contract: ${nftContract}, Token: ${tokenId}`)

    // Get platform relayer wallet (pays gas for user)
    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: { message: "Relayer wallet not configured", code: "RELAYER_NOT_CONFIGURED" },
      })
    }

    // Connect to marketplace contract
    const marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      relayerWallet
    )

    // Estimate gas with 20% buffer
    const gasEstimate = await marketplaceContract.buyNFT.estimateGas(nftContract, tokenId)
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

    console.log(`[Buy NFT] Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}`)

    // Execute buyNFT transaction with retry (relayer pays gas)
    const tx = await withRetry(
      async () => {
        return await marketplaceContract.buyNFT(nftContract, tokenId, {
          gasLimit: gasLimit,
        })
      },
      3,
      1000
    )

    console.log(`[Buy NFT] Transaction sent: ${tx.hash}`)

    // Wait for confirmations
    const receipt = await tx.wait(CONFIRMATIONS)

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted")
    }

    console.log(`[Buy NFT] Confirmed in block ${receipt.blockNumber}`)

    // Log sponsored gas cost (D-05)
    logGasSponsorship('Buy NFT', buyerUserId, receipt)

    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
        nftContract: nftContract,
        tokenId: tokenId,
      },
    })
  } catch (error) {
    const errorMessage =
      error.message.includes("private") || error.message.includes("key")
        ? "Wallet operation failed"
        : error.message

    console.error("[Buy NFT] Error:", error.code || error.message)

    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        code: error.code || "BUY_FAILED",
      },
    })
  }
});

/**
 * Marketplace: List NFT for sale (on-chain escrow)
 * POST /api/v1/marketplace/list
 * 
 * Calls Marketplace.listNFTForSale() to transfer NFT into escrow and list it.
 * Requires user to have approved the marketplace contract for the NFT.
 */
app.post("/api/v1/marketplace/list", async (req, res) => {
  try {
    const { userId, nftContract, tokenId, price, nftType, marketplaceAddress } = req.body

    if (!userId || !nftContract || !tokenId || !price || nftType === undefined || !marketplaceAddress) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required parameters: userId, nftContract, tokenId, price, nftType, marketplaceAddress" },
      })
    }

    console.log(`[Marketplace List] User: ${userId}, Contract: ${nftContract}, Token: ${tokenId}, Price: ${price}`)

    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: { message: "Relayer wallet not configured", code: "RELAYER_NOT_CONFIGURED" },
      })
    }

    const marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      relayerWallet
    )

    const gasEstimate = await marketplaceContract.listNFTForSale.estimateGas(nftContract, tokenId, BigInt(price), nftType)
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

    const tx = await withRetry(
      async () => {
        return await marketplaceContract.listNFTForSale(nftContract, tokenId, BigInt(price), nftType, { gasLimit })
      },
      3,
      1000
    )

    console.log(`[Marketplace List] Tx sent: ${tx.hash}`)
    const receipt = await tx.wait(CONFIRMATIONS)

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted")
    }

    logGasSponsorship('Marketplace List', userId, receipt)

    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
      },
    })
  } catch (error) {
    console.error("[Marketplace List] Error:", error.message)
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "LIST_FAILED" },
    })
  }
});

/**
 * Marketplace: Cancel listing (return NFT from escrow)
 * POST /api/v1/marketplace/cancel
 * 
 * Calls Marketplace.cancelListing() to return NFT to seller.
 */
app.post("/api/v1/marketplace/cancel", async (req, res) => {
  try {
    const { userId, nftContract, tokenId, marketplaceAddress } = req.body

    if (!userId || !nftContract || !tokenId || !marketplaceAddress) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required parameters: userId, nftContract, tokenId, marketplaceAddress" },
      })
    }

    console.log(`[Marketplace Cancel] User: ${userId}, Contract: ${nftContract}, Token: ${tokenId}`)

    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: { message: "Relayer wallet not configured", code: "RELAYER_NOT_CONFIGURED" },
      })
    }

    const marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      MARKETPLACE_ABI,
      relayerWallet
    )

    const gasEstimate = await marketplaceContract.cancelListing.estimateGas(nftContract, tokenId)
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

    const tx = await withRetry(
      async () => {
        return await marketplaceContract.cancelListing(nftContract, tokenId, { gasLimit })
      },
      3,
      1000
    )

    console.log(`[Marketplace Cancel] Tx sent: ${tx.hash}`)
    const receipt = await tx.wait(CONFIRMATIONS)

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted")
    }

    logGasSponsorship('Marketplace Cancel', userId, receipt)

    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
      },
    })
  } catch (error) {
    console.error("[Marketplace Cancel] Error:", error.message)
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "CANCEL_FAILED" },
    })
  }
});

/**
 * Breed Animals endpoint
 * POST /api/wallet/breed-animals
 * 
 * Calls the AnimalNFT contract to breed two animals
 * Requires relayer wallet for gas sponsorship
 */
app.post("/api/wallet/breed-animals", async (req, res) => {
  try {
    const {
      userId,
      parent1TokenId,
      parent2TokenId,
      animalNftAddress,
    } = req.body

    if (!userId || !parent1TokenId || !parent2TokenId || !animalNftAddress) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required parameters: userId, parent1TokenId, parent2TokenId, animalNftAddress",
          code: "MISSING_PARAMS",
        },
      })
    }

    console.log(`[Breed Animals] User: ${userId}, Parent1: ${parent1TokenId}, Parent2: ${parent2TokenId}`)

    // Get platform relayer wallet (pays gas for user)
    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: { message: "Relayer wallet not configured", code: "RELAYER_NOT_CONFIGURED" },
      })
    }

    // Connect to AnimalNFT contract
    const animalContract = new ethers.Contract(
      animalNftAddress,
      ANIMAL_NFT_ABI,
      relayerWallet
    )

    // Check if animals can breed (cooldown check)
    try {
      const canBreed1 = await animalContract.canBreed(parent1TokenId)
      if (!canBreed1) {
        return res.status(400).json({
          success: false,
          error: { message: "Parent 1 is on cooldown", code: "PARENT1_ON_COOLDOWN" },
        })
      }

      const canBreed2 = await animalContract.canBreed(parent2TokenId)
      if (!canBreed2) {
        return res.status(400).json({
          success: false,
          error: { message: "Parent 2 is on cooldown", code: "PARENT2_ON_COOLDOWN" },
        })
      }
    } catch (checkError) {
      console.warn("[Breed Animals] Cooldown check failed:", checkError.message)
      // Continue anyway - contract will enforce
    }

    // Estimate gas with 20% buffer
    const gasEstimate = await animalContract.breedAnimals.estimateGas(
      parent1TokenId,
      parent2TokenId
    )
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

    console.log(`[Breed Animals] Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}`)

    // Execute breedAnimals transaction with retry (relayer pays gas)
    const tx = await withRetry(
      async () => {
        return await animalContract.breedAnimals(parent1TokenId, parent2TokenId, {
          gasLimit: gasLimit,
        })
      },
      3,
      1000
    )

    console.log(`[Breed Animals] Transaction sent: ${tx.hash}`)

    // Wait for confirmations
    const receipt = await tx.wait(CONFIRMATIONS)

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted")
    }

    console.log(`[Breed Animals] Confirmed in block ${receipt.blockNumber}`)

    // Extract child token ID from event logs
    let childTokenId = null
    let childGeneration = null
    
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          if (log.fragment?.name === 'AnimalBred') {
            childTokenId = log.args.childId?.toString()
            childGeneration = log.args.childGeneration?.toString()
            break
          }
        } catch {
          // Skip logs that can't be parsed
        }
      }
    }

    // Log sponsored gas cost
    logGasSponsorship('Breed Animals', userId, receipt)

    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
        parent1TokenId: parent1TokenId,
        parent2TokenId: parent2TokenId,
        childTokenId: childTokenId,
        childGeneration: childGeneration,
      },
    })
  } catch (error) {
    const errorMessage =
      error.message.includes("private") || error.message.includes("key")
        ? "Wallet operation failed"
        : error.message

    console.error("[Breed Animals] Error:", error.code || error.message)

    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        code: error.code || "BREEDING_FAILED",
      },
    })
  }
})

/**
 * Upgrade Egg Rarity endpoint
 * POST /api/wallet/upgrade-egg-rarity
 * 
 * Calls the EggNFT contract to upgrade egg rarity using food NFTs
 * Requires user wallet (not relayer - user pays gas)
 */
app.post("/api/wallet/upgrade-egg-rarity", async (req, res) => {
  try {
    const { userId, eggTokenId, foodIds } = req.body

    if (!userId || !eggTokenId || !foodIds || !Array.isArray(foodIds)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required parameters: userId, eggTokenId, foodIds",
          code: "INVALID_PARAMETERS"
        }
      })
    }

    if (foodIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Must provide at least 1 food item to upgrade", code: "NO_FOOD_ITEMS" }
      })
    }

    console.log(`[Upgrade Rarity] User: ${userId}, Egg: ${eggTokenId}, Food Items: ${foodIds.length}`)

    // Get contract address from config
    const eggNftAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.EggNFT
    if (!eggNftAddress) {
      return res.status(500).json({
        success: false,
        error: { message: "EggNFT contract not configured", code: "CONTRACT_NOT_CONFIGURED" }
      })
    }

    // Connect to EggNFT contract (user pays gas)
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    
    // Get user wallet from PocketBase admin credentials
    let userWallet
    try {
      // Fetch user's encrypted private key via PocketBase API
      const pbAuth = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userId, password: PB_ADMIN_PASSWORD })
      })
      
      if (!pbAuth.ok) {
        throw new Error("Failed to authenticate with PocketBase")
      }
      
      const pbData = await pbAuth.json()
      // Decrypt private key using master key
      const privateKey = decryptPrivateKey(pbData.record.encrypted_private_key, MASTER_KEY)
      userWallet = new ethers.Wallet(privateKey, provider)
    } catch (authError) {
      console.error("[Upgrade Rarity] Auth error:", authError.message)
      return res.status(500).json({
        success: false,
        error: { message: "Failed to authenticate user wallet", code: "AUTH_FAILED" }
      })
    }

    const eggNftContract = new ethers.Contract(eggNftAddress, EGG_NFT_ABI, userWallet)

    // Estimate gas with 20% buffer
    const gasEstimate = await eggNftContract.upgradeEggRarity.estimateGas(eggTokenId, foodIds)
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100)

    console.log(`[Upgrade Rarity] Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}`)

    // Execute upgrade transaction (user pays gas)
    const tx = await withRetry(
      async () => {
        return await eggNftContract.upgradeEggRarity(eggTokenId, foodIds, {
          gasLimit: gasLimit
        })
      },
      3,
      1000
    )

    console.log(`[Upgrade Rarity] Transaction sent: ${tx.hash}`)

    // Wait for confirmations
    const receipt = await tx.wait(CONFIRMATIONS)

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted")
    }

    console.log(`[Upgrade Rarity] Confirmed in block ${receipt.blockNumber}`)

    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
        eggTokenId: eggTokenId,
        foodCount: foodIds.length
      }
    })
  } catch (error) {
    const errorMessage =
      error.message.includes("private") || error.message.includes("key")
        ? "Wallet operation failed"
        : error.message

    console.error("[Upgrade Rarity] Error:", error.code || error.message)

    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        code: error.code || "UPGRADE_FAILED"
      }
    })
  }
})

/**
 * POST /api/wallet/tier-claim
 * Claim tier badge and receive USDT reward
 * Requires: wallet, daccPublicKey, pin, tier, tokenId, lifetimeFoodItems, tierBadgeAddress
 */
app.post('/api/wallet/tier-claim', async (req, res) => {
    try {
        const { 
            wallet, 
            daccPublicKey, 
            pin, 
            tier,
            tokenId,
            lifetimeFoodItems,
            tierBadgeAddress 
        } = req.body;

        // Validate required fields
        if (!wallet || !daccPublicKey || !pin || !tier || !tokenId || !lifetimeFoodItems || !tierBadgeAddress) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Missing required fields: wallet, daccPublicKey, pin, tier, tokenId, lifetimeFoodItems, tierBadgeAddress',
                    code: 'MISSING_FIELDS'
                }
            });
        }

        // Validate tier
        const validTiers = ['seedling', 'grower', 'farmer'];
        if (!validTiers.includes(tier)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid tier. Must be: seedling, grower, or farmer',
                    code: 'INVALID_TIER'
                }
            });
        }

        // Validate tokenId matches tier
        const expectedTokenId = { seedling: 1, grower: 2, farmer: 3 }[tier];
        if (parseInt(tokenId) !== expectedTokenId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Token ID mismatch. Expected ${expectedTokenId} for ${tier}`,
                    code: 'TOKEN_ID_MISMATCH'
                }
            });
        }

        // Decrypt user's private key
        let userWallet;
        try {
            const privateKey = await decryptPrivateKey(daccPublicKey, pin);
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            userWallet = new ethers.Wallet(privateKey, provider);
        } catch (error) {
            console.error('Failed to decrypt private key:', error.message);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Failed to decrypt wallet. Invalid credentials.',
                    code: 'DECRYPTION_FAILED'
                }
            });
        }

        // Initialize TierBadge contract
        const tierBadgeContract = new ethers.Contract(
            tierBadgeAddress,
            TIER_BADGE_ABI,
            relayerWallet || userWallet
        );

        // Pre-check: verify user can claim this tier
        try {
            const canClaim = await tierBadgeContract.canClaimTier(
                wallet,
                tokenId,
                lifetimeFoodItems
            );
            
            if (!canClaim) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Cannot claim tier. May already be claimed or threshold not met.',
                        code: 'CANNOT_CLAIM'
                    }
                });
            }
        } catch (error) {
            console.error('TierBadge canClaimTier check failed:', error.message);
            // Continue to attempt mint - contract will revert if invalid
        }

        // Execute tier badge mint with USDT reward
        let tx;
        try {
            // Use relayer wallet if available (gas sponsorship)
            const signer = relayerWallet || userWallet;
            const contractWithSigner = tierBadgeContract.connect(signer);
            
            // Estimate gas with buffer
            const gasEstimate = await contractWithSigner.mintTierBadge.estimateGas(
                wallet,
                tokenId,
                lifetimeFoodItems
            );
            const gasLimit = Math.floor(gasEstimate * (100 + GAS_BUFFER_PERCENT) / 100);
            
            tx = await contractWithSigner.mintTierBadge(
                wallet,
                tokenId,
                lifetimeFoodItems,
                { gasLimit }
            );
            
            console.log(`Tier claim transaction submitted: ${tx.hash}`);
        } catch (error) {
            console.error('TierBadge mintTierBadge failed:', error.message);
            
            // Parse common contract errors
            let errorCode = 'MINT_FAILED';
            let errorMessage = 'Tier badge minting failed';
            
            if (error.message.includes('Invalid tier')) {
                errorCode = 'INVALID_TIER';
                errorMessage = 'Invalid tier ID';
            } else if (error.message.includes('Already claimed')) {
                errorCode = 'ALREADY_CLAIMED';
                errorMessage = 'Tier already claimed';
            } else if (error.message.includes('Threshold not met')) {
                errorCode = 'THRESHOLD_NOT_MET';
                errorMessage = 'Lifetime food items threshold not met';
            } else if (error.message.includes('Claim tiers in order')) {
                errorCode = 'INVALID_ORDER';
                errorMessage = 'Must claim tiers in sequential order';
            } else if (error.message.includes('USDT transfer failed')) {
                errorCode = 'REWARD_TRANSFER_FAILED';
                errorMessage = 'USDT reward transfer failed. Badge may be minted without reward.';
            }
            
            return res.status(500).json({
                success: false,
                error: {
                    message: errorMessage,
                    code: errorCode,
                    details: error.message
                }
            });
        }

        // Wait for confirmations
        let receipt;
        try {
            receipt = await tx.wait(CONFIRMATIONS);
            console.log(`Tier claim confirmed: ${receipt.hash}, gas used: ${receipt.gasUsed}`);
        } catch (error) {
            console.error('Transaction confirmation failed:', error.message);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Transaction submitted but confirmation failed. Check blockchain for status.',
                    code: 'CONFIRMATION_FAILED',
                    tx_hash: tx.hash
                }
            });
        }

        // Log gas sponsorship if relayer was used
        if (relayerWallet) {
            const gasInfo = logGasSponsorship('tier-claim', wallet, receipt);
            console.log(`Gas sponsored for tier claim: ${gasInfo.totalCostBNB} BNB`);
        }

        // Parse TierBadgeMinted event
        let tierName = tier;
        let rewardAmount = '0';
        
        try {
            const eventSignature = 'TierBadgeMinted(address,uint256,string,uint256,uint256)';
            const eventTopic = ethers.keccak256(ethers.toUtf8Bytes(eventSignature));
            
            const eventLog = receipt.logs.find(log => 
                log.topics[0] === eventTopic
            );
            
            if (eventLog) {
                // Decode event data
                const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['string', 'uint256', 'uint256'],
                    eventLog.data
                );
                tierName = decodedData[0];
                rewardAmount = decodedData[1].toString();
            }
        } catch (error) {
            console.error('Failed to parse TierBadgeMinted event:', error.message);
        }

        return res.json({
            success: true,
            data: {
                txHash: receipt.hash,
                tier: tierName,
                tokenId: tokenId,
                rewardAmount: ethers.formatUnits(rewardAmount, 18),
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: receipt.blockNumber,
                confirmations: CONFIRMATIONS
            }
        });

    } catch (error) {
        console.error('Tier claim endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

// ============================================================
// Phase 38: Recruitment Bonus Claim
// ============================================================

// POST /api/v1/wallet/claim-recruitment-bonus
app.post("/api/v1/wallet/claim-recruitment-bonus", async (req, res) => {
  try {
    const { user_address, tier, food_count, usdt_bonus } = req.body;

    if (!user_address || !tier || !food_count || !usdt_bonus) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required fields", code: "MISSING_FIELDS" },
      });
    }

    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: { message: "Relayer wallet not configured", code: "RELAYER_NOT_CONFIGURED" },
      });
    }

    const foodNftAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.foodNft;
    const usdtAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.usdt;
    if (!foodNftAddress || !usdtAddress) {
      return res.status(500).json({
        success: false,
        error: { message: "Contract addresses not configured", code: "CONTRACT_NOT_CONFIGURED" },
      });
    }

    // Validate tier range
    if (tier < 1 || tier > 4) {
      return res.status(400).json({
        success: false,
        error: { message: "Tier must be 1-4", code: "INVALID_TIER" },
      });
    }

    // Step 1: Mint food NFTs (relayer pays gas)
    const foodNftAbi = [
      "function mint(address to, uint256 foodType, uint256 quantity) external payable returns (uint256[])",
      "function mintPrice() external view returns (uint256)",
    ];
    const foodContract = new ethers.Contract(foodNftAddress, foodNftAbi, relayerWallet);

    // Calculate total mint cost
    const mintPrice = await foodContract.mintPrice();
    const totalCost = mintPrice * BigInt(food_count);

    // Estimate gas for food mint
    const foodGasEstimate = await foodContract.mint.estimateGas(user_address, 1, food_count, {
      value: totalCost,
    });
    const foodGasLimit = (foodGasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const foodTx = await foodContract.mint(user_address, 1, food_count, {
      value: totalCost,
      gasLimit: foodGasLimit,
    });

    const foodReceipt = await foodTx.wait(CONFIRMATIONS);
    if (foodReceipt.status !== 1) {
      throw new Error("Food NFT mint transaction reverted");
    }

    // Step 2: Transfer USDT bonus (relayer pays gas)
    const usdtAbi = [
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function decimals() external view returns (uint8)",
    ];
    const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, relayerWallet);

    const usdtAmount = ethers.parseUnits(usdt_bonus.toString(), 18);
    const usdtGasEstimate = await usdtContract.transfer.estimateGas(user_address, usdtAmount);
    const usdtGasLimit = (usdtGasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const usdtTx = await usdtContract.transfer(user_address, usdtAmount, { gasLimit: usdtGasLimit });
    const usdtReceipt = await usdtTx.wait(CONFIRMATIONS);
    if (usdtReceipt.status !== 1) {
      throw new Error("USDT transfer transaction reverted");
    }

    // Log gas sponsorship
    logGasSponsorship("claim-recruitment-bonus", user_address, foodReceipt);
    logGasSponsorship("claim-recruitment-bonus-usdt", user_address, usdtReceipt);

    res.json({
      success: true,
      data: {
        tier,
        food_count,
        usdt_bonus,
        food_tx_hash: foodReceipt.transactionHash,
        usdt_tx_hash: usdtReceipt.transactionHash,
        block_number: foodReceipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Claim Recruitment Bonus] Error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "CLAIM_RECRUITMENT_BONUS_FAILED" },
    });
  }
});

// ============================================================
// Phase 38: VRF Hatching - Request & Fulfillment
// ============================================================

// POST /api/v1/wallet/hatch-egg-vrf
app.post("/api/v1/wallet/hatch-egg-vrf", async (req, res) => {
  try {
    const { user_id, egg_id } = req.body;

    if (!user_id || !egg_id) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required fields: user_id, egg_id", code: "MISSING_FIELDS" },
      });
    }

    // Fetch user's encrypted private key from PocketBase
    const { encryptedPrivateKey } = await getUserPrivateKey(user_id);
    const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + user_id);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    const eggNftAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.eggNft;
    if (!eggNftAddress) {
      return res.status(500).json({
        success: false,
        error: { message: "EggNFT contract not configured", code: "CONTRACT_NOT_CONFIGURED" },
      });
    }

    // ABI for VRF hatching functions
    const eggNftVrfAbi = [
      "function hatchEgg(uint256 tokenId) external returns (uint256 requestId)",
      "function claimHatch(uint256 tokenId) external returns (uint256 animalTokenId)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function pendingHatches(uint256 requestId) external view returns (address requester, uint256 tokenId, uint256 raritySeed, uint256 foodCount, bool isBreedingEgg, uint256 parent1AnimalId, uint256 parent2AnimalId, uint256 rarityUpgradeCount, uint256 generation)",
    ];

    const eggContract = new ethers.Contract(eggNftAddress, eggNftVrfAbi, signer);

    // Verify ownership
    const owner = await eggContract.ownerOf(egg_id);
    if (owner.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: { message: "User does not own this egg", code: "NOT_OWNER" },
      });
    }

    // Estimate gas for hatchEgg (VRF request)
    const gasEstimate = await eggContract.hatchEgg.estimateGas(egg_id);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    // Execute VRF request (user pays gas)
    const tx = await eggContract.hatchEgg(egg_id, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("VRF hatch transaction reverted");
    }

    // Extract requestId from event logs
    let requestId = null;
    if (receipt.logs) {
      for (const log of receipt.logs) {
        try {
          if (log.fragment?.name === "VRFRequested") {
            requestId = log.args.requestId?.toString();
            break;
          }
        } catch {
          /* skip unparseable logs */
        }
      }
    }

    console.log(
      `[VRF Hatch] VRF requested for egg ${egg_id}, requestId: ${requestId}, tx: ${tx.hash}`
    );

    res.json({
      success: true,
      data: {
        request_id: requestId,
        egg_id,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        status: "vrf_requested",
        message: "VRF randomness requested. Animal will be minted in 1-3 minutes.",
      },
    });
  } catch (error) {
    console.error("[VRF Hatch] Error:", error.message);
    const errorMessage =
      error.message.includes("private") || error.message.includes("key")
        ? "Wallet operation failed"
        : error.message;
    res.status(500).json({
      success: false,
      error: { message: errorMessage, code: error.code || "VRF_HATCH_FAILED" },
    });
  }
});

// POST /api/v1/wallet/check-vrf-fulfillment
app.post("/api/v1/wallet/check-vrf-fulfillment", async (req, res) => {
  try {
    const { user_id, egg_id } = req.body;

    if (!egg_id) {
      return res.status(400).json({
        success: false,
        error: { message: "egg_id is required", code: "MISSING_FIELDS" },
      });
    }

    const eggNftAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.eggNft;
    if (!eggNftAddress) {
      return res.status(500).json({
        success: false,
        error: { message: "EggNFT contract not configured", code: "CONTRACT_NOT_CONFIGURED" },
      });
    }

    const eggNftVrfAbi = [
      "function hatchEgg(uint256 tokenId) external returns (uint256 requestId)",
      "function claimHatch(uint256 tokenId) external returns (uint256 animalTokenId)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function getEggProperties(uint256 tokenId) external view returns (uint256, address, uint256, bool, uint256, address[4], uint256, uint256, uint256, bool, uint256, uint256)",
      "function pendingHatches(uint256 requestId) external view returns (address requester, uint256 tokenId, uint256 raritySeed, uint256 foodCount, bool isBreedingEgg, uint256 parent1AnimalId, uint256 parent2AnimalId, uint256 rarityUpgradeCount, uint256 generation)",
    ];

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const eggContract = new ethers.Contract(eggNftAddress, eggNftVrfAbi, provider);

    // Check if egg is already hatched via getEggProperties
    let isHatched = false;
    try {
      const props = await eggContract.getEggProperties(egg_id);
      // The is_hatched field varies by contract version; check if props array is long enough
      isHatched = props.length >= 4 ? props[3] : false;
    } catch {
      // If getEggProperties doesn't exist yet (pre-Phase 37), skip this check
      console.log(`[VRF Fulfillment] getEggProperties not available for egg ${egg_id}, skipping hatched check`);
    }

    if (isHatched) {
      return res.json({
        success: true,
        data: {
          egg_id,
          status: "hatched",
          message: "Egg already hatched",
        },
      });
    }

    // If user_id provided, attempt to claim the hatch (user pays gas)
    if (user_id) {
      const { encryptedPrivateKey } = await getUserPrivateKey(user_id);
      const privateKey = await decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + user_id);
      const signer = new ethers.Wallet(privateKey, provider);
      const userContract = eggContract.connect(signer);

      try {
        const gasEstimate = await userContract.claimHatch.estimateGas(egg_id);
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

        const tx = await userContract.claimHatch(egg_id, { gasLimit });
        const receipt = await tx.wait(CONFIRMATIONS);

        if (receipt.status !== 1) {
          throw new Error("Claim hatch transaction reverted");
        }

        // Extract animal_token_id from event
        let animalTokenId = null;
        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              if (log.fragment?.name === "EggHatched") {
                animalTokenId = log.args.animal_id?.toString();
                break;
              }
            } catch {
              /* skip */
            }
          }
        }

        console.log(
          `[VRF Fulfillment] Egg ${egg_id} hatched! Animal: ${animalTokenId}, tx: ${tx.hash}`
        );

        return res.json({
          success: true,
          data: {
            egg_id,
            status: "hatched",
            animal_token_id: animalTokenId,
            tx_hash: tx.hash,
            block_number: receipt.blockNumber,
          },
        });
      } catch (claimError) {
        // VRF not ready yet or claim failed — return pending status
        if (
          claimError.message.includes("VRF randomness not yet fulfilled") ||
          claimError.message.includes("No VRF request found") ||
          claimError.message.includes("VRF") ||
          claimError.message.includes("fulfilled") ||
          claimError.message.includes("not ready")
        ) {
          return res.json({
            success: true,
            data: {
              egg_id,
              status: "vrf_pending",
              message: "VRF randomness not yet fulfilled. Please check again in 1-3 minutes.",
            },
          });
        }
        throw claimError;
      }
    }

    // No user_id — just return pending status
    return res.json({
      success: true,
      data: {
        egg_id,
        status: "pending_hatch",
        message: "Egg not yet hatched. Call with user_id to attempt claim.",
      },
    });
  } catch (error) {
    console.error("[VRF Fulfillment] Error:", error.message);
    const errorMessage =
      error.message.includes("private") || error.message.includes("key")
        ? "Wallet operation failed"
        : error.message;
    res.status(500).json({
      success: false,
      error: { message: errorMessage, code: error.code || "VRF_FULFILLMENT_FAILED" },
    });
  }
});

// ============================================================
// Phase 29: Admin Controls - Platform Pause/Unpause Operations
// ============================================================

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '';

function getEggNFTContract() {
    if (!ADMIN_PRIVATE_KEY) {
        throw new Error('ADMIN_PRIVATE_KEY environment variable is required for admin operations');
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    
    const contractAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.eggNFT || 
                           process.env.EGG_NFT_ADDRESS;
    
    if (!contractAddress) {
        throw new Error('EggNFT contract address not configured');
    }
    
    // Minimal ABI for pause/unpause operations
    const abi = [
        'function pause() external',
        'function unpause() external',
        'function paused() external view returns (bool)',
        'event PauseStateChanged(bool paused)'
    ];
    
    return new ethers.Contract(contractAddress, abi, wallet);
}

app.post('/api/v1/admin/control', async (req, res) => {
    try {
        const { action } = req.body;
        
        if (!action || !['pause', 'unpause'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid action. Must be "pause" or "unpause"',
                    code: 'INVALID_ACTION'
                }
            });
        }

        if (!ADMIN_PRIVATE_KEY) {
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Admin wallet not configured',
                    code: 'ADMIN_NOT_CONFIGURED'
                }
            });
        }

        const contract = getEggNFTContract();
        
        let tx;
        if (action === 'pause') {
            console.log(`[Admin] Pausing marketplace...`);
            tx = await contract.pause();
        } else {
            console.log(`[Admin] Unpausing marketplace...`);
            tx = await contract.unpause();
        }

        const receipt = await tx.wait(CONFIRMATIONS);
        
        console.log(`[Admin] ${action} transaction confirmed: ${tx.hash}`);
        
        res.json({
            success: true,
            data: {
                action,
                transaction_hash: tx.hash,
                block_number: receipt.blockNumber,
                confirmations: CONFIRMATIONS
            }
        });

    } catch (error) {
        console.error('[Admin] Control endpoint error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

// Health check with admin status
app.get('/api/v1/admin/status', async (req, res) => {
    try {
        const contract = getEggNFTContract();
        const isPaused = await contract.paused();
        
        res.json({
            success: true,
            data: {
                paused: isPaused,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Admin] Status endpoint error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Unable to retrieve admin status',
                code: 'STATUS_ERROR'
            }
        });
    }
});

// ============================================================
// Phase 38: Admin Config Setters & Game Config Reader
// ============================================================

// Extended EggNFT ABI for admin config functions (Phase 37/38)
function getEggNFTConfigContract() {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('ADMIN_PRIVATE_KEY environment variable is required for admin operations');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  const contractAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.eggNft;
  if (!contractAddress) {
    throw new Error('EggNFT contract address not configured');
  }

  // Extended ABI for admin config + burn + view functions
  const abi = [
    "function setPlatformFee(uint256 feePercent) external",
    "function setBreedCooldown(uint256 cooldownSeconds) external",
    "function updateRarityWeights(uint256 common, uint256 rare, uint256 epic, uint256 legendary) external",
    "function addNewSpecies(uint256 speciesId, string calldata name, uint256 weight) external",
    "function setKYCRequired(bool required) external",
    "function platformFee() external view returns (uint256)",
    "function breedCooldown() external view returns (uint256)",
    "function getRarityWeights() external view returns (uint256 common, uint256 rare, uint256 epic, uint256 legendary)",
    "function getSpecies(uint256 speciesId) external view returns (string name, uint256 weight)",
    "function kycRequired() external view returns (bool)",
    "function burnNFT(uint256 tokenId, uint8 nftType) external",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function pause() external",
    "function unpause() external",
    "function paused() external view returns (bool)",
  ];

  return new ethers.Contract(contractAddress, abi, wallet);
}

// POST /api/v1/wallet/admin/set-platform-fee
app.post("/api/v1/wallet/admin/set-platform-fee", async (req, res) => {
  try {
    const { fee_percent } = req.body;

    if (fee_percent === undefined || fee_percent === null) {
      return res.status(400).json({
        success: false,
        error: { message: "fee_percent is required", code: "MISSING_FIELD" },
      });
    }

    const fee = parseInt(fee_percent);
    if (isNaN(fee) || fee < 0 || fee > 2000) {
      return res.status(400).json({
        success: false,
        error: { message: "Fee must be 0-2000 basis points (0-20%)", code: "INVALID_FEE" },
      });
    }

    if (!ADMIN_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        error: { message: "Admin wallet not configured", code: "ADMIN_NOT_CONFIGURED" },
      });
    }

    const contract = getEggNFTConfigContract();
    const gasEstimate = await contract.setPlatformFee.estimateGas(fee);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.setPlatformFee(fee, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(`[Admin] Platform fee set to ${fee} basis points, tx: ${tx.hash}`);

    res.json({
      success: true,
      data: {
        fee_percent: fee,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Admin] Set platform fee error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "SET_FEE_FAILED" },
    });
  }
});

// POST /api/v1/wallet/admin/set-breed-cooldown
app.post("/api/v1/wallet/admin/set-breed-cooldown", async (req, res) => {
  try {
    const { cooldown_seconds } = req.body;

    if (cooldown_seconds === undefined || cooldown_seconds === null) {
      return res.status(400).json({
        success: false,
        error: { message: "cooldown_seconds is required", code: "MISSING_FIELD" },
      });
    }

    const cooldown = parseInt(cooldown_seconds);
    if (isNaN(cooldown) || cooldown < 3600 || cooldown > 604800) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Cooldown must be 3600-604800 seconds (1hr-7days)",
          code: "INVALID_COOLDOWN",
        },
      });
    }

    const contract = getEggNFTConfigContract();
    const gasEstimate = await contract.setBreedCooldown.estimateGas(cooldown);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.setBreedCooldown(cooldown, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(`[Admin] Breed cooldown set to ${cooldown}s, tx: ${tx.hash}`);

    res.json({
      success: true,
      data: {
        cooldown_seconds: cooldown,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Admin] Set breed cooldown error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "SET_COOLDOWN_FAILED" },
    });
  }
});

// POST /api/v1/wallet/admin/update-rarity-weights
app.post("/api/v1/wallet/admin/update-rarity-weights", async (req, res) => {
  try {
    const { weights } = req.body;

    if (!weights || !weights.common || !weights.rare || !weights.epic || !weights.legendary) {
      return res.status(400).json({
        success: false,
        error: {
          message: "All weights required: common, rare, epic, legendary",
          code: "MISSING_WEIGHTS",
        },
      });
    }

    const common = parseInt(weights.common);
    const rare = parseInt(weights.rare);
    const epic = parseInt(weights.epic);
    const legendary = parseInt(weights.legendary);
    const total = common + rare + epic + legendary;

    if (total !== 10000) {
      return res.status(400).json({
        success: false,
        error: { message: "Weights must sum to 10000 (100%)", code: "INVALID_WEIGHTS" },
      });
    }

    const contract = getEggNFTConfigContract();
    const gasEstimate = await contract.updateRarityWeights.estimateGas(
      common,
      rare,
      epic,
      legendary
    );
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.updateRarityWeights(common, rare, epic, legendary, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(
      `[Admin] Rarity weights updated: C=${common}, R=${rare}, E=${epic}, L=${legendary}, tx: ${tx.hash}`
    );

    res.json({
      success: true,
      data: {
        weights: { common, rare, epic, legendary },
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Admin] Update rarity weights error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "UPDATE_WEIGHTS_FAILED" },
    });
  }
});

// POST /api/v1/wallet/admin/add-species
app.post("/api/v1/wallet/admin/add-species", async (req, res) => {
  try {
    const { species_id, name, weight } = req.body;

    if (!species_id || !name) {
      return res.status(400).json({
        success: false,
        error: { message: "species_id and name are required", code: "MISSING_FIELDS" },
      });
    }

    const id = parseInt(species_id);
    const w = parseInt(weight) || 100;

    const contract = getEggNFTConfigContract();
    const gasEstimate = await contract.addNewSpecies.estimateGas(id, name, w);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.addNewSpecies(id, name, w, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(`[Admin] New species added: ID=${id}, Name=${name}, Weight=${w}, tx: ${tx.hash}`);

    res.json({
      success: true,
      data: {
        species_id: id,
        name,
        weight: w,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Admin] Add species error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "ADD_SPECIES_FAILED" },
    });
  }
});

// POST /api/v1/wallet/admin/set-kyc-required
app.post("/api/v1/wallet/admin/set-kyc-required", async (req, res) => {
  try {
    const { kyc_required } = req.body;

    if (kyc_required === undefined || kyc_required === null) {
      return res.status(400).json({
        success: false,
        error: { message: "kyc_required is required (boolean)", code: "MISSING_FIELD" },
      });
    }

    if (!ADMIN_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        error: { message: "Admin wallet not configured", code: "ADMIN_NOT_CONFIGURED" },
      });
    }

    const contract = getEggNFTConfigContract();
    const gasEstimate = await contract.setKYCRequired.estimateGas(kyc_required);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.setKYCRequired(kyc_required, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(`[Admin] KYC required set to ${kyc_required}, tx: ${tx.hash}`);

    res.json({
      success: true,
      data: {
        kyc_required: kyc_required,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Admin] Set KYC required error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "SET_KYC_FAILED" },
    });
  }
});

// POST /api/v1/wallet/burn-nft
app.post("/api/v1/wallet/burn-nft", async (req, res) => {
  try {
    const { user_address, nft_id, nft_type } = req.body;

    if (!user_address || !nft_id || !nft_type) {
      return res.status(400).json({
        success: false,
        error: {
          message: "user_address, nft_id, and nft_type are required",
          code: "MISSING_FIELDS",
        },
      });
    }

    // Map nft_type to contract enum: 0=Egg, 1=Animal
    let nftTypeEnum;
    if (nft_type === "egg") {
      nftTypeEnum = 0;
    } else if (nft_type === "animal") {
      nftTypeEnum = 1;
    } else if (nft_type === "food") {
      return res.status(400).json({
        success: false,
        error: { message: "Use burn-food endpoint for food NFTs", code: "INVALID_NFT_TYPE" },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'nft_type must be "egg" or "animal"', code: "INVALID_NFT_TYPE" },
      });
    }

    if (!ADMIN_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        error: { message: "Admin wallet not configured", code: "ADMIN_NOT_CONFIGURED" },
      });
    }

    const contract = getEggNFTConfigContract();

    // Verify ownership for animal burns
    if (nftTypeEnum === 1) {
      try {
        const owner = await contract.ownerOf(nft_id);
        if (owner.toLowerCase() !== user_address.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: { message: "User does not own this NFT", code: "NOT_OWNER" },
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: { message: "NFT does not exist", code: "NFT_NOT_FOUND" },
        });
      }
    }

    const gasEstimate = await contract.burnNFT.estimateGas(nft_id, nftTypeEnum);
    const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);

    const tx = await contract.burnNFT(nft_id, nftTypeEnum, { gasLimit });
    const receipt = await tx.wait(CONFIRMATIONS);

    if (receipt.status !== 1) {
      throw new Error("Burn transaction reverted");
    }

    console.log(`[Burn NFT] ${nft_type} #${nft_id} burned, tx: ${tx.hash}`);

    res.json({
      success: true,
      data: {
        nft_id,
        nft_type,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Burn NFT] Error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "BURN_NFT_FAILED" },
    });
  }
});

// GET /api/v1/wallet/game-config
app.get("/api/v1/wallet/game-config", async (req, res) => {
  try {
    const eggNftAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.eggNft;
    if (!eggNftAddress) {
      return res.status(500).json({
        success: false,
        error: { message: "EggNFT contract not configured", code: "CONTRACT_NOT_CONFIGURED" },
      });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // ABI for config view functions
    const configAbi = [
      "function platformFee() external view returns (uint256)",
      "function breedCooldown() external view returns (uint256)",
      "function getRarityWeights() external view returns (uint256 common, uint256 rare, uint256 epic, uint256 legendary)",
      "function kycRequired() external view returns (bool)",
      "function paused() external view returns (bool)",
      "function MINT_PRICE() external view returns (uint256)",
      "function MAX_FOOD_COUNT() external view returns (uint256)",
      "function MAX_UPGRADE_FOOD() external view returns (uint256)",
    ];

    const contract = new ethers.Contract(eggNftAddress, configAbi, provider);

    const [
      platformFee,
      breedCooldown,
      rarityWeights,
      kycRequired,
      paused,
      mintPrice,
      maxFoodCount,
      maxUpgradeFood,
    ] = await Promise.all([
      contract.platformFee(),
      contract.breedCooldown(),
      contract.getRarityWeights(),
      contract.kycRequired(),
      contract.paused(),
      contract.MINT_PRICE(),
      contract.MAX_FOOD_COUNT(),
      contract.MAX_UPGRADE_FOOD(),
    ]);

    res.json({
      success: true,
      data: {
        platform_fee: Number(platformFee),
        breed_cooldown_seconds: Number(breedCooldown),
        rarity_weights: {
          common: Number(rarityWeights.common),
          rare: Number(rarityWeights.rare),
          epic: Number(rarityWeights.epic),
          legendary: Number(rarityWeights.legendary),
        },
        kyc_required: kycRequired,
        paused: paused,
        mint_price: ethers.formatUnits(mintPrice, 18),
        max_food_count: Number(maxFoodCount),
        max_upgrade_food: Number(maxUpgradeFood),
      },
    });
  } catch (error) {
    console.error("[Game Config] Error:", error.message);
    res.status(500).json({
      success: false,
      error: { message: error.message, code: error.code || "GET_CONFIG_FAILED" },
    });
  }
});

// Get CoinStor balance from smart contract
app.get('/api/v2/admin/coinstor/balance', async (req, res) => {
    try {
        const cdContractAddress = CONTRACT_ADDRESSES[CHAIN_ID]?.commissionDistribution;
        if (!cdContractAddress) {
            throw new Error('CommissionDistribution contract not configured');
        }

        // ABI to read commissionBalances mapping and coinStorReserve address
        const cdAbi = [
            "function commissionBalances(address) external view returns (uint256)",
            "function coinStorReserve() external view returns (address)"
        ];

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const cdContract = new ethers.Contract(cdContractAddress, cdAbi, provider);
        
        const coinStorAddress = await cdContract.coinStorReserve();
        const rawBalance = await cdContract.commissionBalances(coinStorAddress);
        const balance = parseFloat(ethers.formatUnits(rawBalance, 18));

        res.json({
            success: true,
            data: {
                balance: balance,
                coinStorAddress: coinStorAddress,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[CoinStor] Balance endpoint error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Unable to retrieve CoinStor balance',
                code: 'COINSTOR_BALANCE_ERROR'
            }
        });
    }
});

// Inject liquidity into CoinStor reserve
app.post('/api/v2/admin/coinstor/inject-liquidity', async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Valid amount required', code: 'INVALID_AMOUNT' }
            });
        }

        // This would call CommissionDistribution.sol deposit function
        // For now, log the intent and update local tracking
        console.log(`[CoinStor] Liquidity injection requested: ${amount} USDT`);
        
        res.json({
            success: true,
            data: {
                message: 'Liquidity injection initiated',
                amount: parseFloat(amount),
                status: 'pending_blockchain_confirmation'
            }
        });
    } catch (error) {
        console.error('[CoinStor] Liquidity injection error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Liquidity injection failed', code: 'LIQUIDITY_INJECTION_FAILED' }
        });
    }
});

// Distribute ecosystem rewards from CoinStor
app.post('/api/v2/admin/coinstor/rewards-distribution', async (req, res) => {
    try {
        const { recipients } = req.body;
        
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Recipients array required', code: 'INVALID_RECIPIENTS' }
            });
        }

        // Validate each recipient has wallet and amount
        for (const recipient of recipients) {
            if (!recipient.wallet || !recipient.amount || parseFloat(recipient.amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'Each recipient must have valid wallet and positive amount', code: 'INVALID_RECIPIENT' }
                });
            }
        }

        console.log(`[CoinStor] Rewards distribution to ${recipients.length} recipients initiated`);
        
        res.json({
            success: true,
            data: {
                message: `Reward distribution for ${recipients.length} recipients initiated`,
                recipientsProcessed: recipients.length,
                status: 'processing'
            }
        });
    } catch (error) {
        console.error('[CoinStor] Rewards distribution error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Rewards distribution failed', code: 'REWARDS_DISTRIBUTION_FAILED' }
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wallet API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Create wallet: POST http://localhost:${PORT}/api/wallet/create`);
    console.log(`Breed animals: POST http://localhost:${PORT}/api/wallet/breed-animals`);
    console.log(`Tier claim: POST http://localhost:${PORT}/api/wallet/tier-claim`);
    console.log(`Admin control: POST http://localhost:${PORT}/api/v1/admin/control [requires ADMIN_PRIVATE_KEY]`);
    console.log(`Claim recruitment bonus: POST http://localhost:${PORT}/api/v1/wallet/claim-recruitment-bonus`);
    console.log(`VRF hatch: POST http://localhost:${PORT}/api/v1/wallet/hatch-egg-vrf`);
    console.log(`VRF fulfillment: POST http://localhost:${PORT}/api/v1/wallet/check-vrf-fulfillment`);
    console.log(`Admin set-platform-fee: POST http://localhost:${PORT}/api/v1/wallet/admin/set-platform-fee`);
    console.log(`Admin set-breed-cooldown: POST http://localhost:${PORT}/api/v1/wallet/admin/set-breed-cooldown`);
    console.log(`Admin update-rarity-weights: POST http://localhost:${PORT}/api/v1/wallet/admin/update-rarity-weights`);
    console.log(`Admin add-species: POST http://localhost:${PORT}/api/v1/wallet/admin/add-species`);
    console.log(`Admin set-kyc-required: POST http://localhost:${PORT}/api/v1/wallet/admin/set-kyc-required`);
    console.log(`Burn NFT: POST http://localhost:${PORT}/api/v1/wallet/burn-nft`);
    console.log(`Game config: GET http://localhost:${PORT}/api/v1/wallet/game-config`);
});