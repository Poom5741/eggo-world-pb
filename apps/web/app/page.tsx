import Link from 'next/link'
import TopNav from '@/components/TopNav'
import BottomNavMobile from '@/components/BottomNavMobile'

export default function Home() {
  return (
    <>
      <TopNav />
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container opacity-20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-tertiary-container opacity-20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-secondary-container opacity-15 rounded-full blur-[80px]"></div>
      </div>

      <main className="pt-20 pb-24 lg:pb-0">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto overflow-hidden">
          <div className="lg:w-1/2 space-y-8 z-10 text-center lg:text-left">
            <div className="inline-block px-6 py-2 bg-tertiary-container text-on-tertiary-container rounded-full font-bold text-sm tracking-widest uppercase">
              Season 1: Genesis
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-on-surface leading-tight tracking-tighter">
              HATCH YOUR <span className="text-primary italic">DESTINY.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-lg mx-auto lg:mx-0">
              Welcome to EggoWorld, where pixels meet clay. Collect food, feed your Eggos, and watch them evolve into legendary digital companions.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <Link href="/join" className="clay-btn bg-primary-container text-on-primary-container px-10 py-5 rounded-[2rem] font-headline font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                Join the EggoWorld
              </Link>
              <Link href="/marketplace" className="px-10 py-5 rounded-[2rem] font-headline font-bold text-lg hover:bg-surface-container-low transition-colors">
                View Marketplace
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 relative mt-16 lg:mt-0">
            <div className="relative w-full aspect-square max-w-lg mx-auto bg-surface-container-highest rounded-full shadow-[inset_0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center p-8">
              <img 
                alt="Giant Mascot Egg" 
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(119,99,0,0.4)] animate-float" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIyPc9E9hhRj6Naem1md-_SjAlnWv3C9t9Jd1ptVysafOeZMyE_DVEnm59Uwf0ktgCkWuUNv03y60br8lIo1qaWcOgDm_PqFCVCCtr-M2rGRlk7s7EgGaYs14WJecmxGBdeRzV8JXCLmUPxR7rPWXVLhcFrK1D4sb5xnisNibPTfReqZA4s2lMTPjYO0K6qgxPBoDWQ_RG5brJU4xgaZh_XLPWlpT0tB4cFOLwn5Fs6zyzEqDRDJQV4vyxAZDG57JdfzAoWRe2I75Y"
              />
              <div className="absolute -top-10 -right-10 bg-secondary-container p-6 rounded-[2rem] shadow-xl transform rotate-12">
                <span className="material-symbols-outlined text-4xl text-on-secondary-container" style={{fontVariationSettings: "'FILL' 1"}}>egg</span>
              </div>
              <div className="absolute bottom-4 -left-12 bg-tertiary-container p-6 rounded-[2rem] shadow-xl transform -rotate-12">
                <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{fontVariationSettings: "'FILL' 1"}}>restaurant</span>
              </div>
            </div>
          </div>
        </section>

        {/* NFT Showcase Bento */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-on-surface">Genesis Collection</h2>
                <p className="text-on-surface-variant max-w-md">Discover the first wave of Eggo elements and rare food clusters.</p>
              </div>
              <button className="bg-[var(--surface-container-highest)] px-8 py-3 rounded-full font-bold shadow-md hover:shadow-xl transition-all">Explore All NFTs</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 bg-surface p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-between group overflow-hidden">
                <div className="relative">
                  <img alt="Egg NFT" className="w-full h-64 object-contain group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ6frJgjpBlqFXuzYqunCrkcnnHrIj8Ukva6o2cTE8neIItCV4J28vaz5wEainQmW6P8zOBRIbMUWGcG0GU-hCSgLLEMDyp5D46yUinWRHGU-58MzD8mNrdTrgE01MmAKgbjfXw9g3CyiDxduwTVuRrACp3LfETkA_Xt-qILRZZkr2WRGm5QvcXkezcmsOOdRFaH4e2ZDnQOOcXiy-qUkSw7tu2t3ZSzJeNsnF6ENfsH1dxBSCXa_8KGNzuKneq7mcu1IDz7g84S1i"/>
                  <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 rounded-full text-sm font-bold">LEGENDARY</div>
                </div>
                <div className="pt-8">
                  <h3 className="text-2xl font-black">Sun-Kissed Shell #042</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-headline font-bold">1.24 ETH</span>
                    <button className="material-symbols-outlined bg-surface-container-highest p-3 rounded-full" aria-label="Add to cart">shopping_cart</button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-high p-6 rounded-[2rem] shadow-md flex flex-col">
                <img alt="Food NFT" className="w-full h-40 object-contain mb-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlvVtHt4eUTbKPHMQoGhwRSQ3sWTS9tLRrnGkXHZzP8ua7kOspxfb0vdtYBee9aBKKEnPrxFVcxrrlZoPFcSBn4PWwcDwB7Dqs2dv9fTDfNnyZGuHjBY5UiCrjCUDPiIvtPop6q5ZpYU8ZI_I9cckwwhagVO08ZwnXZ04y3Jn6K0uDLMrLX_E20U591_Ctp1nTwNcaqLt6leMfC0nlKlQAQxPwiQDKER0h9UqKo9t6HAeit3rto07WagYZQjjWz_OipXEYhjlrHxv9"/>
                <h3 className="font-black text-lg">Berry Boost Pack</h3>
                <p className="text-sm text-on-surface-variant mt-2">+25 Energy</p>
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="font-bold">0.05 ETH</span>
                  <button className="text-primary font-bold">Buy Now</button>
                </div>
              </div>

              <div className="bg-surface-container-high p-6 rounded-[2rem] shadow-md flex flex-col">
                <img alt="Food NFT" className="w-full h-40 object-contain mb-4 filter hue-rotate-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7DaaxzvQiGkXTawQJCzTuM3HIzGknVUd_qRkNsikAm83DjzxVgljUgw5wqFznjCCmqbiEvsQi5YgdO_01U0etn3BDhlWcreGmRZCk5YbpGuRWk9ejLaiD9aWtO-eHugQyTIBHKeVT40HoGZv79cESweBYhzoQBZMt_JmSMDQzByVqSzU1W4WEqb9olbKTuCHYbfWhX2TcVmkjR3xEMK8vHpAvGiQlkBrFgLyb9PajFPLxcGO1XK9lOhnX9vMirOWnUxPWpzHlykR2"/>
                <h3 className="font-black text-lg">Blue Honey Core</h3>
                <p className="text-sm text-on-surface-variant mt-2">+50 Vitality</p>
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="font-bold">0.12 ETH</span>
                  <button className="text-primary font-bold">Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">How To Eggo</h2>
            <p className="text-on-surface-variant">Simple steps to master the EggoWorld ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-surface-container z-0 -translate-y-12"></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-primary-container rounded-[2rem] shadow-xl flex items-center justify-center transform hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-4xl text-on-primary-container" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">shopping_bag</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">Buy Egg</h3>
                <p className="text-on-surface-variant text-sm mt-2">Acquire your first Genesis Egg from the marketplace.</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-secondary-container rounded-[2rem] shadow-xl flex items-center justify-center transform hover:-rotate-6 transition-transform">
                <span className="material-symbols-outlined text-4xl text-on-secondary-container" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">restaurant</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">Collect Food</h3>
                <p className="text-on-surface-variant text-sm mt-2">Complete daily quests to find high-energy snacks.</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-tertiary-container rounded-[2rem] shadow-xl flex items-center justify-center transform hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">volunteer_activism</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">Feed</h3>
                <p className="text-on-surface-variant text-sm mt-2">Keep your Eggo full to unlock growth potential.</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-[var(--secondary)] rounded-[2rem] shadow-xl flex items-center justify-center transform hover:-rotate-6 transition-transform">
                <span className="material-symbols-outlined text-4xl text-[var(--on-secondary)]" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">auto_awesome</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-on-surface">Hatch</h3>
                <p className="text-on-surface-variant text-sm mt-2">Unlock a unique 3D creature with rare traits.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features & Community */}
        <section className="py-24 px-6 bg-surface-container-highest">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/2 bg-[var(--surface)] p-12 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container opacity-20 rounded-bl-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-6">
                <span className="material-symbols-outlined text-5xl text-secondary" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">group_add</span>
                <h2 className="text-4xl font-black">Referral Benefits</h2>
                <p className="text-lg text-on-surface-variant">Invite your friends to the nest. For every new hatchling, you earn 5% of their marketplace activity and exclusive &quot;Golden Omelette&quot; badges.</p>
                <button className="bg-secondary text-on-secondary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">Copy Invite Link</button>
              </div>
            </div>

            <div className="lg:w-1/2 bg-[var(--surface)] p-12 rounded-[2rem] shadow-xl border-4 border-dashed border-[var(--border)] relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <span className="material-symbols-outlined text-5xl text-tertiary" style={{fontVariationSettings: "'FILL' 1"}} aria-hidden="true">event</span>
                <h2 className="text-4xl font-black">Community Events</h2>
                <p className="text-lg text-on-surface-variant">Join weekly Raids and Hatching Parties. Compete for the title of &quot;Master Breeder&quot; and win limited edition food drops.</p>
                <div className="flex items-center space-x-[-12px]">
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-primary-container flex items-center justify-center font-bold z-10">JD</div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-secondary-container flex items-center justify-center font-bold z-20">SK</div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-tertiary-container flex items-center justify-center font-bold z-30">LM</div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-surface-container-highest flex items-center justify-center text-xs font-bold z-40">+542</div>
                  <span className="ml-6 text-sm font-bold text-on-surface-variant">Active right now</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto bg-primary p-16 rounded-[2rem] shadow-[0_40px_100px_rgba(119,99,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/60-lines.png')"}}></div>
            <div className="relative z-10 space-y-8">
              <h2 className="text-5xl md:text-7xl font-black text-on-primary">READY TO HATCH?</h2>
              <p className="text-[var(--on-surface)]/70 text-xl max-w-xl mx-auto">Join thousands of collectors in the most vibrant pet ecosystem on the blockchain.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button className="bg-white text-primary px-12 py-5 rounded-[2rem] font-headline font-black text-2xl shadow-2xl hover:scale-105 transition-transform">
                  Join Discord
                </button>
                <button className="bg-[var(--secondary)] text-[var(--on-secondary)] px-12 py-5 rounded-[2rem] font-headline font-black text-2xl border-2 border-[var(--foreground)]/20 hover:bg-[var(--secondary-container)] transition-colors">
                  Hatch Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--surface-container-low)] pt-20 pb-32 lg:pb-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-[var(--border)]/20 pb-12">
            <div className="space-y-6">
              <div className="text-3xl font-black italic text-[var(--on-surface)] font-headline">EggoWorld</div>
              <p className="text-on-surface-variant">The future of pet gaming, built with love and clay.</p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-[2rem] hover:bg-primary-container transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" aria-hidden="true">share</span>
                </div>
                <div className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-[2rem] hover:bg-primary-container transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" aria-hidden="true">forum</span>
                </div>
                <div className="w-10 h-10 bg-surface-container flex items-center justify-center rounded-[2rem] hover:bg-primary-container transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" aria-hidden="true">public</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-6">Market</h4>
              <ul className="space-y-4 text-on-surface-variant">
                <li><Link href="/eggs" className="hover:text-primary">All Eggs</Link></li>
                <li><Link href="/marketplace" className="hover:text-primary">Food Packs</Link></li>
                <li><Link href="#" className="hover:text-primary">Artifacts</Link></li>
                <li><Link href="#" className="hover:text-primary">Sell Items</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6">Resources</h4>
              <ul className="space-y-4 text-on-surface-variant">
                <li><Link href="#" className="hover:text-primary">Documentation</Link></li>
                <li><Link href="#" className="hover:text-primary">Hatching Guide</Link></li>
                <li><Link href="#" className="hover:text-primary">Tokenomics</Link></li>
                <li><Link href="#" className="hover:text-primary">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-6">Newsletter</h4>
              <p className="text-sm text-on-surface-variant mb-4">Get the latest egg-straordinary updates.</p>
              <div className="flex bg-surface-container-high rounded-[2rem] p-1">
                <input className="bg-transparent border-none focus:ring-0 text-sm flex-grow px-4" placeholder="Email address" type="email"/>
                <button className="bg-primary text-on-primary p-2 rounded-md material-symbols-outlined" aria-label="Send newsletter signup">send</button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-8 flex flex-col md:flex-row justify-between items-center text-sm text-on-surface-variant/60">
            <p>© 2024 EggoWorld Labs. All rights reserved.</p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </main>
      
      <BottomNavMobile />
    </>
  )
}
