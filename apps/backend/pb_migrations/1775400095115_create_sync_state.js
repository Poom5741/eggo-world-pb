/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection()

  collection.id = ""
  collection.name = "sync_state"
  collection.type = "base"
  collection.system = false
  collection.schema = [{"name":"id","type":"text","required":true,"unique":true,"options":{"pattern":"^config$"}},{"name":"lastProcessedBlock","type":"number","required":true,"unique":false,"options":{"min":0,"max":null,"default":0}},{"name":"lastSyncTimestamp","type":"date","required":false,"unique":false,"options":{}},{"name":"status","type":"select","required":true,"unique":false,"options":{"maxSelect":1,"values":["syncing","error","idle"]}},{"name":"last_error","type":"text","required":false,"unique":false,"options":{"pattern":""}},{"name":"failed_block","type":"number","required":false,"unique":false,"options":{"min":0,"max":null}}]
  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null
  collection.options = {}

  return db.save(collection)
}, (db) => {
  const collection = db.findCollectionByNameOrId("sync_state")
  return db.delete(collection)
})
