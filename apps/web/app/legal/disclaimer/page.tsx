"use client"

import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Card } from '@/components/ui/card'

export default function Disclaimer() {
  return (
    <LayoutWithoutNav>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="p-8 space-y-6">
          <h1 className="text-3xl font-bold">Legal Disclaimer</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 1, 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Not Financial Advice</h2>
            <p>EggoWorld is a gaming and entertainment platform. NFTs purchased on this platform are digital collectibles and do not represent an investment vehicle, security, or financial instrument. The value of NFTs is determined solely by market supply and demand and may fluctuate significantly. Past performance does not guarantee future results.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. No Guaranteed Returns</h2>
            <p>The MLM referral system provides commissions based on actual NFT sales. There is no guarantee of any specific income or return on investment. Commission rates and structures may change with platform updates.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Regulatory Compliance</h2>
            <p>Users are responsible for ensuring their use of the Platform complies with all applicable laws and regulations in their jurisdiction. Some jurisdictions may classify NFT platforms or MLM systems differently. You should consult with a legal professional if you have concerns about compliance.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Risk Acknowledgement</h2>
            <p>By using the Platform, you acknowledge and accept the following risks:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Smart contract vulnerabilities or exploits.</li>
              <li>Blockchain network congestion or failures.</li>
              <li>Regulatory changes affecting NFT or cryptocurrency markets.</li>
              <li>Market volatility affecting NFT prices.</li>
              <li>Loss of access due to wallet security issues.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Gambling Notice</h2>
            <p>The Platform does not constitute gambling. NFT hatching uses Chainlink VRF for provably random outcomes, but randomness in games does not constitute gambling under most jurisdictions. If you are in a jurisdiction with specific laws about randomized in-game items, please consult legal counsel.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Tax Obligations</h2>
            <p>Users are solely responsible for reporting and paying any applicable taxes on NFT transactions, commissions earned, and other platform activities. EggoWorld does not provide tax advice.</p>
          </section>
        </Card>
      </div>
    </LayoutWithoutNav>
  )
}
