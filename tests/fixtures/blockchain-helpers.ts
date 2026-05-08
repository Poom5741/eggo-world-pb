/**
 * Blockchain verification helpers for E2E tests
 * Phase 42: Auth Mock + Blockchain Helpers
 *
 * Provides transaction polling, on-chain verification, and event parsing
 * using ethers.js v6 for reliable blockchain state verification
 */

import { ethers } from 'ethers'
import { getE2EContext } from './e2e-setup'

/**
 * Create ethers provider connected to Anvil RPC
 */
export function createEthersProvider(): ethers.JsonRpcProvider {
  const { anvilRpcUrl } = getE2EContext()
  return new ethers.JsonRpcProvider(anvilRpcUrl)
}

/**
 * Options for waitForTx helper
 */
export interface WaitForTxOptions {
  /** Number of confirmations to wait for (default: 12 per D-09) */
  confirmations?: number
  /** Timeout in milliseconds (default: 120000 per D-10) */
  timeout?: number
}

/**
 * Error thrown when transaction times out
 */
export class TransactionTimeoutError extends Error {
  constructor(hash: string, timeout: number) {
    super(`Transaction ${hash} not confirmed within ${timeout}ms`)
    this.name = 'TransactionTimeoutError'
  }
}

/**
 * Wait for transaction confirmation with configurable confirmations and timeout
 * Per BLOCK-01: Transaction polling utility implemented (replaces fixed waits)
 * Per D-08: Use ethers.js provider.waitForTransaction
 * Per D-09: Default 12 confirmations (BSC standard)
 * Per D-10: Default 120-second timeout
 *
 * @param txHash - Transaction hash to wait for
 * @param options - Configuration options
 * @returns Transaction receipt
 * @throws TransactionTimeoutError if timeout exceeded
 */
export async function waitForTx(
  txHash: string,
  options: WaitForTxOptions = {}
): Promise<ethers.TransactionReceipt> {
  const { confirmations = 12, timeout = 120000 } = options
  const provider = createEthersProvider()

  // ethers v6 waitForTransaction has built-in timeout parameter
  // signature: waitForTransaction(hash, confirms, timeout)
  // timeout in v6 is in milliseconds, 0 means no timeout
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations, timeout)

    if (!receipt) {
      throw new Error(`Transaction ${txHash} not found or failed`)
    }

    return receipt
  } catch (error) {
    // Handle ethers timeout error or wrap other errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new TransactionTimeoutError(txHash, timeout)
    }
    throw new Error(`Failed to wait for transaction ${txHash}: ${error}`)
  }
}

// ============================================================================
// On-chain Verification Helpers (BLOCK-02)
// ============================================================================

/**
 * Minimal ABI for ERC721 ownership verification
 * Per D-14: Use ethers.js contract calls: ownerOf, balanceOf
 */
export const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
]

/**
 * Full ABI for EggNFT with Transfer event
 */
export const EGG_NFT_ABI = [
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]

/**
 * Get owner address for a specific tokenId
 * Per D-14: contract.ownerOf(tokenId) → owner address
 *
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID to check ownership
 * @returns Owner address
 */
export async function getOwnerOf(
  contractAddress: string,
  tokenId: number | bigint
): Promise<string> {
  const provider = createEthersProvider()
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
  const owner = await contract.ownerOf(tokenId)
  return owner
}

/**
 * Get NFT balance for a wallet address
 * Per D-14: contract.balanceOf(address) → NFT count
 *
 * @param contractAddress - NFT contract address
 * @param walletAddress - Wallet address to check balance
 * @returns Number of NFTs owned
 */
export async function getBalanceOf(
  contractAddress: string,
  walletAddress: string
): Promise<number> {
  const provider = createEthersProvider()
  const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
  const balance = await contract.balanceOf(walletAddress)
  return Number(balance)
}

/**
 * Result of ownership verification
 * Per D-15: Verify against PocketBase record for cross-check
 */
export interface OwnershipVerificationResult {
  onChainOwner: string
  expectedOwner: string
  matches: boolean
}

/**
 * Verify on-chain ownership matches expected owner
 * Per D-15: Cross-check with expected owner
 *
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID to verify
 * @param expectedOwner - Expected owner address
 * @returns Verification result with match status
 */
