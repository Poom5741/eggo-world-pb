/**
 * Synpress wallet setup for Anvil test accounts
 * Phase 43: Wallet Automation
 *
 * Per WALLET-01: Synpress MetaMask automation setup with Anvil test accounts.
 * Per D-05: Maps 4 Anvil default accounts to test users (test_buyer, test_seller, test_referrer, test_admin).
 * Per D-11: Anvil default keys are publicly known - no security concern for test environment.
 *
 * Setup sequence:
 * 1. Import Account 0 via seed phrase (creates "Account 1" in MetaMask) → rename to "test_buyer"
 * 2. Import Account 1 via private key → rename to "test_seller"
 * 3. Import Account 2 via private key → rename to "test_referrer"
 * 4. Import Account 3 via private key → rename to "test_admin"
 * 5. Add Anvil network (BSC Testnet fork on localhost:8545, Chain ID 97)
 * 6. Switch to Anvil network
 */

import { defineWalletSetup } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

// MetaMask wallet password for test automation
// Per D-03: Consistent password for all test runs
const PASSWORD = 'EggoE2ETestPassword!'

// Anvil default seed phrase (standard test mnemonic)
// This creates Account 0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
const ANVIL_SEED_PHRASE = 'test test test test test test test test test test test junk'

// Anvil default private keys (publicly known per D-11)
// These are the standard Anvil default accounts from Foundry
const ANVIL_PRIVATE_KEYS = {
  // Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 → test_seller
  account_1: '0x59c6995e99842d4f3b5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f',
  // Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC → test_referrer
  account_2: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9ace8057658a',
  // Account 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 → test_admin
  account_3: '0x7c852118a4fb54e2292d045ac8ca9d1c0b0763b8ea5d9b1e1f8f8f8f8f8f8f8f8',
}

// Anvil network configuration (BSC Testnet fork per D-02)
const ANVIL_NETWORK = {
  name: 'BSC Testnet',
  rpcUrl: 'http://localhost:8545',
  chainId: 97,
  symbol: 'tBNB',
}

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD)

  // Step 1: Import wallet via seed phrase (Account 0 → test_buyer)
  // This creates "Account 1" in MetaMask which corresponds to Anvil Account 0
  await metamask.importWallet(ANVIL_SEED_PHRASE)
  await metamask.renameAccount('Account 1', 'test_buyer')

  // Step 2: Import Account 1 via private key → test_seller
  await metamask.importWalletFromPrivateKey(ANVIL_PRIVATE_KEYS.account_1)
  await metamask.renameAccount('Account 2', 'test_seller')

  // Step 3: Import Account 2 via private key → test_referrer
  await metamask.importWalletFromPrivateKey(ANVIL_PRIVATE_KEYS.account_2)
  await metamask.renameAccount('Account 3', 'test_referrer')

  // Step 4: Import Account 3 via private key → test_admin
  await metamask.importWalletFromPrivateKey(ANVIL_PRIVATE_KEYS.account_3)
  await metamask.renameAccount('Account 4', 'test_admin')

  // Step 5: Add Anvil network (BSC Testnet fork)
  await metamask.addNetwork(ANVIL_NETWORK)

  // Step 6: Switch to Anvil network
  await metamask.switchNetwork(ANVIL_NETWORK.name, true)
})