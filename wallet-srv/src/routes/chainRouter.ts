import { Router } from "express";
import { createDaccWallet } from "dacc-js";

const router = Router();

// Chain configurations
const CHAINS: Record<string, { rpc: string; chainId: number; name: string; nativeCurrency: { name: string; symbol: string; decimals: number } }> = {
  "56": {
    rpc: "https://bsc-dataseed1.binance.org",
    chainId: 56,
    name: "BSC",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  "97": {
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: 97,
    name: "BSC Testnet",
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }
  },
  "1": {
    rpc: process.env.INFURA_KEY ? `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}` : "https://mainnet.infura.io/v3/YOUR_KEY",
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  "11155111": {
    rpc: process.env.INFURA_KEY ? `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}` : "https://sepolia.infura.io/v3/YOUR_KEY",
    chainId: 11155111,
    name: "Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 }
  },
  "137": {
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    name: "Polygon",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  },
  "80001": {
    rpc: "https://rpc-mumbai.maticvigil.com",
    chainId: 80001,
    name: "Mumbai",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  }
};

// GET /:chainId/balance-native
router.get("/:chainId/balance-native", async (req, res) => {
  try {
    const { chainId } = req.params;
    const { address } = req.query;

    // Validate chain
    const chain = CHAINS[chainId];
    if (!chain) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported chain ID: ${chainId}`,
          code: "UNSUPPORTED_CHAIN"
        }
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: {
          message: "address is required",
          code: "MISSING_ADDRESS"
        }
      });
    }

    // Get balance using dacc-js
    const dacc = new (await import("dacc-js")).Dacc();
    const balance = await dacc.getBalance({
      address: address as string,
      network: chain
    });

    res.json({
      success: true,
      data: {
        address: address,
        balance: balance,
        network: chain.name,
        chainId: parseInt(chainId)
      }
    });

  } catch (error: any) {
    console.error("Balance native error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: "BALANCE_NATIVE_FAILED"
      }
    });
  }
});

export default router;
