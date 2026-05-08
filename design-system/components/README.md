# Design System Components

Reusable UI components built with claymorphism design and Jules Design tokens.

## Directory Structure

```
design-system/components/
├── primitives/          # Base components (Card, Button, Input, Badge)
├── layout/              # Layout components (Container, Section, Grid)
├── navigation/          # Navigation (Navbar, Sidebar, BottomNav)
├── nft/                 # NFT-specific (EggCard, FoodCard, ListingCard)
├── dashboard/           # Dashboard widgets (StatCard, ActivityFeed)
├── forms/               # Form components (FormGroup, Label, Error)
└── feedback/            # Feedback (Loading, EmptyState, ErrorState)
```

## Component Usage

All components are designed to be:

- **Reusable**: Work across different pages and contexts
- **Accessible**: WCAG 2.2 compliant, keyboard navigation
- **Responsive**: Mobile-first, test at 375px, 768px, 1024px, 1440px
- **Themeable**: Support light/dark mode out of the box
- **Type-safe**: Full TypeScript support

## Installation

Components will be auto-generated based on this design system. No manual installation needed.

## Component Index

### Primitives

- `Card` - Base card with claymorphism shadows
- `Button` - Buttons with clay and standard variants
- `Input` - Form inputs with clay styling
- `Badge` - Status badges and tags
- `Avatar` - User/profile images
- `Skeleton` - Loading placeholders

### Layout

- `Container` - Responsive content container
- `Section` - Page sections with proper spacing
- `Grid` - Responsive grid layouts
- `Stack` - Vertical/horizontal stacks

### Navigation

- `Navbar` - Top navigation bar
- `Sidebar` - Side navigation (desktop)
- `BottomNav` - Mobile bottom navigation
- `Breadcrumbs` - Navigation breadcrumbs

### NFT Components

- `EggCard` - Egg NFT display card
- `FoodCard` - Food NFT display card
- `ListingCard` - Marketplace listing card
- `NftGrid` - NFT collection grid
- `RarityBadge` - Rarity indicator

### Dashboard

- `StatCard` - Statistics display
- `BalanceCard` - Balance display with actions
- `ActivityFeed` - Activity timeline
- `TierCard` - Tier progress display
- `QuickActions` - Action button grid

### Forms

- `FormGroup` - Form field wrapper
- `Label` - Field labels
- `Error` - Error messages
- `HelpText` - Help text

### Feedback

- `Loading` - Loading spinner
- `EmptyState` - Empty state component
- `ErrorState` - Error state component
- `SuccessState` - Success state component

## Examples

See individual component files for detailed usage examples.
