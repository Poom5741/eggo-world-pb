/**
 * Smoke tests for wallet automation setup
 * Phase 43: Wallet Automation
 *
 * Per WALLET-01, WALLET-02, WALLET-03: Verify Synpress setup and blockchain helpers.
 *
 * Note: Tests require Anvil running (docker-compose.e2e.yml up) to pass.
 * Synpress cache must be built separately: bun run test:e2e:cache
 */

import { test, expect } from '@playwright/test'
import { ethers } from 'ethers'
import { checkRelayerBalance, createEthersProvider } from '../fixtures/blockchain-helpers'
import { TEST_USERS, getE2EContext } from '../fixtures/e2e-setup'

test.describe('Wallet Automation Setup (Phase 43)', () => {
  test.skip('Synpress wallet setup requires manual cache build', async () => {
    // This test documents that synpress cache must be built first
    // Run: bun run test:e2e:cache before E2E tests with MetaMask automation
    // The cache persists browser state with imported accounts and network configuration
  })

  test('checkRelayerBalance connects to Anvil and returns balance', async () => {
    // Per WALLET-03: Verify relayer balance helper works
    const result = await checkRelayerBalance()

    // Verify address format
    expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/)

    // Verify balance is returned
    expect(result.balanceEth).toBeDefined()
    expect(parseFloat(result.balanceEth)).toBeGreaterThan(0)

    // Verify sufficiency check
    expect(result.sufficient).toBeDefined()
    expect(typeof result.sufficient).toBe('boolean')
  })

  test('Anvil Account 0 has 10,000 ETH (default funding)', async () => {
    // Per D-06: Anvil accounts have 10,000 ETH pre-funded
    const provider = createEthersProvider()
    const account0Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

    const balance = await provider.getBalance(account0Address)
    const balanceEth = parseFloat(ethers.formatEther(balance))

    // Anvil default accounts start with 10,000 ETH
    expect(balanceEth).toBeGreaterThanOrEqual(9999)
  })

  test('TEST_USERS wallet addresses match Anvil accounts', async () => {
    // Per WALLET-02: Verify TEST_USERS.walletAddress mapping per D-05
    expect(TEST_USERS.test_buyer.walletAddress).toBe(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    )
    expect(TEST_USERS.test_seller.walletAddress).toBe(
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    )
    expect(TEST_USERS.test_referrer.walletAddress).toBe(
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    )
    expect(TEST_USERS.test_admin.walletAddress).toBe(
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    )
  })

  test('checkRelayerBalance with custom threshold', async () => {
    // Verify threshold parameter works
    const result = await checkRelayerBalance(undefined, { threshold: 1000 })

    // Anvil Account 0 has 10,000 ETH, so should be sufficient for threshold 1000
    expect(result.threshold).toBe(1000)
    expect(result.sufficient).toBe(true)
  })

  test('checkRelayerBalance with specific address', async () => {
    // Verify custom address parameter works
    const customAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Account 1
    const result = await checkRelayerBalance(customAddress)

    expect(result.address).toBe(customAddress)
    expect(parseFloat(result.balanceEth)).toBeGreaterThan(0)
  })

  test('Anvil RPC endpoint is accessible', async () => {
    // Per D-02: Verify Anvil RPC endpoint connection
    const { anvilRpcUrl } = getE2EContext()
    const provider = createEthersProvider()

    // Verify we can get the current block number
    const blockNumber = await provider.getBlockNumber()
    expect(blockNumber).toBeGreaterThanOrEqual(0)
  })
})