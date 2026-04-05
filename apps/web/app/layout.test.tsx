import { describe, it, expect } from "bun:test"
import { readFileSync } from "fs"
import { join } from "path"

describe("Root Layout", () => {
  const layoutPath = join(process.cwd(), "app", "layout.tsx")
  const layoutContent = readFileSync(layoutPath, "utf-8")

  it("includes Material Symbols CDN link in head", () => {
    // ตรวจสอบว่า layout.tsx มี Material Symbols CDN link
    expect(layoutContent).toContain("Material+Symbols+Outlined")
  })

  it("preserves existing Press_Start_2P font import", () => {
    // ตรวจสอบว่ายังคงมี Press_Start_2P font
    expect(layoutContent).toContain("Press_Start_2P")
  })

  it("preserves existing Geist font import", () => {
    // ตรวจสอบว่ายังคงมี Geist font
    expect(layoutContent).toContain("Geist")
  })

  it("preserves Vercel Analytics", () => {
    // ตรวจสอบว่ายังคงมี Vercel Analytics
    expect(layoutContent).toContain("@vercel/analytics")
  })
})
