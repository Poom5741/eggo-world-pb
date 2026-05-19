'use client'

import Link from 'next/link'
import { initiateGoogleLogin } from '@/lib/auth/google-oauth'
import { Button } from '@/components/ui/button'

export default function Join() {
  const handleGoogleLogin = async () => {
    const redirectTo = '/dashboard'
    
    try {
      await initiateGoogleLogin({ redirectTo })
    } catch (error) {
      console.error('Google login failed:', error)
    }
  }

  return (
    <div className="bg-surface-container-low min-h-screen flex items-center justify-center p-6 overflow-x-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary-container/20 rounded-full blur-[100px] -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-secondary-container/20 rounded-full blur-[100px] -z-10"></div>
      <div className="fixed top-[20%] right-[10%] w-[15vw] h-[15vw] bg-tertiary-container/10 rounded-full blur-[60px] -z-10"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Branding & Mascot Section */}
        <div className="hidden lg:flex flex-col items-center text-center space-y-8 animate-float">
          <div className="relative group">
            <div className="w-80 h-80 bg-surface-container rounded-xl flex items-center justify-center clay-card relative z-10 overflow-hidden transform group-hover:rotate-3 transition-transform duration-500">
              <img 
                alt="Eggo Mascot" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTKsxMonkbNpda8Z3_V1nA2EUhRpt_Wi6ELvkCgClvZfJw5wNwTE9ZGtHgL1qZqIzFcKgXUuvlrG0fuMOOPmHGeHP12MmzFXTQLBuAvJry0yUaQhoa0_r8_jDCEN7J5c3kUvnGSNW9_g9XSVs8-trJEfwodfFujPQKsVvk3rG_v4Hq927vNEV2oikx9z8YJOsuMpeSqHfKF7QKyPFx0Xup6BhzCC48kzxXydaORKUaRBx_1ixhswo4w2BLZYbWujvA1jYbgrR4Zu3l"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full font-bold text-lg shadow-xl z-20 border-4 border-surface rotate-12">
              Let&apos;s Hatch!
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="pixel-font text-6xl font-black text-on-surface leading-none">EggoWorld</h1>
            <p className="text-on-surface-variant text-xl max-w-sm font-medium mx-auto">
              The world&apos;s first tactile hatchery. Collect, feed, and grow your digital companions.
            </p>
          </div>
        </div>

        {/* Auth Form Section */}
        <div className="flex justify-center">
          <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl w-full max-w-md clay-card relative z-10">
            {/* Form Header */}
            <div className="mb-10 text-center">
              <div className="lg:hidden mb-6 flex justify-center">
                <div className="w-20 h-20 bg-primary-container rounded-lg clay-card flex items-center justify-center p-2">
                  <img 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvO_6FHUyMetthLoDolLqzKoUbbdppeBRLgnjbGEQ1oihulKrrXWJYec0fYs4VWkdyi8WMdq8IAdD8lrB64V5ywsMkWzD2Q5Wj7eQEvfYKFUlYqI9Wg15ZmXEV_ybp_p6MhebWfEDbw_owVeI0qPvfRA6DTTwugsMid3y5fye0Vw4LPhKMulXjbG52YsXfgyNgwPX6h0zJDmMirs4J0UP9N3xPWRrw4EVXygmD4cZiU_4FSF1M0M_CYIpp1wM21_-BnAIRDhS9zJQj"
                  />
                </div>
              </div>
              <h2 className="pixel-font text-4xl font-extrabold text-on-surface mb-2">Welcome Back!</h2>
              <p className="text-on-surface-variant font-medium">Hatch your journey today.</p>
            </div>

            {/* Form Controls */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button 
                  variant="google"
                  size="clay-lg"
                  className="font-headline font-black text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                  onClick={handleGoogleLogin}
                >
                 <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                 Sign in with Google
                </Button>
              </div>

              <p className="text-center text-on-surface-variant text-sm font-medium pt-6">
                By joining, you agree to the <Link href="/coming-soon" aria-disabled="true" className="text-secondary font-bold hover:underline">Hatchery Pact</Link>.
              </p>
            </div>

            {/* Footer Hint */}
            <div className="mt-10 pt-8 flex justify-center gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container shadow-md mb-2">
                  <span className="material-symbols-outlined" aria-hidden="true">egg</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Bonus Egg</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container shadow-md mb-2">
                  <span className="material-symbols-outlined" aria-hidden="true">group</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Community</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container shadow-md mb-2">
                  <span className="material-symbols-outlined" aria-hidden="true">token</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Daily Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge for Help */}
      <button 
        className="fixed bottom-8 right-8 w-16 h-16 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all shadow-xl z-50"
        aria-label="Help"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">help_outline</span>
      </button>
    </div>
  )
}
