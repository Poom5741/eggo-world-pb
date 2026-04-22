# Marketplace Page Design

Overrides Master design system for marketplace-specific layouts and components.

---

## Page Structure

```tsx
<div className="min-h-screen bg-surface-container-low">
  <TopNav />
  
  <main className="pt-20 pb-24">
    {/* Hero Search Section */}
    <section className="bg-gradient-to-b from-primary-container to-surface-container py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-headline font-black text-5xl mb-4">
          Discover NFTs
        </h1>
        <p className="text-on-surface-variant text-lg mb-8">
          Find the perfect eggs and food for your collection
        </p>
        
        {/* Search Bar - Primary CTA */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search eggs, food, or collections..."
            className="w-full pl-14 pr-6 py-4 rounded-clay-full bg-surface shadow-clay-lg focus:ring-2 focus:ring-primary text-lg"
          />
        </div>
        
        {/* Popular Searches */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="cursor-pointer hover:opacity-80">Rare Eggs</Badge>
          <Badge variant="secondary" className="cursor-pointer hover:opacity-80">Food Packs</Badge>
          <Badge variant="secondary" className="cursor-pointer hover:opacity-80">Legendary</Badge>
        </div>
      </div>
    </section>
    
    {/* Categories */}
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-headline font-black text-3xl mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="group cursor-pointer bg-surface rounded-clay-lg p-6 shadow-clay-md hover:shadow-clay-lg transition-all text-center"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-clay-full bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <p className="font-bold text-on-surface">{category.name}</p>
              <p className="text-xs text-on-surface-variant">{category.count} items</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    
    {/* Featured Listings */}
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-black text-3xl">Featured Listings</h2>
          <Button variant="ghost">View All</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </div>
    </section>
  </main>
  
  <BottomNavMobile />
</div>
```

---

## Layout Rules

### Filters Layout

```tsx
<div className="flex flex-col md:flex-row gap-6">
  {/* Sidebar Filters */}
  <aside className="w-full md:w-64 flex-shrink-0">
    <Card className="p-6 space-y-6">
      {/* Filter sections */}
    </Card>
  </aside>
  
  {/* Main Grid */}
  <div className="flex-1">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Listing cards */}
    </div>
  </div>
</div>
```

### Sort Bar

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="text-on-surface-variant">
    Showing <span className="font-bold text-on-surface">{start}-{end}</span> of <span className="font-bold text-on-surface">{total}</span> results
  </div>
  
  <div className="flex items-center gap-3">
    <span className="text-on-surface-variant text-sm">Sort by:</span>
    <Select defaultValue="featured">
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured">Featured</SelectItem>
        <SelectItem value="price-low">Price: Low to High</SelectItem>
        <SelectItem value="price-high">Price: High to Low</SelectItem>
        <SelectItem value="rarity">Rarity</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## Marketplace-Specific Components

### Listing Card

```tsx
<div className="group bg-surface rounded-clay-xl shadow-clay-md overflow-hidden cursor-pointer hover:shadow-clay-lg transition-all">
  {/* Image */}
  <div className="relative aspect-square bg-surface-container-high">
    <img 
      src={image} 
      alt={name}
      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
    />
    
    {/* Favorite Button */}
    <button className="absolute top-3 right-3 w-9 h-9 rounded-clay-full bg-surface/80 backdrop-blur-sm flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
      <Heart className="w-5 h-5" />
    </button>
    
    {/* Status Badge */}
    {status && (
      <Badge className="absolute top-3 left-3" variant={statusVariant}>
        {status}
      </Badge>
    )}
  </div>
  
  {/* Content */}
  <div className="p-5 space-y-4">
    {/* Title & Rarity */}
    <div>
      <h3 className="font-headline font-black text-lg truncate">{name}</h3>
      <p className="text-sm text-on-surface-variant">{collection}</p>
    </div>
    
    {/* Attributes */}
    <div className="grid grid-cols-2 gap-2">
      {attributes.slice(0, 2).map((attr) => (
        <div key={trait_type} className="bg-surface-container-high rounded-clay-sm px-3 py-2 text-center">
          <div className="text-xs text-on-surface-variant">{trait_type}</div>
          <div className="text-sm font-bold truncate">{value}</div>
        </div>
      ))}
    </div>
    
    {/* Price & Action */}
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-on-surface-variant">Price</div>
        <div className="font-black text-xl text-primary">{price} ETH</div>
      </div>
      <Button variant="clay" size="clay-sm">
        Buy Now
      </Button>
    </div>
  </div>
</div>
```

### Filter Section

```tsx
<div className="space-y-6">
  {/* Price Range */}
  <div>
    <h4 className="font-bold text-on-surface mb-3">Price Range</h4>
    <div className="space-y-3">
      <Slider 
        defaultValue={[min, max]} 
        max={10}
        step={0.1}
        className="w-full"
      />
      <div className="flex items-center gap-2">
        <Input 
          type="number" 
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-on-surface-variant">-</span>
        <Input 
          type="number" 
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="flex-1"
        />
      </div>
    </div>
  </div>
  
  {/* Rarity */}
  <div>
    <h4 className="font-bold text-on-surface mb-3">Rarity</h4>
    <div className="space-y-2">
      {rarities.map((rarity) => (
        <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
          <Checkbox />
          <span className="text-on-surface group-hover:text-primary transition-colors">
            {rarity}
          </span>
        </label>
      ))}
    </div>
  </div>
  
  {/* Traits */}
  <div>
    <h4 className="font-bold text-on-surface mb-3">Traits</h4>
    <Accordion type="multiple" className="w-full">
      {traitCategories.map((category) => (
        <AccordionItem key={category} value={category}>
          <AccordionTrigger>{category}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {traits.map((trait) => (
                <label key={trait} className="flex items-center gap-3">
                  <Checkbox />
                  <span className="text-sm text-on-surface">{trait}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
</div>
```

