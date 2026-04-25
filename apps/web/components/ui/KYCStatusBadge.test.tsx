/**
 * Tests for KYCStatusBadge component
 * RED PHASE - Tests will fail until component is implemented
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test"
import { render, screen, waitFor } from "@testing-library/react"
import { KYCStatusBadge } from "./KYCStatusBadge"

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

describe("KYCStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsHydrated.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("Test 1: Shows 'Verified' badge (green, ShieldCheck) when kyc_verified=true", async () => {
    render(<KYCStatusBadge status={{ kyc_verified: true, kyc_required_globally: false, can_withdraw: true }} />)
    expect(screen.getByText("KYC Verified")).toBeInTheDocument()
  })

  it("Test 2: Shows 'KYC Required' badge when required but not verified", async () => {
    render(<KYCStatusBadge status={{ kyc_verified: false, kyc_required_globally: true, can_withdraw: false }} />)
    expect(screen.getByText("KYC Required")).toBeInTheDocument()
  })

  it("Test 3: Shows 'Not Verified' badge when kyc_verified=false and not required", async () => {
    render(<KYCStatusBadge status={{ kyc_verified: false, kyc_required_globally: false, can_withdraw: true }} />)
    expect(screen.getByText("Not Verified")).toBeInTheDocument()
  })

  it("Test 4: Shows 'Not Required' badge when kyc_required_globally=false", async () => {
    render(<KYCStatusBadge status={{ kyc_verified: false, kyc_required_globally: false, can_withdraw: true }} />)
    expect(screen.getByText("Not Verified")).toBeInTheDocument()
  })

  it("Test 5: Hydration-safe — returns null until hydrated", async () => {
    mockUseIsHydrated.mockReturnValue(false)
    const { container } = render(<KYCStatusBadge />)
    expect(container.innerHTML).toBe("")
  })

  it("Test 6: Fetches KYC status on mount when no status prop provided", async () => {
    ;(global.fetch as any) = vi.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            kyc_verified: true,
            kyc_required_globally: false,
            can_withdraw: true,
          },
        }),
      ok: true,
    })

    render(<KYCStatusBadge />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8090/api/v2/kyc-status",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "test-token-abc",
          }),
        })
      )
    })

    expect(screen.getByText("KYC Verified")).toBeInTheDocument()
  })
})