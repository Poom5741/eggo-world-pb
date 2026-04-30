import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketplaceSync } from './use-marketplace-sync'

vi.mock('@/lib/pocketbase/marketplace', () => ({
  getMarketplaceListings: vi.fn(),
  getListingById: vi.fn(),
}))

import { getMarketplaceListings } from '@/lib/pocketbase/marketplace'
const mockGetMarketplaceListings = getMarketplaceListings as ReturnType<typeof vi.fn>

describe('useMarketplaceSync - Exponential Backoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default 30s interval and zero errors', async () => {
    mockGetMarketplaceListings.mockResolvedValue([])

    const { result } = renderHook(() => useMarketplaceSync())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.currentInterval).toBe(30000)
    expect(result.current.errorCount).toBe(0)
  })

  it('sets error state when fetch fails', async () => {
    mockGetMarketplaceListings.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useMarketplaceSync())

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  it('allows manual refresh', async () => {
    mockGetMarketplaceListings.mockResolvedValue([])

    const { result } = renderHook(() => useMarketplaceSync())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockGetMarketplaceListings).toHaveBeenCalledTimes(2)
  })
})
