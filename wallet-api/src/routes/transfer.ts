import { Router } from 'express';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

// ─── Configuration ──────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || 'https://rpc.0xl3.com';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '7117', 10);
const CONFIRMATIONS = parseInt(process.env.CONFIRMATIONS || '12', 10);
const GAS_BUFFER_PERCENT = parseInt(process.env.GAS_BUFFER_PERCENT || '20', 10);
const TRANSFER_TIMEOUT_MS = parseInt(process.env.TRANSFER_TIMEOUT_MS || '60000', 10);
const MASTER_KEY = process.env.WALLET_MASTER_KEY || '';
const PB_URL = process.env.POCKETBASE_URL || 'https://pb.eggoworld.io';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || '';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || '';

// Use USDT_ADDRESS from environment (docker-compose passes this)
const USDT_CONTRACT_ADDRESS = process.env.USDT_ADDRESS || '';

// ─── Relayer Wallet Initialization ──────────────────────────────────────────

let relayerWallet: ethers.Wallet | null = null;

function initializeRelayerWallet() {
  if (!RELAYER_PRIVATE_KEY) {
    console.warn("WARNING: RELAYER_PRIVATE_KEY not set. Gas sponsorship disabled.");
    console.warn("Users will need their own BNB for gas fees.");
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    console.log(`Relayer wallet initialized: ${relayerWallet.address}`);
    return relayerWallet;
  } catch (error) {
    console.error("Failed to initialize relayer wallet:", (error as Error).message);
    return null;
  }
}

// Initialize on module load
initializeRelayerWallet();

// Gas sponsorship logging helper
function logGasSponsorship(operation: string, userId: string, receipt: ethers.TransactionReceipt) {
  // In ethers v6, use gasPrice for gas cost calculation
  const gasCost = receipt.gasUsed * receipt.gasPrice!;
  const gasCostBNB = ethers.formatEther(gasCost);

  // Log for accounting/monitoring
  console.log(
    `[Gas Sponsorship] ${operation} - User: ${userId}, Gas: ${gasCostBNB} BNB, TxHash: ${receipt.hash}`
  );

  return {
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.gasPrice!.toString(),
    totalCostWei: gasCost.toString(),
    totalCostBNB: gasCostBNB,
  };
}

// AES-256-GCM encryption constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits (standard for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits

// USDT ABI for transfer operation
const USDT_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface EncryptedKeyData {
  version: number;
  kdf?: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

interface TransferRequest {
  to_address: string;
  amount: number | string;
  user_id: string;
}

interface TransferErrorCode {
  code: string;
  message: string;
}

// ─── Zod Validation Schema ──────────────────────────────────────────────────

const transferSchema = z.object({
  to_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).refine(val => Number(val) > 0, {
    message: 'Amount must be greater than 0'
  }),
  user_id: z.string().min(1, 'user_id is required')
});

// ─── Error Classes ──────────────────────────────────────────────────────────

