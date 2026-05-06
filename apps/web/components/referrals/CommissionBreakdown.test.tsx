/**
 * Tests for CommissionBreakdown component
 * 
 * @tests
 * - Renders 4 commission level cards (G1-G4)
 * - Shows correct percentages (20%, 10%, 10%, 10%)
 * - Displays empty state when no referrals
 * - Shows loading skeleton during fetch
 */

import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import { CommissionBreakdown } from './CommissionBreakdown'
import { createClient } from '@/lib/pocketbase/client'

// Mock PocketBase client
vi.mock('@/lib/pocketbase/client', () => ({
  createClient: vi.fn(() => ({
    collection: vi.fn((_name: string) => ({
      getList: vi.fn(),
    })),
  })),
}))

describe('CommissionBreakdown', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('แสดง loading skeleton ระหว่างดึงข้อมูล (shows loading skeleton during fetch)', () => {
    const mockGetList = vi.fn(
      () => new Promise(() => {}) // Never resolves for loading test
    )
    vi.mocked(createClient().collection('').getList).mockImplementation(mockGetList)

    render(<CommissionBreakdown userId={mockUserId} />)

    // ตรวจสอบว่ามี loading state - class animate-pulse อยู่ใน document
    const loadingElements = screen.getAllByRole('generic')
      .filter(el => el.className?.includes('animate-pulse'))
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('แสดง empty state เมื่อไม่มี referral (shows empty state when no referrals)', async () => {
    const mockGetList = vi.fn().mockResolvedValue({ items: [] })
    vi.mocked(createClient().collection('').getList).mockImplementation(mockGetList)

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText(/NO REFERRALS YET/i)).toBeInTheDocument()
      expect(screen.getByText(/Share your referral link/i)).toBeInTheDocument()
    })
  })

  it('แสดง 4 การ์ดพร้อม commission percentages ที่ถูกต้อง (renders 4 cards with correct percentages)', async () => {
    const mockCommissions = {
      items: [
        { level: 1, amount: '20', source_user: 'user1' },
        { level: 1, amount: '30', source_user: 'user2' },
        { level: 2, amount: '10', source_user: 'user3' },
        { level: 3, amount: '10', source_user: 'user4' },
        { level: 4, amount: '10', source_user: 'user5' },
      ],
    }

    const mockGetList = vi.fn().mockResolvedValue(mockCommissions)
    vi.mocked(createClient().collection('').getList).mockImplementation(mockGetList)

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      // ตรวจสอบ level labels
      expect(screen.getByText(/G1/i)).toBeInTheDocument()
      expect(screen.getByText(/G2/i)).toBeInTheDocument()
      expect(screen.getByText(/G3/i)).toBeInTheDocument()
      expect(screen.getByText(/G4/i)).toBeInTheDocument()

      // ตรวจสอบ percentages
      expect(screen.getByText(/20%/i)).toBeInTheDocument()
      expect(screen.getAllByText(/10%/i).length).toBeGreaterThanOrEqual(3)
    })
  })

  it('แสดงจำนวน buddies และยอด earned ที่ถูกต้อง (displays correct buddy count and earned amount)', async () => {
    const mockCommissions = {
      items: [
        { level: 1, amount: '20.50', source_user: 'user1' },
        { level: 1, amount: '30.75', source_user: 'user2' },
        { level: 2, amount: '10.00', source_user: 'user3' },
      ],
    }

    const mockGetList = vi.fn().mockResolvedValue(mockCommissions)
    vi.mocked(createClient().collection('').getList).mockImplementation(mockGetList)

    render(<CommissionBreakdown userId={mockUserId} />)

    await waitFor(() => {
      // G1应该有2个buddies (user1, user2) - G1ควรมี 2 buddies
      expect(screen.getByText(/2 Buddies/i)).toBeInTheDocument()
      // G1 earned = 20.50 + 30.75 = 51.25
      expect(screen.getByText('51.25 USDT')).toBeInTheDocument()
    })
  })
})
