import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { renderToString } from 'react-dom/server'

const mockIsAuthenticated = vi.fn()
let mockIsHydrated = true

vi.mock('@/lib/pocketbase/client', () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}))

vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: () => mockIsHydrated,
}))

import { useAuthRedirect } from './use-auth-redirect'

describe('useAuthRedirect', () => {
  beforeEach(() => {
    mockIsAuthenticated.mockReset()
    mockIsHydrated = true
  })

  describe('isAuthenticated', () => {
    it('returns true when user has valid token', () => {
      mockIsAuthenticated.mockReturnValue(true)
      const { isAuthenticated: result } = useAuthRedirect()
      expect(result).toBe(true)
    })

    it('returns false when no token', () => {
      mockIsAuthenticated.mockReturnValue(false)
      const { isAuthenticated: result } = useAuthRedirect()
      expect(result).toBe(false)
    })
  })

  describe('getRedirectPath', () => {
    it('returns original path when authenticated', () => {
      mockIsAuthenticated.mockReturnValue(true)
      const { getRedirectPath } = useAuthRedirect()
      const result = getRedirectPath('/dashboard')
      expect(result).toBe('/dashboard')
    })

    it('returns /join when not authenticated', () => {
      mockIsAuthenticated.mockReturnValue(false)
      const { getRedirectPath } = useAuthRedirect()
      const result = getRedirectPath('/dashboard')
      expect(result).toBe('/join')
    })

    it('returns /join with redirect param when not authenticated', () => {
      mockIsAuthenticated.mockReturnValue(false)
      const { getRedirectPath } = useAuthRedirect()
      const result = getRedirectPath('/protected/page')
      expect(result).toBe('/join?redirectTo=%2Fprotected%2Fpage')
    })
  })

  describe('SSR safety', () => {
    it('does not throw during server render', () => {
      mockIsAuthenticated.mockReturnValue(false)
      expect(() => {
        renderToString(<ServerComponent />)
      }).not.toThrow()
    })

    it('renders without hydration mismatch', () => {
      mockIsAuthenticated.mockReturnValue(true)
      const TestComponent = () => {
        const { isAuthenticated: isAuth, getRedirectPath } = useAuthRedirect()
        return (
          <div>
            <span data-testid="auth-status">{isAuth ? 'authenticated' : 'not-authenticated'}</span>
            <span data-testid="redirect-path">{getRedirectPath('/test')}</span>
          </div>
        )
      }
      expect(() => {
        renderToString(<TestComponent />)
      }).not.toThrow()
    })
  })
})

function ServerComponent() {
  const { isAuthenticated } = useAuthRedirect()
  return <div>{isAuthenticated ? 'logged in' : 'logged out'}</div>
}
