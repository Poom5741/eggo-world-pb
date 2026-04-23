# Button Component Variants — Usage Guide

**Created:** 2026-04-23  
**Phase:** 25 (UX/UI Consistency Audit Fixes)  
**Component:** `@/components/ui/button`

---

## Available Variants

### Primary Action Buttons

| Variant   | Use Case                         | Example                 |
| --------- | -------------------------------- | ----------------------- |
| `default` | Standard primary actions (CTAs)  | "Join", "Buy Now"       |
| `clay`    | Platform claymorphism style      | "Hatch Now", "Feed Egg" |
| `line`    | LINE authentication buttons only | "Login with LINE"       |

### Tier/Badge Related Actions

| Variant | Use Case                   | Color                 |
| ------- | -------------------------- | --------------------- |
| `tier1` | Seedling tier (10 items)   | Emerald 500 (#10b981) |
| `tier2` | Grower tier (100 items)    | Amber 500 (#f59e0b)   |
| `tier3` | Farmer tier (1,000 items)  | Violet 500 (#8b5cf6)  |
| `tier4` | Master tier (10,000 items) | Pink 500 (#ec4899)    |

### Secondary/Supporting Actions

| Variant       | Use Case                           | Example                    |
| ------------- | ---------------------------------- | -------------------------- |
| `secondary`   | Supporting actions                 | "Cancel", "Back"           |
| `outline`     | Tertiary actions, outlined buttons | "View Details"             |
| `ghost`       | Icon-only or subtle actions        | Close buttons in dialogs   |
| `destructive` | Danger/destroy actions             | "Delete", "Remove Listing" |

---

## Available Sizes

### Standard Sizes

| Size      | Height        | Padding     | Use Case                        |
| --------- | ------------- | ----------- | ------------------------------- |
| `sm`      | h-8 (32px)    | px-3 py-1.5 | Compact buttons, inline actions |
| `default` | h-9 (36px)    | px-4 py-2   | Standard form buttons           |
| `lg`      | h-10 (40px)   | px-6 py-2   | Hero CTAs, prominent actions    |
| `icon`    | size-9 (36px) | —           | Icon-only buttons               |

### Claymorphism Sizes

| Size      | Height | Padding | Border Radius   | Use Case              |
| --------- | ------ | ------- | --------------- | --------------------- |
| `clay-sm` | h-8    | px-4    | rounded-clay-sm | Compact clay buttons  |
| `clay-md` | h-10   | px-6    | rounded-clay    | Standard clay buttons |
| `clay-lg` | h-12   | px-8    | rounded-clay-md | Prominent clay CTAs   |
| `clay-xl` | h-14   | px-10   | rounded-clay-lg | Hero clay actions     |

---

## Usage Patterns

### Primary CTA (Claymorphism)

```tsx
<Button variant="clay" size="clay-lg">
  Hatch Now
</Button>
```

### LINE Login Button

```tsx
<Button variant="line" size="clay-xl">
  <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
    ...
  </svg>
  Login with LINE
</Button>
```

### Tier Action Button

```tsx
<Button variant="tier3" size="lg">
  Claim Tier Reward
</Button>
```

### Secondary Action

```tsx
<Button variant="outline" size="sm">
  Cancel
</Button>
```

---

## Anti-Patterns (NEVER USE)

- ❌ Hardcoded button styles: `<button className="bg-[var(--primary)] text-white px-6 py-2">`
- ❌ Hardcoded LINE color: `<button className="bg-[#00C300] text-white">`
- ❌ Creating new inline button variants instead of extending Button component

---

**Component File:** `apps/web/components/ui/button.tsx`  
**Phase:** 25 (UX/UI Consistency Audit Fixes)
