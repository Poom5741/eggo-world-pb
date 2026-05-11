#!/usr/bin/env python3
"""Generate a standard ethers wallet for seller, encrypt private key, store in PB."""
import requests, json, hashlib, secrets

# Config
PB_URL = "http://localhost:8090"
WALLET_MASTER_KEY = "0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630"
SELLER_USER_ID = "2365hdkq6zo7x5y"
BUYER_USER_ID = "p70qpe6e4fzxiv7"
RPC_URL = "https://rpc.0xl3.com"
RELAYER_PK = "0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630"
RELAYER_ADDR = "0x77DD22ebE2986e8C0d1cDb4c853D43d9576F2bB5"
MOCK_USDT = "0x6Ce3cCcBC5146ED8b88F1FbC12D4682Be3E4Cf8e"
EGG_NFT = "0xd8292C1cB10802a61F91e04ed5Ea0865499Bf6FE"
MARKETPLACE = "0x238eB80DDa39A6C211fBC45852ec7a3569e3E4a9"

def xor_encrypt(private_key_hex: str, master_key: str, user_id: str) -> dict:
    """Encrypt private key using XOR (legacy format v3)."""
    encryption_key = master_key + user_id
    key_hash = hashlib.sha256(encryption_key.encode()).hexdigest()
    # ethers.id() = keccak256, but we use sha256 for simpler Python
    # Actually, let's use keccak256 via hashlib
    import hashlib as hl
    # Use keccak_256 from hashlib if available, otherwise sha256
    try:
        k = hl.new('sha3_256', encryption_key.encode()).hexdigest()
    except:
        k = hl.sha256(encryption_key.encode()).hexdigest()
    
    key_hex = k[2:66]  # 64 hex chars
    key_len = len(key_hex) // 2
    
    # Remove 0x prefix
    pk = private_key_hex.replace('0x', '').lower()
    
    # XOR each byte
    cipher_chars = []
    for i in range(0, len(pk), 2):
        key_byte = int(key_hex[(i // 2) % len(key_hex)], 16)
        cipher_byte = int(pk[i:i+2], 16)
        xor_val = cipher_byte ^ key_byte
        cipher_chars.append(format(xor_val, '02x'))
    
    ciphertext = ''.join(cipher_chars)
    
    return {
        "version": 3,
        "kdf": "simple-xor",
        "iv": "0",
        "authTag": "0",
        "ciphertext": ciphertext
    }

def main():
    S = requests.Session()
    
    # Auth to PB
    r = S.post(f"{PB_URL}/api/collections/_superusers/auth-with-password",
        json={"identity": "admin@eggo.local", "password": "admin123"})
    token = r.json()["token"]
    S.headers.update({"Authorization": f"Bearer {token}"})
    
    # Generate new wallet using cast
    import subprocess
    result = subprocess.run(
        ["cast", "wallet", "new"],
        capture_output=True, text=True, timeout=10
    )
    print(f"cast wallet new output:\n{result.stdout}")
    print(f"cast wallet new stderr:\n{result.stderr}")
    
    # Parse output
    addr = None
    pk = None
    for line in result.stdout.strip().split('\n'):
        if 'Address:' in line:
            addr = line.split('Address:')[1].strip()
        if 'Private key:' in line:
            pk = line.split('Private key:')[1].strip()
    
    print(f"\nNew wallet: {addr}")
    print(f"Private key: {pk}")
    
    # Encrypt private key
    encrypted = xor_encrypt(pk, WALLET_MASTER_KEY, SELLER_USER_ID)
    print(f"\nEncrypted key (v3 XOR):")
    print(json.dumps(encrypted))
    
    # Fund the new wallet with ETH
    print(f"\n--- Funding new wallet with ETH ---")
    r = subprocess.run([
        "cast", "send", "--private-key", RELAYER_PK,
        "--rpc-url", RPC_URL,
        "--value", "0.05ether",
        addr
    ], capture_output=True, text=True, timeout=60)
    print(f"ETH transfer: {r.stdout[-200:] if r.stdout else 'no output'}")
    print(f"  stderr: {r.stderr[-300:] if r.stderr else ''}")
    
    # Mint USDT to new wallet
    print(f"\n--- Minting USDT to new wallet ---")
    r = subprocess.run([
        "cast", "send", "--private-key", RELAYER_PK,
        "--rpc-url", RPC_URL,
        MOCK_USDT,
        "mint(address,uint256)", addr, "100000000000000000000"  # 100 USDT (18 decimals)
    ], capture_output=True, text=True, timeout=60)
    print(f"USDT mint: {r.stdout[-200:] if r.stdout else 'no output'}")
    print(f"  stderr: {r.stderr[-300:] if r.stderr else ''}")
    
    # Update seller's user record in PB
    print(f"\n--- Updating seller PB record ---")
    encrypted_json = json.dumps(encrypted)
    r = S.patch(f"{PB_URL}/api/collections/users/records/{SELLER_USER_ID}",
        json={
            "wallet": addr,
            "encrypted_private_key": encrypted_json
        })
    print(f"Update seller user: {r.status_code} - {r.text[:200]}")
    
    # Update seller's wallet record
    r = S.get(f"{PB_URL}/api/collections/user_wallets/records?perPage=20")
    for w in r.json().get("items", []):
        if w.get("user_id") == SELLER_USER_ID:
            r2 = S.patch(f"{PB_URL}/api/collections/user_wallets/records/{w['id']}",
                json={"wallet_address": addr, "usdt_balance": "100"})
            print(f"Update seller wallet: {r2.status_code} - {r2.text[:200]}")
    
    # Also set encrypted_private_key on the user_wallets record
    for w in r.json().get("items", []):
        if w.get("user_id") == SELLER_USER_ID:
            r2 = S.patch(f"{PB_URL}/api/collections/user_wallets/records/{w['id']}",
                json={"encrypted_private_key": encrypted_json})
            print(f"Set wallet encrypted_key: {r2.status_code}")
    
    print(f"\n=== Done! ===")
    print(f"New seller wallet: {addr}")
    print(f"Private key: {pk}")

if __name__ == "__main__":
    main()
