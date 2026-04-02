// Type-safe environment variables
export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  MIN_PASSWORD_LENGTH: parseInt(process.env.MIN_PASSWORD_LENGTH || '12', 10),
  MAX_PASSWORD_LENGTH: parseInt(process.env.MAX_PASSWORD_LENGTH || '120', 10),
  PUBLIC_ENCRYPTION: process.env.PUBLIC_ENCRYPTION === 'true',
  DATA_STORAGE_NETWORK: process.env.DATA_STORAGE_NETWORK || 'opSepolia',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

export type Env = typeof env
