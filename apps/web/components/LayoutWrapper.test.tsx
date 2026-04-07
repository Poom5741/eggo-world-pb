import { describe, it, expect } from "bun:test"
import { render, screen } from "@testing-library/react"
import LayoutWrapper from "./LayoutWrapper"

describe("LayoutWrapper", () => {
  it("renders children prop content", () => {
    render(
      <LayoutWrapper>
        <div data-testid="test-child">Test Content</div>
      </LayoutWrapper>
    )
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("includes TopNav component", () => {
    render(<LayoutWrapper><div>Content</div></LayoutWrapper>)
    // TopNav renders "EggoWorld" logo
    expect(screen.getByText("EggoWorld")).toBeInTheDocument()
  })

  it("includes SideNav component", () => {
    render(<LayoutWrapper><div>Content</div></LayoutWrapper>)
    // SideNav renders "EggoBuddy" mascot name
    expect(screen.getByText("EggoBuddy")).toBeInTheDocument()
  })

  it("includes BottomNavMobile component", () => {
    render(<LayoutWrapper><div>Content</div></LayoutWrapper>)
    // BottomNavMobile renders navigation items including "Dashboard"
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0)
  })

  it("main content has correct padding classes (pt-20, pb-32, lg:pb-8)", () => {
    render(<LayoutWrapper><div>Content</div></LayoutWrapper>)
    
    const main = document.querySelector("main")
    expect(main).toBeInTheDocument()
    // Main has pb-32 and lg:pb-8
    expect(main?.className).toContain("pb-32")
    expect(main?.className).toContain("lg:pb-8")
    
    // Wrapper div has pt-20
    const wrapper = document.querySelector(".flex.flex-1.pt-20")
    expect(wrapper).toBeInTheDocument()
  })
})
