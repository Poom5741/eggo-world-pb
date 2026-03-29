# apps/web/components/ui - shadcn/ui Components

**Generated:** 2026-03-29
**Parent:** See `apps/web/AGENTS.md`

## OVERVIEW

57 shadcn/ui primitive components with new-york style, Lucide icons, and Tailwind CSS 4.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add component | Run `bunx shadcn@latest add` | Don't create manually |
| Modify theme | `components.json` | new-york style, neutral color |
| Modify base styles | Component files in `components/ui/` | Tailwind v4 syntax |
| Add icons | Import from `lucide-react` | Consistent icon library |

## CONVENTIONS

**Component Installation:**
```bash
bunx shadcn@latest add {component-name}
# Examples:
bunx shadcn@latest add button
bunx shadcn@latest add dialog
bunx shadcn@latest add form
```

**Theme Configuration:**
- Style: `new-york`
- Base color: `neutral`
- RSC enabled: `true`
- Icon library: `lucide`

**Styling:**
- Tailwind CSS 4 (no config files needed)
- CSS variables for theming
- Radix UI primitives as base

## ANTI-PATTERNS

**DO NOT:**
- Manually create component files in `components/ui/`
- Import multiple icon libraries (use only lucide-react)
- Override shadcn styles with inline styles
- Remove Radix dependencies from components

## COMMANDS

```bash
# Add new shadcn component
bunx shadcn@latest add {name}

# List available components
bunx shadcn@latest add

# Update existing components
bunx shadcn@latest add {name} --overwrite
```

## NOTES

**File count:** 57 components (extensive library available)

**Location:** All components in single `components/ui/` directory (not nested)

**Usage:** Import from `@/components/ui/{component}`
