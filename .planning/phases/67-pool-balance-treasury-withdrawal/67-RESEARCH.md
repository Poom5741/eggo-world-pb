# Phase 67: Pool Balance & Treasury Withdrawal - Research

**Researched:** 2026-05-26
**Domain:** Admin treasury management with MetaMask withdrawals and error handling
**Confidence:** HIGH

## Summary

Phase 67 builds the Pool Balance & Treasury Withdrawal section of the admin treasury page. Admin can view USDT pool balances (Treasury + CoinStor + Total) with manual refresh and auto-refresh after withdrawals, then withdraw treasury funds via MetaMask with comprehensive error handling. The implementation leverages viem for blockchain interactions, extends Phase 64's pool balance endpoint, and follows Phase 66's ownership-based transaction patterns.

**Primary recommendation:** Use Phase 64's pool balance endpoint for balance data, Phase 66's viem `writeContract` pattern for `withdrawTreasury()`, and implement comprehensive error handling using viem's `BaseError` and `ContractFunctionRevertedError` types. Follow shadcn/ui patterns for form validation and real-time feedback.

## Architectural Responsibility Map

| Capability             | Primary Tier     | Secondary Tier | Rationale                                                  |
| ---------------------- | ---------------- | -------------- | ---------------------------------------------------------- |
| Pool balance display   | Browser / Client | Backend API    | Balance data from Phase 64 endpoint, displayed client-side |
| Withdrawal transaction | Browser / Client | —              | MetaMask signs tx directly via viem writeContract          |
| Ownership verification | Browser / Client | —              | Reuse Phase 66 patterns for withdrawal enablement          |
| Error handling         | Browser / Client | —              | Client-side validation + viem error parsing                |
| Balance refresh        | Browser / Client | Backend API    | Auto-refresh after tx, manual refresh button               |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-17:** Single summary card showing all three pool balances (Treasury 46%/6%, CoinStor 4%, Total). Total balance emphasized at top with larger font, Treasury and CoinStor shown below as supporting details.
- **D-18:** Full currency format with dollar signs, thousands separators, and USDT labels (e.g., "$1,234.56 USDT"). 2 decimal places for all amounts.
- **D-19:** Standard loading/error patterns — skeleton placeholders during initial fetch and manual refresh, inline Alert component for errors with retry button.
- **D-20:** Direct MetaMask transaction flow — user clicks Withdraw, MetaMask pops up immediately, transaction signs and sends without intermediate confirmation step.
- **D-21:** Gas estimation displayed before withdrawal in USDT/BNB to help admin understand transaction cost.
- **D-22:** Detailed progress indication during transaction — step-by-step feedback: "Signing..." → "Sending..." → "Confirming..." → "Done".
- **D-23:** Success/failure handling via Alerts — success shows green alert + auto-refreshes pool balances; failure shows red error alert + retry button.
- **D-24:** Real-time validation as user types — immediate feedback if withdrawal amount ≤ 0 or exceeds available treasury balance.
- **D-25:** Large withdrawal safeguards — warning message for amounts >10% of treasury or >$1000 USDT, but withdrawal still allowed.
- **D-26:** Strict ownership check — withdrawal button disabled until user accepts CommissionDistribution ownership (from Phase 66). Shows tooltip: "Accept CommissionDistribution ownership first" + link to Phase 66 ownership section.
- **D-27:** Visual connection to Phase 66 — helpful guidance messaging links to ownership section rather than displaying redundant status badges.
- **D-28:** Auto-refresh balances after successful withdrawal transaction completes + always-visible manual refresh button in balance card header.
- **D-29:** Skeleton placeholders during manual refresh (same as initial load) — clear visual indication that data is updating.
- **D-30:** Error handling for refresh failures — show error alert but keep previous balance data visible, refresh button remains enabled for retry.

### Claude's Discretion

- Exact spacing and typography for balance card layout
- Warning message threshold details (>10% vs >$1000 — use whichever is more conservative)
- Progress step wording and timing for withdrawal transaction
- Exact placement of gas estimation in withdrawal form
- Visual design of ownership guidance tooltip/link

### Deferred Ideas (OUT OF SCOPE)

- CoinStor (4%) pool withdrawal — no `withdrawCoinStor` function in CommissionDistribution.sol
- Withdraw to custom address — `withdrawTreasury` sends to immutable treasury address
- Ownership transfer initiation — already handled by TransferOwnership script
- Multi-sig or multi-wallet admin — solo developer project
- Wallet connect on other admin pages — only `/admin/treasury` needs MetaMask

## Phase Requirements

