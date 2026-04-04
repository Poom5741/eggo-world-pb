import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Commissions Dashboard Page', () => {
  const filePath = join(process.cwd(), 'app/dashboard/commissions/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('contains commission records display', () => {
    expect(content).toContain('commission_records')
    expect(content).toContain('earnings')
  })

  it('contains auto-polling logic', () => {
    expect(content).toContain('setInterval')
    expect(content).toContain('fetchData')
  })

  it('contains "Updating..." indicator', () => {
    expect(content).toContain('Updating...')
  })

  it('imports referral dashboard components', () => {
    expect(content).toContain('@/components')
  })
})
