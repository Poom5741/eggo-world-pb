import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/auth/login', '/auth/sign-up', '/auth/sign-up-success', '/auth/error', '/auth/line', '/auth/callback']
  const isPublicPath = publicPaths.includes(pathname)

  const pbAuth = request.cookies.get('pb_auth')
  const isAuthenticated = !!pbAuth

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthenticated && (pathname === '/auth/login' || pathname === '/auth/sign-up')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}