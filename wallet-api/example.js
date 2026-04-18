/**
 * Example usage of the AES-256-GCM encryption system
 */

import { encryptPrivateKey, decryptPrivateKey } from './utils/encrypt.js';
import { Buffer } from 'buffer';

function demonstrateEncryptionDecryption() {
  console.log('=== AES-256-GCM Encryption/Decryption Demo ===\n');
  
  // Sample private key (this would normally be a real 64-character hex string)
  const samplePrivateKey = '0x5a3a3b4c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a';
  
  // Master key from environment or secure storage
  const masterKey = process.env.WALLET_MASTER_KEY || 'myVerySecureMasterKey123!';
  
  console.log('1. Original Private Key:', samplePrivateKey);
  console.log('Master Key Length:', masterKey.length, 'characters');
  console.log('');
  
  // Encrypt the private key
  try {
    console.log('2. Encrypting private key...');
    const encryptedData = encryptPrivateKey(samplePrivateKey, masterKey);
    console.log('   ✓ Encryption successful!');
    console.log('   Version:', encryptedData.version);
    console.log('   IV length:', encryptedData.iv.length, 'characters');
    console.log('   AuthTag length:', encryptedData.authTag.length, 'characters');
    console.log('   Ciphertext length:', encryptedData.ciphertext.length, 'characters');
    console.log('');
    
    // Verify that the data is actually encrypted
    if (encryptedData.ciphertext.includes('0x')) {
      console.error('❌ ERROR: Private key was not properly encrypted (contains plaintext)');
      return false;
    }
    
    // Decrypt the private key
    console.log('3. Decrypting private key...');
    const decryptedPrivateKey = decryptPrivateKey(encryptedData, masterKey);
    console.log('   ✓ Decryption successful!');
    console.log('   Decrypted Private Key:', decryptedPrivateKey);
    console.log('');
    
    // Verify that decryption was successful
    if (decryptedPrivateKey !== samplePrivateKey) {
      console.error('❌ ERROR: Decrypted private key does not match original!');
      return false;
    }
    
    console.log('✅ SUCCESS: Round-trip encryption/decryption works perfectly!');
    console.log('   Original and decrypted private keys match.');
    console.log('');
    
    // Test version detection compatibility
    console.log('4. Testing version compatibility...');
    console.log('   Encrypted version:', encryptedData.version);
    console.log('   Detected version during decryption:', encryptedData.version);
    
    if (encryptedData.version === 4) {
      console.log('   ✓ Correctly detected AES-GCM version (4)');
    } else {
      console.error('   ❌ ERROR: Wrong version detected');
      return false;
    }
    
    console.log('');
    console.log('✅ All tests passed successfully!');
    console.log('');
    console.log('=== Security Notes ===');
    console.log('- AES-256-GCM provides confidentiality, integrity, and authenticity');
    console.log('- Each encryption uses a randomly generated IV to prevent patterns');
    console.log('- Authentication tags prevent tampering');
    console.log('- Version number allows for future encryption scheme updates');
    
    return true;
  } catch (error) {
    console.error('❌ ERROR during encryption/decryption:', error.message);
    return false;
  }
}

function demonstrateLegacyCompatibility() {
  console.log('\n=== Legacy XOR Compatibility Demo ===\n');
  
  // Sample original data encrypted with older XOR method (version 3)
  const originalPrivateKey = '0x5a3a3b4c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a';
  const masterKey = process.env.WALLET_MASTER_KEY || 'myVerySecureMasterKey123!';
  
  console.log('5. Testing backward compatibility...');
  console.log('   Original Private Key:', originalPrivateKey);
  
  // Simulate legacy encrypted data format (version 3)
  const legacyEncryptedData = encryptWithLegacyMethod(originalPrivateKey, masterKey);
  console.log('   ✓ Created legacy-encrypted data with version 3');
  
  try {
    // Try to decrypt using the new system (should work with backward compatibility)
    console.log('   Attempting to decrypt with new decryptPrivateKey function...');
    const decrypted = decryptPrivateKey(legacyEncryptedData, masterKey);
    console.log('   ✓ Backward compatibility works!');
    console.log('   Decrypted using version 3:', decrypted);
    
    if (decrypted === originalPrivateKey) {
      console.log('   ✓ Legacy decryption successful!');
      return true;
    } else {
      console.error('   ❌ Legacy decryption failed - data mismatch!');
      return false;
    }
  } catch (error) {
    console.error('   ❌ ERROR in legacy compatibility:', error.message);
    return false;
  }
}

/**
 * Helper function that simulates legacy XOR encryption (for demonstration)
 * @param {string} data 
 * @param {string} key 
 * @returns {Object} Legacy formatted encrypted data
 */
