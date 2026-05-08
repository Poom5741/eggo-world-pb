# Phase 25: UX/UI Consistency Audit Fixes - Context

**Gathered:** 2026-04-23  
**Status:** Ready for planning  
**Milestone:** v0.0.9 Feature Completion & Cloudflare Deployment  
**Priority:** P2 (lowest priority in v0.0.9)

## Phase Boundary

Fix 93 distinct UX/UI consistency violations identified in comprehensive audit report (`docs/UX-UI-AUDIT-REPORT.md`).

Organized into three tiers:

- **P0 Critical:** Emoji removal, hardcoded colors, accessibility violations (21 issues)
- **P1 High Priority:** Container widths, typography chaos, component standardization
- **P2 Technical Debt:** Shadow/border consistency, layout wrappers, interactions polish

## Implementation Decisions

### the agent's Discretion

All implementation choices are at the agent's discretion — use existing shadcn/ui patterns, Lucide icons, and CSS variables from `globals.css`. Follow the migration guide in the audit report.

## Existing Code Insights

**Current State:**

- 26 page files with inconsistencies across the platform
- 16 files using emojis instead of Lucide icons
- 8 files with 23 hardcoded color violations
- Button component has inconsistent variants
- Layout wrappers use 6 different max-width values
- Typography uses multiple approaches (151 matches)

**Key Files to Modify:**

- `apps/web/components/icons/species-icons.tsx` — Create centralized icon mapper
- `apps/web/app/globals.css` — Add missing CSS variables for line-color, tier colors
- All page files in `apps/web/app/` — Replace emojis with icons
- `apps/web/components/ui/button.tsx` — Add line/tier variants

**Constraints:**

- Must maintain backward compatibility during migration
- ESLint rule should be additive (not break existing builds)
- CSS variables must work with Tailwind 4's `@theme inline` syntax

## Specific Ideas

1. **Icon Mapper Pattern:** Create `species-icons.tsx` with mapping from emoji to Lucide icons — allows gradual migration without breaking changes
2. **CSS Variable Migration:** Add missing variables (`--color-line`, `--color-tier-*`) then migrate hardcoded values progressively
3. **Accessibility Priority:** Form labels and keyboard navigation fixes should be done first (WCAG 2.2 AA compliance)
4. **Dead Links Strategy:** Use Option C from audit — create `/app/coming-soon/page.tsx` placeholder for all `href="#"` links
5. **Container Standardization:** Adopt `max-w-6xl` as the standard for main app pages (15+ files already use it)

## Deferred Ideas

- Full automated ESLint emoji detection rule (manual audit sufficient for now)
- Design system token extraction to separate file (out of scope for this phase)
- Automated color contrast checker integration into CI/CD