export async function verifyOnChainOwnership(
  contractAddress: string,
  tokenId: number | bigint,
  expectedOwner: string
): Promise<OwnershipVerificationResult> {
  const onChainOwner = await getOwnerOf(contractAddress, tokenId)
  const matches = onChainOwner.toLowerCase() === expectedOwner.toLowerCase()

  return {
    onChainOwner,
    expectedOwner,
    matches,
  }
}

// ============================================================================
// Event Parsing Helpers (BLOCK-03)
// ============================================================================

/**
 * Full ABIs for event parsing
 * Per D-12: ABIs from wallet-api/server.js
 */
export const MARKETPLACE_ABI = [
  'function buyNFT(uint256 listingId) external',
  'function getListedNFT(uint256 listingId) external view returns (tuple(address seller, uint256 price, bool active))',
  'function createListing(uint256 nftId, uint256 nftType, uint256 price) external',
  'function cancelListing(uint256 listingId) external',
  'event NFTSold(uint256 indexed listingId, address indexed seller, address indexed buyer, uint256 price)',
]

export const ANIMAL_NFT_ABI = [
  'function breedAnimals(uint256 parent1Id, uint256 parent2Id) external returns (uint256)',
  'function canBreed(uint256 tokenId) external view returns (bool)',
  'function getLastBredTimestamp(uint256 tokenId) external view returns (uint256)',
  'function BREED_COOLDOWN() external view returns (uint256)',
  'event AnimalBred(uint256 indexed parent1Id, uint256 indexed parent2Id, uint256 indexed childId, uint256 childGeneration)',
]

export const TIER_BADGE_ABI = [
  'function mintTierBadge(address user, uint256 tokenId, uint256 lifetimeFoodItems) external returns (bool)',
  'function canClaimTier(address user, uint256 tokenId, uint256 lifetimeFoodItems) external view returns (bool)',
  'function tiers(uint256 tokenId) external view returns (string name, uint256 threshold, uint256 rewardAmount)',
  'function userHighestTier(address user) external view returns (uint256)',
  'event TierBadgeMinted(address indexed user, uint256 indexed tokenId, string tierName, uint256 rewardAmount, uint256 lifetimeFoodItems)',
]

/**
 * ABI for CommissionDistribution contract (Phase 48)
 * Used for referral commission verification
 */
export const COMMISSION_DISTRIBUTION_ABI = [
  'function getCommissionBalance(address referrer) external view returns (uint256)',
  'function commissionBalances(address referrer) external view returns (uint256)',
]

/**
 * Event names supported for parsing
 */
export type EventName = 'Transfer' | 'NFTSold' | 'AnimalBred' | 'TierBadgeMinted'

/**
 * Event ABI map for parsing
 */
export const EVENT_ABI_MAP: Record<EventName, ethers.InterfaceAbi> = {
  Transfer: EGG_NFT_ABI,
  NFTSold: MARKETPLACE_ABI,
  AnimalBred: ANIMAL_NFT_ABI,
  TierBadgeMinted: TIER_BADGE_ABI,
}

/**
 * Parsed Transfer event data
 */
export interface ParsedTransferEvent {
  from: string
  to: string
  tokenId: bigint
}

/**
 * Parsed NFTSold event data
 */
export interface ParsedNFTSoldEvent {
  listingId: bigint
  seller: string
  buyer: string
  price: bigint
}

/**
 * Parsed AnimalBred event data
 */
export interface ParsedAnimalBredEvent {
  parent1Id: bigint
  parent2Id: bigint
  childId: bigint
  childGeneration: bigint
}

/**
 * Parsed TierBadgeMinted event data
 */
export interface ParsedTierBadgeMintedEvent {
  user: string
  tokenId: bigint
  tierName: string
  rewardAmount: bigint
  lifetimeFoodItems: bigint
}

/**
 * Union type for all parsed events
 */
export type ParsedEvent =
  | ParsedTransferEvent
  | ParsedNFTSoldEvent
  | ParsedAnimalBredEvent
  | ParsedTierBadgeMintedEvent

/**
 * Parse a specific event from transaction receipt
 * Per D-11: Use ethers.js contract.interface.parseLog
 * Per D-13: Helper returns parsed event with typed data
 *
 * @param receipt - Transaction receipt
 * @param eventName - Event name to parse
 * @returns Parsed event data or null if not found
 */
