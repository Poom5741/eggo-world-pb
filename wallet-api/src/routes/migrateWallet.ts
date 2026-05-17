import { Router } from 'express'
import { ethers } from 'ethers'
import { z } from 'zod'
import { encryptPrivateKey } from '../../utils/encrypt.js'

// Type declaration for utils/encrypt.js
interface EncryptedKeyData {
  version: number
  iv: string
  authTag: string
  ciphertext: string
}

const migrateWalletSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  pbUrl: z.string().url('pbUrl must be a valid URL')
})

const router = Router()

// POST /api/wallet/migrate-evm
// Generates EVM wallet for existing users without one and updates PB user record
router.post('/migrate-evm', async (req, res) => {
  try {
    const validation = migrateWalletSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(200).json({
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.issues
        }
      })
    }

    const { userId, pbUrl } = validation.data

    const MASTER_KEY = process.env.WALLET_MASTER_KEY
    const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@eggo.local'
    const adminPassword = process.env.PB_ADMIN_PASSWORD || 'admin123'

    if (!MASTER_KEY) {
      console.error('WALLET_MASTER_KEY not configured')
      return res.status(200).json({
        success: false,
        error: {
          message: 'Wallet service not configured',
          code: 'CONFIG_ERROR'
        }
      })
    }

    console.log(`Migrating EVM wallet for user: ${userId}`)

    // Step 1: Generate EVM wallet
    const wallet = ethers.Wallet.createRandom()
    const address = wallet.address
    const privateKey = wallet.privateKey

    // Step 2: Encrypt private key
    const encryptionKey = MASTER_KEY + userId
    const encrypted_private_key: EncryptedKeyData = encryptPrivateKey(privateKey, encryptionKey)

    // Step 3: Authenticate as PocketBase admin
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

    const authData = await authResponse.json() as { token: string }
    const adminToken = authData.token

    // Step 4: Update user record with encrypted private key
    const updateResponse = await fetch(`${pbUrl}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        encrypted_private_key: JSON.stringify(encrypted_private_key)
      })
    })

    if (!updateResponse.ok) {
      console.error('Failed to update PocketBase user record:', await updateResponse.text())
      return res.status(200).json({
        success: false,
        error: { message: 'Failed to update user record', code: 'PB_UPDATE_FAILED' }
      })
    }

    console.log(`EVM wallet migrated for user: ${address}`)

    res.status(200).json({
      success: true,
      data: {
        address: address,
        encrypted_private_key: encrypted_private_key
      }
    })

  } catch (error: any) {
    console.error('Migrate wallet error:', error)
    res.status(200).json({
      success: false,
      error: {
        message: error.message || 'Failed to migrate wallet',
        code: 'WALLET_MIGRATION_FAILED'
      }
    })
  }
})

export { router as migrateWalletRouter }
