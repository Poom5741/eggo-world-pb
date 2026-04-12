/// <reference path="../pb_data/types.d.ts" />

// Hook to initialize sync_state collection on app startup
// Runs early (after 00-config) to ensure sync_state exists for 21-sync-events

console.log("Checking sync_state collection on bootstrap...");

// Check if sync_state collection exists
let syncStateCollection = null;
try {
  syncStateCollection = $app.findCollectionByNameOrId("sync_state");
  console.log("✓ sync_state collection already exists:", syncStateCollection.id);
} catch (err) {
  // Collection doesn't exist, create it
  console.log("sync_state collection not found, creating...");
  
  const collection = new Collection({
    "name": "sync_state",
    "type": "base",
    "system": false,
    "schema": [
      {name: "id", type: "text", required: true, unique: true, primary: true, options: {pattern: "^config$"}},
      {name: "lastProcessedBlock", type: "number", required: true, options: {min: 0}},
      {name: "lastSyncTimestamp", type: "date", required: false},
      {name: "status", type: "select", required: false, options: {values: ["syncing", "error", "idle"]}},
      {name: "last_error", type: "text", required: false},
      {name: "failed_block", type: "number", required: false}
    ]
  });
  
  try {
    $app.save(collection);
    console.log("✓ sync_state collection created:", collection.id);
  } catch (saveErr) {
    console.error("✗ Failed to save sync_state collection:", saveErr.message);
  }
}

// Check if config record exists, create if missing
try {
  const states = $app.findRecordsByFilter("sync_state", 'id = "config"', "", 1, 0);
  if (states.length === 0) {
    console.log("sync_state config record not found, creating...");
    const stateRecord = $app.newRecord("sync_state");
    stateRecord.set("id", "config");
    stateRecord.set("lastProcessedBlock", 0);
    stateRecord.set("status", "idle");
    $app.save(stateRecord);
    console.log("✓ Initial sync_state config record created");
  }
} catch (err) {
  console.error("Error checking/creating sync_state config record:", err.message);
}

console.log("sync_state initialization complete");
