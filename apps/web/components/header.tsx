'use client'

import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 border-b-4 border-primary/30">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/eggoworld-logo.svg"
            alt="EggoWorld Logo"
            width={40}
            height={40}
            loading="eager"
            className="pixelated"
          />
          <span className="font-[var(--font-pixel)] text-primary text-xs md:text-sm tracking-wider">
            EGGOWORLD
          </span>
        </Link>

        {/* Auth Links */}
        <div className="flex items-center gap-3">
          <Link 
            href="/auth/login"
            className="font-[var(--font-pixel)] text-xs text-foreground hover:text-primary px-3 py-2 border-2 border-primary/30 hover:border-primary transition-all"
          >
            LOGIN
          </Link>
          <Link 
            href="/auth/sign-up"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-[var(--font-pixel)] text-xs px-4 py-2 border-2 border-primary transition-all"
          >
            SIGN UP
          </Link>
        </div>
      </div>
    </header>
  )
}
