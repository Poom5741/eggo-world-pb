# Move Mint to Eggs Modal

## TL;DR

Move mint functionality from `/mint` page to a modal on `/eggs` page. Add "Mint New Egg" button to eggs page header. Redesign to match present claymorphism style. Delete old `/mint` and `/mint/food` pages.

## Context

Current `/mint` page is standalone. User wants integrated experience - mint new eggs directly from eggs inventory page via modal. Better UX, consistent with present design system.

## Work Objectives

### Core Objective

Extract mint functionality into reusable modal component, integrate into `/eggs` page, delete old routes.

### Concrete Deliverables

- `MintEggModal` component (claymorphism design)
- Updated `/eggs/page.tsx` with button + modal integration
- Deleted `/mint/` directory
- Deleted `/mint/food/` directory
- All references updated to remove `/mint` routes

### Definition of Done

- [ ] Click "Mint New Egg" on eggs page opens modal
- [ ] Modal matches claymorphism design (not pixel style)
- [ ] Mint flow works end-to-end (payment → success → close modal)
- [ ] Eggs list refreshes after successful mint
- [ ] `/mint` and `/mint/food` pages 404
- [ ] No broken references to old routes

### Must NOT Have

- Pixel font styling in modal
- Standalone `/mint` page remaining
- `/mint/food` page remaining
- Redirects to `/mint` anywhere in codebase

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: NO (manual QA via browser)
- **Framework**: bun test available

