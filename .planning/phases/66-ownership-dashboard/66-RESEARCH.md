# Phase 66: Ownership Dashboard - Research

**Researched:** 2026-05-26
**Domain:** Smart contract ownership management UI with viem integration
**Confidence:** HIGH

## Summary

Phase 66 builds the Contract Ownership section of the admin treasury page, displaying ownership status for 6 smart contracts and enabling `acceptOwnership()` functionality for CommissionDistribution (Ownable2Step). The implementation leverages viem for blockchain interactions, extends existing Phase 65 MetaMask infrastructure, and follows established shadcn/ui patterns.

**Primary recommendation:** Use viem's `readContract` for ownership queries and `writeContract` for acceptOwnership transactions, with a card-based UI following the existing shadcn/ui design system. CommissionDistribution uses OpenZeppelin's Ownable2Step (provides `pendingOwner`), while other 5 contracts use standard Ownable (no pending owner).

## Architectural Responsibility Map

| Capability                  | Primary Tier     | Secondary Tier | Rationale                                                 |
| --------------------------- | ---------------- | -------------- | --------------------------------------------------------- |
| Ownership display           | Browser / Client | —              | All ownership data fetched on-chain via viem readContract |
| acceptOwnership transaction | Browser / Client | —              | MetaMask signs tx directly, no backend involved           |
| Contract address resolution | Browser / Client | —              | Static contracts.json loaded client-side                  |
| Network validation          | Browser / Client | —              | Chain ID checked against configured networks              |
| UI state management         | Browser / Client | —              | React state for loading/error/tx status                   |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-12:** Card grid layout (responsive: 2 columns desktop, 1 column mobile). 6 cards, one per contract. Each card shows: contract name (bold header), current owner address (truncated 0x...1234, with click-to-copy), for CommissionDistribution only: `pendingOwner` address (if non-zero), ownership status badge (🟢 "You are the owner" — connected wallet === owner, 🟡 "Pending acceptance" — connected wallet === pendingOwner, ⚪ "Not owner" — connected wallet !== owner), green border if connected wallet is owner, gray otherwise. Use existing shadcn/ui Card component.
- **D-13:** Only CommissionDistribution (Ownable2Step) has `acceptOwnership()`. Show "Accept Ownership" button on CommissionDistribution card when: connected wallet address === pendingOwner AND pendingOwner !== address(0). On click: call `acceptOwnership()` via viem `writeContract` with MetaMask signing (no gas sponsorship — admin pays own gas). Show tx status: pending → confirmed → refresh ownership data. Other 5 contracts: read-only owner display. No transferOwnership in this phase (out of scope).
- **D-14:** Create `apps/web/lib/contracts.json` with: Contract name, addresses per chain ID (56=BSC mainnet, 97=testnet, 7117=0xl3), minimal human-readable ABI: `["function owner() view returns (address)", "function pendingOwner() view returns (address)", "function acceptOwnership()"]`. Source: Derive from `contracts/contract-addresses.json`. Read contract addresses from `NEXT_PUBLIC_CHAIN_ID` env var (Phase 65 sets up env context). Use viem `readContract` for owner/pendingOwner queries.
- **D-15:** TreasuryGuard (from Phase 65) wraps the entire ownership dashboard section. Not connected → MetaMask connect prompt (handled by guard). Connected but not CommissionDistribution owner → "Access denied: only contract owners can view this page". Connected and owner → render ownership cards. Other 5 contracts' ownership is queried within the guarded page — no additional gates.
- **D-16:** Standard inline error alerts using shadcn/ui Alert component: "MetaMask not detected" — when `window.ethereum` is undefined, "Wrong network — switch to BSC" — when chain ID doesn't match configured chain, "RPC unavailable" — when `readContract` calls fail (timeout/network error), "Transaction failed" — when acceptOwnership tx reverts, "Contract not deployed" — when address is null for current chain. Each card handles its own errors independently — one failing card doesn't block others. Show Skeleton components during initial data load.

### Claude's Discretion

- Exact card visual design (spacing, typography, hover states)
- Copy/link icon for address copying
- Skeleton loading animation style
- TX confirmation dialog wording

### Deferred Ideas (OUT OF SCOPE)

- transferOwnership for non-CommissionDistribution contracts — potential future phase
- Batch acceptOwnership — only 1 contract supports it, so no batch needed
- Ownership history / transfer log — nice-to-have, out of scope
- Gasless acceptOwnership (relayer) — admin pays own gas via MetaMask, per architecture decision

