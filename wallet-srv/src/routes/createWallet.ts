import { Router } from "express";
import { createDaccWallet } from "dacc-js";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { passwordSecretkey, publicEncryption = false } = req.body;

    // Validate password
    const MIN_PASSWORD = parseInt(process.env.MIN_PASSWORD_LENGTH || "12");
    const MAX_PASSWORD = parseInt(process.env.MAX_PASSWORD_LENGTH || "120");

    if (!passwordSecretkey || passwordSecretkey.length < MIN_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be at least ${MIN_PASSWORD} characters`,
          code: "PASSWORD_TOO_SHORT"
        }
      });
    }

    if (passwordSecretkey.length > MAX_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be at most ${MAX_PASSWORD} characters`,
          code: "PASSWORD_TOO_LONG"
        }
      });
    }

    // Create wallet using dacc-js
    const wallet = await createDaccWallet({
      passwordSecretkey,
      publicEncryption,
      minPassword: MIN_PASSWORD,
      maxPassword: MAX_PASSWORD
    });

    res.json({
      success: true,
      data: {
        address: wallet.address,
        daccPublickey: wallet.daccPublickey
      }
    });

  } catch (error: any) {
    console.error("Wallet creation error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || "Failed to create wallet",
        code: "WALLET_CREATION_FAILED"
      }
    });
  }
});

export default router;
