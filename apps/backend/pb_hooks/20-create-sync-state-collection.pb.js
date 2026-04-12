/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook to create sync_state collection if it doesn't exist
 * Must run BEFORE 21-sync-events.pb.js (hence prefix "20-")
 */

// Hook runs on app bootstrap
((e) => {
  console.log("Checking sync_state collection...");
  
  // Try to find the collection
  try {
    const collection = e.app.findCollectionByNameOrId("sync_state");
    console.log("✓ sync_state collection exists:", collection.id);
    
    // Collection exists, no need to create
    return;
  } catch (err) {
    console.log("sync_state collection not found, creating...");
  }
  
  // Collection doesn't exist, create it
  const migration = ((app) => {
    const collection = new Collection({
      "name": "sync_state",
      "type": "base",
      "system": false,
      "schema": [
        {name: "id", type: "text", required: true, unique: true, options: {pattern: "^config$"}},
        {name: "lastProcessedBlock", type: "number", required: true, options: {min: 0}},
        {name: "lastSyncTimestamp", type: "date", required: false},
        {name: "status", type: "select", required: false, options: {values: ["syncing", "error", "idle"]}},
        {name: "last_error", type: "text", required: false},
        {name: "failed_block", type: "number", required: false}
      ]
    });

    try {
      app.save(collection);
      console.log("✓ sync_state collection created successfully:", collection.id);
      
      // Create initial config record
      const stateRecord = app.newRecord("sync_state");
      stateRecord.set("id", "config");
      stateRecord.set("lastProcessedBlock", 0);
      stateRecord.set("status", "idle");
      app.save(stateRecord);
      console.log("✓ Initial sync_state config record created");
    } catch (saveErr) {
      console.error("✗ Failed to create sync_state collection:", saveErr.message);
    }
  });
  
  migration(e.app);
  
  console.log("Sync state collection setup complete");
})({app: $app})
