import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Eggs Page Test Specifications
 * Tests for apps/web/app/eggs/page.tsx
 *
 * Uses file content assertions (Phase 8 pattern) to verify:
 * - Empty state CTA routes to /marketplace
 * - handleFeedEgg opens FeedDialog
 * - Empty state renders correctly
 */

const eggsPagePath = join(process.cwd(), 'app/eggs/page.tsx')

const getEggsPageContent = () => {
  try {
    const content = readFileSync(eggsPagePath, 'utf-8')
    return content
  } catch {
    return ''
  }
}

describe('Eggs Page', () => {
  describe('Empty State CTA', () => {
    it('empty state CTA routes to /marketplace', () => {
      const content = getEggsPageContent()
      expect(content).toContain("router.push('/marketplace')")
      expect(content).not.toContain("router.push('/eggs')")
    })

    it('renders empty state with No Eggs Yet message', () => {
      const content = getEggsPageContent()
      expect(content).toContain('No Eggs Yet')
      expect(content).toContain('Get Your First Egg')
    })
  })

  describe('Feed Dialog Wiring', () => {
    it('handleFeedEgg sets feedingEgg and opens FeedDialog', () => {
      const content = getEggsPageContent()
      expect(content).toContain('setFeedDialogOpen(true)')
      expect(content).toContain('setFeedingEgg(egg)')
      expect(content).not.toContain("console.log('Feed egg:")
    })

    it('handleManageEgg also opens FeedDialog', () => {
      const content = getEggsPageContent()
      expect(content).toContain('const handleManageEgg = (eggId: number) => {')
      expect(content).toMatch(/handleManageEgg[\s\S]*setFeedingEgg[\s\S]*setFeedDialogOpen/)
    })
  })

  describe('FeaturedEggHero Integration', () => {
    it('passes onFeed prop to FeaturedEggHero', () => {
      const content = getEggsPageContent()
      expect(content).toContain('onFeed={handleFeedEgg}')
    })

    it('uses dynamic import for FeedDialog component', () => {
      const content = getEggsPageContent()
      expect(content).toMatch(/FeedDialog/)
      expect(content).toMatch(/dynamic/)
      expect(content).toMatch(/feed-dialog/)
    })
  })
})
