/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Add usdt_balance field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_usdt_balance",
    "max": 999999999,
    "min": 0,
    "name": "usdt_balance",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // Add usdt_total_earned field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_usdt_total_earned",
    "max": 999999999,
    "min": 0,
    "name": "usdt_total_earned",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // Add total_direct_recruits field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_total_direct_recruits",
    "max": 999999,
    "min": 0,
    "name": "total_direct_recruits",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // Add lifetime_food_items field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "number_lifetime_food_items",
    "max": 999999,
    "min": 0,
    "name": "lifetime_food_items",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // Add highest_tier_reached field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "text_highest_tier",
    "max": 20,
    "min": 0,
    "name": "highest_tier_reached",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // Add referrer_id relation field
  collection.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation_referrer_id",
    "maxSelect": 1,
    "minSelect": null,
    "name": "referrer_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // Add indexes
  collection.indexes = [
    ...collection.indexes,
    "CREATE INDEX `idx_users_referrer_id` ON `users` (`referrer_id`)",
    "CREATE INDEX `idx_users_highest_tier` ON `users` (`highest_tier_reached`)"
  ]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Remove fields
  collection.fields.removeById("number_usdt_balance")
  collection.fields.removeById("number_usdt_total_earned")
  collection.fields.removeById("number_total_direct_recruits")
  collection.fields.removeById("number_lifetime_food_items")
  collection.fields.removeById("text_highest_tier")
  collection.fields.removeById("relation_referrer_id")

  // Remove indexes
  collection.indexes = collection.indexes.filter(idx => 
    !idx.includes("idx_users_referrer_id") && !idx.includes("idx_users_highest_tier")
  )

  return app.save(collection)
})
