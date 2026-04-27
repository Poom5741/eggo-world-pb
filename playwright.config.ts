import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E testing
 * Phase 41: Framework Setup + Docker Environment
 *
 * Tests run against static export from apps/web/out/
 * Services (PocketBase, wallet-api, Anvil) provided by docker-compose.e2e.yml
 */
export default defineConfig({
  // Test directory - existing E2E test location (D-13)
  testDir: './tests/e2e',

  // Match Playwright test files
  // Note: Phase 19 manual test script excluded (standalone Node.js, not Playwright)
  testMatch: '**/playwright-*.test.{js,ts}',

  // Global test settings
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Parallel workers (CI uses fewer)
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for frontend (D-04: static export compatibility)
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure (helpful for CI debugging)
    video: 'retain-on-failure',

    // Headless mode (D-15: CI-friendly default)
    headless: true,
  },

  // Configure projects for browsers (D-15)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and Safari can be added later as needed
  ],

  // Static file server for frontend preview (D-04)
  // Serves from apps/web/out/ directory
  webServer: {
    command: 'npx serve apps/web/out -l 3000',
    port: 3000,
    timeout: 10000,
    reuseExistingServer: !process.env.CI,
  },
})