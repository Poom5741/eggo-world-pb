/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection()

  collection.id = ""
  collection.name = "undefined"
  collection.type = "undefined"
  collection.system = false
  collection.schema = undefined
  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null
  collection.options = {}

  return db.save(collection)
}, (db) => {
  const collection = db.findCollectionByNameOrId("wallet_configs")
  return db.delete(collection)
})
