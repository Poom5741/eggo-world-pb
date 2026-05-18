import cron from 'node-cron'
import { ethers } from 'ethers'
import { env } from './env.js'

// ─── Constants ───────────────────────────────────────────────────────────────

const TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const REQUIRED_CONFIRMATIONS = env.CONFIRMATIONS || 12
const BLOCK_RANGE = 5000 // eth_getLogs max block range

// ─── Configuration ───────────────────────────────────────────────────────────

const RPC_URL = env.RPC_URL
const USDT_ADDRESS = env.USDT_ADDRESS
const PB_URL = process.env.POCKETBASE_URL || 'http://eggo-pb:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || ''
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || ''
const CRON_SCHEDULE = process.env.DEPOSIT_SCAN_CRON || '*/5 * * * *' // every 5 min

const USDT_ABI = [
  'function decimals() external view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]

// ─── USDT ABI for balanceOf ──────────────────────────────────────────────────

// ─── State ───────────────────────────────────────────────────────────────────

let scheduledTask: ReturnType<typeof cron.schedule> | null = null
let lastScanTime: string | null = null
let lastScanError: string | null = null
let totalScans = 0
let totalDepositsDetected = 0
let totalDepositsConfirmed = 0
let isScanning = false

// PocketBase admin token cache
let pbAdminToken: string | null = null
let pbTokenExpiry = 0

// ─── PocketBase Admin Auth ───────────────────────────────────────────────────

async function getPocketBaseAdminToken(): Promise<string> {
  if (pbAdminToken && Date.now() < pbTokenExpiry - 300_000) {
    return pbAdminToken
  }

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error('PocketBase admin credentials not configured')
  }

  const authResponse = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: PB_ADMIN_PASSWORD,
    }),
  })

  if (!authResponse.ok) {
    const error = await authResponse.text()
    throw new Error(`PocketBase admin auth failed: ${error}`)
  }

  const authData = (await authResponse.json()) as { token: string }
  pbAdminToken = authData.token
  pbTokenExpiry = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  console.log('[DepositScanner] PocketBase admin token refreshed')
  return pbAdminToken
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === maxAttempts) {
        throw error
      }
      const delay = initialDelay * Math.pow(2, attempt - 1)
      console.log(`[DepositScanner] Retry attempt ${attempt}/${maxAttempts} after ${delay}ms: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('withRetry: unexpected exit')
}

// ─── Fetch User Wallets ──────────────────────────────────────────────────────

interface UserWallet {
  id: string
  wallet: string
}

async function fetchAllUserWallets(): Promise<UserWallet[]> {
  const token = await getPocketBaseAdminToken()
  const allUsers: UserWallet[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `${PB_URL}/api/collections/users/records?page=${page}&perPage=${perPage}&fields=id,wallet`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      items: Array<{ id: string; wallet?: string }>
      totalPages: number
    }

    for (const user of data.items) {
      if (user.wallet && user.wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
        allUsers.push({ id: user.id, wallet: user.wallet })
      }
    }

    if (page >= data.totalPages) break
    page++
  }

  return allUsers
}

// ─── Fetch Pending Deposits ──────────────────────────────────────────────────

interface PendingDeposit {
  id: string
  user: string
  amount: number
  tx_hash: string
  log_index: number
  block_number: number
  block_hash: string
  confirmations: number
}

async function fetchPendingDeposits(): Promise<PendingDeposit[]> {
  const token = await getPocketBaseAdminToken()
  const allPending: PendingDeposit[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `${PB_URL}/api/collections/deposits/records?filter=(status%3D%22pending%22)&page=${page}&perPage=${perPage}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch pending deposits: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      items: PendingDeposit[]
      totalPages: number
    }

    allPending.push(...data.items)
    if (page >= data.totalPages) break
    page++
  }

  return allPending
}

// ─── Check Existing Deposits (Dedup) ─────────────────────────────────────────

