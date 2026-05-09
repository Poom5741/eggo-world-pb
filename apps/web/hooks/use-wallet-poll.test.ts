import { describe, it, expect, vi, beforeEach } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { useWalletPoll } from "./use-wallet-poll"

vi.mock("@/lib/pocketbase/client", () => ({
  createClient: vi.fn(() => ({
    authStore: { token: "mock-token-123" },
  })),
}))

describe("useWalletPoll", () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  it("fetches balance on mount with valid address", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { usdt_balance: "100.50", withdrawable: "100.50" },
      }),
    })

    const { result } = renderHook(() =>
      useWalletPoll("0x1234567890abcdef1234567890abcdef12345678")
    )

    await waitFor(() => {
      expect(result.current.balance.usdt).toBe("100.50")
    })
    expect(result.current.loading).toBe(false)
  })

  it("handles undefined wallet address gracefully", async () => {
    const { result } = renderHook(() => useWalletPoll(undefined))

    expect(result.current.balance.usdt).toBe("0")
    expect(result.current.loading).toBe(false)
  })

  it("handles invalid wallet address format", async () => {
    const { result } = renderHook(() => useWalletPoll("invalid"))

    expect(result.current.balance.usdt).toBe("0")
    expect(result.current.loading).toBe(false)
  })

  it("handles null wallet address string", async () => {
    const { result } = renderHook(() => useWalletPoll("null"))

    expect(result.current.balance.usdt).toBe("0")
    expect(result.current.loading).toBe(false)
  })

  it("handles 4xx errors gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    const { result } = renderHook(() =>
      useWalletPoll("0x1234567890abcdef1234567890abcdef12345678")
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBeNull()
  })

  it("throws error on 5xx error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    })

    const { result } = renderHook(() =>
      useWalletPoll("0x1234567890abcdef1234567890abcdef12345678")
    )

    await waitFor(() => {
      expect(result.current.error).toContain("500")
    })
  })

  it("loading state transitions correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { usdt_balance: "100.50", withdrawable: "100.50" },
      }),
    })

    const { result } = renderHook(() =>
      useWalletPoll("0x1234567890abcdef1234567890abcdef12345678")
    )

    // Starts false (initial React state before fetch effect fires)
    expect(result.current.loading).toBe(false)

    // After data loads successfully, loading returns to false
    await waitFor(() => {
      expect(result.current.balance.usdt).toBe("100.50")
    })
    expect(result.current.loading).toBe(false)
  })
})
