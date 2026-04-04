import { Router } from 'express'
import type { Request, Response } from 'express'
import { createDaccWallet } from 'dacc-js'
import { z } from 'zod'
import { env } from '../env.js'

// Validation schemas with Zod
const createWalletSchema = z.object({
  passwordSecretkey: z.string()
    .min(env.MIN_PASSWORD_LENGTH, `Password must be at least ${env.MIN_PASSWORD_LENGTH} characters`)
    .max(env.MAX_PASSWORD_LENGTH, `Password must be no more than ${env.MAX_PASSWORD_LENGTH} characters`),
  publicEncryption: z.boolean().optional(),
  dataStorageNetwork: z.string().optional(),
  pkWalletForSaveData: z.string().optional(),
  minPassword: z.number().optional(),
  maxPassword: z.number().optional()
})

const router = Router()

// Validation schemas
interface CreateWalletRequest {
  passwordSecretkey: string
  publicEncryption?: boolean
  dataStorageNetwork?: string
  pkWalletForSaveData?: string
  minPassword?: number
  maxPassword?: number
}

interface CreateWalletResponse {
  success: boolean
  data?: {
    address: string
    daccPublickey: string
  }
  error?: {
    message: string
    code: string
  }
}

// POST /api/wallet/create
router.post('/create', async (req: Request, res: Response) => {
  try {
    // Validate request body with Zod
    const validation = createWalletSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors
        }
      })
    }

    const { passwordSecretkey, publicEncryption, dataStorageNetwork, pkWalletForSaveData, minPassword, maxPassword } = validation.data

    // Create wallet using dacc-js
    const wallet = await createDaccWallet({
      passwordSecretkey,
      publicEncryption: publicEncryption || false,
      dataStorageNetwork: dataStorageNetwork as any,
      pkWalletForSaveData: pkWalletForSaveData as any,
      minPassword: minPassword || env.MIN_PASSWORD_LENGTH,
      maxPassword: maxPassword || env.MAX_PASSWORD_LENGTH
    })

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        address: wallet.address,
        daccPublickey: wallet.daccPublickey
      }
    })

  } catch (error: any) {
    console.error('Create wallet error:', error)
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create wallet',
        code: 'WALLET_CREATION_FAILED'
      }
    })
  }
})

// GET /api/wallet/create-info
router.get('/create-info', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      minPasswordLength: env.MIN_PASSWORD_LENGTH.toString(),
      maxPasswordLength: env.MAX_PASSWORD_LENGTH.toString(),
      supportedNetworks: ['sepolia', 'opSepolia', 'baseSepolia', 'bnbTestnet', 'ethereum', 'optimism', 'base', 'bnb'],
      publicEncryptionEnabled: env.PUBLIC_ENCRYPTION,
      defaultNetwork: env.DATA_STORAGE_NETWORK
    }
  })
})

export { router as createWalletRouter }
