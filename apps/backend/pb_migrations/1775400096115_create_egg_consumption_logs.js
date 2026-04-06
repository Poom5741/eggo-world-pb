/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection()

  collection.id = ""
  collection.name = "egg_consumption_logs"
  collection.type = "base"
  collection.system = false
  collection.schema = [{"name":"egg","type":"relation","required":true,"options":{"collectionId":"egg_nfts","cascadeDelete":true,"minSelect":null,"maxSelect":1}},{"name":"food_items","type":"json","required":true,"options":{}},{"name":"food_type_distribution","type":"json","required":false,"options":{}},{"name":"total_food_count","type":"number","required":true,"options":{"min":0}},{"name":"fed_at","type":"date","required":true}]
  collection.listRule = "@request.auth.id != "" && egg.owner = @request.auth.id"
  collection.viewRule = "@request.auth.id != "" && egg.owner = @request.auth.id"
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = "@request.auth.id != "" && egg.owner = @request.auth.id"
  collection.options = {}

  return db.save(collection)
}, (db) => {
  const collection = db.findCollectionByNameOrId("egg_consumption_logs")
  return db.delete(collection)
})