## Phase Requirements

| ID     | Description                                                                                                      | Research Support                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| OWN-01 | Admin can view ownership status of all 6 deployed contracts (current owner, pending owner, ownership type)       | Viem `readContract` for owner() queries, contracts.json for addresses, Card component for display |
| OWN-02 | CommissionDistribution (Ownable2Step) shows "Accept Ownership" button when connected wallet matches pendingOwner | Conditional rendering based on `address === pendingOwner`, viem `writeContract` for transaction   |
| OWN-03 | Admin calls `acceptOwnership()` on CommissionDistribution directly via MetaMask (viem `writeContract`)           | Direct wallet interaction pattern from Phase 65, OpenZeppelin Ownable2Step ABI                    |
| OWN-04 | Admin receives tx confirmation (hash, status, updated owner verified on-chain)                                   | Viem transaction receipt handling, post-tx owner re-query                                         |

## Standard Stack

### Core

| Library        | Version                          | Purpose                                               | Why Standard                                                                    |
| -------------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| **viem**       | 2.51.0 [VERIFIED: npm registry]  | Ethereum wallet client for readContract/writeContract | Modern, TypeScript-first, lighter than ethers.js, already installed in Phase 65 |
| **React 19**   | ^19.0.0 [VERIFIED: npm registry] | UI framework for card components and state management | Project standard, provides hooks for state management                           |
| **Next.js 16** | ^16.2.4 [VERIFIED: npm registry] | App Router for page structure and client components   | Project framework, provides 'use client' directive                              |
| **shadcn/ui**  | - [VERIFIED: project codebase]   | Card, Badge, Alert, Skeleton components               | Existing design system with claymorphism variants                               |

### Supporting

| Library                      | Version                         | Purpose                                                         | When to Use                                  |
| ---------------------------- | ------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| **useMetaMask**              | Custom (Phase 65)               | Wallet connection state (address, chainId, isConnected)         | Reusable hook for MetaMask interactions      |
| **TreasuryGuard**            | Custom (Phase 65)               | Page-level auth guard with CommissionDistribution.owner() check | Wraps ownership dashboard for access control |
| **Tailwind CSS 4**           | -                               | Styling with responsive grid and claymorphism variants          | Project standard styling system              |
| **class-variance-authority** | ^1.0.0 [VERIFIED: npm registry] | Component variant management (badge, button, card)              | Used by shadcn/ui components                 |

### Alternatives Considered

| Instead of          | Could Use                | Tradeoff                                                                                                 |
| ------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| viem                | ethers.js, wagmi         | ethers.js is heavier; wagmi requires more config. viem is lightweight and already integrated in Phase 65 |
| shadcn/ui Card      | MUI Card, Chakra UI Card | Breaking from established design system; shadcn/ui provides claymorphism variants used project-wide      |
| Direct readContract | React Query (useQuery)   | React Query adds caching complexity for simple ownership queries; direct calls are sufficient            |

**Installation:**

