# Dashboard Page Design

Overrides Master design system for dashboard-specific layouts and components.

---

## Page Structure

```tsx
<div className="min-h-screen bg-surface-container-low">
  <TopNav />
  <SideNav /> {/* Desktop only, visible at lg+ */}
  <main className="pt-20 pb-24 lg:pb-8">
    <div className="max-w-7xl mx-auto px-6">
      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{/* Cards here */}</div>
    </div>
  </main>
  <BottomNavMobile /> {/* Mobile only, hidden at lg+ */}
</div>
```

---

## Layout Rules

### Grid System

```tsx
// 3-column grid for dashboard cards
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 2-column for wider cards
className = "grid grid-cols-1 md:grid-cols-2 gap-8"

// Single column for detailed sections
className = "space-y-6"
```

### Container

```tsx
// Main container
max-w-7xl mx-auto px-6

// Nested containers
max-w-4xl mx-auto px-6
```

---

## Dashboard-Specific Components

### Balance Card

```tsx
<div className="bg-surface-container rounded-clay-lg p-6 shadow-clay-md">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-headline font-bold text-lg">Total Balance</h3>
    <button className="text-primary hover:bg-primary/10 p-2 rounded-clay-sm transition-colors">
      <History className="w-5 h-5" />
    </button>
  </div>
  <div className="space-y-2">
    <div className="text-4xl font-black font-headline text-on-surface">{balance} USDT</div>
    <div className="flex items-center gap-2 text-sm">
      <TrendingUp className="w-4 h-4 text-tertiary" />
      <span className="text-tertiary font-bold">+12.5%</span>
      <span className="text-on-surface-variant">this week</span>
    </div>
  </div>
  <div className="flex gap-3 mt-6">
    <Button variant="clay" size="clay-md" className="flex-1">
      Deposit
    </Button>
    <Button variant="clay-outline" size="clay-md" className="flex-1">
      Withdraw
    </Button>
  </div>
</div>
```

### Active Eggs Card

```tsx
<div className="bg-surface rounded-clay-xl shadow-clay-lg p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="font-headline font-black text-xl">Active Eggs</h3>
    <Badge variant="primary">{count} / 10</Badge>
  </div>

  <div className="grid grid-cols-3 gap-4">
    {eggs.map((egg) => (
      <div key={egg.id} className="group cursor-pointer">
        <div className="aspect-square rounded-clay-lg overflow-hidden bg-surface-container-high relative">
          <img
            src={egg.image}
            alt={egg.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
          {egg.isReady && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-tertiary-container rounded-full animate-pulse" />
          )}
        </div>
        <p className="text-xs font-bold text-center mt-2">{egg.name}</p>
      </div>
    ))}
  </div>

  <Button variant="clay-outline" size="clay-sm" className="w-full mt-4">
    View All Eggs
  </Button>
</div>
```

### Tier Progress Card

```tsx
<div className="bg-gradient-to-br from-primary-container to-secondary-container rounded-clay-xl p-6 shadow-clay-lg text-on-primary-container">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-headline font-black text-xl">Tier Progress</h3>
    <Badge variant="secondary">Tier {currentTier}</Badge>
  </div>

  <div className="space-y-4">
    <div>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span>XP to Next Tier</span>
        <span>
          {xp} / {requiredXP}
        </span>
      </div>
      <div className="h-3 bg-white/20 rounded-clay-full overflow-hidden">
        <div
          className="h-full bg-on-primary-container rounded-clay-full transition-all duration-500"
          style={{ width: `${(xp / requiredXP) * 100}%` }}
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-white/10 rounded-clay-sm p-2">
        <div className="text-xs opacity-80">Level</div>
        <div className="font-black">{level}</div>
      </div>
      <div className="bg-white/10 rounded-clay-sm p-2">
        <div className="text-xs opacity-80">Multiplier</div>
        <div className="font-black">{multiplier}x</div>
      </div>
      <div className="bg-white/10 rounded-clay-sm p-2">
        <div className="text-xs opacity-80">Rank</div>
        <div className="font-black">#{rank}</div>
      </div>
    </div>
  </div>
</div>
```

### Activity Feed

