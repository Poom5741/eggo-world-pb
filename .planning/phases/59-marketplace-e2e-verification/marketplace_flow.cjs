// Marketplace E2E Flow Script
// Handles: buyer wallet setup, listing, buying on-chain
// Since wallet-api uses relayer but Marketplace contract requires msg.sender = owner/buyer

const { ethers } = require('ethers');

// ─── Configuration ──────────────────────────────────────────────────────────
const PB_URL = 'http://localhost:8090';
const RPC_URL = 'https://rpc.0xl3.com';
const WALLET_MASTER_KEY = '0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630';
const PB_ADMIN_EMAIL = 'admin@eggo.local';
const PB_ADMIN_PASSWORD = 'admin123';

const CONTRACTS = {
  usdt: '0x6Ce3cCcBC5146ED8b88F1FbC12D4682Be3E4Cf8e',
  eggNft: '0xd8292C1cB10802a61F91e04ed5Ea0865499Bf6FE',
  marketplace: '0x238eB80DDa39A6C211fBC45852ec7a3569e3E4a9',
  commission: '0xF01e1A6BAB405f31B43851B198f5Ce51B98aBE44',
};

// Seller wallet (already has encrypted_private_key)
const SELLER_USER_ID = '2365hdkq6zo7x5y';
const SELLER_WALLET = '0x11a577554eBFE49ed259CAE0A4E08e462c8790E0';

// Buyer wallet (needs encrypted_private_key)
const BUYER_USER_ID = 'p70qpe6e4fzxiv7';
const BUYER_EXISTING_WALLET = '0x89A47D21b742010eD1DE9f5Fa52e15d471F07d9A';

// Egg details
const TOKEN_ID = 5;
const EGG_ID = 1778433239028;
const PRICE = 50; // USDT
const NFT_TYPE_EGG = 0;

// ─── ABI Fragments ──────────────────────────────────────────────────────────
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
];

const ERC721_ABI = [
  'function approve(address to, uint256 tokenId) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];

const MARKETPLACE_ABI = [
  'function listNFTForSale(address nftContract, uint256 tokenId, uint256 price, uint8 nftType) external',
  'function buyNFT(address nftContract, uint256 tokenId) external',
  'function getListing(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, uint256 listedAt, uint8 nftType, uint256 originalEggId, bool active)',
];

const COMMISSION_ABI = [
  'function getCommissionBalance(address user) external view returns (uint256)',
];

// ─── XOR Decryption (same as wallet-api's decryptLegacyXOR) ──────────────────
function xorDecrypt(encryptedJson, masterKey, userId) {
  const encrypted = typeof encryptedJson === 'string' ? JSON.parse(encryptedJson) : encryptedJson;
  if (encrypted.kdf !== 'simple-xor') {
    throw new Error('Unsupported KDF: ' + encrypted.kdf);
  }
  const encryptionKey = masterKey + userId;
  const keyHash = ethers.id(encryptionKey);
  const keyHex = keyHash.slice(2, 66);
  const ciphertext = encrypted.ciphertext;

  let decrypted = '';
  for (let i = 0; i < ciphertext.length; i += 2) {
    const keyByte = parseInt(keyHex[(i / 2) % 64], 16);
    const cipherByte = parseInt(ciphertext.substr(i, 2), 16);
    const plainByte = cipherByte ^ keyByte;
    decrypted += String.fromCharCode(plainByte);
  }
  return decrypted;
}

function xorEncrypt(pk, masterKey, userId) {
  const encryptionKey = masterKey + userId;
  const keyHash = ethers.id(encryptionKey);
  const keyHex = keyHash.slice(2, 66);

  let ciphertext = '';
  for (let i = 0; i < pk.length; i++) {
    const keyByte = parseInt(keyHex[i % 64], 16);
    const plainByte = pk.charCodeAt(i);
    const cipherByte = plainByte ^ keyByte;
    ciphertext += cipherByte.toString(16).padStart(2, '0');
  }

  return JSON.stringify({
    version: 3,
    kdf: 'simple-xor',
    iv: '0',
    authTag: '0',
    ciphertext: ciphertext,
  });
}

// ─── PocketBase Helpers ─────────────────────────────────────────────────────
async function getPbToken() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
  });
  const data = await res.json();
  return data.token;
}

async function getUserRecord(pbToken, userId) {
  const res = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    headers: { Authorization: `Bearer ${pbToken}` },
  });
  return res.json();
}

async function patchUser(pbToken, userId, data) {
  const res = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pbToken}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ─── Step 1: Setup Buyer Wallet ────────────────────────────────────────────
