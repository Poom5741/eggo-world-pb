/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "wallet_configs",
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "name": "wallet_configs",
    "type": "base",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_config_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_config_key",
        "max": 50,
        "min": 1,
        "name": "key",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_config_value",
        "max": null,
        "min": null,
        "name": "value",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_config_description",
        "max": 255,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate_config_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_config_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_wallet_configs_key` ON `wallet_configs` (`key`)"
    ],
    "system": false
  })

  app.save(collection)

  // Create initial WITHDRAWAL_FEE config (5%)
  const configCollection = app.findCollectionByNameOrId("wallet_configs")
  const configRecord = new Record(configCollection)
  configRecord.set("key", "WITHDRAWAL_FEE")
  configRecord.set("value", 0.05)
  configRecord.set("description", "Withdrawal fee percentage (default 5%)")
  app.save(configRecord)

  return null
}, (app) => {
  const collection = app.findCollectionByNameOrId("wallet_configs")
  return app.delete(collection)
})
