import { Router } from "express";
import { ethers } from "ethers";
import crypto from "crypto";

const router = Router();

// ─── Configuration ──────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || "https://rpc.0xl3.com";
const CONFIRMATIONS = parseInt(process.env.CONFIRMATIONS || "12", 10);
const GAS_BUFFER_PERCENT = parseInt(process.env.GAS_BUFFER_PERCENT || "20", 10);
const MASTER_KEY = process.env.WALLET_MASTER_KEY || "";
const PB_URL = process.env.POCKETBASE_URL || "https://pb.eggoworld.io";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "";
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || "";
const MOCK_BLOCKCHAIN = process.env.MOCK_BLOCKCHAIN === "true";

// AES-256-GCM encryption constants
const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16;

// Minimal ABI for EggNFT contract
const EGG_NFT_ABI = [
  "function mintEgg(address referrer) external returns (uint256)",
  "function mintEggWithChain(address[4] calldata referrers) external returns (uint256)",
  "function mintPrice() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface EncryptedKeyData {
  version: number;
  kdf?: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

interface MintRequest {
  userId: string;
  wallet: string;
  eggId: string;
  eggNftAddress: string;
  referrerAddress?: string;
  referralChain?: string[];
  daccPublicKey?: string;
  pin?: string;
}

interface MintErrorCode {
  code: string;
  message: string;
}

// ─── Error Classes ──────────────────────────────────────────────────────────

class RetryError extends Error {
  attempts: number;
  lastError: Error;

  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = "RetryError";
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
    throw new Error("PocketBase admin credentials not configured");
  }

  const authResponse = await fetch(
    `${PB_URL}/api/collections/_superusers/auth-with-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  console.log("[Mint Egg] PocketBase admin token refreshed");
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
    (err as any).code = "WALLET_NOT_FOUND";
    throw err;
  }

  const userData = await response.json() as { encrypted_private_key?: string; wallet: string };

  if (!userData.encrypted_private_key) {
    const err = new Error("Encrypted private key not found for user");
    (err as any).code = "WALLET_NOT_FOUND";
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

  let decrypted = "";
  for (let i = 0; i < ciphertext.length; i += 2) {
    const keyByte = parseInt(keyHex[(i / 2) % keyHex.length], 16);
    const cipherByte = parseInt(ciphertext.substr(i, 2), 16);
    const plainByte = cipherByte ^ keyByte;
    decrypted += String.fromCharCode(plainByte);
  }

  if (decrypted.length === 66 && decrypted.startsWith("0x")) {
    return decrypted;
  }

  throw new Error("Legacy decryption failed - invalid private key format");
}

function decryptPrivateKey(encryptedData: EncryptedKeyData, masterKey: string): string {
  // Handle legacy XOR (version 3)
  if (encryptedData.version === 3 || encryptedData.kdf === "simple-xor") {
    console.warn("[Mint Egg] Decrypting legacy XOR wallet");
    return decryptLegacyXOR(encryptedData, masterKey);
  }

  // Handle AES-GCM (version 4)
  if (encryptedData.version !== 4) {
    throw new Error(`Unknown encryption version: ${encryptedData.version}`);
  }

  const key = crypto.createHash("sha256").update(masterKey).digest();
  const iv = Buffer.from(encryptedData.iv, "hex");
  const authTag = Buffer.from(encryptedData.authTag, "hex");
  const ciphertext = Buffer.from(encryptedData.ciphertext, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, undefined, "utf8");
  decrypted += decipher.final("utf8");

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
        error.code === "INSUFFICIENT_FUNDS" ||
        error.code === "CALL_EXCEPTION" ||
        error.code === "UNPREDICTABLE_GAS_LIMIT" ||
        error.message?.includes("revert")
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
        `[Mint Egg] Retry attempt ${attempt}/${maxAttempts} after ${delay}ms: ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript requires this - unreachable
  throw new Error("withRetry: unexpected exit");
}

// ─── Route Handler ──────────────────────────────────────────────────────────

/**
 * POST /api/wallet/mint-egg
 *
 * Called by PocketBase hook 13-mint-egg-nft.pb.js
 * Accepts wallet credentials and mint parameters, executes on-chain mint.
 *
 * When MOCK_BLOCKCHAIN=true, returns a random mock txHash.
 * Otherwise executes real blockchain transaction with retry and confirmation.
 */
router.post("/mint-egg", async (req, res) => {
  try {
    const {
      userId,
      wallet: walletAddress,
      eggId,
      eggNftAddress,
      referrerAddress,
      referralChain,
      daccPublicKey,
      pin,
    } = req.body as MintRequest;

    // Validate required fields
    if (!userId || !walletAddress || !eggId || !eggNftAddress) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Missing required parameters: userId, wallet, eggId, eggNftAddress",
          code: "MISSING_PARAMS",
        },
      });
    }

    console.log(
      `[Mint Egg] User: ${userId}, Wallet: ${walletAddress}, Egg ID: ${eggId}`
    );

    // ─── MOCK MODE ────────────────────────────────────────────────────────
    if (MOCK_BLOCKCHAIN) {
      const mockTxHash = "0x" + crypto.randomBytes(32).toString("hex");
      console.log(`[Mint Egg] MOCK mode - TX hash: ${mockTxHash}`);

      return res.json({
        success: true,
        data: {
          txHash: mockTxHash,
          wallet: walletAddress,
          eggNftAddress: eggNftAddress,
          mock: true,
        },
      });
    }

    // ─── REAL BLOCKCHAIN MODE ─────────────────────────────────────────────

    if (!MASTER_KEY) {
      return res.status(500).json({
        success: false,
        error: {
          message: "Server misconfiguration: WALLET_MASTER_KEY not set",
          code: "SERVER_ERROR",
        },
      });
    }

    // 1. Get user's encrypted private key from PocketBase
    const { encryptedPrivateKey } = await getUserPrivateKey(userId);

    // 2. Decrypt private key
    const privateKey = decryptPrivateKey(encryptedPrivateKey, MASTER_KEY + userId);

    // 3. Create provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    // 4. Connect to EggNFT contract
    const eggContract = new ethers.Contract(eggNftAddress, EGG_NFT_ABI, signer);

    // 5. Get mint price from contract
    const mintPrice: bigint = await eggContract.mintPrice();
    console.log(
      `[Mint Egg] Mint price: ${ethers.formatEther(mintPrice)} native token`
    );

    // 6. Determine the referrer address from referral chain
    const referrerAddr = referralChain && referralChain.length > 0 && referralChain[0]
      ? referralChain[0]
      : ethers.ZeroAddress;

    // 6. Estimate gas with buffer
    let gasLimit: bigint;
    try {
      const gasEstimate: bigint = await eggContract.mintEgg.estimateGas(referrerAddr);
      gasLimit =
        (gasEstimate * BigInt(100 + GAS_BUFFER_PERCENT)) / BigInt(100);
      console.log(
        `[Mint Egg] Gas estimate: ${gasEstimate}, Gas limit (with ${GAS_BUFFER_PERCENT}% buffer): ${gasLimit}`
      );
    } catch (gasError: any) {
      let errorCode = "GAS_ESTIMATION_FAILED";
      let errorMessage =
        "Gas estimation failed. The transaction may fail. Please try again.";

      if (gasError.code === "UNPREDICTABLE_GAS_LIMIT") {
        errorMessage =
          "Cannot estimate gas. This transaction would fail. Please check your wallet balance.";
      } else if (gasError.code === "CALL_EXCEPTION") {
        errorCode = "TRANSACTION_REVERTED";
        errorMessage =
          "Transaction would revert. Please try again or contact support.";
      } else if (gasError.message?.includes("insufficient funds")) {
        errorCode = "INSUFFICIENT_FUNDS_FOR_GAS";
        errorMessage =
          "Insufficient funds for gas. Please add BNB to your wallet.";
      }

      console.error(
        "[Mint Egg] Gas estimation failed:",
        gasError.code || gasError.message
      );
      return res.status(400).json({
        success: false,
        error: { message: errorMessage, code: errorCode },
      });
    }

    // 7. Execute transaction with retry (3 attempts, exponential backoff 1s/2s/4s)
    const tx = await withRetry(async () => {
      return await eggContract.mintEgg(referrerAddr, {
        gasLimit: gasLimit,
      });
    }, 3, 1000);

    console.log(`[Mint Egg] Transaction sent: ${tx.hash}`);

    // 8. Wait for confirmations
    const receipt = await tx.wait(CONFIRMATIONS);

    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction reverted");
    }

    console.log(`[Mint Egg] Confirmed in block ${receipt.blockNumber}`);

    // 9. Create PocketBase egg_nfts record (non-blocking - don't fail mint on PB error)
    try {
      const pbToken = await getPocketBaseAdminToken();

      // Extract token_id from Transfer event logs
      let tokenId: string | null = null;
      if (receipt.logs) {
        const iface = new ethers.Interface(EGG_NFT_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            if (
              parsed?.name === "Transfer" &&
              parsed.args.to.toLowerCase() === walletAddress.toLowerCase()
            ) {
              tokenId = parsed.args.tokenId.toString();
              break;
            }
          } catch {
            // Skip logs that don't match our ABI
          }
        }
      }

      // Fallback: use eggId if tokenId not extracted
      if (!tokenId) {
        console.warn(
          "[Mint Egg] Could not extract tokenId from logs, using eggId"
        );
        tokenId = eggId.toString();
      }

      const pbCreateResponse = await fetch(
        `${PB_URL}/api/collections/egg_nfts/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pbToken}`,
          },
          body: JSON.stringify({
            token_id: tokenId,
            tx_hash: tx.hash,
            owner: userId,
            wallet_address: walletAddress,
            food_count: 2,
            is_hatched: false,
            referral_chain: referrerAddress || null,
            mint_block: receipt.blockNumber,
            status: "confirmed",
          }),
        }
      );

      if (!pbCreateResponse.ok) {
        const pbError = await pbCreateResponse.text();
        console.error("[Mint Egg] Failed to create egg_nfts record:", pbError);
      } else {
        const pbRecord = await pbCreateResponse.json() as { id: string };
        console.log(`[Mint Egg] Created egg_nfts record: ${pbRecord.id}`);
      }
    } catch (pbError: any) {
      console.error("[Mint Egg] PocketBase callback error:", pbError.message);
      // Continue - don't fail mint if PB record creation fails
    }

    // 10. Log gas cost for monitoring
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    console.log(
      `[Mint Egg] Gas cost: ${ethers.formatEther(gasCost)} native token, User: ${userId}`
    );

    // 11. Return success
    res.json({
      success: true,
      data: {
        txHash: tx.hash,
        wallet: walletAddress,
        eggNftAddress: eggNftAddress,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
        eggId: eggId,
        mock: false,
      },
    });
  } catch (error: any) {
    // Don't expose internal errors or sensitive data
    const errorMessage =
      error.message?.includes("private") || error.message?.includes("key")
        ? "Wallet operation failed"
        : error.message || "Failed to mint egg";

    console.error("[Mint Egg] Error:", error.code || error.message);

    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        code: error.code || "MINT_FAILED",
      },
    });
  }
});

export { router as mintEggRouter };
