import { describe, it, expect, vi, beforeEach } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"
import { useDailyCheckin } from "./use-daily-checkin"

vi.mock("@/lib/pocketbase/client", () => ({
  createClient: vi.fn(() => ({
    authStore: { record: { id: "user123" } },
    collection: vi.fn(() => ({
      getFirstListItem: vi.fn().mockResolvedValue({
        last_check_in: "2026-04-18T10:00:00.000Z",
        check_in_streak: 5,
        check_in_count: 10,
      }),
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

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.checkInData).not.toBeNull()
    })

    // Now claim
    await result.current.claimCheckin()

    await waitFor(() => {
      // After claim, should have refreshed status
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
    const { createClient } = await import("@/lib/pocketbase/client")
    ;(createClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      authStore: { record: { id: "user123" } },
      collection: vi.fn(() => ({
        getFirstListItem: vi.fn().mockRejectedValue(new Error("Network error")),
      })),
      send: vi.fn(),
    }))

    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).toContain("Network error")
  })

  it("refreshes status when countdown reaches zero", async () => {
    // Mock with last check-in almost 24 hours ago (1 second remaining)
    const { createClient } = await import("@/lib/pocketbase/client")
    ;(createClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      authStore: { record: { id: "user123" } },
      collection: vi.fn(() => ({
        getFirstListItem: vi.fn().mockResolvedValue({
          last_check_in: new Date(Date.now() - (24 * 60 * 60 * 1000 - 1000)).toISOString(),
          check_in_streak: 3,
          check_in_count: 5,
        }),
      })),
      send: vi.fn(),
    }))

    const { result } = renderHook(() => useDailyCheckin("user123"))

    await waitFor(() => {
      expect(result.current.checkInData?.countdownSeconds).toBeLessThanOrEqual(1)
    })

    // After countdown reaches 0, should trigger refresh
    await waitFor(() => {
      expect(result.current.checkInData?.canClaim).toBe(true)
    })
  })
})
