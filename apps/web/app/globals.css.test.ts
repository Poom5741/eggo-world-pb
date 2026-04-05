import { describe, it, expect } from "bun:test"
import { readFileSync } from "fs"
import { join } from "path"

describe("Globals CSS - Material Symbols", () => {
  const cssPath = join(process.cwd(), "app", "globals.css")
  const cssContent = readFileSync(cssPath, "utf-8")

  it("defines .material-symbols-outlined class", () => {
    // ตรวจสอบว่ามี class .material-symbols-outlined
    expect(cssContent).toMatch(/\.material-symbols-outlined\s*\{/)
  })

  it("includes font-variation-settings with FILL, wght, GRAD, opsz", () => {
    // ตรวจสอบว่ามี font-variation-settings ที่ถูกต้อง
    expect(cssContent).toContain("font-variation-settings")
    expect(cssContent).toContain("'FILL'")
    expect(cssContent).toContain("'wght'")
    expect(cssContent).toContain("'GRAD'")
    expect(cssContent).toContain("'opsz'")
  })

  it("sets correct font-size for icons", () => {
    // ตรวจสอบว่ามี font-size ที่กำหนด
    expect(cssContent).toMatch(/font-size:\s*24px/)
  })

  it("includes display inline-block for proper rendering", () => {
    // ตรวจสอบว่ามี display: inline-block
    expect(cssContent).toContain("display: inline-block")
  })
})
