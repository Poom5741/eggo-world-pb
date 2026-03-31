import { Router, Request, Response } from "express";
import { daccSignAuthorizeEIP7702 } from "dacc-js";
import { defineChain, keccak256, toBytes } from "viem";
import fs from "fs";
import path from "path";

const router = Router();

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface EIP7702AuthorizeRequest {
  daccPublickey: string;
  passwordSecretkey: string;
  address: string;
  smartAccount: string;
  chainId?: number;
}

interface EIP7702ExecuteRequest {
  daccPublickey: string;
  passwordSecretkey: string;
  address: string;
  smartAccount: string;
  to: string;
  data?: string;
  value?: string;
  chainId?: number;
}

let networks: Record<string, NetworkConfig> = {};

const networksPath = path.join(process.cwd(), "config", "networks.json");

try {
  const networksData = fs.readFileSync(networksPath, "utf8");
  networks = JSON.parse(networksData);
} catch (error) {
  console.error("Failed to load networks configuration:", error);
}

function getNetworkByChainId(chainId: number): NetworkConfig | null {
  const networkConfig = networks[String(chainId)];
  if (!networkConfig) {
    return null;
  }
  return networkConfig;
}

function createViemChain(networkConfig: NetworkConfig) {
  return defineChain({
    id: Number(networkConfig.chainId),
    name: networkConfig.name,
    nativeCurrency: networkConfig.nativeCurrency,
    rpcUrls: {
      default: {
        http: [networkConfig.rpcUrl]
      }
    }
  });
}

function convertBigInt(obj: any): any {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, convertBigInt(v)])
    );
  }
  return obj;
}

function validateAuthorizeRequest(body: any): EIP7702AuthorizeRequest | null {
  const { daccPublickey, passwordSecretkey, address, smartAccount, chainId = 56 } = body;
  
  if (!daccPublickey || !passwordSecretkey || !address || !smartAccount) {
    return null;
  }
  
  return {
    daccPublickey,
    passwordSecretkey,
    address,
    smartAccount,
    chainId: Number(chainId)
  };
}

function validateExecuteRequest(body: any): EIP7702ExecuteRequest | null {
  const { 
    daccPublickey, 
    passwordSecretkey, 
    address, 
    to, 
    data, 
    value = "0",
    smartAccount,
    chainId = 56 
  } = body;
  
  if (!daccPublickey || !passwordSecretkey || !address || !to || !smartAccount) {
    return null;
  }
  
  return {
    daccPublickey,
    passwordSecretkey,
    address,
    smartAccount,
    to,
    data: data || "0x",
    value: value || "0",
    chainId: Number(chainId)
  };
}

router.post("/authorize", async (req: Request, res: Response) => {
  try {
    const requestData = validateAuthorizeRequest(req.body);
    
    if (!requestData) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields",
          code: "MISSING_REQUIRED_FIELDS"
        }
      });
    }

    const { daccPublickey, passwordSecretkey, address, smartAccount, chainId } = requestData;

    const network = getNetworkByChainId(chainId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN"
        }
      });
    }

    const customChain = createViemChain(network);

    const authParams: any = {
      network: customChain,
      contractAddress: smartAccount,
      daccPublickey,
      passwordSecretkey
    };

    const result = await daccSignAuthorizeEIP7702(authParams);

    const authorizationHash = keccak256(toBytes(result.authorization || "0x"));

    res.json({
      success: true,
      data: {
        hash: authorizationHash,
        smartAccount,
        chainId,
        status: "authorized",
        expiresAt: result.expiresAt || null
      }
    });

  } catch (error: any) {
    console.error("EIP-7702 authorize error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_AUTH_FAILED"
      }
    });
  }
});

router.post("/execute", async (req: Request, res: Response) => {
  try {
    const requestData = validateExecuteRequest(req.body);
    
    if (!requestData) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields",
          code: "MISSING_REQUIRED_FIELDS"
        }
      });
    }

    const { 
      daccPublickey, 
      passwordSecretkey, 
      address, 
      smartAccount,
      to,
      data,
      value,
      chainId 
    } = requestData;

    const network = getNetworkByChainId(chainId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN"
        }
      });
    }

    const customChain = createViemChain(network);

    const authParams: any = {
      network: customChain,
      contractAddress: smartAccount,
      daccPublickey,
      passwordSecretkey,
      to,
      data,
      value
    };

    const result = await daccSignAuthorizeEIP7702(authParams);

    const transactionHash = keccak256(toBytes(result.authorization || "0x"));

    res.json({
      success: true,
      data: {
        transactionHash: transactionHash,
        from: address,
        to: to,
        value: value,
        smartAccount: smartAccount,
        network: network.name,
        chainId: chainId,
        gasSponsored: true
      }
    });

  } catch (error: any) {
    console.error("EIP-7702 execute error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_EXECUTE_FAILED"
      }
    });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    const { address, chainId = "56" } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: {
          message: "address is required",
          code: "MISSING_ADDRESS"
        }
      });
    }

    const chainIdNum = parseInt(chainId as string);
    const network = getNetworkByChainId(chainIdNum);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN"
        }
      });
    }

    res.json({
      success: true,
      data: {
        address: address,
        eip7702Enabled: false,
        delegateAddress: null,
        authorizationHash: null,
        expiresAt: null,
        chainId: chainIdNum,
        network: network.name
      }
    });

  } catch (error: any) {
    console.error("EIP-7702 status error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "EIP7702_STATUS_FAILED"
      }
    });
  }
});

export default router;
