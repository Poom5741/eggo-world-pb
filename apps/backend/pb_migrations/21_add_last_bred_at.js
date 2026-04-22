/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add last_bred_at field to animal_nfts collection
 * Phase 21-03: Cooldown Display & Validation
 * 
 * Adds tracking for when an animal was last used for breeding
 * to enforce the 48-hour breeding cooldown period.
 */

migrate((app) => {
  const collection = app.findCollectionByNameOrId("animal_nfts")
  
  // Add last_bred_at field
  collection.fields.add(new Field({
    name: "last_bred_at",
    type: "date",
    required: false,
    unique: false,
    options: {}
  }))
  
  return app.saveCollection(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("animal_nfts")
  
  // Remove last_bred_at field on rollback
  const field = collection.fields.findOne("last_bred_at")
  if (field) {
    collection.fields.remove(field)
  }
  
  return app.saveCollection(collection)
})
