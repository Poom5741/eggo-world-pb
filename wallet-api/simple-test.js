import { encryptPrivateKey, decryptPrivateKey } from './utils/encrypt.js';

// Sample private key
const samplePrivateKey = '0x5a3a3b4c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a';
const masterKey = 'myVerySecureMasterKey123!';

console.log('1. Original Private Key:', samplePrivateKey);

try {
  console.log('2. Encrypting...');
  const encryptedData = encryptPrivateKey(samplePrivateKey, masterKey);
  console.log('3. ✓ Encrypted! Version:', encryptedData.version);
  
  console.log('4. Decrypting...');
  const decryptedPrivateKey = decryptPrivateKey(encryptedData, masterKey);
  console.log('5. ✓ Decrypted!');
  console.log('6. Decrypted matches original?', decryptedPrivateKey === samplePrivateKey);
} catch (error) {
  console.error('ERROR:', error.message);
}