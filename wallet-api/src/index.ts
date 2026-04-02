import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createWalletRouter } from './routes/createWallet.js'
import type { Request, Response, NextFunction } from 'express'
import { env } from './env.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = env.PORT

// Middleware
app.use(helmet())
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'wallet-api',
    version: '2.0.0'
  })
})

// API Routes - keeping backward compatible path /api/wallet/create
app.use('/api/wallet', createWalletRouter)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  })
})

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    }
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Wallet API Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 Environment: ${env.NODE_ENV}`)
})

export default app