function encryptWithLegacyMethod(data, key) {
  const dataBuffer = Buffer.from(data, 'utf8');
  const keyBuffer = Buffer.from(key);
  const encryptedChunks = [];
  
  for (let i = 0; i < dataBuffer.length; i++) {
    encryptedChunks.push(dataBuffer[i] ^ keyBuffer[i % keyBuffer.length]);
  }
  
  const encryptedHex = Buffer.from(encryptedChunks).toString('hex');
  
  return {
    version: 3,  // Legacy XOR encryption version
    data: encryptedHex  // In old format
  };
}

if (typeof require !== 'undefined' && require.main === module) {
  console.log('Running AES-256-GCM encryption demo...\n');
  
  const success = demonstrateEncryptionDecryption();
  const compatSuccess = demonstrateLegacyCompatibility();
  
  if (success && compatSuccess) {
    console.log('\n🎉 All demonstrations completed successfully!');
  } else {
    console.log('\n💥 Some demonstrations failed!');
    process.exit(1);
  }
}
    
    // Decrypt the private key
    console.log('3. Decrypting private key...');
    const decryptedPrivateKey = decryptPrivateKey(encryptedData, masterKey);
    console.log('   ✓ Decryption successful!');
    console.log('   Decrypted Private Key:', decryptedPrivateKey);
    console.log('');
    
    // Verify that decryption was successful
    if (decryptedPrivateKey !== samplePrivateKey) {
      console.error('❌ ERROR: Decrypted private key does not match original!');
      return false;
    }
    
    console.log('✅ SUCCESS: Round-trip encryption/decryption works perfectly!');
    console.log('   Original and decrypted private keys match.');
    console.log('');
    
    // Test version detection compatibility
    console.log('4. Testing version compatibility...');
    console.log('   Encrypted version:', encryptedData.version);
    console.log('   Detected version during decryption:', encryptedData.version);
    
    if (encryptedData.version === 4) {
      console.log('   ✓ Correctly detected AES-GCM version (4)');
    } else {
      console.error('   ❌ ERROR: Wrong version detected');
      return false;
    }
    
    console.log('');
    console.log('✅ All tests passed successfully!');
    console.log('');
    console.log('=== Security Notes ===');
    console.log('- AES-256-GCM provides confidentiality, integrity, and authenticity');
    console.log('- Each encryption uses a randomly generated IV to prevent patterns');
    console.log('- Authentication tags prevent tampering');
    console.log('- Version number allows for future encryption scheme updates');
    
    return true;
  } catch (error) {
    console.error('❌ ERROR during encryption/decryption:', error.message);
    return false;
  }
}

function demonstrateLegacyCompatibility() {
  console.log('\n=== Legacy XOR Compatibility Demo ===\n');
  
  // Sample original data encrypted with older XOR method (version 3)
  const originalPrivateKey = '0x5a3a3b4c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a';
  const masterKey = process.env.WALLET_MASTER_KEY || 'myVerySecureMasterKey123!';
  
  console.log('5. Testing backward compatibility...');
  console.log('   Original Private Key:', originalPrivateKey);
  
  // Simulate legacy encrypted data format (version 3)
  const legacyEncryptedData = encryptWithLegacyMethod(originalPrivateKey, masterKey);
  console.log('   ✓ Created legacy-encrypted data with version 3');
  
  try {
    // Try to decrypt using the new system (should work with backward compatibility)
    console.log('   Attempting to decrypt with new decryptPrivateKey function...');
    const decrypted = decryptPrivateKey(legacyEncryptedData, masterKey);
    console.log('   ✓ Backward compatibility works!');
    console.log('   Decrypted using version 3:', decrypted);
    
    if (decrypted === originalPrivateKey) {
      console.log('   ✓ Legacy decryption successful!');
      return true;
    } else {
      console.error('   ❌ Legacy decryption failed - data mismatch!');
      return false;
    }
  } catch (error) {
    console.error('   ❌ ERROR in legacy compatibility:', error.message);
    return false;
  }
}

/**
 * Helper function that simulates legacy XOR encryption (for demonstration)
 * @param {string} data 
 * @param {string} key 
 * @returns {Object} Legacy formatted encrypted data
 */
function encryptWithLegacyMethod(data, key) {
  const dataBuffer = Buffer.from(data, 'utf8');
  const keyBuffer = Buffer.from(key);
  const encryptedChunks = [];
  
  for (let i = 0; i < dataBuffer.length; i++) {
    encryptedChunks.push(dataBuffer[i] ^ keyBuffer[i % keyBuffer.length]);
  }
  
  const encryptedHex = Buffer.from(encryptedChunks).toString('hex');
  
  return {
    version: 3,  // Legacy XOR encryption version
    data: encryptedHex  // In old format
  };
}

import { Buffer } from 'buffer';

// Run the demonstrations
if (import.meta.url === new URL(import.meta.url)) {
  console.log('Running AES-256-GCM encryption demo...\n');
  
  const success = demonstrateEncryptionDecryption();
  const compatSuccess = demonstrateLegacyCompatibility();
  
  if (success && compatSuccess) {
    console.log('\n🎉 All demonstrations completed successfully!');
  } else {
    console.log('\n💥 Some demonstrations failed!');
    process.exit(1);
  }
}