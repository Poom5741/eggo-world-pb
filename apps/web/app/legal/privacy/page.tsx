"use client"

import LayoutWithoutNav from '@/components/LayoutWithoutNav'
import { Card } from '@/components/ui/card'

export default function PrivacyPolicy() {
  return (
    <LayoutWithoutNav>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="p-8 space-y-6">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: May 1, 2026</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>When you use EggoWorld, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Email address, LINE user ID, display name, and avatar (when you register via LINE OAuth).</li>
              <li><strong>Wallet Information:</strong> Your EVM wallet address, encrypted private keys (stored securely — we never see your raw private key), and USDT transaction history.</li>
              <li><strong>Usage Data:</strong> NFT ownership, breeding activity, referral relationships, commission history, and platform interactions.</li>
              <li><strong>Device Data:</strong> Browser type, IP address, and device identifiers for security and analytics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain the EggoWorld platform (NFT minting, breeding, marketplace transactions).</li>
              <li>To calculate and distribute MLM referral commissions.</li>
              <li>To verify KYC compliance for USDT withdrawals.</li>
              <li>To prevent fraud, abuse, and unauthorized access.</li>
              <li>To comply with legal obligations and regulatory requirements.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Data Storage & Security</h2>
            <p>Your wallet private keys are encrypted using AES-256-GCM with a master key stored separately from the database. We employ industry-standard security measures including TLS encryption, rate limiting, and access controls.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Blockchain Data</h2>
            <p>Transactions on the BNB SmartChain (BSC) are public and permanently recorded on the blockchain. Your wallet address and on-chain activity are visible to anyone. This is inherent to blockchain technology and cannot be reversed.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>LINE Corporation:</strong> LINE OAuth for authentication.</li>
              <li><strong>Chainlink:</strong> VRF for provably random NFT hatching.</li>
              <li><strong>BNB SmartChain:</strong> Blockchain infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data held by the platform.</li>
              <li>Request deletion of your account and associated data (subject to blockchain immutability).</li>
              <li>Withdraw consent for data processing.</li>
              <li>Export your transaction history.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Contact</h2>
            <p>For privacy-related inquiries, contact us at: <strong>support@eggoworld.io</strong></p>
          </section>
        </Card>
      </div>
    </LayoutWithoutNav>
  )
}
