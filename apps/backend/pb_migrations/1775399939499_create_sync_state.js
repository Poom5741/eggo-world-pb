/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
            "name": "sync_state",
        "type": "base",
        "system": false,
        "schema": [
            {
                "name": "id",
                "type": "text",
                "required": true,
                "unique": true,
                "options": {
                    "pattern": "^config$"
                }
            },
            {
                "name": "lastProcessedBlock",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null,
                    "default": 0
                }
            },
            {
                "name": "lastSyncTimestamp",
                "type": "date",
                "required": false,
                "unique": false,
                "options": {}
            },
            {
                "name": "status",
                "type": "select",
                "required": true,
                "unique": false,
                "options": {
                    "maxSelect": 1,
                    "values": [
                        "syncing",
                        "error",
                        "idle"
                    ]
                }
            },
            {
                "name": "last_error",
                "type": "text",
                "required": false,
                "unique": false,
                "options": {
                    "pattern": ""
                }
            },
            {
                "name": "failed_block",
                "type": "number",
                "required": false,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null
                }
            }
        ],
        "indexes": [],
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "options": {}
  }, collection)

  return app.createCollection(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("sync_state")

  return app.deleteCollection(collection)
})
