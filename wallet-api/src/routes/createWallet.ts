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
    res.status(200).json({
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

// POST /api/wallet/create-and-save
// Creates wallet and updates PocketBase user record directly via admin API
// This bypasses PocketBase $http.send response body parsing issues
router.post('/create-and-save', async (req: Request, res: Response) => {
  try {
    const { passwordSecretkey, publicEncryption, userId, pbUrl } = req.body

    if (!passwordSecretkey || !userId || !pbUrl) {
      return res.status(200).json({
        success: false,
        error: { message: 'Missing required fields', code: 'MISSING_FIELDS' }
      })
    }

    console.log(`Creating wallet for user: ${userId}`)

    const wallet = await createDaccWallet({
      passwordSecretkey,
      publicEncryption: publicEncryption || false,
      minPassword: env.MIN_PASSWORD_LENGTH,
      maxPassword: env.MAX_PASSWORD_LENGTH
    })

    console.log(`Wallet created: ${wallet.address}`)

    // Update PocketBase user record directly via admin API
    const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@eggo.local'
    const adminPassword = process.env.PB_ADMIN_PASSWORD || 'admin123'

    // Step 1: Authenticate as admin (PocketBase 0.23+ uses _superusers collection)
    const authResponse = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
    })

    if (!authResponse.ok) {
      console.error('Failed to authenticate with PocketBase admin:', await authResponse.text())
      return res.status(200).json({
        success: false,
        error: { message: 'Failed to authenticate with PocketBase', code: 'PB_AUTH_FAILED' }
      })
    }

    const authData = await authResponse.json()
    const adminToken = authData.token

    // Step 2: Update user record
    const updateResponse = await fetch(`${pbUrl}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        wallet_address: wallet.address,
        usdt_balance: 0,
        usdt_total_earned: 0,
        total_direct_recruits: 0,
        lifetime_food_items: 0,
        highest_tier_reached: 'bronze'
      })
    })

    if (!updateResponse.ok) {
      console.error('Failed to update PocketBase user record:', await updateResponse.text())
      return res.status(200).json({
        success: false,
        error: { message: 'Failed to update user record', code: 'PB_UPDATE_FAILED' }
      })
    }

    console.log(`User record updated: ${userId}`)
    res.status(200).json({
      success: true,
      data: {
        address: wallet.address,
        daccPublickey: wallet.daccPublickey
      }
    })

  } catch (error: any) {
    console.error('Create-and-save wallet error:', error)
    res.status(200).json({
      success: false,
      error: {
        message: error.message || 'Failed to create wallet',
        code: 'WALLET_CREATION_FAILED'
      }
    })
  }
})

export { router as createWalletRouter }
