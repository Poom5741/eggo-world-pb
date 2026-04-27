/**
 * E2E test fixtures scaffold
 * Phase 41: Framework Setup + Docker Environment
 *
 * Phase 42 will add auth bypass helpers
 * Phase 43 will add wallet automation helpers
 */

import type { Page } from '@playwright/test'

/**
 * E2E test context interface
 * Provides URLs for all services in the Docker test environment
 */
export interface E2ETestContext {
  /** PocketBase backend URL */
  pocketbaseUrl: string
  /** Wallet API URL for gas sponsorship */
  walletApiUrl: string
  /** Anvil RPC URL for blockchain interactions */
  anvilRpcUrl: string
}

/**
 * Get E2E test context from environment variables
 * Falls back to Docker Compose default ports
 *
 * @returns E2ETestContext with service URLs
 */
export function getE2EContext(): E2ETestContext {
  return {
    pocketbaseUrl: process.env.POCKETBASE_URL || 'http://localhost:8090',
    walletApiUrl: process.env.WALLET_API_URL || 'http://localhost:3001',
    anvilRpcUrl: process.env.ANVIL_RPC_URL || 'http://localhost:8545',
  }
}

/**
 * Predefined test users for E2E testing
 * These users are created in production PocketBase with USDT balance
 */
export const TEST_USERS = {
  test_buyer: { role: 'buyer', description: 'Purchases NFTs from marketplace' },
  test_seller: { role: 'seller', description: 'Lists NFTs for sale' },
  test_referrer: { role: 'referrer', description: 'Referral chain testing (G1 position)' },
  test_admin: { role: 'admin', description: 'Admin operations testing' },
} as const

export type TestUserName = keyof typeof TEST_USERS

/**
 * E2E login helper for authenticating test users
 * Per AUTH-02: Test fixture creates authenticated session without UI flow
 *
 * @param page - Playwright page object
 * @param testUser - The test user to authenticate (test_buyer, test_seller, test_referrer, test_admin)
 * @param redirectTo - Optional redirect path after login
 * @throws Error if test user is invalid or authentication fails
 */
export async function e2eLogin(
  page: Page,
  testUser: TestUserName,
  redirectTo?: string
): Promise<void> {
  // Validate test user name
  if (!TEST_USERS[testUser]) {
    throw new Error(`Invalid test user: ${testUser}. Valid: ${Object.keys(TEST_USERS).join(', ')}`)
  }

  // Navigate to login page with E2E query params
  const loginUrl = redirectTo
    ? `/auth/login?e2e=true&e2e_test_user=${testUser}&redirectTo=${redirectTo}`
    : `/auth/login?e2e=true&e2e_test_user=${testUser}`

  await page.goto(loginUrl)

  // Wait for E2E button to appear
  await page.waitForSelector('[data-testid="e2e-login-button"]', { state: 'visible', timeout: 10000 })

  // Click E2E login button
  await page.click('[data-testid="e2e-login-button"]')

  // Wait for redirect to complete (dashboard or redirectTo)
  await page.waitForURL(/dashboard|redirectTo/, { timeout: 15000 })

  // Verify authentication by checking localStorage
  const authStored = await page.evaluate(() => {
    return localStorage.getItem('pocketbase_auth') !== null
  })

  if (!authStored) {
    throw new Error('E2E login failed - auth token not stored')
  }
}

/**
 * Placeholder for PocketBase connection helper
 * Phase 42 will implement auth bypass
 *
 * @param url - PocketBase URL
 * @returns Promise that resolves to connection status
 */
export async function connectPocketBase(url: string): Promise<boolean> {
  // TODO: Phase 42 - Implement auth bypass for test user injection
  const healthCheck = await fetch(`${url}/api/health`)
  return healthCheck.ok
}

/**
 * Placeholder for Anvil connection helper
 * Phase 42 will implement blockchain helpers
 *
 * @param url - Anvil RPC URL
 * @returns Promise that resolves to connection status
 */
export async function connectAnvil(url: string): Promise<boolean> {
  // TODO: Phase 42 - Implement blockchain helpers (VRF mock, polling)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    })
    const data = await response.json()
    return data.result !== undefined
  } catch {
    return false
  }
}