'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from './use-is-hydrated'
import { createClient } from '@/lib/pocketbase/client'

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: any | null
  token: string | null
}

/**
 * useAuth - Centralized authentication state management
 * 
 * Handles the race condition between client hydration and auth token restoration
 * from localStorage. Uses pb.authStore.onChange() to catch async auth updates.
 * 
 * @returns Auth state with loading, authenticated, user, and token
 * 
 * @example
 * ```tsx
 * const { isLoading, isAuthenticated, user, token } = useAuth()
 * 
 * if (isLoading) return <Loading />
 * if (!isAuthenticated) return <LoginRedirect />
 * return <Dashboard user={user} />
 * ```
 */
export function useAuth(): AuthState {
  const isHydrated = useIsHydrated()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  })

  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()

    const checkAuth = () => {
      const token = pb.authStore.token
      const isValid = pb.authStore.isValid
      const user = pb.authStore.record

      if (token && isValid && user) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          token,
        })
        return true
      }
      return false
    }

    // Try immediate check
    if (checkAuth()) return

    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (token && model) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: model,
          token,
        })
        unsubscribe?.()
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        })
      }
    })

    const timeout = setTimeout(() => {
      if (state.isLoading) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
        })
      }
    }, 2000)

    return () => {
      clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [isHydrated, state.isLoading])

  return state
}

export function useRequireAuth(redirectTo: string = '/auth/login') {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo)
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo])

  return auth
}
