import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AuthFlow } from '../components/auth-flow'
import { PocketBaseProvider } from '../lib/pocketbase-provider'

const createMockPocketBase = (overrides = {}) => ({
  authStore: { isValid: false, record: null, clear: vi.fn() },
  collection: vi.fn(() => ({
    listAuthMethods: vi.fn(),
    authWithOAuth2Code: vi.fn()
  })),
  ...overrides
})

describe('AuthFlow Component - GREEN Phase (Issue #001)', () => {
  let mockPocketBase

  beforeEach(() => {
    mockPocketBase = createMockPocketBase()
  })

  test('renders LINE login button on mount (happy path)', async () => {
    mockPocketBase.collection.mockReturnValue({
      listAuthMethods: vi.fn().mockResolvedValue({
        oauth2: { 
          providers: [{ 
            name: 'line', 
            displayName: 'LINE', 
            authURL: 'http://localhost:8090/api/oauth2-auth/line/', 
            state: 'test-state', 
            codeVerifier: 'test-verifier' 
          }] 
        }
      })
    })

    render(
      <PocketBaseProvider value={mockPocketBase}>
        <AuthFlow />
      </PocketBaseProvider>
    )

    expect(await screen.findByText('Login with LINE')).toBeInTheDocument()
  })

  test('shows error when OIDC providers fail to load (negative path)', async () => {
    mockPocketBase.collection.mockReturnValue({
      listAuthMethods: vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    })

    render(
      <PocketBaseProvider value={mockPocketBase}>
        <AuthFlow />
      </PocketBaseProvider>
    )

    expect(await screen.findByText('Failed to fetch')).toBeInTheDocument()
  })

  test('stores oauth_state and oauth_code_verifier on button click', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    mockPocketBase.collection.mockReturnValue({
      listAuthMethods: vi.fn().mockResolvedValue({
        oauth2: { 
          providers: [{ 
            name: 'oidc', 
            displayName: 'LINE', 
            authURL: 'http://localhost:8090/api/oauth2-auth/oidc/', 
            state: 'test-state-123', 
            codeVerifier: 'test-verifier-456' 
          }] 
        }
      })
    })

    render(
      <PocketBaseProvider value={mockPocketBase}>
        <AuthFlow />
      </PocketBaseProvider>
    )

    const loginButton = await screen.findByText('Login with LINE')
    fireEvent.click(loginButton)

    expect(setItemSpy).toHaveBeenCalledWith('oauth_state', 'test-state-123')
    expect(setItemSpy).toHaveBeenCalledWith('oauth_code_verifier', 'test-verifier-456')
    expect(setItemSpy).toHaveBeenCalledWith('oauth_provider', 'oidc')
  })

  test('redirects to OIDC authorization URL on login click', async () => {
    const originalLocation = window.location
    delete window.location
    window.location = { ...originalLocation, href: '' }
    
    mockPocketBase.collection.mockReturnValue({
      listAuthMethods: vi.fn().mockResolvedValue({
        oauth2: { 
          providers: [{ 
            name: 'oidc', 
            displayName: 'LINE', 
            authURL: 'http://localhost:8090/api/oauth2-auth/oidc/', 
            state: 'test-state-123', 
            codeVerifier: 'test-verifier-456' 
          }] 
        }
      })
    })

    render(
      <PocketBaseProvider value={mockPocketBase}>
        <AuthFlow />
      </PocketBaseProvider>
    )

    const loginButton = await screen.findByText('Login with LINE')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(window.location.href).toContain('http://localhost:8090/api/oauth2-auth/oidc/')
    })
  })

  test('handles callback exchange failure gracefully', async () => {
    mockPocketBase.collection.mockReturnValue({
      listAuthMethods: vi.fn().mockResolvedValue({
        oauth2: { 
          providers: [{ 
            name: 'oidc', 
            displayName: 'LINE', 
            authURL: 'http://localhost:8090/api/oauth2-auth/oidc/', 
            state: 'test-state', 
            codeVerifier: 'test-verifier' 
          }] 
        }
      }),
      authWithOAuth2Code: vi.fn().mockRejectedValue(new Error('Invalid code'))
    })

    render(
      <PocketBaseProvider value={mockPocketBase}>
        <AuthFlow />
      </PocketBaseProvider>
    )

    const loginButton = await screen.findByText('Login with LINE')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(window.location.href).toContain('http://localhost:8090/api/oauth2-auth/oidc/')
    })
  })
})
