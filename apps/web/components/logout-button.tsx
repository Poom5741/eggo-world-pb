'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-[var(--font-pixel)] text-xs px-4 py-2 border-2 border-primary/30 transition-colors"
    >
      LOGOUT
    </button>
  )
}
