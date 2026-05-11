/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2087227935",
    "max": 42,
    "min": 0,
    "name": "wallet",
    "pattern": "^0x[a-fA-F0-9]{40}$",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3165842018",
    "max": 255,
    "min": 0,
    "name": "daccPublickey",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3045404147",
    "max": 255,
    "min": 0,
    "name": "pin",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
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
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number2506234467",
    "max": 999999999,
    "min": 0,
    "name": "usdt_total_earned",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number2835654510",
    "max": 999999999,
    "min": 0,
    "name": "total_direct_recruits",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number2524586163",
    "max": 999999999,
    "min": 0,
    "name": "lifetime_food_items",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3238228162",
    "max": 50,
    "min": 0,
    "name": "highest_tier_reached",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3654089031",
    "max": 0,
    "min": 0,
    "name": "referral_chain",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2809179246",
    "max": 0,
    "min": 0,
    "name": "externalId",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text2087227935")

  // remove field
  collection.fields.removeById("text3165842018")

  // remove field
  collection.fields.removeById("text3045404147")

  // remove field
  collection.fields.removeById("number1746998080")

  // remove field
  collection.fields.removeById("number2506234467")

  // remove field
  collection.fields.removeById("number2835654510")

  // remove field
  collection.fields.removeById("number2524586163")

  // remove field
  collection.fields.removeById("text3238228162")

  // remove field
  collection.fields.removeById("text3654089031")

  // remove field
  collection.fields.removeById("text2809179246")

  return app.save(collection)
})
