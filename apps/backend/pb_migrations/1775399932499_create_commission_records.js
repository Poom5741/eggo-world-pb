/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
            "name": "commission_records",
        "type": "base",
        "system": false,
        "schema": [
            {
                "name": "user",
                "type": "relation",
                "required": true,
                "unique": false,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            },
            {
                "name": "level",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 1,
                    "max": 4
                }
            },
            {
                "name": "amount",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null
                }
            },
            {
                "name": "tx_hash",
                "type": "text",
                "required": true,
                "unique": false,
                "options": {
                    "pattern": "^0x[a-fA-F0-9]{64}$"
                }
            },
            {
                "name": "from_egg",
                "type": "relation",
                "required": true,
                "unique": false,
                "options": {
                    "collectionId": "egg_nfts_collection_id",
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1,
                    "displayFields": null
                }
            },
            {
                "name": "claimed",
                "type": "bool",
                "required": true,
                "unique": false,
                "options": {}
            },
            {
                "name": "claimed_at",
                "type": "date",
                "required": false,
                "unique": false,
                "options": {}
            },
            {
                "name": "block_number",
                "type": "number",
                "required": false,
                "unique": false,
                "options": {
                    "min": 0,
                    "max": null
                }
            }
        ],
        "indexes": [
            "CREATE INDEX `idx_commission_user` ON `commission_records` (`user`)",
            "CREATE INDEX `idx_commission_claimed` ON `commission_records` (`claimed`)",
            "CREATE INDEX `idx_commission_tx_hash` ON `commission_records` (`tx_hash`)"
        ],
        "listRule": "@request.auth.id != \"\" && user = @request.auth.id",
        "viewRule": "@request.auth.id != \"\" && user = @request.auth.id",
        "createRule": null,
        "updateRule": "@request.auth.id != \"\" && user = @request.auth.id",
        "deleteRule": null,
        "options": {}
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("commission_records")

  return app.deleteCollection(collection)
})
