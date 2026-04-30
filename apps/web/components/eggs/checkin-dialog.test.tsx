import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CheckInDialog } from './checkin-dialog'

// Mock useDailyCheckin hook
vi.mock('@/hooks/use-daily-checkin', () => ({
  useDailyCheckin: vi.fn()
}))

import { useDailyCheckin } from '@/hooks/use-daily-checkin'

const mockUseDailyCheckin = useDailyCheckin as ReturnType<typeof vi.fn>

describe('CheckInDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders streak counter with fire emoji', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 14,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 20,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('14d')).toBeTruthy()
  })

  it('shows claim button when canClaim is true', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 10,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn().mockResolvedValue(undefined),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('Claim Daily Reward')).toBeTruthy()
  })

  it('shows countdown when canClaim is false', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-19T08:00:00.000Z',
        checkInCount: 10,
        canClaim: false,
        countdownSeconds: 45045
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '12:30:45'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('12:30:45')).toBeTruthy()
    expect(screen.getByText('Next check-in in:')).toBeTruthy()
  })

  it('calls claimCheckin when claim button clicked', async () => {
    const claimCheckin = vi.fn().mockResolvedValue(undefined)
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 10,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin,
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    fireEvent.click(screen.getByText('Claim Daily Reward'))
    await waitFor(() => {
      expect(claimCheckin).toHaveBeenCalled()
    })
  })

  it('shows loading state during claim', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 10,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: true,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('Claiming...')).toBeTruthy()
  })

  it('displays error message when claim fails', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-19T08:00:00.000Z',
        checkInCount: 10,
        canClaim: false,
        countdownSeconds: 36000
      },
      loading: false,
      error: 'Check-in failed: cooldown active',
      claimCheckin: vi.fn(),
      countdown: '10:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('Check-in failed: cooldown active')).toBeTruthy()
  })

  it('shows 7-day streak bonus badge', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 7,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 15,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText(/7-Day Warrior/)).toBeTruthy()
    expect(screen.getByText(/Next bonus:/)).toBeTruthy()
  })

  it('shows 30-day streak bonus badge', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 30,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 50,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText(/30-Day Master/)).toBeTruthy()
    expect(screen.getByText(/Next bonus:/)).toBeTruthy()
  })

  it('shows total check-ins count', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 5,
        lastCheckIn: '2026-04-18T10:00:00.000Z',
        checkInCount: 42,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText(/Total check-ins:/)).toBeTruthy()
  })

  it('shows reward info section', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 0,
        lastCheckIn: null,
        checkInCount: 0,
        canClaim: true,
        countdownSeconds: 0
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '00:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('Daily Rewards:')).toBeTruthy()
    expect(screen.getByText('• Daily check-in: 1 Food NFT')).toBeTruthy()
    expect(screen.getByText('• 7-day streak: 2 Food NFTs')).toBeTruthy()
    expect(screen.getByText('• 30-day streak: 5 Food NFTs + Special Badge')).toBeTruthy()
  })

  it('shows "Come Back Later" button when cannot claim', () => {
    mockUseDailyCheckin.mockReturnValue({
      checkInData: {
        streak: 3,
        lastCheckIn: '2026-04-19T08:00:00.000Z',
        checkInCount: 8,
        canClaim: false,
        countdownSeconds: 36000
      },
      loading: false,
      error: null,
      claimCheckin: vi.fn(),
      countdown: '10:00:00'
    })

    render(
      <CheckInDialog
        open={true}
        onOpenChange={vi.fn()}
        userId="user123"
        eggId={1}
      />
    )
    expect(screen.getByText('Come Back Later')).toBeTruthy()
  })
})