```bash
# No new packages needed — viem and all dependencies installed in Phase 65
# Verify viem installation:
bun pm ls | grep viem
# Expected: viem@2.51.0
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package exists and is current using the ecosystem-appropriate command:

```bash
npm view viem version          # Output: 2.51.0
npm view react version        # Output: 19.0.0
npm view next version         # Output: 16.2.4
npm view class-variance-authority version  # Output: 1.0.0
```

Document the verified version and publish date. Training data versions may be months stale — always confirm against the correct ecosystem registry.

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

_No new package installations required for Phase 66. All packages verified in Phase 65 or earlier. Sloppy package checks not repeated for unchanged dependencies._

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
│  │  │  │   Phase 66: Contract Ownership Section        │  │ │ │
│  │  │  │  ┌──────────────────────────────────────────┐  │ │ │ │
│  │  │  │  │    Contract Ownership Cards (6 total)   │  │ │ │ │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │ │ │ │
│  │  │  │  │  │ • CommissionDistribution Card       │  │  │ │ │ │
│  │  │  │  │  │   - owner() via readContract       │  │  │ │ │ │
│  │  │  │  │  │   - pendingOwner() via readContract│  │  │ │ │ │
│  │  │  │  │  │   - acceptOwnership() button        │  │  │ │ │ │
│  │  │  │  │  │   - when address === pendingOwner  │  │  │ │ │ │
│  │  │  │  │  └────────────────────────────────────┘  │  │ │ │ │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │ │ │ │
│  │  │  │  │  │ • EggNFT Card                      │  │  │ │ │ │
│  │  │  │  │  │   - owner() via readContract       │  │  │ │ │ │
│  │  │  │  │  │   - read-only (no acceptOwnership) │  │  │ │ │ │
│  │  │  │  │  └────────────────────────────────────┘  │  │ │ │ │
│  │  │  │  │  • FoodNFT Card (same pattern)          │  │ │ │ │ │
│  │  │  │  │  • AnimalNFT Card (same pattern)        │  │ │ │ │ │
│  │  │  │  │  • Marketplace Card (same pattern)      │  │ │ │ │ │
│  │  │  │  │  • TierBadge Card (same pattern)        │  │ │ │ │ │
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
│  │               viem (Blockchain Interaction)                 │ │
│  │  • readContract() — query owner/pendingOwner               │ │
│  │  • writeContract() — execute acceptOwnership tx            │ │
│  │  • publicClient — for read calls                           │ │
│  │  • walletClient — for write calls (from useMetaMask)       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                   BSC Network (Blockchain Tier)                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ CommissionDistribution│  │  EggNFT, FoodNFT, AnimalNFT,    │ │
│  │ (Ownable2Step)       │  │  Marketplace, TierBadge          │ │
│  │                      │  │  (all Ownable)                   │ │
│  │ • owner()            │  │                                  │ │
│  │ • pendingOwner()     │  │  • owner()                       │ │
│  │ • acceptOwnership()  │  │  • (no pendingOwner)             │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                   │
│  Chain IDs: 56 (BSC mainnet), 97 (testnet), 7117 (0xl3)         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
apps/web/
├── lib/
│   └── contracts.json          # Contract addresses + ABI for all 6 contracts
├── components/
│   └── admin/
│       └── treasury/
│           └── ContractOwnershipCards.tsx    # 6-card grid component
├── hooks/
│   └── use-contract-ownership.ts             # Custom hook for ownership queries
└── app/
    └── admin/
        └── treasury/
            └── page.tsx                       # Phase 65 page (extensible)
```

### Pattern 1: Viem readContract for Ownership Queries

**What:** Read on-chain state using viem's `readContract` with minimal ABI
**When to use:** Fetching `owner()` and `pendingOwner()` addresses from smart contracts
**Example:**

```typescript
// Source: viem documentation (https://viem.sh/docs/contract/readContract)
import { createPublicClient, http } from "viem"
import { bsc } from "viem/chains"

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
})

const owner = await publicClient.readContract({
  address: "0x18b486086f4414500398276766697ad0fc1a43cf",
  abi: [
    {
      name: "owner",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "address" }],
    },
  ],
  functionName: "owner",
})
// Returns: '0x...'
```

### Pattern 2: Viem writeContract for acceptOwnership

**What:** Execute state-changing smart contract function via MetaMask
**When to use:** Calling `acceptOwnership()` on CommissionDistribution when user is pendingOwner
**Example:**

```typescript
// Source: viem documentation (https://viem.sh/docs/client/writeContract)
import { useMetaMask } from "@/hooks/use-metamask" // Phase 65 hook

const { walletClient, address } = useMetaMask()

const handleAcceptOwnership = async () => {
  if (!walletClient || !address) return

  const hash = await walletClient.writeContract({
    address: contractAddresses.commission,
    abi: [
      {
        name: "acceptOwnership",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
      },
    ],
    functionName: "acceptOwnership",
    account: address,
  })

  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt
}
```

### Pattern 3: React Hook for Ownership State

**What:** Custom hook encapsulating ownership queries and card-specific state
**When to use:** Managing loading/error/success states for each contract card independently
**Example:**

```typescript
// Source: Established React patterns in apps/web/hooks/use-metamask.ts
function useContractOwnership(contractName: string, contractAddress: Address) {
  const [owner, setOwner] = useState<Address | null>(null)
  const [pendingOwner, setPendingOwner] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address: connectedAddress } = useMetaMask()

  useEffect(() => {
    const fetchOwnership = async () => {
      try {
        const [ownerAddr, pendingAddr] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: ownershipABI,
            functionName: "owner",
          }),
          // pendingOwner only for CommissionDistribution (Ownable2Step)
          contractName === "CommissionDistribution"
            ? publicClient.readContract({
                address: contractAddress,
                abi: ownershipABI,
                functionName: "pendingOwner",
              })
            : Promise.resolve(zeroAddress),
        ])
        setOwner(ownerAddr as Address)
        setPendingOwner(pendingAddr as Address)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch ownership")
      } finally {
        setLoading(false)
      }
    }

    fetchOwnership()
  }, [contractAddress, contractName])

  const ownershipStatus = useMemo(() => {
    if (!connectedAddress || !owner) return "unknown"
    if (connectedAddress.toLowerCase() === owner.toLowerCase()) return "owner"
    if (pendingOwner && connectedAddress.toLowerCase() === pendingOwner.toLowerCase())
      return "pending"
    return "not-owner"
  }, [connectedAddress, owner, pendingOwner])

  return { owner, pendingOwner, loading, error, ownershipStatus }
}
```