async function getExistingTxHashes(txHashes: string[]): Promise<Set<string>> {
  if (txHashes.length === 0) return new Set()

  const token = await getPocketBaseAdminToken()
  const existing = new Set<string>()

  // Batch in chunks of 10 to avoid URL length limits
  const chunkSize = 10
  for (let i = 0; i < txHashes.length; i += chunkSize) {
    const chunk = txHashes.slice(i, i + chunkSize)
    const filter = chunk.map((h) => `tx_hash="${h}"`).join('||')
    const url = `${PB_URL}/api/collections/deposits/records?filter=${encodeURIComponent(filter)}&fields=tx_hash`

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) continue

    const data = (await response.json()) as { items: Array<{ tx_hash: string }> }
    for (const item of data.items) {
      existing.add(item.tx_hash)
    }
  }

  return existing
}

// ─── Create Deposit Record ───────────────────────────────────────────────────

async function createDepositRecord(deposit: {
  userId: string
  amount: number
  tx_hash: string
  log_index: number
  from_address: string
  block_number: number
  block_hash: string
}): Promise<boolean> {
  try {
    const token = await getPocketBaseAdminToken()
    const response = await fetch(`${PB_URL}/api/collections/deposits/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user: deposit.userId,
        amount: deposit.amount.toString(),
        tx_hash: deposit.tx_hash,
        log_index: (deposit.log_index || 0) + 1,
        from_address: deposit.from_address,
        block_number: deposit.block_number,
        block_hash: deposit.block_hash,
        status: 'pending',
        confirmations: 1,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      // Silently skip duplicates (unique constraint on tx_hash+log_index)
      if (errText.includes('unique') || errText.includes('duplicate')) {
        return false
      }
      throw new Error(`Create deposit failed: ${errText}`)
    }

    return true
  } catch (error: any) {
    console.error(`[DepositScanner] Error creating deposit ${deposit.tx_hash}:`, error.message)
    return false
  }
}

// ─── Update Deposit Status ───────────────────────────────────────────────────

async function updateDepositStatus(
  depositId: string,
  status: string,
  confirmations?: number,
): Promise<boolean> {
  try {
    const token = await getPocketBaseAdminToken()
    const body: Record<string, string> = { status }
    if (confirmations !== undefined) {
      body.confirmations = confirmations.toString()
    }
    if (status === 'confirmed') {
      body.confirmed_at = new Date().toISOString()
    }

    const response = await fetch(`${PB_URL}/api/collections/deposits/records/${depositId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    return response.ok
  } catch (error: any) {
    console.error(`[DepositScanner] Error updating deposit ${depositId}:`, error.message)
    return false
  }
}

// ─── Update Wallet Balance ───────────────────────────────────────────────────

async function updateWalletBalance(userId: string, amount: number): Promise<boolean> {
  const token = await getPocketBaseAdminToken()

  const walletResponse = await fetch(
    `${PB_URL}/api/collections/user_wallets/records?filter=(user_id%3D%22${userId}%22)&perPage=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!walletResponse.ok) {
    console.error(`[DepositScanner] Failed to fetch user_wallets for ${userId}`)
    return false
  }

  const walletData = (await walletResponse.json()) as {
    items: Array<{ id: string; usdt_balance?: number; total_earned?: number }>
  }

  if (walletData.items.length === 0) {
    console.error(`[DepositScanner] No user_wallets record for ${userId}`)
    return false
  }

  const walletRecord = walletData.items[0]
  const oldBalance = Number(walletRecord.usdt_balance || 0)
  const oldEarned = Number(walletRecord.total_earned || 0)

  // Retry up to 3 times to handle concurrent update races
  for (let attempt = 1; attempt <= 3; attempt++) {
    const newBalance = oldBalance + amount
    const newEarned = oldEarned + amount

    const updateResponse = await fetch(
      `${PB_URL}/api/collections/user_wallets/records/${walletRecord.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usdt_balance: newBalance.toString(),
          total_earned: newEarned.toString(),
          last_transaction_at: new Date().toISOString(),
        }),
      },
    )

    if (updateResponse.ok) {
      const userResponse = await fetch(
        `${PB_URL}/api/collections/users/records/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            usdt_balance: newBalance.toString(),
          }),
        },
      )

      if (!userResponse.ok) {
        console.warn(`[DepositScanner] Failed to sync users.usdt_balance for ${userId}`)
      }

      return true
    }

    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500))
      const retry = await fetch(
        `${PB_URL}/api/collections/user_wallets/records/${walletRecord.id}?fields=usdt_balance,total_earned`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (retry.ok) {
        const fresh = (await retry.json()) as { usdt_balance?: number; total_earned?: number }
        console.log(`[DepositScanner] Retry balance update for ${userId}: stale=${oldBalance} fresh=${fresh.usdt_balance}`)
        continue
      }
    }
  }

  console.error(`[DepositScanner] Balance update failed for ${userId} after 3 retries`)
  return false
}

async function updateWalletBalanceDirectly(userId: string, onChainBalance: number): Promise<boolean> {
  const token = await getPocketBaseAdminToken()
  const walletResponse = await fetch(
    `${PB_URL}/api/collections/user_wallets/records?filter=(user_id%3D%22${userId}%22)&perPage=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!walletResponse.ok) return false
  const walletData = (await walletResponse.json()) as { items: Array<{ id: string; total_earned?: number }> }
  if (walletData.items.length === 0) return false

  const currentEarned = Number(walletData.items[0].total_earned || 0)
  const body: Record<string, string> = {
    usdt_balance: onChainBalance.toString(),
    last_transaction_at: new Date().toISOString(),
  }
  if (onChainBalance > currentEarned) {
    body.total_earned = onChainBalance.toString()
  }

  const updateResponse = await fetch(`${PB_URL}/api/collections/user_wallets/records/${walletData.items[0].id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!updateResponse.ok) return false

  await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ usdt_balance: onChainBalance.toString() }),
  })
  return true
}

const USDT_USDT_ABI = [...USDT_ABI, 'function decimals() external view returns (uint8)']
let usdtInstance: ethers.Contract | null = null
let usdtDecimals = 18

async function getUsdtContract(provider: ethers.JsonRpcProvider): Promise<ethers.Contract> {
  if (usdtInstance) return usdtInstance
  usdtInstance = new ethers.Contract(USDT_ADDRESS, USDT_USDT_ABI, provider)
  usdtDecimals = Number(await usdtInstance.decimals())
  return usdtInstance
}

// ─── Scan New Deposits ───────────────────────────────────────────────────────

async function scanNewDeposits(userWallets: UserWallet[], provider: ethers.JsonRpcProvider): Promise<number> {
  let depositsDetected = 0
  const currentBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(currentBlock - BLOCK_RANGE, 0)

  // Build user wallet -> userId map
  const walletToUser = new Map<string, string>()
  for (const u of userWallets) {
    walletToUser.set(u.wallet.toLowerCase(), u.id)
  }

  // Scan each wallet individually (BSC RPC may not support multiple topics[2])
  for (const user of userWallets) {
    try {
      const toTopic = '0x' + user.wallet.slice(2).padStart(64, '0')

      const logs = await provider.getLogs({
        address: USDT_ADDRESS,
        topics: [TRANSFER_SIGNATURE, null, toTopic],
        fromBlock,
        toBlock: currentBlock,
      })

      if (logs.length === 0) continue

      const txHashes = logs.map((l) => l.transactionHash)
      const existingTxHashes = await getExistingTxHashes(txHashes)

      // Filter out existing deposits and create new ones
      for (const log of logs) {
        const txHash = log.transactionHash
        if (!txHash || existingTxHashes.has(txHash)) continue
        if (log.removed) continue

        // Verify recipient matches
        const toAddr = log.topics?.[2]
        if (!toAddr) continue
        const parsedToAddr = '0x' + toAddr.slice(26).toLowerCase()
        if (parsedToAddr !== user.wallet.toLowerCase()) continue

        // Parse amount
        const amountHex = log.data
        if (!amountHex) continue
        const amountRaw = BigInt(amountHex)
        if (amountRaw <= 0n) continue

        // Get USDT decimals (assume 18 for BSC USDT, but verify)
        try {
          const contract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider)
          const decimals = await contract.decimals()
          const amount = Number(amountRaw) / Math.pow(10, Number(decimals))
          if (amount <= 0) continue

          // Get block hash for reorg detection
          const blockHash = log.blockHash || ''
          const blockNumber = Number(log.blockNumber || 0)
          const logIndex = Number(log.index || 0)

          // Extract from address from topics[1]
          const fromTopic = log.topics?.[1]
          const fromAddress = fromTopic ? '0x' + fromTopic.slice(26) : '0x0000000000000000000000000000000000000000'

          const created = await createDepositRecord({
            userId: user.id,
            amount,
            tx_hash: txHash,
            log_index: logIndex,
            from_address: fromAddress,
            block_number: blockNumber,
            block_hash: blockHash,
          })

          if (created) {
            depositsDetected++
            console.log(`[DepositScanner] New deposit detected: ${txHash.slice(0, 10)}... for user ${user.id}, amount: ${amount}`)
          }
        } catch (parseError: any) {
          console.error(`[DepositScanner] Error parsing log for user ${user.id}:`, parseError.message)
        }
      }
    } catch (scanError: any) {
      console.error(`[DepositScanner] Error scanning wallet ${user.wallet}:`, scanError.message)
    }
  }

  return depositsDetected
}

// ─── Confirm Pending Deposits ────────────────────────────────────────────────

async function confirmPendingDeposits(provider: ethers.JsonRpcProvider): Promise<number> {
  let depositsConfirmed = 0

  try {
    const pendingDeposits = await fetchPendingDeposits()

    if (pendingDeposits.length === 0) return 0

    const currentBlock = await provider.getBlockNumber()

    for (const deposit of pendingDeposits) {
      const confirmations = currentBlock - deposit.block_number
      if (confirmations < 0) continue

      if (confirmations >= REQUIRED_CONFIRMATIONS) {
        // Verify block hasn't been reorged
        try {
          const block = await provider.getBlock(deposit.block_number)
          if (!block || !block.hash || block.hash.toLowerCase() !== deposit.block_hash.toLowerCase()) {
            // Reorg detected
            await updateDepositStatus(deposit.id, 'failed')
            console.log(`[DepositScanner] Reorg detected, deposit ${deposit.tx_hash.slice(0, 10)}... marked as failed`)
            continue
          }

          // Confirm deposit and update balance
          const confirmed = await updateDepositStatus(deposit.id, 'confirmed', confirmations)
          if (confirmed) {
            const balanceUpdated = await updateWalletBalance(deposit.user, deposit.amount)
            if (balanceUpdated) {
              depositsConfirmed++
              console.log(`[DepositScanner] Deposit confirmed: ${deposit.tx_hash.slice(0, 10)}... amount: ${deposit.amount}`)
            } else {
              console.error(`[DepositScanner] Failed to update balance for deposit ${deposit.tx_hash}`)
            }
          }
        } catch (verifyError: any) {
          console.error(`[DepositScanner] Block verification failed for ${deposit.tx_hash}:`, verifyError.message)
        }
      } else {
        // Update confirmation count
        await updateDepositStatus(deposit.id, 'pending', confirmations)
      }
    }
  } catch (error: any) {
    console.error('[DepositScanner] Error confirming pending deposits:', error.message)
  }

  return depositsConfirmed
}

// ─── Main Scan Function ──────────────────────────────────────────────────────

async function scanAllDeposits(): Promise<void> {
  if (isScanning) {
    console.log('[DepositScanner] Scan already in progress, skipping')
    return
  }

  isScanning = true
  lastScanError = null

  try {
    if (!USDT_ADDRESS) {
      throw new Error('USDT_ADDRESS not configured')
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)

    // Step 1: Fetch all user wallets
    console.log('[DepositScanner] Fetching user wallets...')
    const userWallets = await fetchAllUserWallets()
    console.log(`[DepositScanner] Found ${userWallets.length} user wallets to scan`)

    if (userWallets.length === 0) {
      console.log('[DepositScanner] No user wallets found, skipping scan')
      return
    }

    // Step 2: Scan for new deposits
    console.log('[DepositScanner] Scanning for new deposits...')
    const depositsDetected = await scanNewDeposits(userWallets, provider)

    // Step 3: Confirm pending deposits
    console.log('[DepositScanner] Confirming pending deposits...')
    const depositsConfirmed = await confirmPendingDeposits(provider)

    // Step 4: Reconcile on-chain balances with PocketBase
    console.log('[DepositScanner] Reconciling on-chain balances...')
    const contract = await getUsdtContract(provider)
    for (const user of userWallets) {
      try {
        const chainBal = await contract.balanceOf(user.wallet)
        const onChainValue = Number(ethers.formatUnits(chainBal, usdtDecimals))

        const token = await getPocketBaseAdminToken()
        const wr = await fetch(`${PB_URL}/api/collections/user_wallets/records?filter=(user_id%3D%22${user.id}%22)&perPage=1`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!wr.ok) continue
        const wd = (await wr.json()) as { items: Array<{ usdt_balance?: number }> }
        if (wd.items.length === 0) continue

        const pbBal = Number(wd.items[0].usdt_balance || 0)
        if (Math.abs(pbBal - onChainValue) < 0.01) continue

        console.log(`[DepositScanner] ${user.id}: PB=${pbBal} on-chain=${onChainValue}, diff=${onChainValue - pbBal}`)
        await updateWalletBalanceDirectly(user.id, onChainValue)
      } catch {
        // Skip wallets with no USDT activity
      }
    }

    // Update stats
    totalScans++
    totalDepositsDetected += depositsDetected
    totalDepositsConfirmed += depositsConfirmed
    lastScanTime = new Date().toISOString()

    console.log(`[DepositScanner] Scan complete: ${depositsDetected} new deposits, ${depositsConfirmed} confirmed`)
  } catch (error: any) {
    lastScanError = error.message
    console.error('[DepositScanner] Scan failed:', error.message)
  } finally {
    isScanning = false
  }
}

// ─── Cron Job Management ─────────────────────────────────────────────────────

function startDepositScanner(): void {
  if (scheduledTask) {
    console.log('[DepositScanner] Scanner already started')
    return
  }

  console.log(`[DepositScanner] Starting deposit scanner with schedule: ${CRON_SCHEDULE}`)

  scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
    await scanAllDeposits()
  })

  // Run initial scan immediately on startup
  setTimeout(() => {
    scanAllDeposits()
  }, 10_000) // Wait 10s for server to fully start
}

function stopDepositScanner(): void {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
    console.log('[DepositScanner] Scanner stopped')
  }
}

// ─── Status Endpoint ─────────────────────────────────────────────────────────

interface ScannerStatus {
  running: boolean
  lastScanTime: string | null
  lastScanError: string | null
  totalScans: number
  totalDepositsDetected: number
  totalDepositsConfirmed: number
  isScanning: boolean
  cronSchedule: string
  usdtAddress: string
  rpcUrl: string
}

function getScannerStatus(): ScannerStatus {
  return {
    running: scheduledTask !== null,
    lastScanTime,
    lastScanError,
    totalScans,
    totalDepositsDetected,
    totalDepositsConfirmed,
    isScanning,
    cronSchedule: CRON_SCHEDULE,
    usdtAddress: USDT_ADDRESS,
    rpcUrl: RPC_URL,
  }
}

// Manual trigger (for testing or on-demand)
async function triggerScan(): Promise<void> {
  await scanAllDeposits()
}

export {
  startDepositScanner,
  stopDepositScanner,
  getScannerStatus,
  triggerScan,
  scanAllDeposits,
}
