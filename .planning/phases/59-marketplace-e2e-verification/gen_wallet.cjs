// Generate wallet, encrypt key using same method as wallet-api, store in PB
const { ethers } = require("ethers");

const PB_URL = "http://localhost:8090";
const WALLET_MASTER_KEY = "0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630";
const SELLER_USER_ID = "2365hdkq6zo7x5y";

function xorEncrypt(pk, masterKey, userId) {
    const encryptionKey = masterKey + userId;
    const keyHash = ethers.id(encryptionKey);
    const keyHex = keyHash.slice(2, 66);
    
    let ciphertext = "";
    for (let i = 0; i < pk.length; i++) {
        const keyByte = parseInt(keyHex[i % 64], 16);
        const plainByte = pk.charCodeAt(i);
        const cipherByte = plainByte ^ keyByte;
        ciphertext += cipherByte.toString(16).padStart(2, '0');
    }
    
    return JSON.stringify({
        version: 3,
        kdf: "simple-xor",
        iv: "0",
        authTag: "0",
        ciphertext: ciphertext
    });
}

// Verify encryption is reversible
function verifyEncryption(pk, encryptedJson) {
    const encrypted = JSON.parse(encryptedJson);
    const encryptionKey = WALLET_MASTER_KEY + SELLER_USER_ID;
    const keyHash = ethers.id(encryptionKey);
    const keyHex = keyHash.slice(2, 66);
    const ciphertext = encrypted.ciphertext;
    
    let decrypted = "";
    for (let i = 0; i < ciphertext.length; i += 2) {
        const keyByte = parseInt(keyHex[(i / 2) % keyHex.length], 16);
        const cipherByte = parseInt(ciphertext.substr(i, 2), 16);
        const plainByte = cipherByte ^ keyByte;
        decrypted += String.fromCharCode(plainByte);
    }
    
    if (decrypted === pk) {
        console.log("✓ Encryption verified: reversible");
        return true;
    } else {
        console.log("✗ Encryption FAILED verification");
        console.log("Original:", pk);
        console.log("Decrypted:", decrypted);
        return false;
    }
}

async function main() {
    // Generate wallet
    const wallet = ethers.Wallet.createRandom();
    const pk = wallet.privateKey;
    const addr = wallet.address;
    
    console.log("=== NEW WALLET ===");
    console.log("Address:", addr);
    console.log("Private key:", pk);
    
    // Encrypt
    const encryptedJson = xorEncrypt(pk, WALLET_MASTER_KEY, SELLER_USER_ID);
    console.log("\n=== ENCRYPTED KEY ===");
    console.log(encryptedJson);
    
    // Verify
    if (!verifyEncryption(pk, encryptedJson)) {
        process.exit(1);
    }
    
    // Output for shell script consumption
    console.log("\n=== OUTPUT ===");
    console.log(`ADDRESS=${addr}`);
    console.log(`PRIVATE_KEY=${pk}`);
    console.log(`ENCRYPTED=${encryptedJson}`);
}

main().catch(console.error);
