/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const existing = app.findCollectionByNameOrId("egg_nfts");
    if (existing) {
      console.log("Migration 1778335324: egg_nfts already exists, skipping");
      return;
    }
  } catch (e) {
    // Not found, proceed with creation
  }

    try {
    const c = app.findCollectionByNameOrId("egg_nfts")
    if (c) return
  } catch(e) {}

  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      }
    ],
    "id": "pbc_1228445674",
    "indexes": [],
    "listRule": null,
    "name": "egg_nfts",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1228445674");

  return app.delete(collection);
})
