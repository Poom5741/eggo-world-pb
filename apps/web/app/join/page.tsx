'use client'

import Link from 'next/link'

export default function Join() {
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
              <button 
                className="line-button w-full h-16 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => {
                  window.location.href = '/auth/line'
                }}
              >
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738s-12 4.369-12 9.738c0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.052.311-.252 1.215 1.086.663 1.338-.553 7.214-4.248 9.843-7.271 1.83-2.023 2.11-3.704 2.11-5.704z"></path>
                </svg>
                Login with LINE
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-outline-variant opacity-30"></div>
                <span className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">or Join</span>
                <div className="h-px flex-1 bg-outline-variant opacity-30"></div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-2">Username</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">person</span>
                    <input 
                      className="w-full h-14 pl-12 bg-surface-container-highest rounded-full border-none focus:ring-4 focus:ring-primary-container transition-all clay-input placeholder:text-on-surface-variant/40 font-medium" 
                      placeholder="Your display name" 
                      type="text"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-2">Referral Code (Optional)</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">confirmation_number</span>
                    <input 
                      className="w-full h-14 pl-12 bg-surface-container-highest rounded-full border-none focus:ring-4 focus:ring-primary-container transition-all clay-input placeholder:text-on-surface-variant/40 font-medium uppercase" 
                      placeholder="Enter code to get bonus eggs" 
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <Link 
                href="/dashboard" 
                className="flex items-center justify-center w-full h-16 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-black text-xl shadow-xl hover:scale-[1.05] active:scale-[0.95] transition-all relative overflow-hidden group"
              >
                <span className="relative z-10">Start Hatching</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              <p className="text-center text-on-surface-variant text-sm font-medium">
                By joining, you agree to the <Link href="#" className="text-secondary font-bold hover:underline">Hatchery Pact</Link>.
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
        className="fixed bottom-8 right-8 w-16 h-16 bg-surface-container-highest rounded-full clay-card flex items-center justify-center text-primary hover:scale-110 active:scale-90 transition-all z-50"
        aria-label="Help"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">help_outline</span>
      </button>
    </div>
  )
}
