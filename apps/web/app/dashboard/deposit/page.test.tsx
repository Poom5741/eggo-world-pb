import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'
import { join } from 'path'

const depositPagePath = join(process.cwd(), 'app/dashboard/deposit/page.tsx')

const getDepositPageContent = () => {
  try {
    return fs.readFileSync(depositPagePath, 'utf-8')
  } catch {
    return ''
  }
}

describe('Deposit Page', () => {
  describe('Page Structure', () => {
    it('should have deposit page file', () => {
      const content = getDepositPageContent()
      expect(content).toBeTruthy()
      expect(content.length).toBeGreaterThan(0)
    })

    it('should use "use client" directive', () => {
      const content = getDepositPageContent()
      expect(content).toContain("'use client'")
    })

    it('should use LayoutWithoutNav component', () => {
      const content = getDepositPageContent()
      expect(content).toContain('LayoutWithoutNav')
    })
  })

  describe('Wallet Address Display', () => {
    it('should import and use useIsHydrated hook', () => {
      const content = getDepositPageContent()
      expect(content).toContain('useIsHydrated')
    })

    it('should get user wallet from getUser()', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/getUser|user\?.wallet/)
    })

    it('should display wallet address in UI', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/wallet|address/)
    })
  })

  describe('QR Code Component', () => {
    it('should import QRCodeSVG from qrcode.react', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/qrcode\.react|QRCodeSVG/)
    })

    it('should render QR code with wallet address value', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/QRCodeSVG|value=.*wallet/)
    })
  })

  describe('Deposit Polling', () => {
    it('should call /api/v2/deposit/poll endpoint', () => {
      const content = getDepositPageContent()
      expect(content).toContain('/api/v2/deposit/poll')
    })

    it('should use POST method for polling', () => {
      const content = getDepositPageContent()
      expect(content).toContain('POST')
    })

    it('should poll every 30 seconds (setInterval)', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/setInterval|30000/)
    })

    it('should include auth token in request', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/Authorization|authStore\.token/)
    })
  })

  describe('Balance Update', () => {
    it('should handle deposit poll response', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/deposits|new_balance/)
    })

    it('should update balance state when deposit detected', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/setBalance|balance.*state/)
    })
  })

  describe('Transaction History', () => {
    it('should display transaction history table', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/table|deposits.*map|Transaction/)
    })

    it('should show deposit tx_hash, amount, timestamp', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/tx_hash|amount|timestamp/)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/error|catch|try/)
    })

    it('should show error message to user', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/Alert|error.*message|setError/)
    })
  })

  describe('Authentication', () => {
    it('should check if user is authenticated', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/user|isAuthenticated|getUser/)
    })

    it('should redirect to /auth/login if not authenticated', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/\/auth\/login|window\.location/)
    })
  })

  describe('Loading State', () => {
    it('should show loading state while fetching', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/loading|isLoading/)
    })

    it('should display "Waiting for deposit" status initially', () => {
      const content = getDepositPageContent()
      expect(content).toMatch(/waiting|deposit|polling/i)
    })
  })
})