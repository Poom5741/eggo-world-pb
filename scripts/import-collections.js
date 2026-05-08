#!/usr/bin/env node
/**
 * Import PocketBase collection schemas from apps/backend/collections/full-collection.json
 *
 * Used by `scripts/e2e-bootstrap.sh` to bootstrap a fresh local PocketBase
 * without running the legacy pb_migrations (some of which are written in
 * the pre-0.23 schema format and fail on a clean DB).
 *
 * Requires:
 *   POCKETBASE_URL    (default: http://localhost:8091)
 *   PB_ADMIN_EMAIL    (required)
 *   PB_ADMIN_PASSWORD (required)
 */

const fs = require('fs')
const path = require('path')

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8091'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('❌ PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required')
  process.exit(1)
}

const COLLECTIONS_FILE = path.join(
  __dirname,
  '..',
  'apps',
  'backend',
  'collections',
  'full-collection.json'
)

async function authSuperuser() {
  const res = await fetch(
    `${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
    }
  )
  if (!res.ok) {
    throw new Error(`Admin auth failed (${res.status}): ${await res.text()}`)
  }
  return (await res.json()).token
}

async function importCollections(token, collections) {
  // PocketBase 0.23.x: PUT /api/collections/import
  // Body: { collections: [...], deleteMissing: false }
  const res = await fetch(`${POCKETBASE_URL}/api/collections/import`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({
      collections,
      deleteMissing: false,
    }),
  })
  if (!res.ok) {
    throw new Error(`Collections import failed (${res.status}): ${await res.text()}`)
  }
}

async function main() {
  console.log(`📥 Importing collections from ${path.basename(COLLECTIONS_FILE)}`)
  console.log(`   Target: ${POCKETBASE_URL}`)

  const raw = fs.readFileSync(COLLECTIONS_FILE, 'utf-8')
  const all = JSON.parse(raw)
  // Exclude PocketBase system collections (name starts with `_` or system:true).
  // Importing them with modified rules fails on 0.23.x ("System collection API rule cannot be changed").
  const collections = all.filter(
    (c) => !c.system && typeof c.name === 'string' && !c.name.startsWith('_')
  )
  // E2E quirk: PB 0.23.x treats `false` as blank for required bool fields,
  // which breaks the sync script that creates fresh records with is_hatched:false etc.
  // Force required=false on every bool field during import — only affects local E2E DB.
  for (const col of collections) {
    if (!Array.isArray(col.fields)) continue
    for (const f of col.fields) {
      if (f && f.type === 'bool' && f.required) {
        f.required = false
      }
    }
  }
  console.log(`   Count : ${collections.length}/${all.length} collection(s) (system excluded, bool required→false)`)

  const token = await authSuperuser()
  console.log('   ✓ admin authenticated')

  await importCollections(token, collections)
  console.log('   ✓ collections imported')

  // Smoke check
  const check = await fetch(`${POCKETBASE_URL}/api/collections?perPage=200`, {
    headers: { Authorization: token },
  })
  if (check.ok) {
    const data = await check.json()
    const names = (data.items || []).map((c) => c.name).sort()
    console.log(`   ✓ ${names.length} collections active: ${names.join(', ')}`)
  }
}

main().catch((err) => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
