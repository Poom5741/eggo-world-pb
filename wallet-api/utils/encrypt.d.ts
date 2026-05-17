interface EncryptedKeyData {
  version: number;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encryptPrivateKey(privateKey: string, masterKey: string): EncryptedKeyData;
export function decryptPrivateKey(encryptedData: EncryptedKeyData, masterKey: string): string;
