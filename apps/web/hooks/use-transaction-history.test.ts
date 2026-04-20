import { describe, it, expect, vi, beforeEach } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { useTransactionHistory } from "./use-transaction-history"

vi.mock("@/lib/pocketbase/client", () => ({
  createClient: vi.fn(() => ({
    authStore: { record: { id: "user123" } },
    collection: vi.fn(() => ({
      getList: vi.fn().mockResolvedValue({
        items: [
          {
            id: "tx1",
            type: "mint",
            amount: "10",
            status: "confirmed",
            created: "2026-04-19T10:00:00.000Z",
            tx_hash: "0x123",
            description: "Mint Food NFT",
          },
          {
            id: "tx2",
            type: "deposit",
            amount: "50",
            status: "pending",
            created: "2026-04-19T11:00:00.000Z",
            tx_hash: null,
            description: "USDT Deposit",
          },
        ],
        totalItems: 2,
      }),
    })),
  })),
}))

describe("useTransactionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches transactions on mount", async () => {
    const { result } = renderHook(() => useTransactionHistory("user123"))

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(2)
    })
  })

  it("maps transaction fields correctly", async () => {
    const { result } = renderHook(() => useTransactionHistory("user123"))

    await waitFor(() => {
      const tx = result.current.transactions[0]
      expect(tx.id).toBe("tx1")
      expect(tx.type).toBe("mint")
      expect(tx.amount).toBe("10")
      expect(tx.status).toBe("confirmed")
      expect(tx.timestamp).toBe("2026-04-19T10:00:00.000Z")
      expect(tx.tx_hash).toBe("0x123")
      expect(tx.description).toBe("Mint Food NFT")
    })
  })

  it("handles empty transaction list", async () => {
    const { createClient } = await import("@/lib/pocketbase/client")
    ;(createClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      authStore: { record: { id: "user123" } },
      collection: vi.fn(() => ({
        getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
      })),
    }))

    const { result } = renderHook(() => useTransactionHistory("user123"))

    await waitFor(() => {
      expect(result.current.transactions).toEqual([])
    })
  })

  it("returns empty array when userId is undefined", async () => {
    const { result } = renderHook(() => useTransactionHistory(undefined))

    expect(result.current.transactions).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it("handles API errors gracefully", async () => {
    const { createClient } = await import("@/lib/pocketbase/client")
    ;(createClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      authStore: { record: { id: "user123" } },
      collection: vi.fn(() => ({
        getList: vi.fn().mockRejectedValue(new Error("Collection not found")),
      })),
    }))

    const { result } = renderHook(() => useTransactionHistory("user123"))

    await waitFor(() => {
      expect(result.current.transactions).toEqual([])
      expect(result.current.error).toBeNull() // Should not error, just return empty
    })
  })

  it("respects limit parameter", async () => {
    const { createClient } = await import("@/lib/pocketbase/client")
    const mockGetList = vi.fn().mockResolvedValue({
      items: [],
      totalItems: 0,
    })
    ;(createClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      authStore: { record: { id: "user123" } },
      collection: vi.fn(() => ({
        getList: mockGetList,
      })),
    }))

    renderHook(() => useTransactionHistory("user123", 5))

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(1, 5, {
        filter: `user = "user123"`,
        sort: "-created",
      })
    })
  })

  it("refresh function refetches transactions", async () => {
    const { result } = renderHook(() => useTransactionHistory("user123"))

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(2)
    })

    // Call refresh
    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(2)
    })
  })

  it("shows loading state while fetching", async () => {
    const { result } = renderHook(() => useTransactionHistory("user123"))

    // Initial state should be loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