```tsx
<div className="bg-surface rounded-clay-lg shadow-clay-md p-6">
  <h3 className="font-headline font-black text-xl mb-6">Recent Activity</h3>

  <div className="space-y-4">
    {activities.map((activity) => (
      <div key={activity.id} className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-clay-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
          {activity.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface truncate">{activity.title}</p>
          <p className="text-sm text-on-surface-variant">{activity.description}</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">{activity.timestamp}</p>
        </div>
        {activity.amount && (
          <div className="text-right">
            <div className="font-bold text-tertiary">+{activity.amount}</div>
            <div className="text-xs text-on-surface-variant">USDT</div>
          </div>
        )}
      </div>
    ))}
  </div>

  <Button variant="ghost" size="sm" className="w-full mt-4">
    View All Activity
  </Button>
</div>
```

### Quick Actions

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Button variant="clay" size="clay-lg" className="flex-col h-auto py-6 gap-3">
    <Wallet className="w-8 h-8" />
    <span className="font-bold">Deposit</span>
  </Button>

  <Button variant="clay-outline" size="clay-lg" className="flex-col h-auto py-6 gap-3">
    <Send className="w-8 h-8" />
    <span className="font-bold">Withdraw</span>
  </Button>

  <Button variant="clay-secondary" size="clay-lg" className="flex-col h-auto py-6 gap-3">
    <ShoppingCart className="w-8 h-8" />
    <span className="font-bold">Marketplace</span>
  </Button>

  <Button variant="clay" size="clay-lg" className="flex-col h-auto py-6 gap-3">
    <Users className="w-8 h-8" />
    <span className="font-bold">Referrals</span>
  </Button>
</div>
```

---

## Specific Patterns

### Stats Overview Row

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Stat 1 */}
  <div className="bg-surface rounded-clay-lg p-6 shadow-clay-md">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-clay-full bg-primary-container flex items-center justify-center">
        <Wallet className="w-5 h-5 text-on-primary" />
      </div>
      <span className="text-on-surface-variant font-bold">Balance</span>
    </div>
    <div className="text-2xl font-black font-headline">1,234 USDT</div>
  </div>

  {/* Repeat for other stats */}
</div>
```

### NFT Collection Grid

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {nfts.map((nft) => (
    <div key={nft.id} className="group cursor-pointer">
      <div className="aspect-square rounded-clay-lg overflow-hidden bg-surface-container relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white font-bold text-sm truncate">{nft.name}</p>
          <p className="text-white/80 text-xs">{nft.rarity}</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## Dashboard-Specific Utilities

```css
/* Dashboard card variants */
.dashboard-card {
  @apply bg-surface rounded-clay-lg shadow-clay-md p-6;
}

.dashboard-card-lg {
  @apply bg-surface rounded-clay-xl shadow-clay-lg p-8;
}

.dashboard-card-compact {
  @apply bg-surface-container rounded-clay p-4;
}

/* Stat card variant */
.stat-card {
  @apply bg-surface rounded-clay-lg p-6 shadow-clay-md;
}

/* Section header */
.section-header {
  @apply flex items-center justify-between mb-6;
}

.section-title {
  @apply font-headline font-black text-xl;
}
```

---

## Responsive Behavior

### Mobile (375px - 767px)

- Single column layout
- Bottom nav visible
- Compact cards
- Reduced shadow complexity
- Stacked actions

### Tablet (768px - 1023px)

- 2-column grid
- Bottom nav visible
- Standard card sizes
- Side-by-side actions

### Desktop (1024px+)

- 3-column grid
- Side nav visible, bottom nav hidden
- Full card sizes with larger shadows
- Horizontal action layouts

---

## Performance Notes

- Use `will-change: transform` on animated cards
- Lazy load egg/NFT images
- Reduce shadow complexity on mobile
- Virtualize long activity feeds

---

## Accessibility

- All interactive elements have focus states
- Touch targets minimum 44×44px
- Sufficient color contrast (4.5:1)
- Keyboard navigation supported
- Screen reader friendly labels

---

## Common Patterns

### Empty State

```tsx
<div className="text-center py-12">
  <div className="w-24 h-24 mx-auto mb-4 rounded-clay-full bg-surface-container flex items-center justify-center">
    <Inbox className="w-12 h-12 text-on-surface-variant" />
  </div>
  <h3 className="font-headline font-bold text-lg mb-2">No eggs yet</h3>
  <p className="text-on-surface-variant mb-4">Mint your first egg to get started</p>
  <Button variant="clay">Mint Egg</Button>
</div>
```

### Loading State

```tsx
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="bg-surface rounded-clay-lg p-6 shadow-clay-md">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-8 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-clay" />
        <Skeleton className="h-10 flex-1 rounded-clay" />
      </div>
    </div>
  ))}
</div>
```
