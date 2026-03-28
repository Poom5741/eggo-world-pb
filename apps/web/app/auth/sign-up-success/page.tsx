import Link from 'next/link'
import Image from 'next/image'

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border-4 border-primary/50 p-8 space-y-6 text-center">
          {/* Logo */}
          <Image
            src="/eggoworld-logo.svg"
            alt="EggoWorld"
            width={64}
            height={64}
            loading="eager"
            className="mx-auto pixelated"
          />

          {/* Title */}
          <div className="space-y-2">
            <h1 className="font-[var(--font-pixel)] text-xl text-primary">
              CHECK YOUR EMAIL
            </h1>
            <p className="font-[var(--font-pixel)] text-xs text-muted-foreground">
              ACCOUNT CREATED SUCCESSFULLY
            </p>
          </div>

          {/* Message */}
          <div className="bg-secondary/30 border-2 border-primary/30 p-4">
            <p className="font-[var(--font-pixel)] text-[10px] text-foreground leading-relaxed">
              WE SENT A CONFIRMATION LINK TO YOUR EMAIL. PLEASE CHECK YOUR INBOX AND CLICK THE LINK TO ACTIVATE YOUR ACCOUNT.
            </p>
          </div>

          {/* Back to Login */}
          <Link 
            href="/auth/login"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-[var(--font-pixel)] text-xs px-6 py-3 border-2 border-primary transition-all"
          >
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    </div>
  )
}
