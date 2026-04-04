# Design System Component Showcase

This file demonstrates all components and patterns from the EggoWorld Design System.

---

## Color Palette Display

```tsx
export function ColorPaletteShowcase() {
  const colors = [
    { name: "Background", var: "--background", hex: "#1a1a2e" },
    { name: "Foreground", var: "--foreground", hex: "#fef9c3" },
    { name: "Primary", var: "--primary", hex: "#facc15" },
    { name: "Secondary", var: "--secondary", hex: "#0f3460" },
    { name: "Accent", var: "--accent", hex: "#e94560" },
    { name: "Card", var: "--card", hex: "#16213e" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {colors.map((color) => (
        <div
          key={color.name}
          className="p-4 border-4 border-primary/50"
          style={{ backgroundColor: `var(${color.var})` }}
        >
          <p className="font-[var(--font-pixel)] text-xs mb-2">{color.name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{color.hex}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Typography Scale

```tsx
export function TypographyShowcase() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-pixel)] text-4xl text-primary mb-2">DISPLAY TEXT (48px)</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Use: Hero titles, major announcements
        </p>
      </div>

      <div>
        <h1 className="font-[var(--font-pixel)] text-3xl text-primary mb-2">HEADING 1 (36px)</h1>
        <p className="font-mono text-xs text-muted-foreground">Use: Page titles</p>
      </div>

      <div>
        <h2 className="font-[var(--font-pixel)] text-2xl text-primary mb-2">HEADING 2 (28px)</h2>
        <p className="font-mono text-xs text-muted-foreground">Use: Section headers</p>
      </div>

      <div>
        <h3 className="font-[var(--font-pixel)] text-xl text-primary mb-2">HEADING 3 (22px)</h3>
        <p className="font-mono text-xs text-muted-foreground">Use: Subsection headers</p>
      </div>

      <div>
        <p className="font-[var(--font-pixel)] text-sm text-foreground mb-2">
          BODY TEXT LARGE (14px)
        </p>
        <p className="font-mono text-xs text-muted-foreground">Use: Emphasized body text</p>
      </div>

      <div>
        <p className="font-[var(--font-pixel)] text-xs text-foreground mb-2">
          Body text (12px) - Default size for all UI text
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          Use: Standard body text, descriptions
        </p>
      </div>

      <div>
        <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground uppercase mb-2">
          LABEL TEXT (10px)
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          Use: Form labels, captions, metadata
        </p>
      </div>
    </div>
  )
}
```

---

## Button Variants

```tsx
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function ButtonShowcase() {
  return (
    <div className="space-y-6">
      {/* Primary Buttons */}
      <div className="space-y-3">
        <h3 className="section-title">Primary Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">MINT EGG</button>

          <button className="btn-primary" disabled>
            DISABLED
          </button>

          <button className="btn-primary">
            <Wallet className="w-4 h-4 mr-2 inline" />
            CONNECT WALLET
          </button>
        </div>
      </div>

      {/* Secondary Buttons */}
      <div className="space-y-3">
        <h3 className="section-title">Secondary Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-secondary">CANCEL</button>

          <button className="btn-secondary" disabled>
            DISABLED
          </button>
        </div>
      </div>

      {/* Ghost Buttons */}
      <div className="space-y-3">
        <h3 className="section-title">Ghost Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-ghost">LEARN MORE</button>

          <button className="btn-ghost">VIEW DETAILS</button>
        </div>
      </div>

      {/* shadcn/ui Button Integration */}
      <div className="space-y-3">
        <h3 className="section-title">shadcn/ui Button (Customized)</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="default"
            className="font-[var(--font-pixel)] text-xs border-4 border-primary/50 hover:border-primary h-12 px-6"
          >
            CUSTOM BUTTON
          </Button>

          <Button
            variant="outline"
            className="font-[var(--font-pixel)] text-xs border-2 border-primary/30 hover:border-primary h-10 px-4"
          >
            OUTLINE
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Card Variants

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function CardShowcase() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Card */}
        <div className="card--primary cursor-pointer hover:bg-card/80 transition-colors">
          <h3 className="font-[var(--font-pixel)] text-sm text-primary mb-2">PRIMARY CARD</h3>
          <p className="font-[var(--font-pixel)] text-xs text-foreground">
            Used for important content, featured items, and primary actions.
          </p>
        </div>

        {/* Secondary Card */}
        <div className="card--secondary">
          <h3 className="font-[var(--font-pixel)] text-sm text-foreground mb-2">SECONDARY CARD</h3>
          <p className="font-[var(--font-pixel)] text-xs text-foreground">
            Used for standard content, secondary information, and supporting elements.
          </p>
        </div>

        {/* Accent Card */}
        <div className="card--accent">
          <h3 className="font-[var(--font-pixel)] text-sm text-accent mb-2">ACCENT CARD</h3>
          <p className="font-[var(--font-pixel)] text-xs text-foreground">
            Used for warnings, premium features, and critical notifications.
          </p>
        </div>
      </div>

      {/* shadcn/ui Card Integration */}
      <Card className="card--primary">
        <CardHeader>
          <CardTitle className="font-[var(--font-pixel)] text-lg text-foreground">
            NFT COLLECTION
          </CardTitle>
          <CardDescription className="font-[var(--font-pixel)] text-xs text-muted-foreground">
            Your digital assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-[var(--font-pixel)] text-xs text-foreground">
            Card content with shadcn/ui structure
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Form Elements

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function FormShowcase() {
  return (
    <div className="space-y-6 max-w-md">
      {/* Text Input */}
      <div className="space-y-2">
        <Label className="label">WALLET ADDRESS</Label>
        <Input className="input-field" placeholder="0x..." type="text" />
        <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground">
          Enter your BSC wallet address
        </p>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label className="label">PIN CODE</Label>
        <Input className="input-field" placeholder="••••••" type="password" />
      </div>

      {/* Disabled Input */}
      <div className="space-y-2">
        <Label className="label">DISABLED FIELD</Label>
        <Input
          className="input-field opacity-50 cursor-not-allowed"
          value="Read-only value"
          disabled
        />
      </div>

      {/* Error State */}
      <div className="space-y-2">
        <Label className="label">AMOUNT</Label>
        <Input
          className="input-field border-accent focus:border-accent"
          placeholder="0.00"
          type="number"
        />
        <p className="font-[var(--font-pixel)] text-[10px] text-accent">Insufficient balance</p>
      </div>
    </div>
  )
}
```

---

## Info Boxes

```tsx
export function InfoBoxShowcase() {
  return (
    <div className="space-y-4">
      {/* Error Box */}
      <div className="info-error">
        <p className="font-[var(--font-pixel)] text-xs text-accent">
          ❌ Transaction failed: Insufficient gas fee
        </p>
      </div>

      {/* Success Box */}
      <div className="info-success">
        <p className="font-[var(--font-pixel)] text-xs text-green-500">
          ✅ Egg hatched successfully! You got a RARE dragon.
        </p>
      </div>

      {/* Warning Box */}
      <div className="info-warning">
        <p className="font-[var(--font-pixel)] text-xs text-amber-500">
          ⚠️ Warning: This action cannot be undone
        </p>
      </div>
    </div>
  )
}
```

---

## Animation Showcase

```tsx
export function AnimationShowcase() {
  return (
    <div className="space-y-8">
      {/* Twinkle */}
      <div>
        <h3 className="section-title mb-4">Twinkle Animation</h3>
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary animate-twinkle"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Use: Starfield backgrounds, decorative sparkles
        </p>
      </div>

      {/* Float */}
      <div>
        <h3 className="section-title mb-4">Float Animation</h3>
        <div className="animate-float inline-block p-6 card--primary">
          <p className="font-[var(--font-pixel)] text-xs">FLOATING CARD</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Use: NFT cards, idle character animations
        </p>
      </div>

      {/* Glitch */}
      <div>
        <h3 className="section-title mb-4">Glitch Animation</h3>
        <button
          className="btn-primary animate-glitch"
          onClick={(e) => {
            e.currentTarget.classList.remove("animate-glitch")
            void e.currentTarget.offsetWidth // Trigger reflow
            e.currentTarget.classList.add("animate-glitch")
          }}
        >
          CLICK TO GLITCH
        </button>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Use: Error states, cyberpunk effects (single shot)
        </p>
      </div>

      {/* Pulse Glow */}
      <div>
        <h3 className="section-title mb-4">Pulse Glow Animation</h3>
        <button className="btn-primary animate-pulse-glow">IMPORTANT CTA</button>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Use: Important CTAs, rare NFT highlights
        </p>
      </div>

      {/* Marquee */}
      <div>
        <h3 className="section-title mb-4">Marquee Animation</h3>
        <div className="overflow-hidden whitespace-nowrap card--secondary py-3">
          <div className="animate-marquee inline-block">
            <span className="font-[var(--font-pixel)] text-xs text-primary mx-8">
              🎮 NEW EGGS AVAILABLE • BREEDING SEASON ACTIVE • CLAIM YOUR REWARDS •
            </span>
            <span className="font-[var(--font-pixel)] text-xs text-primary mx-8">
              🎮 NEW EGGS AVAILABLE • BREEDING SEASON ACTIVE • CLAIM YOUR REWARDS •
            </span>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Use: News tickers, announcement banners
        </p>
      </div>
    </div>
  )
}
```

---

## Layout Patterns

```tsx
export function LayoutShowcase() {
  return (
    <div className="space-y-8">
      {/* Page Container */}
      <section>
        <h3 className="section-title mb-4">Page Container</h3>
        <div className="page-container card--secondary">
          <h1 className="page-title">PAGE TITLE EXAMPLE</h1>
          <p className="font-[var(--font-pixel)] text-xs text-foreground mt-4">
            Content inside page container with proper padding and max-width
          </p>
        </div>
      </section>

      {/* Grid System */}
      <section>
        <h3 className="section-title mb-4">Responsive Grid</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card--primary aspect-square flex items-center justify-center">
              <p className="font-[var(--font-pixel)] text-xs">ITEM {i}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step Indicator */}
      <section>
        <h3 className="section-title mb-4">Step Indicator</h3>
        <div className="flex items-center gap-4">
          <div className="step-indicator">1</div>
          <div className="h-0.5 w-12 bg-primary/30" />
          <div className="step-indicator">2</div>
          <div className="h-0.5 w-12 bg-primary/30" />
          <div className="step-indicator opacity-50">3</div>
        </div>
      </section>

      {/* Divider */}
      <section>
        <h3 className="section-title mb-4">Divider</h3>
        <p className="font-[var(--font-pixel)] text-xs text-foreground">Content above divider</p>
        <hr className="divider" />
        <p className="font-[var(--font-pixel)] text-xs text-foreground">Content below divider</p>
      </section>
    </div>
  )
}
```

---

## Complete Page Example

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Egg, Flame } from "lucide-react"

export function CompletePageExample() {
  return (
    <main className="page-container min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="page-title animate-pulse-glow inline-block">EGGOWORLD</h1>
        <p className="font-[var(--font-pixel)] text-xs text-muted-foreground mt-2">
          Collect • Breed • Trade
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card--primary">
          <CardHeader>
            <CardTitle className="font-[var(--font-pixel)] text-sm text-primary flex items-center gap-2">
              <Egg className="w-4 h-4" />
              MY EGGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-[var(--font-pixel)] text-2xl text-foreground">12</p>
          </CardContent>
        </Card>

        <Card className="card--secondary">
          <CardHeader>
            <CardTitle className="font-[var(--font-pixel)] text-sm text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4" />
              HATCHED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-[var(--font-pixel)] text-2xl text-foreground">8</p>
          </CardContent>
        </Card>

        <Card className="card--accent">
          <CardHeader>
            <CardTitle className="font-[var(--font-pixel)] text-sm text-accent flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              BALANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-[var(--font-pixel)] text-2xl text-foreground">1.5 BNB</p>
          </CardContent>
        </Card>
      </section>

      {/* Action Buttons */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Button className="btn-primary">MINT NEW EGG</Button>
          <Button className="btn-secondary">VIEW MARKETPLACE</Button>
          <Button className="btn-ghost">LEARN MORE</Button>
        </div>
      </section>

      {/* NFT Grid */}
      <section>
        <h2 className="section-title mb-6">YOUR COLLECTION</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="card--primary cursor-pointer hover:bg-card/80 transition-colors animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <CardContent className="p-6">
                <div className="aspect-square bg-background mb-4 flex items-center justify-center">
                  <Egg className="w-16 h-16 text-primary" />
                </div>
                <h3 className="font-[var(--font-pixel)] text-xs text-primary mb-2">
                  EGG #{i.toString().padStart(3, "0")}
                </h3>
                <p className="font-[var(--font-pixel)] text-[10px] text-muted-foreground uppercase">
                  COMMON
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Info Box */}
      <section className="mt-8">
        <div className="info-success">
          <p className="font-[var(--font-pixel)] text-xs text-green-500">
            ✅ Welcome back! You have 3 eggs ready to hatch.
          </p>
        </div>
      </section>
    </main>
  )
}
```

---

## Usage Instructions

1. **Copy examples** from this file into your components
2. **Customize** content and data as needed
3. **Maintain consistency** by using the same class patterns
4. **Test responsiveness** at all breakpoints
5. **Verify accessibility** with keyboard navigation

For complete documentation, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
