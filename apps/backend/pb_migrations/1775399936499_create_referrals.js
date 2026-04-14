/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
    "id": "7000000001",
    "listRule": "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    "createRule": "",
    "updateRule": null,
    "deleteRule": "@request.auth.id != \"\" && @request.auth.id = user_id.id",
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
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4283758321",
        "maxLength": null,
        "minLength": null,
        "name": "referrer_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4283758322",
        "maxLength": null,
        "minLength": null,
        "name": "referee_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      }
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = new Collection()
  unmarshal({ "id": "7000000001" }, collection)
  return app.delete(collection)
})
