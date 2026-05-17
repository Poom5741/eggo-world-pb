import { Router } from 'express';
import { ethers } from 'ethers';
import { z } from 'zod';
import { encryptPrivateKey } from '../../utils/encrypt.js';

const createEvmWalletSchema = z.object({
  userId: z.string().min(1, 'userId is required')
});

const router = Router();

router.post('/create-evm', async (req, res) => {
  try {
    const validation = createEvmWalletSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.issues
        }
      });
    }

    const { userId } = validation.data;

    const MASTER_KEY = process.env.WALLET_MASTER_KEY;
    if (!MASTER_KEY) {
      console.error('WALLET_MASTER_KEY not configured');
      return res.status(500).json({
        success: false,
        error: {
          message: 'Wallet service not configured',
          code: 'CONFIG_ERROR'
        }
      });
    }

    console.log(`Creating EVM wallet for user: ${userId}`);

    const wallet = ethers.Wallet.createRandom();

    const address = wallet.address;
    const privateKey = wallet.privateKey;

    const encryptionKey = MASTER_KEY + userId;
    const encrypted_private_key = encryptPrivateKey(privateKey, encryptionKey);

    res.status(200).json({
      success: true,
      data: {
        address: address,
        encrypted_private_key: encrypted_private_key,
        version: encrypted_private_key.version
      }
    });

    console.log(`EVM wallet created: ${address}`);

  } catch (error: any) {
    console.error('Create EVM wallet error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create EVM wallet',
        code: 'EVM_WALLET_CREATION_FAILED'
      }
    });
  }
});

export { router as createEvmWalletRouter };