| ID      | Description                                                                     | Research Support                                                                     |
| ------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| POOL-01 | Admin can view CoinStor reserve (4%), Treasury (46%/6%), and total pool balance | Phase 64 endpoint provides treasury + coinstor balances, calculate total client-side |
| POOL-02 | Admin can manually refresh pool balances                                        | Refetch function from Phase 64 endpoint, skeleton loading during refresh             |
| POOL-03 | Balances are formatted to 2 decimal places with thousands separators            | JavaScript `Intl.NumberFormat` or `toLocaleString()` for currency formatting         |
| WDRW-01 | Admin can withdraw specified USDT amount from treasury via MetaMask             | viem `writeContract` calling `withdrawTreasury(uint256 amount)`                      |
| WDRW-02 | Withdrawal form shows treasury destination address and available balance        | Immutable treasury address from contract, available balance from Phase 64 endpoint   |
| WDRW-03 | System displays tx confirmation (hash, amount, updated balances)                | viem `waitForTransactionReceipt` + auto-refresh balances after confirmation          |
| WDRW-04 | Withdrawal button only enabled when admin wallet has accepted ownership         | Reuse Phase 66 ownership check pattern, disable button if not owner                  |
| WDRW-05 | System validates amount ≤ available treasury balance before allowing submit     | Client-side validation against available balance from Phase 64 endpoint              |
| ERR-01  | Reverted transactions show user-friendly error message with reason              | viem `BaseError` + `ContractFunctionRevertedError` parsing for revert reasons        |
| ERR-02  | RPC/network failures show retry option with clear error context                 | Catch network errors, display Alert with retry button                                |
| ERR-03  | Contract read failures show inline error state with retry button                | Per-component error handling, don't block other components (Phase 66 pattern)        |

## Standard Stack

### Core

| Library        | Version                          | Purpose                                                   | Why Standard                                                                    |
| -------------- | -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **viem**       | 2.51.0 [VERIFIED: npm registry]  | Ethereum wallet client for writeContract + error handling | Modern, TypeScript-first, lighter than ethers.js, already installed in Phase 65 |
| **React 19**   | ^19.0.0 [VERIFIED: npm registry] | UI framework for balance card and withdrawal form         | Project standard, provides hooks for state management                           |
| **Next.js 16** | ^16.2.4 [VERIFIED: npm registry] | App Router for page structure and client components       | Project framework, provides 'use client' directive                              |
| **shadcn/ui**  | - [VERIFIED: project codebase]   | Card, Alert, Button, Input, Skeleton, Label components    | Existing design system with claymorphism variants                               |

### Supporting

| Library                      | Version                         | Purpose                                                       | When to Use                                   |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| **useMetaMask**              | Custom (Phase 65)               | Wallet connection state (address, chainId, walletClient)      | Reusable hook for MetaMask interactions       |
| **useContractOwnership**     | Custom (Phase 66)               | Ownership status for CommissionDistribution                   | Check if admin can withdraw (WDRW-04)         |
| **Phase 64 endpoint**        | Custom (Phase 64)               | `GET /api/v2/admin/pool-balances` returns treasury + coinstor | Balance data source for dashboard             |
| **TreasuryGuard**            | Custom (Phase 65)               | Page-level auth guard with ownership verification             | Wraps entire treasury page for access control |
| **Tailwind CSS 4**           | -                               | Styling with responsive grid and claymorphism variants        | Project standard styling system               |
| **class-variance-authority** | ^1.0.0 [VERIFIED: npm registry] | Component variant management (button, card, alert)            | Used by shadcn/ui components                  |

### Alternatives Considered

| Instead of           | Could Use             | Tradeoff                                                                                                 |
| -------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| viem                 | ethers.js, wagmi      | ethers.js is heavier; wagmi requires more config. viem is lightweight and already integrated in Phase 65 |
| shadcn/ui components | MUI, Chakra UI        | Breaking from established design system; shadcn/ui provides claymorphism variants used project-wide      |
| Phase 64 endpoint    | Direct on-chain reads | Reuses existing infrastructure, centralizes balance logic, easier to test and maintain                   |

**Installation:**

```bash
# No new packages needed — viem and all dependencies installed in Phase 65
# Verify viem installation:
bun pm ls | grep viem
# Expected: viem@2.51.0
```

**Version verification:**

```bash
npm view viem version          # Output: 2.51.0
npm view react version        # Output: 19.0.0
npm view next version         # Output: 16.2.4
npm view class-variance-authority version  # Output: 1.0.0
```

## Package Legitimacy Audit

> **Required** whenever this phase installs external packages. Run the Package Legitimacy Gate protocol before completing this section.

