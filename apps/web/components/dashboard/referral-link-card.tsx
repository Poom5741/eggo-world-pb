'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function getReferralLink(referralCode: string, userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eggoworld.io'
  if (referralCode) {
    return `${baseUrl}/mint?ref=${referralCode}`
  }
  // Fallback: use userId-based link if referral_code not generated yet
  return `${baseUrl}/auth/sign-up?referrer=${userId}`
}

interface ReferralLinkCardProps {
  referralCode: string
  userId?: string
}

export function ReferralLinkCard({ referralCode, userId }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const link = getReferralLink(referralCode, userId || '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-green-800 font-medium mb-1">Your Referral Link</p>
        <code className="text-sm font-mono text-green-900 break-all">{link}</code>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shrink-0"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  )
}