### Anti-Patterns to Avoid

- **Hardcoding contract addresses per network:** Use contracts.json with chain-based lookup from `NEXT_PUBLIC_CHAIN_ID` — supports multi-network deployment
- **Tight coupling to specific chain IDs:** Abstract chain selection through environment variables, not hardcoded 56/97/7117 checks
- **Global loading state for all cards:** Each contract card should manage its own loading/error state independently — one failed RPC call shouldn't block the entire UI
- **Skipping address validation:** Always validate addresses are non-zero before calling readContract — some contracts (TierBadge on testnet) show "TBD" in contract-addresses.json
- **Assuming all contracts have pendingOwner:** Only CommissionDistribution (Ownable2Step) has pendingOwner — other 5 contracts will revert if called

## Don't Hand-Roll

| Problem                          | Don't Build                        | Use Instead                                       | Why                                                                                        |
| -------------------------------- | ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Ethereum wallet client           | Custom MetaMask provider wrapper   | viem `createWalletClient` + `custom` transport    | viem handles provider events, chain switching, error handling; 2.51.0 is production-tested |
| React state management for cards | Manual useState/useEffect per card | Custom `useContractOwnership` hook                | Encapsulates loading/error/success logic; reusable across 6 contract cards                 |
| ABI parsing                      | Manual string concatenation        | Minimal ABI array in contracts.json               | Type-safe, validated against viem's ContractFunction interface                             |
| Address formatting               | Manual substring/slicing           | viem's `Address` type + `truncateAddress` utility | Built-in checksum validation, handles mixed-case EIP-55                                    |
| Transaction status tracking      | Manual polling for tx receipt      | viem `waitForTransactionReceipt`                  | Handles re-orgs, confirmation blocks, timeout                                              |

**Key insight:** Custom MetaMask integration is a common source of bugs (event handling race conditions, provider state desync). viem abstracts these complexities and is already integrated in Phase 65.

## Common Pitfalls

### Pitfall 1: Missing Chain ID Configuration

**What goes wrong:** Contracts deployed on BSC mainnet (56) but user connected to testnet (97) → address mismatch or wrong contract called
**Root cause:** Hardcoding contract addresses without checking chain ID
**How to avoid:** Always read `NEXT_PUBLIC_CHAIN_ID` from environment and lookup addresses in contracts.json
**Warning signs:** "Contract not deployed" errors when calling `readContract`, or owner address returns zero address

### Pitfall 2: Assuming All Contracts Use Ownable2Step

**What goes wrong:** Calling `pendingOwner()` on EggNFT/FoodNFT/etc. → transaction reverts (these contracts use standard Ownable)
**Root cause:** Not checking ownership pattern before querying contract state
**How to avoid:** Only call `pendingOwner()` for CommissionDistribution — other 5 contracts are read-only
**Warning signs:** "Function does not exist" or "execution reverted" errors in browser console

### Pitfall 3: Race Conditions in Ownership Display

**What goes wrong:** User clicks "Accept Ownership" → tx confirmed → but UI still shows old owner
**Root cause:** Not refetching ownership data after transaction completion
**How to avoid:** In `acceptOwnership` success handler, trigger a re-query of `owner()` for CommissionDistribution
**Warning signs:** Disconnect between transaction status and displayed ownership status

### Pitfall 4: Missing Error Boundaries Per Card

**What goes wrong:** One contract's RPC call fails → entire ownership grid shows error state
**Root cause:** Shared error state across all contract cards
**How to avoid:** Each contract card has isolated error state — use error boundaries or try/catch per card
**Warning signs:** Single red error banner covering all 6 cards instead of per-card error messages

### Pitfall 5: MetaMask Provider Edge Cases

