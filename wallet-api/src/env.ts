// Type-safe environment variables
export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  MIN_PASSWORD_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH || '12', 10),
  MAX_PASSWORD_LENGTH: parseInt(process.env.MAX_PASSWORD_LENGTH || '120', 10),
  PUBLIC_ENCRYPTION: process.env.PUBLIC_ENCRYPTION === 'true',
  DATA_STORAGE_NETWORK: process.env.DATA_STORAGE_NETWORK || 'opSepolia',
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Blockchain configuration for transfer functionality
  RPC_URL: process.env.RPC_URL || 'https://rpc.0xl3.com',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '7117', 10),
  USDT_ADDRESS: process.env.USDT_ADDRESS || '',
  WALLET_MASTER_KEY: process.env.WALLET_MASTER_KEY || '',
  CONFIRMATIONS: parseInt(process.env.CONFIRMATIONS || '12', 10),
  GAS_BUFFER_PERCENT: parseInt(process.env.GAS_BUFFER_PERCENT || '20', 10),
  TRANSFER_TIMEOUT_MS: parseInt(process.env.TRANSFER_TIMEOUT_MS || '60000', 10),
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY || '',
}

export type Env = typeof env
