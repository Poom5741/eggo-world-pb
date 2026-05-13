/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Check if collection already exists (prevent crash loop on restart)
  try {
    const existing = app.findCollectionByNameOrId("user_wallets");
    if (existing) {
      console.log("Migration 1778333408: user_wallets already exists, skipping");
      return;
    }
  } catch (e) {
    // Not found, proceed with creation
  }

    try {
    const c = app.findCollectionByNameOrId("user_wallets")
    if (c) return
  } catch(e) {}

  const collection = new Collection({
    "createRule": "",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.id = user_id.id",
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
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2085571223",
        "max": 42,
        "min": 42,
        "name": "wallet_address",
        "pattern": "^0x[a-fA-F0-9]{40}$",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2809058197",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number1746998080",
        "max": 999999999,
        "min": 0,
        "name": "usdt_balance",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1419245119",
        "max": 999999999,
        "min": 0,
        "name": "total_earned",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number840409451",
        "max": 999999999,
        "min": 0,
        "name": "total_spent",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3553804248",
        "max": 999999999,
        "min": 0,
        "name": "total_withdrawn",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4046267527",
        "max": 0,
        "min": 0,
        "name": "last_deposit_amount",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2584526344",
        "max": 0,
        "min": 0,
        "name": "last_deposit_tx",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number1698883950",
        "max": null,
        "min": null,
        "name": "last_deposit_block",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3151680843",
        "max": null,
        "min": null,
        "name": "last_polled_block",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "date2494126311",
        "max": "",
        "min": "",
        "name": "last_transaction_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_2582638688",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_user_wallets_user_id` ON `user_wallets` (`user_id`)",
      "CREATE INDEX `idx_user_wallets_wallet_address` ON `user_wallets` (`wallet_address`)"
    ],
    "listRule": "user_id = @request.auth.id",
    "name": "user_wallets",
    "system": false,
    "type": "base",
    "updateRule": "user_id = @request.auth.id",
    "viewRule": "user_id = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2582638688");

  return app.delete(collection);
})
