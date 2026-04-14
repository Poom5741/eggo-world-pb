/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
    "id": "7000000001",
    "listRule": "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    "createRule": "",
    "updateRule": null,
    "deleteRule": null,
    "name": "referrals",
    "type": "base",
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
      }
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = new Collection()

  unmarshal({
    "id": "7000000001"
  }, collection)

  return app.delete(collection)
})
