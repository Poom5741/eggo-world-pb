'use client'

import Link from 'next/link'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import type { LinkProps } from 'next/link'

interface AuthLinkProps extends Omit<LinkProps, 'ref'> {
  href: string
  fallbackHref?: string
  children: React.ReactNode
}

function AuthLink({ href, fallbackHref = '/join', children, className, ...props }: AuthLinkProps) {
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