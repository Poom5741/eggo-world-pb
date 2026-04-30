import { describe, it, expect, vi, beforeEach } from 'bun:test'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateListingDialog } from './CreateListingDialog'

// Mock PocketBase client
vi.mock('@/lib/pocketbase/client', () => ({
  createClient: vi.fn(() => ({
    authStore: { token: 'mock-token' },
  })),
}))

describe('CreateListingDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    nftName: 'Test Egg',
    nftType: 'Egg' as const,
    tokenId: '123',
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('opens with NFT details pre-filled', () => {
    render(<CreateListingDialog {...mockProps} />)

    expect(screen.getByText('Test Egg')).toBeInTheDocument()
    expect(screen.getByText('EGG')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Create Listing/i })).toBeInTheDocument()
  })

  it('validates minimum price by NFT type', () => {
    render(<CreateListingDialog {...mockProps} />)

    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButtons = screen.getAllByText('Create Listing')
    const createButton = createButtons[createButtons.length - 1]

    fireEvent.change(priceInput, { target: { value: '0.5' } })
    expect(createButton).toBeDisabled()

    fireEvent.change(priceInput, { target: { value: '1' } })
    expect(createButton).not.toBeDisabled()
  })

  it('calls PocketBase API to create listing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    global.fetch = mockFetch

    render(<CreateListingDialog {...mockProps} />)

    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButtons = screen.getAllByText('Create Listing')
    const createButton = createButtons[createButtons.length - 1]

    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const callUrl = mockFetch.mock.calls[0][0]
    expect(callUrl).toContain('/api/v2/list-animal')
  })

  it('shows success state after listing created', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<CreateListingDialog {...mockProps} />)

    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButtons = screen.getAllByText('Create Listing')
    const createButton = createButtons[createButtons.length - 1]

    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled()
    })

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error state when API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Insufficient balance' },
      }),
    })

    render(<CreateListingDialog {...mockProps} />)

    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButtons = screen.getAllByText('Create Listing')
    const createButton = createButtons[createButtons.length - 1]

    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during listing creation', async () => {
    let resolvePromise: (value: any) => void
    const deferredPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    global.fetch = vi.fn().mockImplementation(() => deferredPromise)

    render(<CreateListingDialog {...mockProps} />)

    const priceInput = screen.getByPlaceholderText(/Min 1/i)
    const createButtons = screen.getAllByText('Create Listing')
    const createButton = createButtons[createButtons.length - 1]

    fireEvent.change(priceInput, { target: { value: '100' } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Creating Listing...')).toBeInTheDocument()
    })
  })
})
