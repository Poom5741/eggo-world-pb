/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
            "name": "egg_consumption_logs",
        "type": "base",
        "system": false,
        "schema": [
            {
                "name": "egg",
                "type": "relation",
                "required": true,
                "options": {
                    "collectionId": "egg_nfts",
                    "cascadeDelete": true,
                    "minSelect": null,
                    "maxSelect": 1
                }
            },
            {
                "name": "food_items",
                "type": "json",
                "required": true,
                "options": {}
            },
            {
                "name": "food_type_distribution",
                "type": "json",
                "required": false,
                "options": {}
            },
            {
                "name": "total_food_count",
                "type": "number",
                "required": true,
                "options": {
                    "min": 0
                }
            },
            {
                "name": "fed_at",
                "type": "date",
                "required": true
            }
        ],
        "indexes": [
            "CREATE INDEX idx_consumption_egg ON egg_consumption_logs (egg)"
        ],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": null,
        "updateRule": null,
        "deleteRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("egg_consumption_logs")

  return app.deleteCollection(collection)
})
