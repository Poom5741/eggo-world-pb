// lib/auth/e2e-auth.ts
// E2E test authentication helper for bypassing LINE OAuth in test environments
// Phase 42: Auth Mock + Blockchain Helpers

/**
 * Predefined test users for E2E testing
 * These users are created in production PocketBase with USDT balance
 */
export const E2E_TEST_USERS = ['test_buyer', 'test_seller', 'test_referrer', 'test_admin', 'test_buyer_poor'] as const

export type E2ETestUser = typeof E2E_TEST_USERS[number]

/**
 * Test user metadata for E2E scenarios
 */
export const TEST_USER_METADATA: Record<E2ETestUser, { role: string; description: string }> = {
  test_buyer: { role: 'buyer', description: 'Purchases NFTs from marketplace' },
  test_seller: { role: 'seller', description: 'Lists NFTs for sale' },
  test_referrer: { role: 'referrer', description: 'Referral chain testing (G1 position)' },
  test_admin: { role: 'admin', description: 'Admin operations testing' },
  test_buyer_poor: { role: 'buyer_poor', description: 'Insufficient balance scenario testing (0 USDT)' },
}

/**
 * Check if current environment allows E2E test login
 * Per D-03: Only show button when localhost or e2e=true param
 *
 * @returns boolean indicating if E2E login is allowed
 */
export function isE2EEnvironment(): boolean {
  // Check hostname - only allow on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true
    }
  }

  // Check for e2e=true query param override (for Playwright testing)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('e2e') === 'true') {
      return true
    }
  }

  return false
}

/**
 * Get test user from query param
 *
 * @returns E2ETestUser or null if not valid
 */
export function getE2ETestUserFromParams(): E2ETestUser | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const testUser = params.get('e2e_test_user')

  if (testUser && E2E_TEST_USERS.includes(testUser as E2ETestUser)) {
    return testUser as E2ETestUser
  }

  return null
}

/**
 * Handle E2E test login
 * Fetches test user credentials from PocketBase and authenticates
 *
 * @param testUser - The test user to authenticate
 * @param redirectTo - Optional redirect path after successful login
 */
export async function handleE2eLogin(testUser: E2ETestUser, redirectTo?: string): Promise<void> {
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.eggoworld.io'

  // Validate test user
  if (!E2E_TEST_USERS.includes(testUser)) {
    throw new Error(`Invalid test user: ${testUser}. Valid users: ${E2E_TEST_USERS.join(', ')}`)
  }

  try {
    // Authenticate directly with PocketBase using test credentials
    // Existing users (test_buyer, test_seller, test_referrer, test_admin): username_e2e_test_password
    // New users (test_buyer_poor): TestPass123!
    // Try old pattern first, fallback to new pattern
    const passwordsToTry = [
      `${testUser}_e2e_test_password`,  // Old pattern for existing users
      'TestPass123!'                     // New pattern for users created via /api/v2/create-test-user
    ]

    let authData: any = null
    let lastError: Error | null = null

    for (const testPassword of passwordsToTry) {
      try {
        const authResponse = await fetch(`${pbUrl}/api/collections/users/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: `${testUser}@e2e.eggoworld.io`,
            password: testPassword,
          }),
        })

        if (authResponse.ok) {
          authData = await authResponse.json()
          console.log(`✅ Authenticated with password pattern: ${testPassword.includes('_e2e_') ? 'OLD' : 'NEW'}`)
          break
        } else {
          lastError = new Error(`Auth failed with password: ${testPassword}`)
        }
      } catch (err) {
        lastError = err as Error
      }
    }

    if (!authData) {
      throw lastError || new Error('All authentication attempts failed')
    }

    // Store auth token in localStorage in the format PocketBase client expects
    // client.ts line 17 expects: { token, model } (not { token, record })
    const authStorage = {
      token: authData.token,
      model: authData.record,  // PocketBase API returns 'record', but client expects 'model'
    }
    localStorage.setItem('pocketbase_auth', JSON.stringify(authStorage))

    // Set cookie for middleware (matches existing pattern)
    document.cookie = `pb_auth=${authData.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`

    // Also save directly to PocketBase client singleton if it exists
    if (typeof window !== 'undefined' && (window as any).__pb) {
      try {
        (window as any).__pb.authStore.save(authData.token, authData.record)
      } catch {
        // Client might not be initialized yet, localStorage will handle it on next load
      }
    }

    // Redirect to dashboard or specified path (trailing slash required for static export)
    const targetPath = redirectTo ? `${redirectTo}/` : '/dashboard/'
    window.location.href = targetPath
  } catch (error) {
    console.error('E2E login failed:', error)
    throw error
  }
}