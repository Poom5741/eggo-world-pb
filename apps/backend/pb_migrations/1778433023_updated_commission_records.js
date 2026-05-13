/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
  const collection = app.findCollectionByNameOrId("pbc_1600475772")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool_claimed",
    "name": "claimed",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
  } catch(e) { console.log("Migration 1778433023: update skipped - " + e.message); }
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1600475772")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool_claimed",
    "name": "claimed",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