### Sell Dialog

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="clay">Sell NFT</Button>
  </DialogTrigger>
  <DialogContent className="rounded-clay-xl shadow-clay-xl max-w-lg">
    <DialogHeader>
      <DialogTitle className="font-headline font-black text-2xl">List for Sale</DialogTitle>
      <DialogDescription>
        Set your price and marketplace duration
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6 py-4">
      {/* NFT Preview */}
      <div className="flex items-center gap-4 p-4 bg-surface-container rounded-clay-lg">
        <img src={image} alt={name} className="w-20 h-20 object-contain" />
        <div>
          <div className="font-bold">{name}</div>
          <div className="text-sm text-on-surface-variant">{collection}</div>
        </div>
      </div>
      
      {/* Price Input */}
      <div>
        <Label>Price (ETH)</Label>
        <Input 
          type="number" 
          placeholder="0.00"
          step={0.01}
          className="mt-2"
        />
      </div>
      
      {/* Duration */}
      <div>
        <Label>Listing Duration</Label>
        <Select>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Fees */}
      <div className="p-4 bg-surface-container rounded-clay-lg space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Platform Fee (2.5%)</span>
          <span className="font-bold">{fee} ETH</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-bold text-on-surface">You'll Receive</span>
          <span className="font-black text-primary">{total} ETH</span>
        </div>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="clay" onClick={handleSell}>List NFT</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Search & Discovery

### Search Bar (Hero)

```tsx
<div className="relative max-w-2xl mx-auto">
  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface-variant" />
  <input
    type="text"
    placeholder="Search by name, collection, or trait..."
    className="w-full pl-16 pr-6 py-5 rounded-clay-full bg-surface shadow-clay-lg focus:ring-2 focus:ring-primary text-lg transition-all"
  />
  {query && (
    <button 
      onClick={() => setQuery('')}
      className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
    >
      <X className="w-5 h-5" />
    </button>
  )}
</div>
```

### Search Suggestions

```tsx
{query && (
  <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-clay-lg shadow-clay-xl p-4 z-50">
    <div className="space-y-3">
      <div>
        <div className="text-xs font-bold text-on-surface-variant uppercase mb-2">Suggested Searches</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Badge 
              key={s} 
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-white"
              onClick={() => setQuery(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

---

## Mobile Optimization

### Mobile Card (Compact)

```tsx
<div className="bg-surface rounded-clay-lg shadow-clay-md overflow-hidden">
  <div className="flex gap-4 p-4">
    <img src={image} alt={name} className="w-24 h-24 object-contain bg-surface-container-high rounded-clay-md" />
    <div className="flex-1 min-w-0">
      <h3 className="font-bold truncate">{name}</h3>
      <p className="text-sm text-on-surface-variant">{collection}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="font-black text-lg">{price} ETH</span>
        <Button variant="clay" size="clay-sm">Buy</Button>
      </div>
    </div>
  </div>
</div>
```

### Mobile Filters (Drawer)

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="icon">
      <Filter className="w-5 h-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-full max-w-xs overflow-y-auto">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>
    
    <div className="py-6 space-y-6">
      {/* Filter sections */}
    </div>
    
    <div className="flex gap-3 mt-6">
      <Button variant="outline" className="flex-1" onClick={clearFilters}>
        Clear All
      </Button>
      <Button variant="clay" className="flex-1" onClick={applyFilters}>
        Show Results
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## Empty States

### No Results

```tsx
<div className="text-center py-20">
  <div className="w-32 h-32 mx-auto mb-6 rounded-clay-full bg-surface-container flex items-center justify-center">
    <Search className="w-16 h-16 text-on-surface-variant" />
  </div>
  <h3 className="font-headline font-bold text-2xl mb-2">No results found</h3>
  <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
    We couldn't find any NFTs matching "{query}". Try adjusting your filters or search terms.
  </p>
  <Button variant="clay" onClick={clearFilters}>
    Clear All Filters
  </Button>
</div>
```

---

## Loading States

### Card Grid Loading

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
    <div key={i} className="bg-surface rounded-clay-xl overflow-hidden shadow-clay-md">
      <Skeleton className="aspect-square" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-clay-sm" />
          <Skeleton className="h-8 flex-1 rounded-clay-sm" />
        </div>
        <Skeleton className="h-10 w-full rounded-clay" />
      </div>
    </div>
  ))}
</div>
```

---

## Responsive Behavior

### Mobile (375px - 767px)

- Single column cards
- Compact card layout
- Drawer filters
- Bottom nav visible
- Hide sidebar

### Tablet (768px - 1023px)

- 2-column grid
- Sidebar filters visible
- Standard card sizes
- Sort bar inline

### Desktop (1024px+)

- 4-column grid
- Full sidebar with filters
- Large card hover effects
- All features visible
