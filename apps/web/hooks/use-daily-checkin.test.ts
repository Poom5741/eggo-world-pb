import { describe, it, expect, vi, beforeEach } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { useDailyCheckin } from "./use-daily-checkin"

const mockGetFirstListItem = vi.fn()

vi.mock("@/lib/pocketbase/client", () => ({
  createClient: vi.fn(() => ({
    authStore: { record: { id: "user123" } },
    collection: vi.fn(() => ({
      getFirstListItem: mockGetFirstListItem,
    })),
    send: vi.fn().mockResolvedValue({
      success: true,
      data: {
        streak: 6,
        last_check_in: "2026-04-19T10:00:00.000Z",
      },
    }),
  })),
}))

describe("useDailyCheckin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFirstListItem.mockResolvedValue({
      last_check_in: "2026-04-18T10:00:00.000Z",
      check_in_streak: 5,
      check_in_count: 10,
    })
  })

  it("fetches check-in status on mount", async () => {
    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.checkInData).not.toBeNull()
    })

    expect(result.current.checkInData?.streak).toBe(5)
    expect(result.current.checkInData?.checkInCount).toBe(10)
  })

  it("sets canClaim to true when 24 hours passed", async () => {
    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.checkInData?.canClaim).toBe(true)
    })
  })

  it("claimCheckin calls API and updates state", async () => {
    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.checkInData).not.toBeNull()
    })

    await result.current.claimCheckin()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it("countdown format is HH:MM:SS", async () => {
    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.countdown).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })
  })

  it("returns null checkInData when userId is undefined", async () => {
    const { result } = renderHook(() => useDailyCheckin(undefined))

    expect(result.current.checkInData).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it("handles error when API call fails", async () => {
    mockGetFirstListItem.mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).toContain("Network error")
  })

  it("handles undefined userId gracefully", async () => {
    const { result } = renderHook(() => useDailyCheckin(undefined))

    expect(result.current.checkInData).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
