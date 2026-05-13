/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_212027000");

  // This delete has been deactivated — it was deleting the production collection.
  // The collection is needed by the frontend. Keep it alive.
  console.log("Migration 1778335598: transaction_logs delete skipped (collection preserved)");
  return;
}, (app) => {
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
    "id": "pbc_212027000",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "transaction_logs",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
})
