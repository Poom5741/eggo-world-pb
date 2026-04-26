import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Marketplace pages should be accessible to browse listings without auth
  // Detail page requires auth for purchase but should allow viewing
  // Next.js config has trailingSlash: true, so normalize pathname for comparison
  const publicPaths = ['/', '/join', '/auth/login', '/auth/sign-up', '/auth/sign-up-success', '/auth/error', '/auth/line', '/auth/callback', '/marketplace', '/marketplace/detail']
  // Normalize pathname - remove trailing slash (except for root '/')
  const normalizedPathname = pathname === '/' ? '/' : pathname.replace(/\/$/, '')
  const isPublicPath = publicPaths.includes(normalizedPathname)

  const pbAuth = request.cookies.get('pb_auth')
  const isAuthenticated = !!pbAuth

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url)
    // เพิ่ม redirectTo เพื่อให้ login page redirect กลับหลัง auth สำเร็จ
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && (pathname === '/auth/login' || pathname === '/auth/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}