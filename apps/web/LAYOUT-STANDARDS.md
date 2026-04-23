# Layout Standards — Container Width Guidelines

**Created:** 2026-04-23  
**Phase:** 25 (UX/UI Consistency Audit Fixes)  
**Status:** Approved

---

## Approved Container Widths

### Standard Container Widths

| Class       | Width  | Use Case                         | Example Files                         |
| ----------- | ------ | -------------------------------- | ------------------------------------- |
| `max-w-7xl` | 1440px | Landing/marketing pages only     | `app/page.tsx` (landing)              |
| `max-w-6xl` | 1280px | **STANDARD** for main app pages  | Wallet, dashboard, marketplace detail |
| `max-w-4xl` | 896px  | Settings/wallet management pages | `app/settings/page.tsx`               |
| `max-w-2xl` | 672px  | Action forms and dialogs         | Feed dialog, hatch reveal modal       |

---

## Migration Rules

### Upgrade to `max-w-6xl` (STANDARD)

Files using `max-w-4xl` that are NOT settings/wallet pages:

- `app/marketplace/[id]/MarketplaceDetailClient.tsx` — Marketplace detail page
- `app/support/page.tsx` — Support page (not a settings page)
- `app/eggs/[id]/feed/FeedEggClient.tsx` — Feed interaction (action form → keep as is)
- `app/wallet/page.tsx` — Wallet management (keep as max-w-4xl per rules above)
- `app/eggs/[id]/hatch/HatchEggClient.tsx` — Hatch reveal (action form → keep as is)

### Keep `max-w-4xl` (Settings/Wallet Pages)

Files that should remain at `max-w-4xl`:

- `app/settings/page.tsx` — Settings page
- `app/wallet/page.tsx` — Wallet management page

---

## Container Padding Utility

All main container wrappers should use consistent horizontal padding:

```css
/* Defined in globals.css */
.container-padding {
  @apply px-4 md:px-6 lg:px-8;
}
```

Usage pattern:

```tsx
<div className="max-w-6xl mx-auto container-padding">{/* Content */}</div>
```

---

## Anti-Patterns (NEVER USE)

- ❌ Ad-hoc width values like `w-[1200px]` or custom max-widths
- ❌ Mixing multiple container widths in a single page without justification
- ❌ Using `max-w-full` for content containers (breaks responsive behavior)

---

## Verification Checklist

Before merging layout changes:

- [ ] All landing/marketing pages use `max-w-7xl`
- [ ] All main app pages use `max-w-6xl`
- [ ] Settings/wallet pages use `max-w-4xl`
- [ ] Action forms/dialogs use `max-w-2xl` or smaller
- [ ] No ad-hoc width values in codebase
- [ ] Container padding utility applied consistently

---

**Owner:** Frontend Team  
**Reviewers:** @frontend-leads