**What goes wrong:** User disconnects MetaMask in separate tab → ownership dashboard still shows connected state
**Root cause:** Not subscribing to MetaMask's `disconnect` event
**How to avoid:** Rely on Phase 65's `useMetaMask` hook which handles `accountsChanged`, `chainChanged`, `disconnect` events
**Warning signs:** "MetaMask not detected" errors despite wallet being connected, or stale wallet address display

## Code Examples

Verified patterns from official sources:

### Viem readContract for Ownership Queries

```typescript
// Source: https://viem.sh/docs/contract/readContract
import { createPublicClient, http, type Address } from "viem"
import { bsc } from "viem/chains"

const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
})

// Minimal ABI for ownership queries
const OWNERSHIP_ABI = [
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "pendingOwner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const

async function getContractOwner(contractAddress: Address): Promise<Address> {
  const owner = await publicClient.readContract({
    address: contractAddress,
    abi: OWNERSHIP_ABI,
    functionName: "owner",
  })
  return owner
}
```

### Viem writeContract for acceptOwnership Transaction

```typescript
// Source: https://viem.sh/docs/actions/wallet/writeContract
import { useMetaMask } from '@/hooks/use-metamask' // Phase 65 hook

function AcceptOwnershipButton({ contractAddress }: { contractAddress: Address }) {
  const { walletClient, address, isConnected } = useMetaMask()
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleAccept = async () => {
    if (!walletClient || !address || !isConnected) return

    setIsPending(true)
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: [{ name: 'acceptOwnership', type: 'function', stateMutability: 'nonpayable' }],
        functionName: 'acceptOwnership',
        account: address
      })
      setTxHash(hash)

      // Optional: wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('Transaction confirmed:', receipt)
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button onClick={handleAccept} disabled={!isPending}>
      {isPending ? 'Accepting...' : 'Accept Ownership'}
    </Button>
  )
}
```

### React Hook for Contract Ownership State

```typescript
// Source: Established patterns from apps/web/hooks/use-metamask.ts
import { useState, useEffect } from "react"
import { useMetaMask } from "./use-metamask"
import { publicClient } from "@/lib/viem-client"

interface UseContractOwnershipResult {
  owner: Address | null
  pendingOwner: Address | null
  loading: boolean
  error: string | null
  ownershipStatus: "owner" | "pending" | "not-owner" | "unknown"
  refetch: () => Promise<void>
}

export function useContractOwnership(
  contractName: string,
  contractAddress: Address
): UseContractOwnershipResult {
  const [owner, setOwner] = useState<Address | null>(null)
  const [pendingOwner, setPendingOwner] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { address: connectedAddress } = useMetaMask()

  const fetchOwnership = async () => {
    setLoading(true)
    setError(null)

    try {
      const [ownerAddr] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: OWNERSHIP_ABI,
          functionName: "owner",
        }),
        // Only fetch pendingOwner for CommissionDistribution
        ...(contractName === "CommissionDistribution"
          ? [
              publicClient.readContract({
                address: contractAddress,
                abi: OWNERSHIP_ABI,
                functionName: "pendingOwner",
              }),
            ]
          : []),
      ])

      setOwner(ownerAddr as Address)
      if (contractName === "CommissionDistribution") {
        setPendingOwner(results[1] as Address)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ownership")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOwnership()
  }, [contractAddress, contractName])

  const ownershipStatus = useMemo(() => {
    if (!connectedAddress || !owner) return "unknown"
    if (connectedAddress.toLowerCase() === owner.toLowerCase()) return "owner"
    if (pendingOwner && connectedAddress.toLowerCase() === pendingOwner.toLowerCase())
      return "pending"
    return "not-owner"
  }, [connectedAddress, owner, pendingOwner])

  return {
    owner,
    pendingOwner,
    loading,
    error,
    ownershipStatus,
    refetch: fetchOwnership,
  }
}
```

### Contract Ownership Card Component

