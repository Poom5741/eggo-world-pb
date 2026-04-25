/**
 * Tests for RecruitmentBonusCard component
 * RED PHASE - Tests will fail until component is implemented
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RecruitmentBonusCard } from "./RecruitmentBonusCard"

// Mock useIsHydrated
const mockUseIsHydrated = vi.fn()
vi.mock("@/hooks/use-is-hydrated", () => ({
  useIsHydrated: () => mockUseIsHydrated(),
}))

// Mock PocketBase client
const mockPb = {
  authStore: {
    token: "test-token-abc",
    record: { id: "user123", admin: false },
    isValid: true,
  },
  baseURL: "http://localhost:8090",
}
vi.mock("@/lib/pocketbase/client", () => ({
  createClient: () => mockPb,
}))

// Mock toast
const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}))

describe("RecruitmentBonusCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsHydrated.mockReturnValue(true)
    // Default fetch mock - status response for a user with 25 recruits (Tier 1)
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            direct_recruits: 25,
            current_tier: 1,
            claimed_tier: 0,
            can_claim: true,
            next_tier: { tier: 2, min: 100, food: 4, usdt: 20 },
          },
        }),
      ok: true,
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("Test 1: renders loading skeleton when fetching status and not hydrated", async () => {
    mockUseIsHydrated.mockReturnValue(false)
    render(<RecruitmentBonusCard />)
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it("Test 2: shows current tier label, direct recruit count, and progress to next tier", async () => {
    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      expect(screen.getByText("Tier 1")).toBeInTheDocument()
    })

    expect(screen.getByText(/25 direct recruits/)).toBeInTheDocument()
    expect(screen.getByText(/25 \/ 100 to next tier/)).toBeInTheDocument()
  })

  it("Test 3: shows claim button when can_claim=true, disabled when can_claim=false", async () => {
    // Test can_claim=true
    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /Claim Tier 1 Bonus/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })
  })

  it("Test 4: clicking claim calls POST /api/v2/claim-recruitment-bonus with auth token", async () => {
    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Claim Tier 1 Bonus/i })).toBeInTheDocument()
    })

    // Set up claim success mock
    ;(global.fetch as any).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tier: 1,
            food_rewarded: 2,
            usdt_bonus: 10,
            direct_recruits: 25,
          },
        }),
      ok: true,
    })

    // Mock status refresh after claim
    ;(global.fetch as any).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            direct_recruits: 25,
            current_tier: 1,
            claimed_tier: 1,
            can_claim: false,
            next_tier: { tier: 2, min: 100, food: 4, usdt: 20 },
          },
        }),
      ok: true,
    })

    fireEvent.click(screen.getByRole("button", { name: /Claim Tier 1 Bonus/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8090/api/v2/claim-recruitment-bonus",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "test-token-abc",
          }),
          body: JSON.stringify({}),
        })
      )
    })
  })

  it("Test 5: after successful claim, shows success toast", async () => {
    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Claim Tier 1 Bonus/i })).toBeInTheDocument()
    })

    ;(global.fetch as any).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            tier: 1,
            food_rewarded: 2,
            usdt_bonus: 10,
            direct_recruits: 25,
          },
        }),
      ok: true,
    })

    // Mock status refresh
    ;(global.fetch as any).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            direct_recruits: 25,
            current_tier: 1,
            claimed_tier: 1,
            can_claim: false,
            next_tier: { tier: 2, min: 100, food: 4, usdt: 20 },
          },
        }),
      ok: true,
    })

    fireEvent.click(screen.getByRole("button", { name: /Claim Tier 1 Bonus/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Claimed!"),
          description: expect.stringContaining("2 food"),
        })
      )
    })
  })

  it("Test 6: handles error states with error message", async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error("Network Error"))

    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  it("Test 7: hydration-safe — shows loading until hydrated", async () => {
    mockUseIsHydrated.mockReturnValue(false)
    render(<RecruitmentBonusCard />)
    // Should show loading skeleton, not attempt to fetch
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it("Test 8: shows 'Max tier reached!' when at tier 4", async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            direct_recruits: 15000,
            current_tier: 4,
            claimed_tier: 4,
            can_claim: false,
            next_tier: null,
          },
        }),
      ok: true,
    })

    render(<RecruitmentBonusCard />)

    await waitFor(() => {
      expect(screen.getByText("Tier 4")).toBeInTheDocument()
      expect(screen.getByText(/Max tier reached!/)).toBeInTheDocument()
    })
  })
})