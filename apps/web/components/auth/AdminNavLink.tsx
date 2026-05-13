'use client'

import Link from 'next/link'
import { useIsHydrated } from '@/hooks/use-is-hydrated'
import { getUser } from '@/lib/pocketbase/client'

export default function AdminNavLink() {
  const isHydrated = useIsHydrated()

  if (!isHydrated) return null

  const user = getUser()
  if (user?.role !== 'admin') return null

  return (
    <Link
      href="/admin/mint"
      className="text-[var(--on-surface-variant)] opacity-60 hover:scale-105 transition-transform active-nav-link"
    >
      Admin
    </Link>
  )
}