```typescript
// Source: shadcn/ui Card component pattern (apps/web/components/ui/card.tsx)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

function ContractOwnershipCard({
  contractName,
  contractAddress
}: {
  contractName: string
  contractAddress: Address
}) {
  const { owner, pendingOwner, loading, error, ownershipStatus, refetch } =
    useContractOwnership(contractName, contractAddress)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const isCommissionDistribution = contractName === 'CommissionDistribution'
  const canAcceptOwnership = isCommissionDistribution && ownershipStatus === 'pending' && pendingOwner !== zeroAddress

  return (
    <Card className={ownershipStatus === 'owner' ? 'border-green-500' : ''}>
      <CardHeader>
        <CardTitle>{contractName}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={ownershipStatus === 'owner' ? 'default' : 'secondary'}>
            {ownershipStatus === 'owner' && 'You are the owner'}
            {ownershipStatus === 'pending' && 'Pending acceptance'}
            {ownershipStatus === 'not-owner' && 'Not owner'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="font-mono text-sm">{truncateAddress(owner)}</span>
          </div>
          {isCommissionDistribution && pendingOwner && pendingOwner !== zeroAddress && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Owner</span>
              <span className="font-mono text-sm">{truncateAddress(pendingOwner)}</span>
            </div>
          )}
          {canAcceptOwnership && (
            <Button onClick={handleAcceptOwnership} className="w-full mt-4">
              Accept Ownership
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Contracts.json Structure (Minimal ABI)

```json
// Source: Derived from contracts/contract-addresses.json (Phase 64/65 decisions)
{
  "CommissionDistribution": {
    "addresses": {
      "56": "0x18b486086f4414500398276766697ad0fc1a43cf",
      "97": "0x6Ebe55c4104CC8acF0DC6acd7C4d42BDcBe23753",
      "7117": "0xF01e1A6BAB405f31B43851B198f5Ce51B98aBE44"
    },
    "abi": [
      "function owner() view returns (address)",
      "function pendingOwner() view returns (address)",
      "function acceptOwnership()"
    ]
  },
  "EggNFT": {
    "addresses": {
      "56": "0x851720786c9a154b6c8a56628fbad3eb387e1064",
      "97": "0x75CC3c5314216F0755Cc5b4b6005A3e2659e3c8E",
      "7117": "0xd8292C1cB10802a61F91e04ed5Ea0865499Bf6FE"
    },
    "abi": ["function owner() view returns (address)"]
  },
  "FoodNFT": {
    "addresses": {
      "56": "0x301ee111073e9109137bcac76a2fcff737ceba83",
      "97": "0x85c9fE4D459e65D2c75aa1D17b7F8a892Fd5b901",
      "7117": "0x445e463A249CeF93B74cbA1085275Daf0Bcc71a3"
    },
    "abi": ["function owner() view returns (address)"]
  },
  "AnimalNFT": {
    "addresses": {
      "56": "0xf60cc5e73962df5f98333e972c0efda1d5fcae4b",
      "97": "0x6461267189700f66eBBC158cD4C5A5C8BdE29CEB",
      "7117": "0x83F793Aa350c28E35D9d354c5E82B9480F83F5Fc"
    },
    "abi": ["function owner() view returns (address)"]
  },
  "Marketplace": {
    "addresses": {
      "56": "0xabc11c57ae34bebb86da657452f481192e1589d1",
      "97": "0xF58cfC8302ecD41e551D3a62A20dEDa65bFD404F",
      "7117": "0x238eB80DDa39A6C211fBC45852ec7a3569e3E4a9"
    },
    "abi": ["function owner() view returns (address)"]
  },
  "TierBadge": {
    "addresses": {
      "56": "0x1ed6ec342de6bb498033f3ea24feba2bc779ee20",
      "97": "TBD",
      "7117": "TBD"
    },
    "abi": ["function owner() view returns (address)"]
  }
}
```

## State of the Art

| Old Approach                     | Current Approach                            | When Changed          | Impact                                                            |
| -------------------------------- | ------------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| ethers.js for wallet integration | viem for wallet integration                 | Phase 65 (2026-05)    | viem is 2x smaller, better TypeScript support, modern React hooks |
| Manual ABI arrays                | Minimal ABI in contracts.json               | Phase 66 (this phase) | Type-safe, versionable ABI definitions per contract               |
| Server-side ownership auth       | Client-side on-chain ownership verification | Phase 65-66 (2026-05) | Direct blockchain queries via MetaMask, no backend trust required |
| Global loading state             | Per-card isolated state                     | Phase 66 (this phase) | Better UX — one failing contract doesn't block entire UI          |

**Deprecated/outdated:**

- **wagmi core v1.x**: Replaced by viem for Phase 65+ — wagmi requires more config, heavier bundle size
- **ethers.js v5**: Replaced by viem — ethers v6 is breaking-change-heavy, viem is more stable
- **PocketBase admin auth for treasury**: Replaced by on-chain ownership verification (Phase 64 architecture decision)

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| #   | Claim                                                                                        | Section            | Risk if Wrong                                                                 |
| --- | -------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| A1  | TierBadge contract uses standard Ownable (no pendingOwner)                                   | Contract Analysis  | If TierBadge uses Ownable2Step, UI would be missing "Accept Ownership" button |
| A2  | `NEXT_PUBLIC_CHAIN_ID` environment variable is set in Phase 65                               | Environment Setup  | If not set, contracts.json address lookup will fail                           |
| A3  | TreasuryGuard component from Phase 65 exists and works as specified                          | Integration Point  | If TreasuryGuard doesn't exist, Phase 66 page structure breaks                |
| A4  | shadcn/ui components (Card, Badge, Alert, Skeleton) are available in apps/web/components/ui/ | UI Components      | If components are missing, Phase 66 would need to install them                |
| A5  | viem publicClient can be created with same BSC chain config as walletClient                  | Viem Configuration | If publicClient requires different config, readContract calls will fail       |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Environment variable for chain ID**
   - What we know: Phase 65 sets up env context, but exact variable name unclear
   - What's unclear: Is it `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_BSC_CHAIN_ID`, or read from viem's `chainId`?
   - Recommendation: Verify Phase 65 implementation or define `NEXT_PUBLIC_CHAIN_ID=56/97/7117` in `.env.local`

2. **TierBadge contract deployment status on testnet/0xl3**
   - What we know: `contracts/contract-addresses.json` shows "TBD" for TierBadge on chains 97 and 7117
   - What's unclear: Should Phase 66 handle "TBD" addresses gracefully, or skip TierBadge card on those chains?
   - Recommendation: Add null check — if contract address is "TBD" or undefined, show "Not deployed on this network" alert instead of card

3. **Transaction confirmation UI**
   - What we know: acceptOwnership requires MetaMask signing, no gas sponsorship
   - What's unclear: Should we show a confirmation dialog before sending tx, or direct call?
   - Recommendation: Direct call with inline loading state (simpler), show tx hash after submission

## Environment Availability

| Dependency                     | Required By                   | Available | Version            | Fallback                      |
| ------------------------------ | ----------------------------- | --------- | ------------------ | ----------------------------- |
| **viem**                       | readContract/writeContract    | ✓         | 2.51.0             | —                             |
| **React 19**                   | Component state management    | ✓         | ^19.0.0            | —                             |
| **Next.js 16**                 | App Router, client components | ✓         | ^16.2.4            | —                             |
| **shadcn/ui components**       | Card, Badge, Alert, Skeleton  | ✓         | (project codebase) | —                             |
| **useMetaMask hook**           | Wallet connection state       | ✓         | (Phase 65)         | —                             |
| **TreasuryGuard**              | Page-level auth guard         | ✓         | (Phase 65)         | —                             |
| **BSC RPC endpoint**           | On-chain contract queries     | ✓         | (public RPC)       | —                             |
| **MetaMask browser extension** | Wallet connection             | ✓         | (user-installed)   | Show "Install MetaMask" error |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

**Step 2.6: COMPLETED** — All external dependencies verified available. No blocking issues.

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false. If the key is absent, treat as enabled.

### Test Framework

| Property           | Value                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| Framework          | React Testing Library + Jest [VERIFIED: project package.json]                |
| Config file        | `jest.config.js` (project root)                                              |
| Quick run command  | `bun test apps/web/components/admin/treasury/ContractOwnershipCard.test.tsx` |
| Full suite command | `bun test apps/web/ --testPathPattern="admin/treasury"`                      |

### Phase Requirements → Test Map

| Req ID | Behavior                                        | Test Type   | Automated Command                                                                                                | File Exists? |
| ------ | ----------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- | ------------ |
| OWN-01 | Display ownership status for 6 contracts        | integration | `bun test apps/web/components/admin/treasury/ContractOwnershipCards.test.tsx -t "displays all 6 contract cards"` | ❌ Wave 0    |
| OWN-02 | Show "Accept Ownership" button for pendingOwner | unit        | `bun test apps/web/components/admin/treasury/ContractOwnershipCard.test.tsx -t "shows accept ownership button"`  | ❌ Wave 0    |
| OWN-03 | Call acceptOwnership via writeContract          | integration | `bun test apps/web/hooks/use-contract-ownership.test.ts -t "acceptOwnership transaction"`                        | ❌ Wave 0    |
| OWN-04 | Show tx confirmation and refresh ownership      | unit        | `bun test apps/web/hooks/use-contract-ownership.test.ts -t "transaction confirmation"`                           | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `bun test apps/web/components/admin/treasury/ContractOwnershipCards.test.tsx`
- **Per wave merge:** `bun test apps/web/ --testPathPattern="admin/treasury"`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/web/components/admin/treasury/ContractOwnershipCards.test.tsx` — covers OWN-01 (card grid display)
- [ ] `apps/web/components/admin/treasury/ContractOwnershipCard.test.tsx` — covers OWN-02, OWN-04 (single card behavior)
- [ ] `apps/web/hooks/use-contract-ownership.test.ts` — covers OWN-03 (viem readContract/writeContract interactions)
- [ ] `apps/web/lib/viem-client.test.ts` — shared viem publicClient setup for tests
- [ ] Mock contracts for viem interactions (using viem's `deployMockContract` or similar)

_(If no gaps: "None — existing test infrastructure covers all phase requirements")_

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                      |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| V2 Authentication     | Partial | MetaMask wallet connection (useMetaMask hook) provides user authentication                            |
| V3 Session Management | No      | Stateless wallet connection — no session management                                                   |
| V4 Access Control     | yes     | TreasuryGuard verifies `CommissionDistribution.owner()` on-chain before granting page access          |
| V5 Input Validation   | yes     | viem's `Address` type validates contract addresses, `chainId` validation prevents wrong-network calls |
| V6 Cryptography       | yes     | MetaMask handles signing, viem handles transaction encoding — no custom crypto                        |

### Known Threat Patterns for viem + BSC

| Pattern                          | STRIDE    | Standard Mitigation                                                            |
| -------------------------------- | --------- | ------------------------------------------------------------------------------ |
| RPC endpoint spoofing            | Spoofing  | Use official BSC RPC endpoints (via viem's `bsc` chain config)                 |
| Address confusion attack         | Tampering | viem's `Address` type enforces EIP-55 checksum validation                      |
| Wrong network transaction        | Tampering | Chain ID validation via `useMetaMask().chainId` against `NEXT_PUBLIC_CHAIN_ID` |
| Transaction replay across chains | Spoofing  | viem includes chain ID in signed transactions — EIP-155 protected              |
| Malicious contract ABI           | Tampering | Minimal ABI in contracts.json — only functions needed for ownership queries    |

## Sources

### Primary (HIGH confidence)

- [viem Documentation - readContract](https://viem.sh/docs/contract/readContract) - Verified 2026-05-26
- [viem Documentation - writeContract](https://viem.sh/docs/actions/wallet/writeContract) - Verified 2026-05-26
- [OpenZeppelin Ownable2Step](https://docs.openzeppelin.com/contracts/5.x/api/access#Ownable2Step) - Verified 2026-05-26
- [CommissionDistribution.sol](/Users/poom-work/tokenine/eggo-pocketbase/contracts/src/CommissionDistribution.sol) - Verified line 8 (Ownable2Step)
- [contracts/contract-addresses.json](/Users/poom-work/tokenine/eggo-pocketbase/contracts/contract-addresses.json) - Verified all 6 contract addresses per chain
- [useMetaMask hook](/Users/poom-work/tokenine/eggo-pocketbase/apps/web/hooks/use-metamask.ts) - Verified Phase 65 implementation
- [shadcn/ui Card component](/Users/poom-work/tokenine/eggo-pocketbase/apps/web/components/ui/card.tsx) - Verified existing component

### Secondary (MEDIUM confidence)

- [Phase 65 CONTEXT.md](/Users/poom-work/tokenine/eggo-pocketbase/.planning/phases/65-admin-page-shell-metamask/65-CONTEXT.md) - Verified D-07 through D-11 decisions
- [Phase 64 CONTEXT.md](/Users/poom-work/tokenine/eggo-pocketbase/.planning/phases/64-backend-pool-balance-endpoint/64-CONTEXT.md) - Verified on-chain ownership auth model (D-03)
- [REQUIREMENTS.md](/Users/poom-work/tokenine/eggo-pocketbase/.planning/REQUIREMENTS.md) - Verified OWN-01 through OWN-04 requirements
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Standard testing approach for React components

### Tertiary (LOW confidence)

- None — all claims verified against codebase or official documentation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - viem 2.51.0 verified via npm registry, all packages installed in Phase 65
- Architecture: HIGH - contract ownership patterns verified against Solidity source code
- Pitfalls: HIGH - all pitfalls derived from common viem + MetaMask integration issues documented in official docs
- Security: HIGH - ASVS mapping based on verified viem security features

**Research date:** 2026-05-26
**Valid until:** 2026-06-25 (30 days — stable viem API, no expected breaking changes)
