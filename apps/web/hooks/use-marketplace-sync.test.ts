import { describe, it, expect } from 'bun:test'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketplaceSync } from './use-marketplace-sync'

// Mock the PocketBase API calls
const mockGetMarketplaceListings = vi.hoisted(() => vi.fn())
const mockGetListingById = vi.hoisted(() => vi.fn())

vi.mock('@/lib/pocketbase/marketplace', () => ({
  getMarketplaceListings: mockGetMarketplaceListings,
  getListingById: mockGetListingById,
}))

describe('useMarketplaceSync - Exponential Backoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ควรเริ่มต้น polling ที่ 30 วินาที', () => {
    mockGetMarketplaceListings.mockResolvedValue([])
    
    const { result } = renderHook(() => useMarketplaceSync())
    
    expect(result.current.currentInterval).toBe(30000)
    expect(result.current.errorCount).toBe(0)
  })

  it('ควรเพิ่ม interval เป็น 2 เท่าเมื่อเกิดข้อผิดพลาด (exponential backoff)', async () => {
    mockGetMarketplaceListings.mockRejectedValue(new Error('Network error'))
    
    const { result } = renderHook(() => useMarketplaceSync({ intervalMs: 30000 }))
    
    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
    
    expect(result.current.errorCount).toBe(1)
    expect(result.current.currentInterval).toBe(60000)
  })

  it('ควร reset interval กลับเป็นปกติเมื่อ fetch สำเร็จ', async () => {
    mockGetMarketplaceListings
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce([])
    
    const { result } = renderHook(() => useMarketplaceSync({ intervalMs: 30000 }))
    
    await waitFor(() => {
      expect(result.current.errorCount).toBeGreaterThan(0)
    })
    
    const intervalAfterErrors = result.current.currentInterval
    expect(intervalAfterErrors).toBeGreaterThan(30000)
    
    await act(async () => {
      vi.advanceTimersByTime(intervalAfterErrors)
    })
    
    await waitFor(() => {
      expect(result.current.errorCount).toBe(0)
    })
    
    expect(result.current.currentInterval).toBe(30000)
  })

  it('ควรไม่เพิ่ม interval เกิน 5 นาที (300000ms)', async () => {
    mockGetMarketplaceListings.mockRejectedValue(new Error('Persistent error'))
    
    const { result } = renderHook(() => useMarketplaceSync({ intervalMs: 30000 }))
    
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        vi.advanceTimersByTime(300000)
      })
    }
    
    expect(result.current.currentInterval).toBeLessThanOrEqual(300000)
    expect(result.current.currentInterval).toBe(300000)
  })

  it('ควรเรียก refresh ด้วยตนเองได้', async () => {
    mockGetMarketplaceListings.mockResolvedValue([])
    
    const { result } = renderHook(() => useMarketplaceSync())
    
    await act(async () => {
      await result.current.refresh()
    })
    
    expect(mockGetMarketplaceListings).toHaveBeenCalledTimes(2)
  })

  it('ควรแสดงสถานะ syncing ระหว่าง refresh', async () => {
    let resolvePromise: (value: any) => void
    const deferredPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockGetMarketplaceListings.mockImplementation(() => deferredPromise)
    
    const { result } = renderHook(() => useMarketplaceSync())
    
    await waitFor(() => {
      expect(result.current.syncing).toBe(true)
    })
    
    act(() => {
      resolvePromise([])
    })
    
    await waitFor(() => {
      expect(result.current.syncing).toBe(false)
    })
  })
})
