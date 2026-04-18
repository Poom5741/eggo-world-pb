# AES-256-GCM Encryption Security Best Practices

## Security Guidelines for Wallet API Encryption

### Core Security Principles

1. **Key Management**
   - Master key (WALLET_MASTER_KEY) should be at least 32 characters long
   - Never log, store, or transmit the master key in plaintext
   - Use a hardware security module (HSM) or key management service in production
   - Rotate the master key regularly and migrate existing encrypted data
   - Ensure master key is provided securely via environment variables or secure vault

2. **Initialization Vector (IV) Handling**
   - AES-GCM requires a unique IV for each encryption operation
   - IV must be randomly generated for each new encryption (crypto.randomBytes(12))
   - Never reuse the same IV with the same key
   - IV can be stored publicly as it doesn't need to be secret
   - 12-byte (96-bit) IV is recommended for optimal security/performance balance

3. **Authentication Tag Protection**
   - The 16-byte authentication tag validates data integrity and authenticity
   - Never discard or ignore authentication tags during decryption
   - Authentication failures indicate possible tampering or corruption
   - Both the ciphertext and authTag must be stored and validated together
   - Auth tag must be validated before trusting the decrypted data

4. **Versioning for Forward Compatibility**
   - Maintaining version numbers enables encryption algorithm upgrades
   - Each version follows a specific protocol for backward compatibility
   - Allows seamless migration from old to new encryption methods
   - Facilitates deprecation of obsolete encryption versions over time

### AES-256-GCM Specifics

- Block cipher operations use the strongest standard (AES-256)
- Galois/Counter Mode (GCM) provides authenticated encryption
- Built-in authenticity verification prevents tampering
- Nonce-based mode requires unique IVs per encryption
- Provides confidentiality, authenticity, and integrity in one operation

### Threat Mitigation

1. **Cryptographic Attacks**
   - Rainbow table resistance via unique random IVs
   - Brute force resistance through AES-256 cipher strength
   - Known plaintext protection through random IVs
   - Tampering detection through authentication tags

2. **Implementation Vulnerabilities**
   - Side channel attack countermeasures implemented
   - Memory scrubbing considerations for private key material
   - Time-constant comparisons where applicable

3. **Operational Security**
   - Proper access controls for encrypted data storage
   - Audit logging for encryption/decryption operations
   - Secure disposal of sensitive variables after use

### Migration Path from Legacy XOR

1. **XOR Vulnerability Notes**:
   - The old XOR cipher is cryptographically weak and vulnerable
   - XOR provides obfuscation but lacks authentication/integrity
   - Should be phased out and replaced with secure encryption
   - Migration should happen as soon as practical

2. **Safe Migration Process**:
   - Allow parallel encryption schemes during transition
   - Decrypt old data with XOR and re-encrypt with AES-GCM
   - Update records with newer v4 encrypted format
   - Remove support for obsolete methods after migration
   - Maintain audit trail of converted records

### Storage and Transmission

- Store encrypted data (version, IV, authTag, ciphertext) together
- Use appropriate data types in databases for binary data storage
- Consider additional envelope encryption at rest if regulation requires
- Transport encryption (TLS 1.3+) should protect in-transit data
- Validate the complete data structure before attempting decryption

### Error Handling Security

- Do not reveal specific decryption failure reasons to clients
- Generic error messages prevent information disclosure
- Log sufficient detail internally for troubleshooting
- Rate limiting may prevent brute force attacks
- Alerting for multiple failed decryption attempts

## Implementation Checklist

- [ ] Master key is properly secured (environment variable/key vault)
- [ ] Unique random IVs generated for each encryption operation
- [ ] Authentication tag validated during decryption
- [ ] Versioning implemented for forwards compatibility
- [ ] Error messages do not leak sensitive information
- [ ] Test suite verifies both encryption and decryption work correctly
- [ ] Fallback XOR decryption is removed after migration
- [ ] Database schema supports the new AES-GCM payload format
- [ ] Audit logs record encryption operations appropriately
- [ ] Performance benchmarking completed

## Recommended Review Interval

Review security implementation annually or whenever cryptographic standards update.
