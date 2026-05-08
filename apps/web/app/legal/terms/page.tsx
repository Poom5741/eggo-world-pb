"use client"

import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Card } from '@/components/ui/card'

export default function TermsOfService() {
  return (
    <LayoutWithoutNav>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="p-8 space-y-6">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 1, 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using EggoWorld ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Eligibility</h2>
            <p>You must be at least 18 years old or the age of majority in your jurisdiction to use the Platform. By using the Platform, you represent that you meet these requirements and that your use complies with all applicable laws.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Platform Description</h2>
            <p>EggoWorld is a gamified NFT platform on BNB SmartChain where users can:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Purchase Egg NFTs (25 USDT) which include 2 bonus Food NFTs.</li>
              <li>Purchase Food NFTs (0.50 USDT each) to feed eggs.</li>
              <li>Hatch eggs into Animal NFTs after feeding 10 food items.</li>
              <li>Breed animals to create new generations.</li>
              <li>Trade NFTs on the marketplace.</li>
              <li>Earn USDT commissions through the 4-level MLM referral system.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. USDT & Financial Transactions</h2>
            <p>All platform transactions are denominated in USDT (BEP-20) on BNB SmartChain. You acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>NFT purchases, commissions, and withdrawals are processed on-chain.</li>
              <li>Blockchain transactions are irreversible once confirmed.</li>
              <li>You are responsible for your wallet's security and private keys.</li>
              <li>The Platform does not provide investment advice. NFT values may fluctuate.</li>
              <li>Withdrawals require KYC verification (if applicable in your jurisdiction).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Referral & Commission Program</h2>
            <p>The Platform offers a 4-level MLM commission structure:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>G1 (Direct Referrer): 20% commission on NFT sales.</li>
              <li>G2: 10% commission.</li>
              <li>G3: 10% commission.</li>
              <li>G4: 10% commission.</li>
              <li>The Platform retains 4% as a CoinStor reserve and 46% for operations.</li>
            </ul>
            <p>Self-referral is strictly prohibited and will result in account suspension.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Creating multiple accounts to game the referral system.</li>
              <li>Using automated scripts or bots to interact with the Platform.</li>
              <li>Attempting to exploit smart contract vulnerabilities.</li>
              <li>Money laundering or any illegal activity.</li>
              <li>Market manipulation or wash trading.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Smart Contract Risk</h2>
            <p>Smart contracts have been audited internally. However, smart contract risk is inherent in blockchain applications. You acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Smart contracts may contain undiscovered vulnerabilities.</li>
              <li>The Platform is not liable for losses resulting from smart contract exploits.</li>
              <li>You should not invest more than you can afford to lose.</li>
              <li>NFTs are digital collectibles with no guaranteed monetary value.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
            <p>The Platform is provided "as is" without warranties of any kind. To the maximum extent permitted by law, EggoWorld shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Material changes will be notified via the Platform. Continued use after changes constitutes acceptance of the new terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">10. Governing Law</h2>
            <p>These terms shall be governed by the laws of Thailand. Any disputes shall be resolved through arbitration in accordance with the rules of the Thailand Arbitration Center.</p>
          </section>
        </Card>
      </div>
    </LayoutWithoutNav>
  )
}
