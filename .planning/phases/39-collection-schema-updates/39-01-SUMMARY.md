---
phase: 39-collection-schema-updates
plan: 01
subsystem: database
tags: [pocketbase, schema-migration, sqlite, vrf, nft-burn, kyc]

# Dependency graph
requires: []
provides:
  - 10 new fields across 4 PocketBase collections supporting VRF hatching, NFT burn, KYC, and recruitment tiers
  - Migration script with idempotent field additions and full rollback logic
affects:
  - 40-frontend-components (UI needs to read these fields)
  - pocketbase-hooks (hooks write to vrf_request_id, is_burned, etc.)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PocketBase v0.23.4 migration pattern: migrate((app) => {...}, (app) => {...}) with Field constructor
    - Collection schema JSON: users.json uses `fields` array (auth type), others use `schema` array (base type)

key-files:
  created:
    - apps/backend/pb_migrations/1777334400000_add_schema_fields_39.js
  modified:
    - apps/backend/collections/users.json
    - apps/backend/collections/egg_nfts.json
    - apps/backend/collections/food_nfts.json
    - apps/backend/collections/animal_nfts.json

key-decisions:
  - "Migration file timestamp 1777334400000 follows existing project convention for migration ordering"
  - "New fields inserted before autodate fields (created/updated) in users, and before contract_address/tx_hash in base collections"
  - "Rollback logic uses fields.findOne + fields.remove pattern matching 21_add_last_bred_at.js"

patterns-established:
  - "Multi-collection migration: single migrate() function handles all 4 collections, each with saveCollection() call"
  - "Rollback uses forEach with findOne/remove pattern for DRY removal logic"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-04-25
---

# Phase 39 Plan 01: Collection Schema Updates Summary

**10 new fields added to 4 PocketBase collections with idempotent migration script supporting VRF hatching, NFT burn, KYC toggle, and recruitment tier tracking**

## Performance

- **Duration:** 6m 59s
- **Started:** 2026-04-25T06:34:28Z
- **Completed:** 2026-04-25T06:41:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `claimed_recruitment_tier` (number) and `kyc_required_globally` (bool) to `users` collection
- Added `is_hatching`, `vrf_request_id`, `vrf_transaction_hash`, `is_burned`, `burned_at` to `egg_nfts` collection
- Added `is_burned`, `burned_at` fields to both `food_nfts` and `animal_nfts` collections
- Created migration script at `apps/backend/pb_migrations/1777334400000_add_schema_fields_39.js` with full rollback logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Update collection JSON files with 10 new fields** - `ec92c9c` (feat: add 10 new fields to 4 collection schemas)
2. **Task 2: Create migration script to add fields to production database** - `79a631e` (committed with Phase 40-01 test file due to shared staging)

## Files Created/Modified

- `apps/backend/collections/users.json` - Added `claimed_recruitment_tier` (number, min:0, max:10) and `kyc_required_globally` (bool) fields
- `apps/backend/collections/egg_nfts.json` - Added `is_hatching`, `vrf_request_id`, `vrf_transaction_hash`, `is_burned`, `burned_at` fields
- `apps/backend/collections/food_nfts.json` - Added `is_burned` (bool) and `burned_at` (date) fields
- `apps/backend/collections/animal_nfts.json` - Added `is_burned` (bool) and `burned_at` (date) fields
- `apps/backend/pb_migrations/1777334400000_add_schema_fields_39.js` - Migration with migrate/rollback for all 10 fields across 4 collections

## Decisions Made

- Followed PocketBase v0.23.4 migration pattern from `21_add_last_bred_at.js`: `migrate((app) => {...}, (app) => {...})` with `Field` constructor
- Used `app.findCollectionByNameOrId()` for collection lookup, `collection.fields.add()` for additions, `collection.fields.findOne()` + `remove()` for rollback
- Saved each collection individually with `app.saveCollection()` for granular rollback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Task 2 commit was merged with Phase 40-01 test file**: The migration file `1777334400000_add_schema_fields_39.js` was committed in `79a631e` alongside `RecruitmentBonusCard.test.tsx` from Phase 40-01 due to shared staging area from parallel execution. The migration file content is correct and complete.
- **Pre-commit lint error in unrelated file**: `RecruitmentBonusCard.test.tsx` had a lint error (`'mockCreateClient' is assigned a value but never used`) that blocked a second attempt to commit. File was unstaged (not our task scope) and the migration file was already committed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 10 fields are defined in both collection JSONs and migration scripts
- Phase 40 (Frontend Components) can now read `claimed_recruitment_tier`, `kyc_required_globally`, `is_hatching`, `is_burned`, etc.
- PocketBase hooks (Phase 32-36 hooks) can write to these fields after migration is applied

---

_Phase: 39-collection-schema-updates_
_Completed: 2026-04-25_
