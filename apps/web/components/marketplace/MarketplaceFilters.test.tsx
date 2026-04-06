import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarketplaceFilters } from './MarketplaceFilters'
import type { FilterState } from './MarketplaceFilters'

describe('MarketplaceFilters', () => {
  it('renders all filter sections', () => {
    render(<MarketplaceFilters />)
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Sort by')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Rarity')).toBeInTheDocument()
  })

  it('renders type checkboxes (Egg, Food, Animal)', () => {
    render(<MarketplaceFilters />)
    
    expect(screen.getByLabelText(/egg/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/food/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/animal/i)).toBeInTheDocument()
  })

  it('renders rarity checkboxes (Common, Rare, Epic, Legendary)', () => {
    render(<MarketplaceFilters />)
    
    expect(screen.getByLabelText(/common/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rare/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/epic/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/legendary/i)).toBeInTheDocument()
  })

  it('renders sort dropdown with correct options', () => {
    render(<MarketplaceFilters />)
    
    expect(screen.getByText('Select sort option')).toBeInTheDocument()
  })

  it('shows clear filters button only when filters are active', async () => {
    const user = userEvent.setup()
    render(<MarketplaceFilters />)
    
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    
    await user.click(screen.getByLabelText(/egg/i))
    
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('clears all filters when clicking clear button', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<MarketplaceFilters onChange={handleChange} />)
    
    await user.click(screen.getByLabelText(/egg/i))
    await user.click(screen.getByLabelText(/rare/i))
    
    await user.click(screen.getByText('Clear all'))
    
    expect(handleChange).toHaveBeenCalledWith({
      types: [],
      rarities: [],
      sortBy: 'newest',
    })
  })

  it('calls onChange when type filter changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<MarketplaceFilters onChange={handleChange} />)
    
    await user.click(screen.getByLabelText(/egg/i))
    
    expect(handleChange).toHaveBeenCalledWith({
      types: ['Egg'],
      rarities: [],
      sortBy: 'newest',
    })
  })

  it('calls onChange when rarity filter changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<MarketplaceFilters onChange={handleChange} />)
    
    await user.click(screen.getByLabelText(/rare/i))
    
    expect(handleChange).toHaveBeenCalledWith({
      types: [],
      rarities: ['Rare'],
      sortBy: 'newest',
    })
  })

  it('calls onChange when sort option changes', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<MarketplaceFilters onChange={handleChange} />)
    
    const select = screen.getByText('Select sort option')
    await user.click(select)
    
    const priceAsc = screen.getByText('Price: Low to High')
    await user.click(priceAsc)
    
    expect(handleChange).toHaveBeenCalledWith({
      types: [],
      rarities: [],
      sortBy: 'price_asc',
    })
  })

  it('respects initialFilters prop', () => {
    const initialFilters: Partial<FilterState> = {
      types: ['Egg', 'Food'],
      rarities: ['Rare', 'Epic'],
      sortBy: 'price_desc',
    }
    
    render(<MarketplaceFilters initialFilters={initialFilters} />)
    
    expect(screen.getByLabelText(/egg/i)).toHaveAttribute('data-state', 'checked')
    expect(screen.getByLabelText(/food/i)).toHaveAttribute('data-state', 'checked')
    expect(screen.getByLabelText(/rare/i)).toHaveAttribute('data-state', 'checked')
    expect(screen.getByLabelText(/epic/i)).toHaveAttribute('data-state', 'checked')
  })

  it('applies clay styling by default', () => {
    const { container } = render(<MarketplaceFilters />)
    
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('bg-surface-container-low')
    expect(mainDiv).toHaveClass('rounded-clay-md')
    expect(mainDiv).toHaveClass('shadow-clay-lg')
  })
})
