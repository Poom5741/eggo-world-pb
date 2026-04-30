import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E testing
 * Phase 41: Framework Setup + Docker Environment
 *
 * Tests run against dev server (POCKETBASE_URL env var)
 * Services (PocketBase, wallet-api, Anvil) provided by docker-compose.e2e.yml
 *
 * Setup project seeds test data before journey tests run.
 */
export default defineConfig({
  // Test directory - existing E2E test location (D-13)
  testDir: './tests/e2e',

  // Match Playwright test files
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
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },

  // Global setup: seed test data before any test runs
  globalSetup: undefined,

  // Configure projects for browsers
  projects: [
    // Setup project: seeds test data
    {
      name: 'setup',
      testMatch: '**/playwright-setup.test.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // Main test project: depends on setup
    {
      name: 'chromium',
      testMatch: '**/playwright-*.test.{js,ts}',
      testIgnore: '**/playwright-setup.test.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Next.js dev server for frontend
  webServer: {
    command: 'bun run dev',
    port: 3000,
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
    cwd: './apps/web',
    env: {
      NEXT_PUBLIC_POCKETBASE_URL: 'http://localhost:8091',
    },
  },
})