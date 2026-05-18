import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createWalletRouter } from './routes/createWallet.js'
import { createEvmWalletRouter } from './routes/createEvmWallet.js'
import { migrateWalletRouter } from './routes/migrateWallet.js'
import { mintEggRouter } from './routes/mintEgg.js'
import { transferRouter } from './routes/transfer.js'
import { depositScannerRouter } from './routes/depositScanner.js'
import { startDepositScanner, stopDepositScanner } from './depositScanner.js'
import type { Request, Response, NextFunction } from 'express'
import { env } from './env.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = env.PORT

// Rate limiter - 10 requests per 15 minutes per IP for transfer operations
const transferRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { 
    success: false, 
    error: { 
      message: 'Too many requests', 
      code: 'RATE_LIMITED' 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware - NO compression to fix PocketBase $http.send compatibility
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
app.use('/api/wallet', createEvmWalletRouter)
app.use('/api/wallet', migrateWalletRouter)
app.use('/api/wallet', mintEggRouter)
// Apply rate limiting to transfer endpoint (v1 API path for PocketBase hook compatibility)
app.use('/api/v1/wallet', transferRateLimiter, transferRouter)

app.use('/api/v1/deposit-scanner', depositScannerRouter)

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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Wallet API Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔧 Environment: ${env.NODE_ENV}`)
  startDepositScanner()
})

gracefulShutdown(server)

function gracefulShutdown(server: ReturnType<typeof app.listen>) {
  const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`)
    stopDepositScanner()
    server.close(() => {
      process.exit(0)
    })
    setTimeout(() => {
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

export default app