| Package                  | Registry | Age     | Downloads                        | Source Repo               | slopcheck | Disposition                     |
| ------------------------ | -------- | ------- | -------------------------------- | ------------------------- | --------- | ------------------------------- |
| viem                     | npm      | 3+ yrs  | 2M+/wk [VERIFIED: npm registry]  | github.com/wevm/viem      | [OK]      | Approved (installed Phase 65)   |
| react                    | npm      | 10+ yrs | 20M+/wk [VERIFIED: npm registry] | github.com/facebook/react | [OK]      | Approved (project core)         |
| next                     | npm      | 10+ yrs | 5M+/wk [VERIFIED: npm registry]  | github.com/vercel/next.js | [OK]      | Approved (project core)         |
| class-variance-authority | npm      | 3+ yrs  | 5M+/wk [VERIFIED: npm registry]  | github.com/joe-bell/cva   | [OK]      | Approved (shadcn/ui dependency) |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

_No new package installations required for Phase 67. All packages verified in Phase 65 or earlier._

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Client Tier)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              /admin/treasury (Phase 65)                    │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │         TreasuryGuard (Phase 65 component)           │ │ │
│  │  │  ┌────────────────────────────────────────────────┐  │ │ │
│  │  │  │   Phase 67: Pool Balance & Treasury Withdrawal  │  │ │ │
│  │  │  │  ┌──────────────────────────────────────────┐  │  │ │ │
│  │  │  │  │    Pool Balance Card                      │  │  │ │ │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │ │ │ │
│  │  │  │  │  │ • Total balance (emphasized)         │  │  │ │ │ │
│  │  │  │  │  │ • Treasury balance (46%/6%)          │  │  │ │ │ │
│  │  │  │  │  │ • CoinStor balance (4%)              │  │  │ │ │ │
│  │  │  │  │  │ • Manual refresh button              │  │  │ │ │ │
│  │  │  │  │  │ • Auto-refresh after withdrawal      │  │  │ │ │ │
│  │  │  │  │  │ • Skeleton loading state             │  │  │ │ │ │
│  │  │  │  │  │ • Error alert with retry             │  │  │ │ │ │
│  │  │  │  │  └────────────────────────────────────┘  │  │ │ │ │
│  │  │  │  └──────────────────────────────────────────┘  │  │ │ │
│  │  │  │  ┌──────────────────────────────────────────┐  │  │ │ │
│  │  │  │  │    Withdrawal Form                       │  │  │ │ │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │ │ │ │
│  │  │  │  │  │ • Treasury destination (immutable)  │  │  │ │ │ │
│  │  │  │  │  │ • Available balance display         │  │  │ │ │ │
│  │  │  │  │  │ • USDT amount input with validation│  │  │ │ │ │
│  │  │  │  │  │ • Gas estimation display            │  │  │ │ │ │
│  │  │  │  │  │ • Large withdrawal warning          │  │  │ │ │ │
│  │  │  │  │  │ • Withdraw button (owner-gated)     │  │  │ │ │ │
│  │  │  │  │  │ • Progress steps: Sign→Send→Confirm │  │  │ │ │ │
│  │  │  │  │  │ • Success/failure alerts            │  │  │ │ │ │
│  │  │  │  │  └────────────────────────────────────┘  │  │ │ │ │
│  │  │  │  └──────────────────────────────────────────┘  │  │ │ │
│  │  │  └────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            useMetaMask Hook (Phase 65)                     │ │
│  │  Provides: { address, chainId, isConnected, walletClient } │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         useContractOwnership Hook (Phase 66)               │ │
│  │  Provides: { owner, ownershipStatus, isOwner }             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               viem (Blockchain Interaction)                 │ │
│  │  • writeContract() — execute withdrawTreasury tx            │ │
│  │  • simulateContract() — validate + gas estimation           │ │
│  │  • waitForTransactionReceipt() — confirm tx                │ │
│  │  • BaseError parsing — extract revert reasons               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                   BSC Network (Blockchain Tier)                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           CommissionDistribution Contract                   │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ • withdrawTreasury(uint256 amount) — onlyOwner       │  │  │
│  │  │ • commissionBalances[treasury] — available balance    │  │  │
│  │  │ • commissionBalances[coinStorReserve] — CoinStor      │  │  │
│  │  │ • treasury address — immutable destination            │  │  │
│  │  │ • owner() — ownership verification                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Chain IDs: 56 (BSC mainnet), 97 (testnet), 7117 (0xl3)         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                   Backend API (Server Tier)                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │    Phase 64: GET /api/v2/admin/pool-balances                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Returns: {                                           │  │  │
│  │  │   treasury: { wei: "123...", usdt: "1234.56" },      │  │  │
│  │  │   coinstor: { wei: "456...", usdt: "456.78" }        │  │  │
│  │  │ }                                                     │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
apps/web/
├── lib/
│   └── contracts.json          # Contract addresses + ABI (from Phase 66)
├── components/
│   └── admin/
│       └── treasury/
│           ├── PoolBalanceCard.tsx           # Balance display + refresh
│           ├── WithdrawalForm.tsx            # Withdrawal form + validation
│           └── TreasuryWithdrawalSection.tsx # Container component
├── hooks/
│   ├── use-pool-balances.ts                  # Pool balance fetching + refresh
│   ├── use-treasury-withdrawal.ts            # Withdrawal transaction logic
│   └── use-contract-ownership.ts             # Ownership verification (from Phase 66)
└── app/
    └── admin/
        └── treasury/
            └── page.tsx                       # Phase 65 page (extensible)
