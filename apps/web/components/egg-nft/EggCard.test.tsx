import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { EggCard } from '../egg-nft/EggCard'

const mockEgg = {
  token_id: 1,
  egg_id: 1001,
  food_count: 2,
  is_hatched: false,
  rarity_seed: 250,
  referral_chain: ['0x1234567890abcdef1234567890abcdef12345678'],
  minted_at: '2026-03-30T00:00:00.000Z'
}

describe('EggCard', () => {
  it('renders egg information correctly', () => {
    render(<EggCard egg={mockEgg} />)
    
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('EPIC')).toBeInTheDocument()
    expect(screen.getByText('2 / 10')).toBeInTheDocument()
  })

  it('shows unhatched status', () => {
    render(<EggCard egg={mockEgg} />)
    
    expect(screen.getByText('UNHATCHED')).toBeInTheDocument()
  })

  it('shows hatched status when egg is hatched', () => {
    const hatchedEgg = { ...mockEgg, is_hatched: true }
    render(<EggCard egg={hatchedEgg} />)
    
    expect(screen.getByText('HATCHED')).toBeInTheDocument()
  })

  it('displays rarity correctly', () => {
    const { rerender } = render(<EggCard egg={mockEgg} />)
    expect(screen.getByText('EPIC')).toBeInTheDocument()

    const legendaryEgg = { ...mockEgg, rarity_seed: 50 }
    rerender(<EggCard egg={legendaryEgg} />)
    expect(screen.getByText('LEGENDARY')).toBeInTheDocument()
  })

  it('can show referral chain', () => {
    render(<EggCard egg={mockEgg} />)
    
    const viewButton = screen.getByText('VIEW REFERRAL CHAIN')
    expect(viewButton).toBeInTheDocument()
  })
})
