/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
            "name": "food_nfts",
        "type": "base",
        "system": false,
        "schema": [
            {
                "name": "food_id",
                "type": "number",
                "required": true,
                "unique": true,
                "options": {
                    "min": 0
                }
            },
            {
                "name": "token_id",
                "type": "number",
                "required": true,
                "unique": false,
                "options": {
                    "min": 0
                }
            },
            {
                "name": "owner",
                "type": "relation",
                "required": true,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": true,
                    "minSelect": null,
                    "maxSelect": 1
                }
            },
            {
                "name": "food_type",
                "type": "select",
                "required": true,
                "options": {
                    "values": [
                        "grain",
                        "fish",
                        "insects",
                        "herb"
                    ]
                }
            },
            {
                "name": "is_consumed",
                "type": "bool",
                "required": true,
                "default": false
            },
            {
                "name": "consumed_by_egg",
                "type": "relation",
                "required": false,
                "options": {
                    "collectionId": "egg_nfts",
                    "cascadeDelete": false,
                    "minSelect": null,
                    "maxSelect": 1
                }
            },
            {
                "name": "contract_address",
                "type": "text",
                "required": true,
                "options": {
                    "pattern": "^0x[a-fA-F0-9]{40}$"
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
                "name": "minted_at",
                "type": "date",
                "required": true
            }
        ],
        "indexes": [
            "CREATE INDEX idx_food_nfts_owner ON food_nfts (owner)",
            "CREATE INDEX idx_food_nfts_is_consumed ON food_nfts (is_consumed)",
            "CREATE INDEX idx_food_nfts_food_type ON food_nfts (food_type)"
        ],
        "listRule": "@request.auth.id != '' && owner.id = @request.auth.id",
        "viewRule": "@request.auth.id != '' && owner.id = @request.auth.id",
        "createRule": null,
        "updateRule": "@request.auth.id != '' && owner.id = @request.auth.id",
        "deleteRule": null
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("food_nfts")

  return app.deleteCollection(collection)
})
