## MintEggModal Component - 2026-04-13

**Claymorphism Design Pattern:**
- DialogContent with `variant="clay"` for clay overlay effect
- Classes: `clay-card` or `clay-card-inset` for volume styling
- `rounded-[2rem]` for large rounded corners
- `shadow-clay-lg` for clay shadow effect
- Color scheme: `bg-[var(--surface-container)]`, `text-[var(--on-surface)]`

**Modal Structure:**
- DialogHeader with variant="clay" for bordered header
- DialogFooter with variant="clay" for bordered footer
- Centered icon in rounded container with shadow
- Price display in clay-card-inset for depth
- Error alerts use `variant="destructive"` with custom colors

**Key Implementation:**
- Call `onSuccess()` callback BEFORE `onClose()` - ensures parent component can process success state
- Use Dialog's `onOpenChange` for cancel handling
- All styling uses CSS variables from globals.css Jules design system

**Components Used:**
- Dialog (shadcn/ui with clay variant)
- Button, Input, Label (shadcn/ui)
- Alert (shadcn/ui with destructive variant)
- Lucide icons: Egg, Loader2, CheckCircle2, AlertCircle

