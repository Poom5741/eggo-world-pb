"use client"

import { useIsHydrated } from './use-is-hydrated'
import { isAuthenticated } from '@/lib/pocketbase/client'

export function useAuthRedirect() {
  const isHydrated = useIsHydrated()
  const auth = isHydrated ? isAuthenticated() : false

  const getRedirectPath = (path: string): string => {
    if (auth) return path
    if (path === '/dashboard') return '/join'
    return `/join?redirectTo=${encodeURIComponent(path)}`
  }

  return {
    isAuthenticated: auth,
    getRedirectPath,
  }
}