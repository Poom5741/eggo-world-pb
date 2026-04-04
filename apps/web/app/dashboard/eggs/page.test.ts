import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('My Eggs Dashboard Page', () => {
  const filePath = join(process.cwd(), 'app/dashboard/eggs/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('contains EggCard component', () => {
    expect(content).toContain('EggCard')
    expect(content).toContain('useEffect')
  })

  it('contains auto-polling logic', () => {
    expect(content).toContain('setInterval')
    expect(content).toContain('fetchEggs')
  })

  it('contains loading state', () => {
    expect(content).toContain('loading')
    expect(content).toContain('Updating...')
  })

  it('imports from correct paths', () => {
    expect(content).toContain('@/components/egg-nft')
    expect(content).not.toContain('relative imports like ../')
  })
})
