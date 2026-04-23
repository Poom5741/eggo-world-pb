/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
    "id": "resale_listings",
    "name": "resale_listings",
    "type": "base",
    "system": false,
    "fields": [
      {
        "hidden": false,
        "id": "number_animal_id",
        "name": "animal_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_seller_id",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "seller_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number_price",
        "name": "price",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "hidden": false,
        "id": "select_rarity",
        "maxSelect": 1,
        "name": "rarity",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["common", "rare", "epic", "legendary"]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_species",
        "max": 0,
        "min": 0,
        "name": "species",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_generation",
        "name": "generation",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 1
      },
      {
        "hidden": false,
        "id": "select_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["active", "sold", "cancelled"]
      },
      {
        "hidden": false,
        "id": "date_listed_at",
        "max": "",
        "min": "",
        "name": "listed_at",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date_sold_at",
        "max": "",
        "min": "",
        "name": "sold_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_buyer_id",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "buyer_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_resale_listings_status` ON `resale_listings` (`status`)",
      "CREATE INDEX `idx_resale_listings_seller` ON `resale_listings` (`seller_id`)",
      "CREATE INDEX `idx_resale_listings_animal` ON `resale_listings` (`animal_id`)",
      "CREATE INDEX `idx_resale_listings_rarity` ON `resale_listings` (`rarity`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id = seller_id",
    "deleteRule": "@request.auth.id = seller_id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = new Collection()
  unmarshal({ "id": "resale_listings" }, collection)
  return app.delete(collection)
})