class RetryError extends Error {
  attempts: number;
  lastError: Error;

  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// ─── PocketBase Admin Auth ──────────────────────────────────────────────────

let pbAdminToken: string | null = null;
let pbTokenExpiry = 0;

async function getPocketBaseAdminToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (pbAdminToken && Date.now() < pbTokenExpiry - 300000) {
    return pbAdminToken;
  }

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error('PocketBase admin credentials not configured');
  }

  const authResponse = await fetch(
    `${PB_URL}/api/collections/_superusers/auth-with-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: PB_ADMIN_EMAIL,
        password: PB_ADMIN_PASSWORD,
      }),
    }
  );

  if (!authResponse.ok) {
    const error = await authResponse.text();
    throw new Error(`PocketBase admin auth failed: ${error}`);
  }

  const authData = await authResponse.json() as { token: string };
  pbAdminToken = authData.token;
  pbTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  console.log('[USDT Transfer] PocketBase admin token refreshed');
  return pbAdminToken!;
}

// ─── Wallet Utilities ───────────────────────────────────────────────────────

async function getUserPrivateKey(
  userId: string
): Promise<{ encryptedPrivateKey: EncryptedKeyData; walletAddress: string }> {
  const token = await getPocketBaseAdminToken();

  const response = await fetch(
    `${PB_URL}/api/collections/users/records/${userId}?fields=wallet,daccPublickey,pin,encrypted_private_key,wallet_version`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`Failed to fetch user wallet: ${errorText}`);
    (err as any).code = 'WALLET_NOT_FOUND';
    throw err;
  }

  const userData = await response.json() as { encrypted_private_key?: string; wallet: string };

  if (!userData.encrypted_private_key) {
    const err = new Error('Encrypted private key not found for user');
    (err as any).code = 'WALLET_NOT_FOUND';
    throw err;
  }

  return {
    encryptedPrivateKey: typeof userData.encrypted_private_key === 'string'
      ? JSON.parse(userData.encrypted_private_key)
      : userData.encrypted_private_key,
    walletAddress: userData.wallet,
  };
}

function decryptLegacyXOR(encryptedData: EncryptedKeyData, masterKey: string): string {
  const keyHash = ethers.id(masterKey);
  const keyHex = keyHash.slice(2, 66);
  const ciphertext = encryptedData.ciphertext;

  let decrypted = '';
  for (let i = 0; i < ciphertext.length; i += 2) {
    const keyByte = parseInt(keyHex[(i / 2) % keyHex.length], 16);
    const cipherByte = parseInt(ciphertext.substr(i, 2), 16);
    const plainByte = cipherByte ^ keyByte;
    decrypted += String.fromCharCode(plainByte);
  }

  if (decrypted.length === 66 && decrypted.startsWith('0x')) {
    return decrypted;
  }

  throw new Error('Legacy decryption failed - invalid private key format');
}

function decryptPrivateKey(encryptedData: EncryptedKeyData, masterKey: string): string {
  // Handle legacy XOR (version 3)
  if (encryptedData.version === 3 || encryptedData.kdf === 'simple-xor') {
    console.warn('[USDT Transfer] Decrypting legacy XOR wallet');
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
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ─── Retry Logic ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on validation or auth errors
      if (
        error.code === 'INSUFFICIENT_FUNDS' ||
        error.code === 'CALL_EXCEPTION' ||
        error.code === 'UNPREDICTABLE_GAS_LIMIT' ||
        error.message?.includes('revert')
      ) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw new RetryError(
          `Failed after ${maxAttempts} attempts: ${error.message}`,
          attempt,
          error
        );
      }

      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(
        `[USDT Transfer] Retry attempt ${attempt}/${maxAttempts} after ${delay}ms: ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript requires this - unreachable
  throw new Error('withRetry: unexpected exit');
}

// ─── Route Handler ──────────────────────────────────────────────────────────

/**
 * POST /api/wallet/transfer
 *
 * Called by PocketBase hook 09-withdraw-usdt.pb.js for USDT transfers
 * Accepts recipient address, amount, and user identifier to perform token transfer.
 * 
 * Gas sponsorship: If user has insufficient BNB for gas fees, platform relayer wallet
 * covers the gas costs to avoid user friction. Gas costs are logged for accounting.
 */
