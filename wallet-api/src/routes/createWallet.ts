import { Router } from 'express'
import type { Request, Response } from 'express'
import { createDaccWallet } from 'dacc-js'
import { env } from '../env.js'

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
    const body: CreateWalletRequest = req.body

    // Validate required fields
    if (!body.passwordSecretkey) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'passwordSecretkey is required',
          code: 'MISSING_PASSWORD'
        }
      } as CreateWalletResponse)
    }

    // Validate password length
    if (body.passwordSecretkey.length < env.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be at least ${env.MIN_PASSWORD_LENGTH} characters long`,
          code: 'PASSWORD_TOO_SHORT'
        }
      } as CreateWalletResponse)
    }

    if (body.passwordSecretkey.length > env.MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Password must be no more than ${env.MAX_PASSWORD_LENGTH} characters long`,
          code: 'PASSWORD_TOO_LONG'
        }
      } as CreateWalletResponse)
    }

    // Create wallet using dacc-js
    const wallet = await createDaccWallet({
      passwordSecretkey: body.passwordSecretkey,
      publicEncryption: body.publicEncryption || false,
      dataStorageNetwork: body.dataStorageNetwork as any,
      pkWalletForSaveData: body.pkWalletForSaveData as any,
      minPassword: body.minPassword || env.MIN_PASSWORD_LENGTH,
      maxPassword: body.maxPassword || env.MAX_PASSWORD_LENGTH
    })

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        address: wallet.address,
        daccPublickey: wallet.daccPublickey
      }
    } as CreateWalletResponse)

  } catch (error: any) {
    console.error('Create wallet error:', error)
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create wallet',
        code: 'WALLET_CREATION_FAILED'
      }
    } as CreateWalletResponse)
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
