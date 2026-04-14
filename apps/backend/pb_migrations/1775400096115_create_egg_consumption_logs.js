/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection()

  unmarshal({
    "id": "7000000004",
    "listRule": "user_id = @request.auth.id",
    "viewRule": "user_id = @request.auth.id",
    "createRule": "",
    "updateRule": null,
    "deleteRule": "@request.auth.id != \"\" && @request.auth.id = user_id.id",
    "name": "egg_consumption_logs",
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2852385566",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      }
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = new Collection()
  unmarshal({ "id": "7000000004" }, collection)
  return app.delete(collection)
})