router.post('/transfer', async (req, res) => {
  try {
    // Validate request body with Zod
    const validation = transferSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid parameters',
          code: 'INVALID_PARAMS',
          details: validation.error.issues
        }
      });
    }

    const { to_address, amount, user_id } = validation.data;

    console.log(`[USDT Transfer] From user: ${user_id} -> ${to_address}, amount: ${amount}`);

    if (!USDT_CONTRACT_ADDRESS) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'USDT contract not configured',
          code: 'CONFIG_ERROR'
        }
      });
    }

    if (!MASTER_KEY) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Server misconfiguration: WALLET_MASTER_KEY not set',
          code: 'SERVER_ERROR',
        },
      });
    }

    const { encryptedPrivateKey } = await getUserPrivateKey(user_id);
    const privateKey = decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + user_id);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const userWallet = new ethers.Wallet(privateKey, provider);

    if (!relayerWallet) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Gas sponsorship not configured — RELAYER_PRIVATE_KEY missing or invalid',
          code: 'SPONSOR_NOT_CONFIGURED'
        }
      });
    }

    const userBNBBalance = await provider.getBalance(userWallet.address);
    const gasSponsorTx = await relayerWallet.sendTransaction({
      to: userWallet.address,
      value: ethers.parseEther('0.005'),
    });
    await gasSponsorTx.wait(2);
    console.log(`[USDT Transfer] Gas sponsored: ${gasSponsorTx.hash} (user BNB was ${ethers.formatEther(userBNBBalance)})`);

    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, userWallet);

    // 6. Convert amount to proper units (USDT uses 18 decimals)
    const amountWithDecimals = ethers.parseUnits(amount.toString(), 18);
    console.log(`[USDT Transfer] Parsed amount: ${amountWithDecimals}, to: ${to_address}`);

    // 6.5. Verify on-chain USDT balance BEFORE attempting transfer
    let userUSDTBalance: bigint;
    try {
      userUSDTBalance = await usdtContract.balanceOf(userWallet.address);
      console.log(
        `[USDT Transfer] On-chain USDT balance: ${ethers.formatUnits(userUSDTBalance, 18)}, required: ${amount}`
      );
    } catch (balanceError: any) {
      console.error('[USDT Transfer] Failed to read on-chain USDT balance:', balanceError.message);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to verify wallet balance on-chain', code: 'BALANCE_CHECK_FAILED' },
      });
    }

    if (userUSDTBalance < amountWithDecimals) {
      const balanceFormatted = ethers.formatUnits(userUSDTBalance, 18);
      console.error(
        `[USDT Transfer] Insufficient on-chain USDT: balance=${balanceFormatted}, required=${amount}`
      );
      return res.status(400).json({
        success: false,
        error: {
          message: `Insufficient USDT balance on-chain. Available: ${balanceFormatted} USDT, Required: ${amount} USDT`,
          code: 'INSUFFICIENT_USDT_BALANCE',
        },
      });
    }

    // 7. Estimate gas with buffer
    let gasLimit: bigint;
    const FALLBACK_GAS_LIMIT = BigInt(100_000); // Known-safe gas limit for ERC-20 transfers
    try {
      const gasEstimate = await usdtContract.transfer.estimateGas(to_address, amountWithDecimals);
      gasLimit = (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
      console.log(
        `[USDT Transfer] Gas estimate: ${gasEstimate}, Gas limit (with ${GAS_BUFFER_PERCENT}% buffer): ${gasLimit}`
      );
    } catch (gasError: any) {
      // Since we already verified balance, use fallback gas limit instead of failing
      console.error(
        `[USDT Transfer] Gas estimation failed (code: ${gasError.code}), but on-chain balance is sufficient. Using fallback gas limit: ${FALLBACK_GAS_LIMIT}`
      );
      console.error('[USDT Transfer] Gas error details:', gasError.message || JSON.stringify(gasError));
      gasLimit = FALLBACK_GAS_LIMIT;
    }

    // 8. Execute transaction with retry (3 attempts, exponential backoff 1s/2s/4s)
    const tx = await withRetry(async () => {
      return await usdtContract.transfer(to_address, amountWithDecimals, {
        gasLimit: gasLimit,
      });
    }, 3, 1000);

    console.log(`[USDT Transfer] Transaction sent: ${tx.hash}`);

    // 9. Wait for confirmations with timeout
    const receiptPromise = tx.wait(CONFIRMATIONS);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutErr = new Error('TRANSFER_TIMEOUT');
        (timeoutErr as any).code = 'TRANSFER_TIMEOUT';
        (timeoutErr as any).txHash = tx.hash;
        reject(timeoutErr);
      }, TRANSFER_TIMEOUT_MS);
    });

    const receipt = await Promise.race([receiptPromise, timeoutPromise]);

    if (!receipt || receipt.status !== 1) {
      throw new Error('USDT transfer transaction reverted');
    }

    console.log(`[USDT Transfer] Confirmed: ${receipt.transactionHash} in block ${receipt.blockNumber}`);

    logGasSponsorship('USDT Transfer', user_id, receipt);

    res.json({
      success: true,
      data: {
        amount: amount,
        status: 'completed',
        txHash: receipt.transactionHash,
        block: receipt.blockNumber,
        gas_sponsored: true
      }
    });
  } catch (error: any) {
    const errorMessage =
      error.message?.includes('private') || error.message?.includes('key')
        ? 'Fund transfer failed'
        : error.message || 'Failed to transfer USDT';

    console.error('[USDT Transfer] Error:', error.code || error.message);

    // Handle specific timeout error
    if (error.message === 'TRANSFER_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: {
          message: 'Transfer transaction not confirmed within timeout. The transaction may still complete on-chain. Check txHash for status.',
          code: 'TRANSFER_TIMEOUT',
          txHash: (error as any).txHash || null
        }
      });
    }

    // Determine appropriate error code
    let errorCode = error.code || 'TRANSFER_FAILED';
    if (errorMessage.includes('insufficient funds')) {
      errorCode = 'INSUFFICIENT_FUNDS';
    } else if (errorMessage.includes('revert')) {
      errorCode = 'TRANSACTION_REVERTED';
    } else if (errorMessage.includes('Insufficient BNB for gas fees')) {
      errorCode = 'INSUFFICIENT_GAS_FUNDS';
    }

    res.status(errorCode === 'TRANSFER_TIMEOUT' ? 504 : 500).json({
      success: false,
      error: {
        message: errorMessage,
        code: errorCode
      }
    });
  }
});

export { router as transferRouter };