async function setupBuyerWallet(pbToken) {
  console.log('\n=== Step 1: Setup Buyer Wallet ===');

  // Generate new ethers wallet
  const wallet = ethers.Wallet.createRandom();
  const pk = wallet.privateKey;
  const addr = wallet.address;

  console.log(`Generated wallet: ${addr}`);

  // Encrypt private key with XOR
  const encryptedJson = xorEncrypt(pk, WALLET_MASTER_KEY, BUYER_USER_ID);
  console.log(`Encrypted key created`);

  // Store in PB
  const result = await patchUser(pbToken, BUYER_USER_ID, {
    wallet: addr,
    encrypted_private_key: JSON.parse(encryptedJson),
  });

  console.log(`PB user updated: wallet=${result.wallet}`);
  console.log(`Private key: ${pk}`);

  return { address: addr, privateKey: pk, encryptedJson };
}

// ─── Step 2: List Egg on Marketplace ───────────────────────────────────────
async function listOnMarketplace(pbToken, sellerPrivateKey) {
  console.log('\n=== Step 2: List Egg on Marketplace ===');

  // Step A: Call PB hook to create listing record
  console.log('\n-- Step A: Creating PB listing record --');
  
  // Get seller's auth token
  const sellerAuthRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'test_seller@e2e.eggoworld.io', password: 'TestPass123!' }),
  });
  const sellerAuth = await sellerAuthRes.json();
  const sellerToken = sellerAuth.token;

  const listRes = await fetch(`${PB_URL}/api/v2/list-egg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ egg_id: EGG_ID, price: PRICE }),
  });
  const listData = await listRes.json();
  console.log('PB list response:', JSON.stringify(listData, null, 2));

  let listingId = null;
  if (!listData.success) {
    console.log('PB listing failed (non-fatal):', JSON.stringify(listData.error));
    console.log('Continuing with on-chain listing only...');
  } else {
    listingId = listData.data.listing_id;
    console.log(`PB listing created: ${listingId}`);
  }

  // Step B: Approve Marketplace contract for EggNFT token
  console.log('\n-- Step B: Approve Marketplace for EggNFT --');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const sellerSigner = new ethers.Wallet(sellerPrivateKey, provider);

  const eggContract = new ethers.Contract(CONTRACTS.eggNft, ERC721_ABI, sellerSigner);
  
  const approveTx = await eggContract.approve(CONTRACTS.marketplace, TOKEN_ID);
  console.log(`Approve tx: ${approveTx.hash}`);
  const approveReceipt = await approveTx.wait();
  console.log(`Approved in block ${approveReceipt.blockNumber}, status: ${approveReceipt.status === 1 ? 'OK' : 'FAILED'}`);

  // Step C: Call Marketplace.listNFTForSale
  console.log('\n-- Step C: Calling Marketplace.listNFTForSale --');
  const marketplaceContract = new ethers.Contract(CONTRACTS.marketplace, MARKETPLACE_ABI, sellerSigner);

  const listTx = await marketplaceContract.listNFTForSale(
    CONTRACTS.eggNft,
    TOKEN_ID,
    ethers.parseUnits(String(PRICE), 18),
    NFT_TYPE_EGG,
  );
  console.log(`List tx: ${listTx.hash}`);
  const listReceipt = await listTx.wait();
  console.log(`Listed in block ${listReceipt.blockNumber}, status: ${listReceipt.status === 1 ? 'OK' : 'FAILED'}`);

  // Verify on-chain listing
  const listing = await marketplaceContract.getListing(CONTRACTS.eggNft, TOKEN_ID);
  console.log(`On-chain listing: seller=${listing.seller}, price=${listing.price.toString()}, active=${listing.active}`);

  return { listingId, txHash: listTx.hash };
}

// ─── Step 3: Buy Egg from Marketplace ──────────────────────────────────────
async function buyFromMarketplace(pbToken, buyerPrivateKey) {
  console.log('\n=== Step 3: Buy Egg from Marketplace ===');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const buyerSigner = new ethers.Wallet(buyerPrivateKey, provider);
  const buyerAddr = buyerSigner.address;
  console.log(`Buyer address: ${buyerAddr}`);

  // Step A: Check listing still active
  const marketplaceContract = new ethers.Contract(CONTRACTS.marketplace, MARKETPLACE_ABI, buyerSigner);
  const listing = await marketplaceContract.getListing(CONTRACTS.eggNft, TOKEN_ID);
  console.log(`Listing: seller=${listing.seller}, active=${listing.active}, price=${listing.price.toString()}`);

  if (!listing.active) {
    throw new Error('Listing is no longer active');
  }

  // Step B: Approve Marketplace contract for USDT
  console.log('\n-- Step B: Approve Marketplace for USDT --');
  const usdtContract = new ethers.Contract(CONTRACTS.usdt, ERC20_ABI, buyerSigner);
  
  const approveTx = await usdtContract.approve(CONTRACTS.marketplace, listing.price);
  console.log(`Approve tx: ${approveTx.hash}`);
  const approveReceipt = await approveTx.wait();
  console.log(`Approved in block ${approveReceipt.blockNumber}, status: ${approveReceipt.status === 1 ? 'OK' : 'FAILED'}`);

  // Step C: Call Marketplace.buyNFT
  console.log('\n-- Step C: Calling Marketplace.buyNFT --');
  const buyTx = await marketplaceContract.buyNFT(CONTRACTS.eggNft, TOKEN_ID);
  console.log(`Buy tx: ${buyTx.hash}`);
  const buyReceipt = await buyTx.wait();
  console.log(`Bought in block ${buyReceipt.blockNumber}, status: ${buyReceipt.status === 1 ? 'OK' : 'FAILED'}`);

  // Verify on-chain ownership
  const eggContract = new ethers.Contract(CONTRACTS.eggNft, ERC721_ABI, buyerSigner);
  const owner = await eggContract.ownerOf(TOKEN_ID);
  console.log(`New owner: ${owner}`);

  return { txHash: buyTx.hash, newOwner: owner };
}

// ─── Step 4: Verify Commission ─────────────────────────────────────────────
async function verifyCommission(pbToken) {
  console.log('\n=== Step 4: Verify Commission ===');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const commissionContract = new ethers.Contract(CONTRACTS.commission, COMMISSION_ABI, provider);

  // Check referrer commission balance
  const referrerWallet = '0xe061c25cA759AE4Abcf38FA850f318B98EF009aE';
  const balance = await commissionContract.getCommissionBalance(referrerWallet);
  console.log(`Referrer (${referrerWallet}) commission balance: ${ethers.formatUnits(balance, 18)} USDT`);

  // Check PB commission_records
  const pbToken2 = await getPbToken();
  const compRes = await fetch(`${PB_URL}/api/collections/commission_records/records?sort=-created`, {
    headers: { Authorization: `Bearer ${pbToken2}` },
  });
  const compData = await compRes.json();
  console.log('Commission records:');
  for (const r of compData.items || []) {
    console.log(`  level=${r.level} amount=${r.amount} from_egg=${r.from_egg} claimed=${r.claimed}`);
  }

  return { commissionBalance: balance.toString() };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || 'all';

  console.log('=== Marketplace E2E Flow ===');
  console.log(`Mode: ${mode}`);
  console.log(`Network: 0xl3 (RPC: ${RPC_URL})`);

  const pbToken = await getPbToken();
  let sellerKey, buyerKey;

  if (mode === 'all' || mode === 'setup-buyer') {
    // Step 1: Setup buyer wallet
    const buyerWallet = await setupBuyerWallet(pbToken);
    buyerKey = buyerWallet.privateKey;

    // Fund buyer with ETH for gas
    console.log('\n-- Funding buyer with ETH --');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(process.env.RELAYER_PK || '0xea7e794abf81dc4b7eaf5c1f206a911244eeb9991bf78b4e91aad096e5ac1630', provider);
    
    const fundTx = await relayer.sendTransaction({
      to: buyerWallet.address,
      value: ethers.parseEther('0.05'),
    });
    console.log(`Fund tx: ${fundTx.hash}`);
    await fundTx.wait();
    console.log('Buyer funded with 0.05 ETH');

    // Fund buyer with USDT
    console.log('\n-- Funding buyer with USDT --');
    const usdtContract = new ethers.Contract(CONTRACTS.usdt, [
      'function mint(address to, uint256 amount) external',
    ], relayer);
    
    const mintTx = await usdtContract.mint(buyerWallet.address, ethers.parseUnits('100', 18));
    console.log(`USDT mint tx: ${mintTx.hash}`);
    await mintTx.wait();
    console.log('Buyer funded with 100 USDT');
  }

  if (mode === 'all' || mode === 'list') {
    // Get seller's private key
    const sellerRecord = await getUserRecord(pbToken, SELLER_USER_ID);
    const encryptedKey = sellerRecord.encrypted_private_key;
    const sellerPk = xorDecrypt(encryptedKey, WALLET_MASTER_KEY, SELLER_USER_ID);
    sellerKey = sellerPk;

    // Step 2: List egg
    const listing = await listOnMarketplace(pbToken, sellerPk);
    console.log('\n✅ Listing complete!');
    console.log(`Listing ID: ${listing.listingId}`);
    console.log(`List tx: ${listing.txHash}`);
  }

  if (mode === 'all' || mode === 'buy') {
    // Get buyer's private key (either from setup above or from PB)
    if (!buyerKey) {
      const buyerRecord = await getUserRecord(pbToken, BUYER_USER_ID);
      const encryptedKey = buyerRecord.encrypted_private_key;
      buyerKey = xorDecrypt(encryptedKey, WALLET_MASTER_KEY, BUYER_USER_ID);
    }

    // Step 3: Buy egg
    const purchase = await buyFromMarketplace(pbToken, buyerKey);
    console.log('\n✅ Purchase complete!');
    console.log(`Buy tx: ${purchase.txHash}`);
    console.log(`New owner: ${purchase.newOwner}`);
  }

  if (mode === 'all' || mode === 'verify') {
    // Step 4: Verify commission
    await verifyCommission(pbToken);
  }

  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