export function parseEvent(
  receipt: ethers.TransactionReceipt,
  eventName: EventName
): ParsedEvent | null {
  const abi = EVENT_ABI_MAP[eventName]
  if (!abi) {
    throw new Error(`Unknown event name: ${eventName}. Valid: ${Object.keys(EVENT_ABI_MAP).join(', ')}`)
  }

  const iface = new ethers.Interface(abi)

  // Find matching event in logs
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data })
      if (parsed && parsed.name === eventName) {
        // Return typed event data (per D-13)
        return parsed.args as unknown as ParsedEvent
      }
    } catch {
      // Log doesn't match this interface, continue
      continue
    }
  }

  return null // Event not found in receipt
}

/**
 * Parse all supported events from transaction receipt
 *
 * @param receipt - Transaction receipt
 * @returns Map of event names to parsed data (null if not found)
 */
export function parseAllEvents(
  receipt: ethers.TransactionReceipt
): Record<EventName, ParsedEvent | null> {
  return {
    Transfer: parseEvent(receipt, 'Transfer'),
    NFTSold: parseEvent(receipt, 'NFTSold'),
    AnimalBred: parseEvent(receipt, 'AnimalBred'),
    TierBadgeMinted: parseEvent(receipt, 'TierBadgeMinted'),
  }
}

// ============================================================================
// Commission Balance Helpers (Phase 48)
// ============================================================================

/**
 * Get commission balance for a referrer wallet
 * Phase 48: Referral Commission Journey Test
 * Calls getCommissionBalance(address) on CommissionDistribution contract
 *
 * @param contractAddress - CommissionDistribution contract address
 * @param walletAddress - Referrer wallet address to check balance
 * @returns Commission balance in USDT (converted from wei with 6 decimals)
 */
export async function getCommissionBalance(
  contractAddress: string,
  walletAddress: string
): Promise<number> {
  const provider = createEthersProvider()
  const contract = new ethers.Contract(contractAddress, COMMISSION_DISTRIBUTION_ABI, provider)
  const balanceWei = await contract.getCommissionBalance(walletAddress)
  // USDT has 6 decimals, convert wei to USDT amount
  return Number(ethers.formatUnits(balanceWei, 6))
}

// ============================================================================
// Gas Sponsorship Relayer Helpers (WALLET-03)
// ============================================================================

/**
 * Options for checkRelayerBalance helper
 * Per D-14: Configurable threshold with default 0.1 ETH
 */
export interface CheckRelayerBalanceOptions {
  /** Minimum balance threshold in ETH (default: 0.1 per D-14) */
  threshold?: number
  /** Log warning if below threshold (default: true) */
  logWarning?: boolean
}

/**
 * Result of relayer balance check
 * Per D-13: Helper returns balance info with sufficiency check
 */
export interface RelayerBalanceResult {
  address: string
  balanceWei: bigint
  balanceEth: string
  sufficient: boolean
  threshold: number
}

/**
 * Check relayer wallet balance for gas sponsorship verification.
 * Per WALLET-03: Gas sponsorship monitoring helper.
 * Per D-12: Create checkRelayerBalance() helper in blockchain-helpers.ts.
 * Per D-13: Helper queries relayer wallet balance via ethers provider on Anvil.
 * Per D-14: Log warning if relayer balance below threshold (default 0.1 ETH).
 *
 * @param relayerAddress - Relayer wallet address (from env or default)
 * @param options - Configuration options
 * @returns Balance result with sufficiency check
 */
export async function checkRelayerBalance(
  relayerAddress?: string,
  options: CheckRelayerBalanceOptions = {}
): Promise<RelayerBalanceResult> {
  const { threshold = 0.1, logWarning = true } = options
  const provider = createEthersProvider()

  // Get relayer address from env or use Anvil Account 0 as default for testing
  const address =
    relayerAddress || process.env.RELAYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

  const balanceWei = await provider.getBalance(address)
  const balanceEth = ethers.formatEther(balanceWei)
  const sufficient = parseFloat(balanceEth) >= threshold

  if (!sufficient && logWarning) {
    console.warn(
      `[checkRelayerBalance] Relayer ${address} balance ${balanceEth} ETH below threshold ${threshold} ETH`
    )
  }

  return { address, balanceWei, balanceEth, sufficient, threshold }
}