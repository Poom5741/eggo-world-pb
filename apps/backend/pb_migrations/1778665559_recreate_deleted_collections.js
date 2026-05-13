migrate((app) => {
  // Recreate collections that were accidentally deleted by migration 1778335598
  
  // 1. Commission Records
  try {
    app.findCollectionByNameOrId("commission_records")
    console.log("commission_records already exists, skipping recreation")
  } catch(e) {
    const commCol = new Collection({
      "createRule": null,
      "deleteRule": null,
      "fields": [
        {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
        {"cascadeDelete":false,"collectionId":"_pb_users_auth_","hidden":false,"id":"relation_user","maxSelect":1,"minSelect":0,"name":"user","presentable":false,"required":true,"system":false,"type":"relation"},
        {"hidden":false,"id":"number_level","max":null,"min":null,"name":"level","onlyInt":false,"presentable":false,"required":false,"system":false,"type":"number"},
        {"hidden":false,"id":"number_amount","max":null,"min":null,"name":"amount","onlyInt":false,"presentable":false,"required":false,"system":false,"type":"number"},
        {"autogeneratePattern":"","hidden":false,"id":"text_tx_hash","max":0,"min":0,"name":"tx_hash","pattern":"","presentable":false,"primaryKey":false,"required":false,"system":false,"type":"text"},
        {"hidden":false,"id":"bool_claimed","max":null,"min":null,"name":"claimed","onlyInt":false,"presentable":false,"required":false,"system":false,"type":"bool"},
        {"autogeneratePattern":"","hidden":false,"id":"text_claimed_at","max":0,"min":0,"name":"claimed_at","pattern":"","presentable":false,"primaryKey":false,"required":false,"system":false,"type":"text"}
      ],
      "id": "pbc_1600475772",
      "indexes": ["CREATE INDEX idx_commission_user ON commission_records(user)"],
      "listRule": "user = @request.auth.id",
      "name": "commission_records",
      "system": false,
      "type": "base",
      "updateRule": null,
      "viewRule": "user = @request.auth.id"
    })
    app.save(commCol)
    console.log("Created commission_records collection")
  }
  
  // 2. Transaction Logs
  try {
    app.findCollectionByNameOrId("transaction_logs")
    console.log("transaction_logs already exists, skipping recreation")
  } catch(e) {
    const txCol = new Collection({
      "createRule": null,
      "deleteRule": null,
      "fields": [
        {"autogeneratePattern":"[a-z0-9]{15}","hidden":false,"id":"text3208210256","max":15,"min":15,"name":"id","pattern":"^[a-z0-9]+$","presentable":false,"primaryKey":true,"required":true,"system":true,"type":"text"},
        {"cascadeDelete":false,"collectionId":"_pb_users_auth_","hidden":false,"id":"rel_user","maxSelect":1,"minSelect":0,"name":"user","presentable":false,"required":true,"system":false,"type":"relation"},
        {"autogeneratePattern":"","hidden":false,"id":"text_tx_hash","max":0,"min":0,"name":"tx_hash","pattern":"","presentable":false,"primaryKey":false,"required":false,"system":false,"type":"text"},
        {"autogeneratePattern":"","hidden":false,"id":"text_tx_type","max":0,"min":0,"name":"tx_type","pattern":"","presentable":false,"primaryKey":false,"required":false,"system":false,"type":"text"},
        {"autogeneratePattern":"","hidden":false,"id":"text_status","max":0,"min":0,"name":"status","pattern":"","presentable":false,"primaryKey":false,"required":false,"system":false,"type":"text"},
        {"hidden":false,"id":"number_amount","max":null,"min":null,"name":"amount","onlyInt":false,"presentable":false,"required":false,"system":false,"type":"number"},
        {"hidden":false,"id":"date_created","max":"","min":"","name":"created","presentable":false,"required":false,"system":false,"type":"date"}
      ],
      "id": "pbc_212027000",
      "indexes": [],
      "listRule": "@request.auth.id != \"\"",
      "name": "transaction_logs",
      "system": false,
      "type": "base",
      "updateRule": null,
      "viewRule": "@request.auth.id != \"\""
    })
    app.save(txCol)
    console.log("Created transaction_logs collection")
  }
}, (app) => {
  try { app.findCollectionByNameOrId("commission_records"); app.delete(app.findCollectionByNameOrId("commission_records")) } catch(e) {}
  try { app.findCollectionByNameOrId("transaction_logs"); app.delete(app.findCollectionByNameOrId("transaction_logs")) } catch(e) {}
})
