'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { createClient, getUser, restoreAuth } from '@/lib/pocketbase/client'

interface AuthGuardProps {
  /** Children receives the authenticated user once ready */
  children: (user: any) => ReactNode
  /** Require admin role (default false) */
  requireAdmin?: boolean
  /** Path to redirect unauthenticated users (default /auth/login) */
  redirectTo?: string
  /** Custom loading skeleton (default: spinner + "LOADING...") */
  skeleton?: ReactNode
  /** Custom unauthorized UI for non-admin users (default: admin access message) */
  unauthorized?: ReactNode
}

/**
 * AuthGuard - Unified authentication wrapper for protected pages.
 *
 * Handles the entire auth lifecycle:
 * 1. Waits for client hydration
 * 2. Attempts auth restoration from localStorage/token
 * 3. Redirects to login if unauthenticated (with redirectTo preserving intent)
 * 4. Checks admin role if `requireAdmin` is true
 * 5. Renders children with the authenticated user
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   {(user) => <Dashboard user={user} />}
 * </AuthGuard>
 * ```
 *
 * @example
 * ```tsx
 * <AuthGuard requireAdmin redirectTo="/auth/login">
 *   {(user) => <AdminPanel user={user} />}
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAdmin = false,
  redirectTo = '/auth/login',
  skeleton,
  unauthorized,
}: AuthGuardProps) {
  const router = useRouter()
  const isHydrated = useIsHydrated()
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  // Step 1: Wait for hydration then attempt auth restoration
  useEffect(() => {
    if (!isHydrated) return

    const pb = createClient()
    restoreAuth(pb).then((success) => {
      if (success) {
        const u = getUser()
        setUser(u)
      }
      setAuthReady(true)
    })
  }, [isHydrated])

  // Step 2: Redirect to login if no user after auth check
  useEffect(() => {
    if (authReady && !user) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [authReady, user, router, redirectTo])

  // Loading state: before hydration or while checking auth
  if (!isHydrated || !authReady) {
    return skeleton ?? (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-medium">LOADING...</p>
        </div>
      </div>
    )
  }

  // Not authenticated — render nothing while redirect happens
  if (!user) return null

  // Admin role check
  if (requireAdmin && !user?.admin) {
    return unauthorized ?? (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <h2 className="text-2xl font-bold text-on-surface">Admin Access Required</h2>
        <p className="text-on-surface-variant">You do not have permission to access this page.</p>
      </div>
    )
  }

  // Render children with the authenticated user
  return <>{children(user)}</>
}
