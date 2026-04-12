'use client'

import Link from 'next/link'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import type { LinkProps } from 'next/link'

interface AuthLinkProps extends Omit<LinkProps, 'ref'> {
  href: string
  children: React.ReactNode
}

function AuthLink({ href, className, ...props }: AuthLinkProps & { className?: string }) {
  const { getRedirectPath } = useAuthRedirect()
  
  const actualHref = getRedirectPath(href)

  return (
    <Link href={actualHref} className={className} {...props}>
      {children}
    </Link>
  )
}

export { AuthLink }
export default AuthLink