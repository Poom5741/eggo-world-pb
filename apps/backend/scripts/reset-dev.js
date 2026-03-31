#!/usr/bin/env bun
/**
 * Development Database Reset Script
 *
 * WARNING: Only use in development environment!
 * This will delete all data and reset migrations.
 */

import { $ } from "bun";

console.log("🔄 Resetting development database...\n");

// 1. Stop PocketBase
console.log("1️⃣  Stopping PocketBase...");
try {
  await $`pgrep -f pocketbase | xargs kill`.quiet();
  console.log("   ✅ PocketBase stopped\n");
} catch {
  console.log("   ℹ️  PocketBase was not running\n");
}

// 2. Delete database file
console.log("2️⃣  Deleting database file...");
try {
  await $`rm -f pb_data/data.db`.quiet();
  await $`rm -f pb_data/data.db-shm`.quiet();
  await $`rm -f pb_data/data.db-wal`.quiet();
  console.log("   ✅ Database deleted\n");
} catch {
  console.log("   ℹ️  No database file found\n");
}

// 3. Run migrations
console.log("3️⃣  Running migrations...");
await $`./pocketbase migrate up`;
console.log("   ✅ Migrations applied\n");

// 4. Start PocketBase
console.log("4️⃣  Starting PocketBase...");
const pb = $`./pocketbase serve`;
pb.exiting.then(() => console.log("\n✅ PocketBase started"));

console.log("\n✨ Development database reset complete!");
console.log("📝 PocketBase is running on http://localhost:8090");
