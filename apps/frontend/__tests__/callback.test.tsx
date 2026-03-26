import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import Callback from '../callback'

const mockAuthWithOAuth2Code = vi.fn()

const createMockPocketBase = () => ({
  collection: vi.fn(() => ({
    authWithOAuth2Code: mockAuthWithOAuth2Code
  }))
})

vi.mock('pocketbase', () => ({
  default: function MockPocketBase() {
    return createMockPocketBase()
  }
}))

describe('Callback Component - GREEN Phase (Issue #001)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { search: '', origin: 'http://localhost:3000' },
      writable: true
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})
  })

  test('shows error when error param present (negative path)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?error=ACCESS_DENIED&error_description=user+denied', origin: 'http://localhost:3000' }
    })

    render(<Callback />)
    expect(await screen.findByText('Login Failed')).toBeInTheDocument()
    expect(await screen.findByText(/user denied/)).toBeInTheDocument()
  })

  test('shows error when missing code parameter (validation)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?state=test-state', origin: 'http://localhost:3000' }
    })

    render(<Callback />)
    expect(await screen.findByText('Missing Parameters')).toBeInTheDocument()
  })

  test('shows error on state mismatch (security validation)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?code=test-code&state=mismatch-state', origin: 'http://localhost:3000' }
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return key === 'oauth_state' ? 'stored-state' : null
    })

    render(<Callback />)
    expect(await screen.findByText('State Mismatch')).toBeInTheDocument()
  })

  test('exchanges code successfully on valid state (happy path)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?code=valid-code&state=matching-state', origin: 'http://localhost:3000' }
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return key === 'oauth_state' ? 'matching-state' : 'test-verifier'
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})
    
    mockAuthWithOAuth2Code.mockResolvedValue({
      record: { id: 'user123', email: 'test@example.com' },
      token: 'access-token'
    })

    render(<Callback />)
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
    expect(mockAuthWithOAuth2Code).toHaveBeenCalledWith('test-verifier', 'valid-code', 'test-verifier', 'http://localhost:3000/frontend/callback.html', {})
  })

  test('handles exchange failure gracefully (infrastructure)', async () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?code=invalid-code&state=matching-state', origin: 'http://localhost:3000' }
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return key === 'oauth_state' ? 'matching-state' : 'test-verifier'
    })
    
    mockAuthWithOAuth2Code.mockRejectedValue(new Error('Code expired'))

    render(<Callback />)
    
    await waitFor(() => {
      expect(screen.getByText('Exchange Failed')).toBeInTheDocument()
      expect(screen.getByText(/Code expired/)).toBeInTheDocument()
    })
  })
})
