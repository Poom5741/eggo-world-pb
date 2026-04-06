/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection()

  collection.id = ""
  collection.name = "transactions"
  collection.type = "base"
  collection.system = false
  collection.schema = [{"name":"user","type":"relation","required":true,"unique":false,"options":{"collectionId":"_pb_users_auth_","cascadeDelete":true,"minSelect":null,"maxSelect":1,"displayFields":null}},{"name":"type","type":"select","required":true,"unique":false,"options":{"maxSelect":1,"values":["mint_egg","mint_food","buy_nft","sell_nft","commission","withdraw","feed_egg","hatch_egg"]}},{"name":"amount_usdt","type":"number","required":true,"unique":false,"options":{"min":null,"max":null,"noDecimal":false}},{"name":"status","type":"select","required":true,"unique":false,"options":{"maxSelect":1,"values":["confirmed","pending","failed"]}},{"name":"tx_hash","type":"text","required":false,"unique":false,"options":{"pattern":"^0x[a-fA-F0-9]{64}$"}},{"name":"description","type":"text","required":false,"unique":false,"options":{"pattern":""}}]
  collection.listRule = "user = @request.auth.id"
  collection.viewRule = "user = @request.auth.id"
  collection.createRule = "user = @request.auth.id"
  collection.updateRule = null
  collection.deleteRule = null
  collection.options = {}

  return db.save(collection)
}, (db) => {
  const collection = db.findCollectionByNameOrId("transactions")
  return db.delete(collection)
})