### QA Policy

Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/`.

---

## Execution Strategy

### Wave 1: Extract & Create (Foundation)

1. Create MintEggModal component
2. Copy mint logic from /mint/page.tsx
3. Redesign to claymorphism style
4. Add close/refresh callbacks

### Wave 2: Integrate (Frontend)

5. Add "Mint New Egg" button to /eggs page header
6. Integrate MintEggModal into /eggs page
7. Wire up state management (modal open/close)

### Wave 3: Cleanup (Delete & Update)

8. Delete /mint/page.tsx
9. Delete /mint/food/page.tsx
10. Update all /mint references in codebase
11. Update quick-actions href (already done, verify)

### Wave 4: Verification

12. Build check
13. Type check
14. Manual QA: Click mint button → complete flow → verify eggs refresh

---

## TODOs

- [ ] **1. Create MintEggModal component**

  **What to do:**
  - Create `components/mint/MintEggModal.tsx`
  - Extract logic from `/mint/page.tsx`:
    - MINT_PRICE = 25
    - Payment flow (USDT)
    - Referrer input
    - Success/error states
  - Redesign UI to claymorphism:
    - Replace pixel font with font-headline
    - Use clay-card, shadow-clay-lg, rounded-[2rem]
    - Match present color scheme
  - Props: `isOpen`, `onClose`, `onSuccess`
  - On success: call onSuccess callback

  **Must NOT do:**
  - Keep pixel font styling
  - Use old design tokens

  **Recommended Agent Profile:**
  - Category: visual-engineering
  - Skills: frontend-design

  **Parallelization:**
  - Can Run In Parallel: NO (blocks Task 2)
  - Blocks: Task 2

  **References:**
  - `app/mint/page.tsx` - source logic to extract
  - `components/ui/dialog.tsx` - shadcn Dialog component
  - `components/ui/card.tsx` - Card component patterns

  **Acceptance Criteria:**
  - [ ] Modal component created
  - [ ] Claymorphism styling applied
  - [ ] All mint logic functional
  - [ ] Props interface defined

  **QA Scenarios:**

  ```
  Scenario: Modal opens with claymorphism design
    Tool: Playwright
    Steps:
      1. Navigate to /eggs (mock auth if needed)
      2. Click "Mint New Egg" button
      3. Verify modal opens
      4. Check styling: clay-card, rounded-[2rem], font-headline
    Expected: Modal visible with present design
    Evidence: .sisyphus/evidence/task-1-modal-design.png
  ```

  **Commit:** YES
  - Message: `feat: add MintEggModal component with claymorphism design`
  - Files: `components/mint/MintEggModal.tsx`

---

- [ ] **2. Integrate modal into /eggs page**

  **What to do:**
  - Modify `app/eggs/page.tsx`
  - Add "Mint New Egg" button to header (top right)
  - Add state: `isMintModalOpen`, `setIsMintModalOpen`
  - Render MintEggModal component
  - On mint success: close modal + refresh eggs list

  **Must NOT do:**
  - Remove existing eggs functionality

  **Recommended Agent Profile:**
  - Category: quick
  - Skills: sphere-frontend

  **Parallelization:**
  - Can Run In Parallel: NO (depends on Task 1)
  - Blocked By: Task 1

  **References:**
  - `app/eggs/page.tsx` - target file
  - `components/dashboard/quick-actions.tsx` - button style reference

  **Acceptance Criteria:**
  - [ ] Button added to eggs page header
  - [ ] Modal integration works
  - [ ] Success callback refreshes eggs

  **QA Scenarios:**

  ```
  Scenario: Complete mint flow end-to-end
    Tool: Playwright
    Steps:
      1. Navigate to /eggs
      2. Click "Mint New Egg"
      3. Complete mint form (test wallet)
      4. Submit
      5. Wait for success
      6. Verify modal closes
      7. Verify eggs list refreshes
    Expected: New egg appears in list
    Evidence: .sisyphus/evidence/task-2-mint-flow.png
  ```

  **Commit:** YES
  - Message: `feat: integrate mint modal into eggs page`
  - Files: `app/eggs/page.tsx`

---

- [ ] **3. Delete /mint directory**

  **What to do:**
  - Delete `app/mint/page.tsx`
  - Delete `app/mint/food/page.tsx`
  - Remove `app/mint/` directory

  **Must NOT do:**
  - Delete if referenced elsewhere (check first)

  **Recommended Agent Profile:**
  - Category: quick

  **Parallelization:**
  - Can Run In Parallel: YES (with Task 4)

  **Acceptance Criteria:**
  - [ ] /mint directory deleted
  - [ ] /mint/food directory deleted

  **QA Scenarios:**

  ```
  Scenario: Old routes return 404
    Tool: Bash (curl)
    Steps:
      1. curl http://localhost:3000/mint
      2. curl http://localhost:3000/mint/food
    Expected: Both return 404
    Evidence: terminal output
  ```

  **Commit:** YES
  - Message: `chore: remove old /mint and /mint/food pages`
  - Files: deleted files

---

- [ ] **4. Update all /mint references**

  **What to do:**
  - Find all `router.push('/mint')` references
  - Find all `href='/mint'` references
  - Update to appropriate new routes:
    - Post-mint redirect: `/eggs` (eggs list)
    - Navigation: `/eggs` + trigger modal
  - Update quick-actions.tsx if needed

  **Files to check:**
  - `components/header.tsx` - nav items
  - `components/HatchReveal.tsx` - any mint refs
  - `app/dashboard/page.tsx` - dashboard links
  - Any other push('/mint') calls

  **Recommended Agent Profile:**
  - Category: quick

  **Parallelization:**
  - Can Run In Parallel: YES (with Task 3)

  **Acceptance Criteria:**
  - [ ] No references to /mint remain
  - [ ] No references to /mint/food remain

  **QA Scenarios:**

  ```
  Scenario: No broken mint links
    Tool: grep
    Steps:
      1. grep -r "'/mint'" --include="*.tsx" apps/web/
    Expected: Only /eggs references found
    Evidence: grep output
  ```

  **Commit:** YES
  - Message: `fix: update all /mint references to /eggs`
  - Files: all modified files

---

- [ ] **5. Update quick-actions button**

  **What to do:**
  - Verify quick-actions.tsx has correct href
  - Change from `/mint` to `/eggs` (modal trigger)
  - Or remove mint button entirely (since it's on eggs page now)

  **Recommended Agent Profile:**
  - Category: quick

  **Acceptance Criteria:**
  - [ ] Quick action button points to /eggs OR removed

  **Commit:** YES (if changed)

---

- [ ] **6. Build & type check**

  **What to do:**
  - Run `bun run build`
  - Run `bunx tsc --noEmit`
  - Fix any errors

  **Acceptance Criteria:**
  - [ ] Build succeeds
  - [ ] Type check passes

  **Commit:** NO (verification only)

---

- [ ] **7. Final manual QA**

  **What to do:**
  - Navigate to /eggs
  - Click "Mint New Egg"
  - Verify modal design matches present
  - Complete test mint
  - Verify modal closes
  - Verify eggs refresh

  **Acceptance Criteria:**
  - [ ] Flow works end-to-end
  - [ ] Design matches present
  - [ ] No console errors

---

## Commit Strategy

1. Create MintEggModal component
2. Integrate into eggs page
3. Delete old mint pages + update references
4. Final verification

---

## Success Criteria

### Verification Commands

```bash
curl http://localhost:3000/eggs        # 200
curl http://localhost:3000/mint        # 404
curl http://localhost:3000/mint/food   # 404
grep -r "'/mint'" apps/web/            # No results (except comments)
```

### Final Checklist

- [ ] "Mint New Egg" button on /eggs page
- [ ] Modal opens with claymorphism design
- [ ] Mint flow works end-to-end
- [ ] Modal closes + refreshes eggs on success
- [ ] /mint and /mint/food return 404
- [ ] No broken links to old routes
- [ ] Build passes
- [ ] Type check passes
