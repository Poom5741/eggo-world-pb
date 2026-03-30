migrate((db) => {
  const collection = new Collection({
    "name": "egg_nfts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "name": "egg_id",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "name": "owner",
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
        "name": "token_id",
        "type": "number",
        "required": true,
        "unique": true,
        "options": {
          "min": 0,
          "max": null
        }
      },
      {
        "name": "contract_address",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "pattern": "^0x[a-fA-F0-9]{40}$"
        }
      },
      {
        "name": "food_count",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": 0,
          "max": 10
        }
      },
      {
        "name": "is_hatched",
        "type": "bool",
        "required": true,
        "unique": false,
        "options": {}
      },
      {
        "name": "rarity_seed",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      },
      {
        "name": "referral_chain",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "name": "tx_hash",
        "type": "text",
        "required": true,
        "unique": true,
        "options": {
          "pattern": "^0x[a-fA-F0-9]{64}$"
        }
      },
      {
        "name": "minted_at",
        "type": "date",
        "required": true,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_egg_nfts_owner` ON `egg_nfts` (`owner`)",
      "CREATE INDEX `idx_egg_nfts_token_id` ON `egg_nfts` (`token_id`)",
      "CREATE INDEX `idx_egg_nfts_is_hatched` ON `egg_nfts` (`is_hatched`)"
    ],
    "listRule": "@request.auth.id != \"\" && owner = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && owner = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && owner = @request.auth.id",
    "updateRule": "@request.auth.id != \"\" && owner = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && owner = @request.auth.id",
    "options": {}
  });

  return db.saveCollection(collection);
}, (db) => {
  const collection = db.findCollectionByNameOrId("egg_nfts");
  return db.deleteCollection(collection);
});
