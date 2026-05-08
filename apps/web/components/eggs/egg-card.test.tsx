import { describe, it, expect, vi } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EggCard } from './egg-card'
import { EggData } from '@/hooks/use-egg-poll'

const mockEggUnhatched: EggData = {
  id: 'egg1',
  egg_id: 1,
  token_id: '101',
  food_count: 5,
  is_hatched: false,
  rarity_seed: 70,
  element_type: 'FIRE',
  minted_at: '2026-04-19T10:00:00.000Z'
}

const mockEggHatched: EggData = {
  id: 'egg2',
  egg_id: 2,
  token_id: '102',
  food_count: 10,
  is_hatched: true,
  rarity_seed: 90,
  element_type: 'WATER',
  minted_at: '2026-04-19T10:00:00.000Z'
}

describe('EggCard - Play Feature', () => {
  it('renders Play button for unhatched egg with "Play" text', () => {
    const onPlay = vi.fn()
    render(
      <EggCard
        egg={mockEggUnhatched}
        onManage={vi.fn()}
        onPlay={onPlay}
      />
    )
    expect(screen.getByText('Play')).toBeTruthy()
  })

  it('renders Daily Check-In button for hatched egg', () => {
    const onPlay = vi.fn()
    render(
      <EggCard
        egg={mockEggHatched}
        onManage={vi.fn()}
        onPlay={onPlay}
      />
    )
    expect(screen.getByText('Daily Check-In')).toBeTruthy()
  })

  it('Play button has sports_esports Material Symbol icon', () => {
    render(
      <EggCard
        egg={mockEggUnhatched}
        onManage={vi.fn()}
        onPlay={vi.fn()}
      />
    )
    const icon = screen.getByText('sports_esports')
    expect(icon).toBeTruthy()
    expect(icon.className).toContain('material-symbols-outlined')
  })

  it('Play button calls onPlay callback when clicked', () => {
    const onPlay = vi.fn()
    render(
      <EggCard
        egg={mockEggUnhatched}
        onManage={vi.fn()}
        onPlay={onPlay}
      />
    )
    const playButton = screen.getByText('Play')
    fireEvent.click(playButton)
    expect(onPlay).toHaveBeenCalledWith(mockEggUnhatched)
  })

  it('Daily Check-In button calls onPlay callback when clicked', () => {
    const onPlay = vi.fn()
    render(
      <EggCard
        egg={mockEggHatched}
        onManage={vi.fn()}
        onPlay={onPlay}
      />
    )
    const checkInButton = screen.getByText('Daily Check-In')
    fireEvent.click(checkInButton)
    expect(onPlay).toHaveBeenCalledWith(mockEggHatched)
  })

  it('Play button does not render when onPlay prop is not provided', () => {
    render(
      <EggCard
        egg={mockEggUnhatched}
        onManage={vi.fn()}
      />
    )
    expect(screen.queryByText('Play')).toBeNull()
    expect(screen.queryByText('Daily Check-In')).toBeNull()
  })
})