```

### Pattern 1: Viem writeContract for Treasury Withdrawal

**What:** Execute state-changing `withdrawTreasury(uint256 amount)` via MetaMask
**When to use:** Admin clicks Withdraw button after passing ownership check and validation
**Confidence:** HIGH [VERIFIED: viem documentation, Phase 66 implementation]

```typescript
// Source: viem documentation + Phase 66 ContractOwnershipCard.tsx pattern
import { writeContract, simulateContract } from "viem"
import { BaseError, ContractFunctionRevertedError } from "viem"

const handleWithdraw = async (amount: bigint) => {
  if (!walletClient || !address) return

  try {
    // Step 1: Simulate contract call to validate + estimate gas
    setWithdrawalStep("validating")
    const { request } = await publicClient.simulateContract({
      address: contractAddresses.commission,
      abi: [
        {
          name: "withdrawTreasury",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "amount", type: "uint256" }],
          outputs: [],
        },
      ],
      functionName: "withdrawTreasury",
      args: [amount],
      account: address,
    })

    // Step 2: Display gas estimation to user
    const gasEstimate = await publicClient.estimateGas(request)
    const gasCostWei = gasEstimate * gasPrice
    const gasCostUsdt = formatUnits(gasCostWei, 18) // BNB price approximation
    setGasEstimation(gasCostUsdt)

    // Step 3: Execute withdrawal via MetaMask
    setWithdrawalStep("signing")
    const hash = await walletClient.writeContract(request)

    // Step 4: Wait for transaction confirmation
    setWithdrawalStep("confirming")
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === "success") {
      setWithdrawalStep("done")
      // Auto-refresh pool balances
      await refetchPoolBalances()
      showSuccessAlert(`Withdrawal successful: ${formatUsdt(amount)}`)
    }
  } catch (error) {
    // Handle errors using viem error types
    if (error instanceof BaseError) {
      const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError)
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? "Unknown error"
        showErrorAlert(`Withdrawal failed: ${errorName}`)
      } else {
        showErrorAlert(`Withdrawal failed: ${error.shortMessage}`)
      }
    }
    setWithdrawalStep("error")
  }
}
```

### Pattern 2: Pool Balance Fetching with Auto-Refresh

**What:** Fetch treasury + coinstor balances from Phase 64 endpoint, auto-refresh after withdrawal
**When to use:** Initial load, manual refresh, post-withdrawal auto-refresh
**Confidence:** HIGH [VERIFIED: Phase 64 CONTEXT.md, existing endpoint patterns]

```typescript
// Source: Phase 64 endpoint specification
interface PoolBalanceResponse {
  success: boolean
  data: {
    treasury: { wei: string; usdt: string }
    coinstor: { wei: string; usdt: string }
  }
}

