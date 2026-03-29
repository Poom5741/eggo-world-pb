require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;
const MASTER_KEY = process.env.WALLET_MASTER_KEY || 'change-this-master-key-in-production';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'eggo-wallet-api' });
});

// Create wallet endpoint
app.post('/api/wallet/create', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId is required' 
            });
        }
        
        console.log(`Creating wallet for user: ${userId}`);
        
        // Generate a new random wallet
        const wallet = ethers.Wallet.createRandom();
        
        const address = wallet.address;
        const privateKey = wallet.privateKey;
        const publicKey = wallet.publicKey;
        
        // Encrypt the private key using the master key + userId
        const encryptionKey = MASTER_KEY + userId;
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, encryptionKey);
        
        const result = {
            success: true,
            data: {
                address: address,
                publicKey: publicKey,
                encryptedPrivateKey: encryptedPrivateKey,
                version: 3
            }
        };
        
        console.log(`Wallet created: ${address}`);
        res.json(result);
        
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Encrypt private key (simplified - in production use proper encryption)
async function encryptPrivateKey(privateKey, key) {
    // Simple XOR encryption for demo
    // In production, use proper AES encryption
    const keyHash = ethers.id(key);
    const keyHex = keyHash.slice(2, 66); // 32 bytes
    
    const privateHex = privateKey.slice(2); // Remove 0x
    
    let encrypted = '';
    for (let i = 0; i < privateHex.length; i++) {
        const keyChar = keyHex[i % keyHex.length];
        const encryptedChar = (parseInt(privateHex[i], 16) ^ parseInt(keyChar, 16)).toString(16).padStart(2, '0');
        encrypted += encryptedChar;
    }
    
    return {
        version: 3,
        ciphertext: encrypted,
        kdf: 'simple-xor',
        keyHash: keyHash.slice(0, 16)
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wallet API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Create wallet: POST http://localhost:${PORT}/api/wallet/create`);
});