# Card Component Variants — Usage Guide

**Created:** 2026-04-23  
**Phase:** 25 (UX/UI Consistency Audit Fixes)  
**Component:** `@/components/ui/card`

---

## Available Variants

### Standard Variant

| Variant   | Style                               | Use Case                              |
| --------- | ----------------------------------- | ------------------------------------- |
| `default` | Flat card with border and shadow-sm | Simple content containers, list items |

### Claymorphism Variants

| Variant   | Shadow          | Padding    | Border Radius   | Background         | Use Case                                      |
| --------- | --------------- | ---------- | --------------- | ------------------ | --------------------------------------------- |
| `clay`    | shadow-clay-lg  | p-clay-lg  | rounded-clay-md | bg-clay-volume-md  | Standard cards, dashboard widgets, list items |
| `clay-lg` | shadow-clay-xl  | p-clay-xl  | rounded-clay-lg | bg-clay-volume-lg  | Featured content, hero cards                  |
| `clay-xl` | shadow-clay-2xl | p-clay-2xl | rounded-clay-xl | bg-clay-volume-2xl | Modal dialogs, prominent sections             |

---

## Usage Patterns

### Standard Card (Simple Container)

```tsx
<Card variant="default" className="mt-4">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text.</CardDescription>
  </CardHeader>
  <CardContent>Content goes here.</CardContent>
</Card>
```

### Claymorphism Card (Dashboard Widget)

```tsx
<Card variant="clay" className="mt-4">
  <CardHeader>
    <CardTitle>Activity Feed</CardTitle>
  </CardHeader>
  <CardContent>
    <TransactionHistory />
  </CardContent>
</Card>
```

### Featured Card (Hero Section)

```tsx
<Card variant="clay-lg" className="mt-8">
  <CardHeader>
    <CardTitle>Featured Collection</CardTitle>
    <CardDescription>New arrivals this week.</CardDescription>
  </CardHeader>
  <CardContent>{/* Featured content */}</CardContent>
  <CardFooter className="flex justify-end">
    <Button variant="default" size="sm">
      View All
    </Button>
  </CardFooter>
</Card>
```

### Modal/Dialog Card (Prominent)

```tsx
<Card variant="clay-xl" className="mx-auto max-w-lg mt-12 p-8">
  <CardHeader>
    <CardTitle className="text-2xl">Confirmation</CardTitle>
  </CardHeader>
  <CardContent>{/* Dialog content */}</CardContent>
  <CardFooter className="flex justify-end gap-4">
    <Button variant="outline" size="sm">
      Cancel
    </Button>
    <Button variant="destructive" size="sm">
      Confirm
    </Button>
  </CardFooter>
</Card>
```

---

## Migration from Div-Based Cards

### Before ❌ (Div-based with hardcoded styles)

```tsx
<div className="bg-surface-container rounded-xl clay-card p-6 shadow-clay-md">
  <h3>Title</h3>
  <p>Description</p>
</div>
```

### After ✅ (Using Card component)

```tsx
<Card variant="clay" className="shadow-clay-md">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Description text.</CardContent>
</Card>
```

---

## Anti-Patterns (NEVER USE)

- ❌ Using `clay-card` class directly on div elements instead of `<Card variant="clay">`
- ❌ Mixing `shadow-lg/md` with `shadow-clay-*` in same component
- ❌ Creating custom card styles with hardcoded padding/border-radius values
- ❌ Using `bg-surface-container` without proper shadow system

---

**Component File:** `apps/web/components/ui/card.tsx`  
**Phase:** 25 (UX/UI Consistency Audit Fixes)