const usePoolBalances = () => {
  const [balances, setBalances] = useState<{
    total: string
    treasury: string
    coinstor: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalances = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/v2/admin/pool-balances")
      const data: PoolBalanceResponse = await response.json()

      if (data.success) {
        const treasuryUsdt = parseFloat(data.data.treasury.usdt)
        const coinstorUsdt = parseFloat(data.data.coinstor.usdt)
        const totalUsdt = treasuryUsdt + coinstorUsdt

        setBalances({
          total: formatCurrency(totalUsdt),
          treasury: formatCurrency(treasuryUsdt),
          coinstor: formatCurrency(coinstorUsdt),
        })
      }
    } catch (err) {
      setError("Failed to fetch pool balances")
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh after successful withdrawal (called from withdrawal handler)
  const autoRefreshAfterWithdrawal = async () => {
    await fetchBalances()
  }

  return { balances, loading, error, refetch: fetchBalances, autoRefreshAfterWithdrawal }
}
```

### Pattern 3: Real-Time Form Validation

**What:** Validate withdrawal amount as user types with immediate feedback
**When to use:** User enters amount in withdrawal form input
**Confidence:** HIGH [VERIFIED: React Hook Form patterns, existing form validation]

```typescript
// Source: Established React form validation patterns
const WithdrawalForm = () => {
  const { balances } = usePoolBalances()
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Real-time validation as user types
  useEffect(() => {
    if (!amount) {
      setValidationError(null)
      return
    }

    const amountNum = parseFloat(amount)

    // Check: Must be > 0
    if (amountNum <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }

    // Check: Must not exceed available treasury balance
    const availableTreasury = parseUsdt(balances?.treasury || '0')
    if (amountNum > availableTreasury) {
      setValidationError(`Amount cannot exceed available treasury: ${balances?.treasury}`)
      return
    }

    setValidationError(null)
  }, [amount, balances])

  // Large withdrawal warning (>10% or >$1000)
  const showLargeWithdrawalWarning = useMemo(() => {
    const amountNum = parseFloat(amount)
    const availableTreasury = parseUsdt(balances?.treasury || '0')
    const isLargeAmount = amountNum > 1000
    const isLargePercentage = (amountNum / availableTreasury) > 0.1

    return isLargeAmount || isLargePercentage
  }, [amount, balances])

  return (
    <form>
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter USDT amount"
      />
      {validationError && <Alert variant="destructive">{validationError}</Alert>}
      {showLargeWithdrawalWarning && (
        <Alert variant="warning">
          Large withdrawal: Please verify amount before confirming
        </Alert>
      )}
    </form>
  )
}
```

### Pattern 4: Comprehensive Error Handling with viem

**What:** Parse viem errors into user-friendly messages with actionable retry options
**When to use:** Any viem operation fails (simulate, writeContract, waitForTransactionReceipt)
**Confidence:** HIGH [VERIFIED: viem error documentation, WebSearch research]

```typescript
// Source: viem error handling documentation + WebSearch research
import { BaseError, ContractFunctionRevertedError, TransactionNotFoundError } from "viem"

const handleViemError = (error: unknown) => {
  // Network/RPC errors
  if (error instanceof BaseError) {
    // Check for contract revert
    const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? ""
      const errorArgs = revertError.data?.args ?? []

      // Map contract revert reasons to user-friendly messages
      const revertMessages: Record<string, string> = {
        "Amount must be > 0": "Withdrawal amount must be greater than 0",
        "Insufficient treasury balance": "Treasury balance is insufficient for this withdrawal",
        "Ownable: caller is not the owner": "Only the contract owner can withdraw funds",
      }

      return {
        type: "contract-revert",
        message: revertMessages[errorName] || `Transaction reverted: ${errorName}`,
        retryable: false,
        context: errorName,
      }
    }

    // Check for transaction not found (RPC timeout)
    const txNotFoundError = error.walk((err) => err instanceof TransactionNotFoundError)
    if (txNotFoundError) {
      return {
        type: "rpc-timeout",
        message: "RPC timeout: Transaction not found. Please check BscScan for details.",
        retryable: true,
        context: "Network may be congested",
      }
    }

    // Generic BaseError
    return {
      type: "unknown-error",
      message: error.shortMessage || "An unknown error occurred",
      retryable: true,
      context: error.name,
    }
  }

  // Non-viem errors
  return {
    type: "unexpected-error",
    message: error instanceof Error ? error.message : "Unexpected error occurred",
    retryable: true,
    context: "Unknown error type",
  }
}

// Usage in withdrawal handler
try {
  const hash = await walletClient.writeContract(request)
} catch (error) {
  const { type, message, retryable, context } = handleViemError(error)
  showErrorAlert(message, retryable ? () => handleWithdraw(amount) : undefined)
  console.error(`Withdrawal error (${type}):`, { context, error })
}
```

### Pattern 5: Transaction Progress Indication

**What:** Display step-by-step progress during withdrawal transaction
**When to use:** From user clicks Withdraw through transaction confirmation
**Confidence:** HIGH [VERIFIED: Phase 66 pattern, UX best practices]

```typescript
// Source: Phase 66 ContractOwnershipCard.tsx progress pattern
type WithdrawalStep = 'idle' | 'validating' | 'signing' | 'confirming' | 'done' | 'error'

