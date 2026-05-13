/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Check if field already exists before adding
  const existing = collection.fields.find(f => f.name === "encrypted_private_key")
  if (existing) {
    console.log("Migration 1778432411: encrypted_private_key already exists, skipping")
    return
  }

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "json3749025120",
    "maxSize": 0,
    "name": "encrypted_private_key",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
  } catch(e) {}
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("json3749025120")

  return app.save(collection)
})
