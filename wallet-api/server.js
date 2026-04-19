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

// Minimal ABI for EggNFT (mintEgg function)
const EGG_NFT_ABI = [
  "function mintEgg(uint256 eggId) external payable returns (uint256)",
  "function mintPrice() external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function setFoodNFTContract(address _foodNft) external",
  "function setAnimalNFTContract(address _animalNft) external",
  "function feedEgg(uint256 eggTokenId, uint256[] calldata foodTokenIds) external"
];

// Minimal ABI for FoodNFT (mint function)
const FOOD_NFT_ABI = [
  "function mint(address to, uint256 foodType, uint256 quantity) external payable returns (uint256[] memory)",
  "function mintPrice() external view returns (uint256)",
  "function setEggNFTContract(address _eggNft) external"
];

// Minimal ABI for CommissionDistribution
const COMMISSION_ABI = [
  "function claimCommission() external returns (uint256)",
  "function getCommissionBalance(address user) external view returns (uint256)",
  "function setEggNFTContract(address _eggNft) external",
  "function setFoodNFTContract(address _foodNft) external"
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

// Transfer USDT (P2P)
app.post('/api/v1/wallet/transfer', async (req, res) => {
    try {
        const { from_address, to_address, amount } = req.body;
        
        if (!from_address || !to_address || !amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid parameters' 
            });
        }
        
        console.log(`Transfer: ${from_address} -> ${to_address}, amount: ${amount}`);
        
        res.json({
            success: true,
            data: {
                amount: amount,
                status: 'pending_blockchain_confirmation'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get USDT balance
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
        
        res.json({
            success: true,
            data: {
                usdt_balance: 0,
                total_earned: 0,
                total_spent: 0,
                total_withdrawn: 0
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Mint Egg NFT
app.post('/api/wallet/mint-egg', async (req, res) => {
    try {
        const { userId, wallet: walletAddress, eggId, eggNftAddress } = req.body;
        
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
        const gasEstimate = await eggContract.mintEgg.estimateGas(eggId, { value: mintPrice });
        const gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
        
        console.log(`[Mint Egg] Gas estimate: ${gasEstimate}, Gas limit: ${gasLimit}`);
        
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wallet API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Create wallet: POST http://localhost:${PORT}/api/wallet/create`);
});