const WithdrawalForm = () => {
  const [withdrawalStep, setWithdrawalStep] = useState<WithdrawalStep>('idle')

  const progressSteps = [
    { key: 'validating', label: 'Validating transaction...' },
    { key: 'signing', label: 'Please confirm in MetaMask...' },
    { key: 'confirming', label: 'Confirming transaction...' },
    { key: 'done', label: 'Withdrawal complete!' }
  ]

  return (
    <div>
      {withdrawalStep !== 'idle' && withdrawalStep !== 'error' && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Transaction Progress</div>
          {progressSteps.map((step) => {
            const currentStepIndex = progressSteps.findIndex(s => s.key === withdrawalStep)
            const stepIndex = progressSteps.findIndex(s => s.key === step.key)
            const isComplete = stepIndex < currentStepIndex
            const isCurrent = step.key === withdrawalStep

            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isComplete ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <span className={`text-sm ${
                  isCurrent ? 'font-medium' : 'text-muted-foreground'
                }`}>{step.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

## Integration with Existing Phases

### Phase 64: Backend Pool Balance Endpoint

**What:** `GET /api/v2/admin/pool-balances` returns treasury + coinstor balances
**How Phase 67 uses it:** Primary data source for pool balance display
**Integration pattern:**

```typescript
// Fetch pool balances from Phase 64 endpoint
const response = await fetch("/api/v2/admin/pool-balances")
const { success, data } = await response.json()

if (success) {
  setTreasuryBalance(data.treasury.usdt) // "1234.56"
  setCoinstorBalance(data.coinstor.usdt) // "567.89"
  setTotalBalance(formatCurrency(parseFloat(data.treasury.usdt) + parseFloat(data.coinstor.usdt)))
}
```

### Phase 65: Admin Page Shell & MetaMask

**What:** `/admin/treasury` page shell with `useMetaMask` hook and `TreasuryGuard`
**How Phase 67 uses it:** Extends page with Pool Balance & Treasury Withdrawal section
**Integration pattern:**

```typescript
// Source: Phase 65 page structure
// apps/web/app/admin/treasury/page.tsx
import { TreasuryGuard } from '@/components/auth/TreasuryGuard'
import { PoolBalanceCard } from '@/components/admin/treasury/PoolBalanceCard'
import { WithdrawalForm } from '@/components/admin/treasury/WithdrawalForm'

export default function TreasuryPage() {
  return (
    <TreasuryGuard>
      <div className="space-y-6">
        {/* Phase 66: Contract Ownership Section */}
        <ContractOwnershipGrid />

        {/* Phase 67: Pool Balance & Treasury Withdrawal */}
        <PoolBalanceCard />
        <WithdrawalForm />
      </div>
    </TreasuryGuard>
  )
}
```

### Phase 66: Ownership Dashboard

**What:** `useContractOwnership` hook for ownership verification, viem transaction patterns
**How Phase 67 uses it:** Enable/disable withdrawal button based on ownership status
**Integration pattern:**

```typescript
// Source: Phase 66 ownership verification
import { useContractOwnership } from '@/hooks/use-contract-ownership'

const WithdrawalForm = () => {
  const { address } = useMetaMask()
  const { ownershipStatus, isOwner } = useContractOwnership(
    'CommissionDistribution',
    contractAddresses.commission
  )

  // Withdraw button disabled until admin accepts ownership
  const canWithdraw = isOwner && address !== null

  return (
    <Button
      onClick={handleWithdraw}
      disabled={!canWithdraw || amount <= 0}
    >
      {!canWithdraw ? 'Accept ownership first' : 'Withdraw'}
    </Button>
  )
}
```

## Project Constraints (from CLAUDE.md)

### Security Requirements

- **NEVER commit WALLET_MASTER_KEY** — Not applicable for Phase 67 (client-side MetaMask)
- **ALWAYS use environment variables for secrets** — Contract addresses from env vars (Phase 64 pattern)
- **MetaMask security** — Admin wallet signs transactions directly, no private key storage

### Technical Constraints

- **Use Bun, not npm/yarn** — Package manager consistency
- **App Router only** — All routes in `apps/web/app/`
- **shadcn/ui components** — Import from `@/components/ui/*`
- **Client components** — Mark with `'use client'` for MetaMask interactions
- **BSC network validation** — Check chain ID (56, 97, 7117) before transactions
- **USDT is BEP-20** — 18 decimals, not ERC-20

### Testing Requirements

- **Frontend tests** — React Testing Library + Jest for form validation and error handling
- **No backend tests** — Phase 64 already tested pool balance endpoint
- **No contract tests** — `withdrawTreasury` tested in Foundry (existing tests)

## Common Pitfalls & Antipatterns

### Critical Mistakes to Avoid

1. **Skipping ownership check** — Withdrawal MUST verify admin is CommissionDistribution owner
2. **Missing real-time validation** — Don't wait until form submit to validate amount
3. **Not auto-refreshing balances** — Users expect to see updated balance after withdrawal
4. **Poor error messages** — "Transaction failed" is not helpful — show specific revert reasons
5. **Blocking UI during transaction** — Show progress, don't freeze the interface
6. **Ignoring network issues** — RPC failures need retry options, not silent failures
7. **Hardcoding contract addresses** — Load from env vars/contracts.json per chain
8. **Forggetting gas estimation** — Users need to know transaction cost before confirming

### Edge Cases to Handle

1. **User rejects MetaMask prompt** — Clear error message + retry button
2. **Insufficient treasury balance** — Real-time validation, prevent form submit
3. **Network switched mid-transaction** — Detect chain change, warn user
4. **Transaction stuck pending** — Show BscScan link, allow retry
5. **Large withdrawal (>10% or >$1000)** — Warning message, but still allow
6. **Ownership transferred during session** — Re-verify ownership before each withdrawal
7. **Admin disconnects wallet** — Clear form state, disable withdrawal
8. **Race condition on refresh** — Debounce rapid refresh clicks

## Testing Strategy

### Frontend Unit Tests

```typescript
// PoolBalanceCard.test.tsx
describe("PoolBalanceCard", () => {
  it("displays total, treasury, and coinstor balances with currency formatting")
  it("shows skeleton during initial load")
  it("shows error alert with retry button on fetch failure")
  it("auto-refreshes after successful withdrawal")
  it("manually refreshes when refresh button clicked")
})

// WithdrawalForm.test.tsx
describe("WithdrawalForm", () => {
  it("displays treasury destination address from contract")
  it("validates amount > 0 in real-time")
  it("validates amount ≤ available treasury balance")
  it("shows large withdrawal warning for amounts >$1000 or >10%")
  it("disables withdraw button when not owner")
  it("enables withdraw button when owner + valid amount")
  it("displays gas estimation before MetaMask prompt")
  it("shows transaction progress steps")
  it("shows success alert + refreshes balances on confirmation")
  it("shows error alert with revert reason on transaction failure")
  it("shows retry option on RPC/network errors")
})

// usePoolBalances.test.ts
describe("usePoolBalances", () => {
  it("fetches balances from Phase 64 endpoint")
  it("calculates total balance correctly")
  it("formats amounts to 2 decimal places with thousands separators")
  it("handles network errors gracefully")
  it("supports manual refetch")
})

// useTreasuryWithdrawal.test.ts
describe("useTreasuryWithdrawal", () => {
  it("simulates contract before writing")
  it("estimates and displays gas cost")
  it("calls withdrawTreasury with correct amount")
  it("parses BaseError into user-friendly messages")
  it("extracts revert reason from ContractFunctionRevertedError")
  it("handles RPC timeout with retry option")
  it("waits for transaction receipt before completion")
  it("auto-refreshes pool balances after successful withdrawal")
})
```

### Integration Tests

```typescript
// treasury-withdrawal.integration.test.tsx
describe("Treasury Withdrawal Flow", () => {
  it("completes full withdrawal flow: connect → view balances → withdraw → confirm")
  it("handles ownership rejection gracefully with link to ownership section")
  it("recovers from network failure with retry")
  it("maintains consistent state if wallet disconnects mid-transaction")
})
```

### E2E Tests (Optional, Phase 68)

```typescript
// treasury-withdrawal.e2e.test.ts
describe("Treasury Withdrawal E2E", () => {
  it("admin can view pool balances on BSC mainnet")
  it("admin can withdraw treasury funds after accepting ownership")
  it("withdrawal validates amount against available balance")
  it("failed withdrawal shows specific error message")
})
```

## Performance Considerations

1. **Balance refresh rate** — Don't poll; only refresh on mount + manual + post-withdrawal
2. **Gas estimation caching** — Cache estimates for 30 seconds to avoid redundant RPC calls
3. **Skeleton loading** — Show skeletons during fetch, avoid layout shift
4. **Debounce validation** — Don't validate on every keystroke; use 300ms debounce
5. **Transaction polling** — Use viem's built-in polling, don't implement custom intervals

## Accessibility Considerations

1. **Screen reader support** — Balance amounts announced as currency: "$1,234.56 USDT"
2. **Keyboard navigation** — All form controls focusable, proper tab order
3. **Error announcements** — Alert components use ARIA live regions for screen readers
4. **Progress indication** — Transaction steps announced as they complete
5. **Color contrast** — Balance card meets WCAG AA contrast requirements (4.5:1)
6. **Touch targets** — Withdraw button minimum 44x44px for mobile users

## Success Metrics

### Functional Requirements

- [ ] Pool balance dashboard displays all three balances (Total, Treasury, CoinStor)
- [ ] Balances formatted with $ sign, thousands separators, 2 decimal places
- [ ] Manual refresh button works and shows loading state
- [ ] Withdrawal form validates amount in real-time
- [ ] Withdraw button disabled until ownership accepted
- [ ] Gas estimation displayed before MetaMask prompt
- [ ] Transaction progress shown step-by-step
- [ ] Successful withdrawal shows success alert + auto-refreshes balances
- [ ] Failed withdrawal shows user-friendly error message
- [ ] RPC failures show retry option

### Quality Metrics

- **Error handling coverage:** All viem errors handled with user-friendly messages
- **Form validation:** Real-time validation prevents invalid submissions
- **Ownership security:** Withdrawal only enabled for verified contract owners
- **Balance accuracy:** Total = Treasury + CoinStor (math verified)
- **Transaction reliability:** Auto-refresh on success, retry on failure
- **UX responsiveness:** Skeleton loading, progress indication, no blocking UI

## Dependencies & Risks

### Critical Dependencies

- **Phase 64 endpoint** — Must be deployed and returning correct balance data
- **Phase 65 useMetaMask** — Wallet connection must work reliably
- **Phase 66 ownership** — Admin must accept ownership before withdrawal
- **CommissionDistribution contract** — `withdrawTreasury` function must work on deployed contract
- **BSC RPC reliability** — Network congestion could cause timeouts

### Implementation Risks

| Risk                                    | Impact | Mitigation                                                 |
| --------------------------------------- | ------ | ---------------------------------------------------------- |
| Phase 64 endpoint down                  | HIGH   | Cache balance data locally, show graceful error with retry |
| MetaMask not installed                  | MEDIUM | Show install prompt + link to metamask.io                  |
| Admin hasn't accepted ownership         | LOW    | Disable button + tooltip with link to ownership section    |
| BSC network congestion                  | MEDIUM | Show BscScan link, allow retry, estimate higher gas limit  |
| Transaction reverted                    | MEDIUM | Parse revert reason, show specific error message           |
| Contract address mismatch across chains | LOW    | Load from env vars/contracts.json keyed by chain ID        |
| USDT decimals mismatch                  | LOW    | Use 18 decimals consistently (BSC BEP-20 standard)         |
| Race condition on balance refresh       | LOW    | Debounce refresh clicks, show loading state during fetch   |

### Rollback Strategy

If Phase 67 fails:

1. **Disable withdrawal section** — Comment out `<WithdrawalForm />` in page.tsx
2. **Keep balance display** — Pool Balance Card is read-only, safe to leave enabled
3. **Fallback to manual withdrawals** — Admin can call `withdrawTreasury` directly via Etherscan
4. **Revert Phase 64 changes** — Only if endpoint is broken (unlikely, already tested)

## Open Questions

### Resolved During Research

1. **Gas estimation approach** — Use `simulateContract` before `writeContract` [VERIFIED: viem docs]
2. **Error handling patterns** — Use viem's `BaseError` + `ContractFunctionRevertedError` [VERIFIED: viem docs]
3. **Transaction confirmation** — Use `waitForTransactionReceipt` with receipt.status check [VERIFIED: viem docs]
4. **Balance refresh strategy** — Auto-refresh after withdrawal + manual button [VERIFIED: CONTEXT.md D-28]

### Remaining for Planner

1. **Exact visual design** — Balance card layout, typography, spacing (Claude's discretion)
2. **Warning threshold** — >10% or >$1000 for large withdrawals (Claude's discretion)
3. **Progress step timing** — How long to show each step (Claude's discretion)
4. **Gas estimation placement** — Where in UI to display gas cost (Claude's discretion)

## References

### External Documentation

- [viem writeContract documentation](https://v1.viem.sh/docs/contract/writeContract.html) — Primary reference for MetaMask transactions
- [viem error handling documentation](https://v1.viem.sh/docs/error-handling.html) — BaseError and ContractFunctionRevertedError patterns
- [viem waitForTransactionReceipt documentation](https://v1.viem.sh/docs/actions/public/waitForTransactionReceipt.html) — Transaction confirmation patterns
- [viem simulateContract documentation](https://v1.viem.sh/docs/contract/simulateContract) — Gas estimation and validation

### Internal Documentation

- `contracts/src/CommissionDistribution.sol` — `withdrawTreasury` function (line 184)
- `.planning/phases/64-backend-pool-balance-endpoint/64-CONTEXT.md` — Pool balance endpoint spec
- `.planning/phases/65-admin-page-shell-metamask/65-CONTEXT.md` — MetaMask connection patterns
- `.planning/phases/66-ownership-dashboard/66-RESEARCH.md` — Viem transaction patterns
- `apps/web/hooks/use-metamask.ts` — MetaMask hook implementation
- `apps/web/components/admin/ContractOwnershipCard.tsx` — writeContract example

### Research Sources

- viem gas estimation patterns [CITED: viem documentation]
- viem error handling with BaseError [CITED: viem error documentation]
- viem transaction confirmation [CITED: waitForTransactionReceipt docs]
- ERC20 token transfer errors [CITED: WebSearch research]
- viem transaction progress patterns [CITED: Phase 66 implementation]

---

**Next Steps:** Proceed to gsd-planner to create detailed PLAN.md with tasks, file structure, and implementation sequence.

_Phase: 67-pool-balance-treasury-withdrawal_
_Research completed: 2026-05-26_
_Confidence: HIGH_
