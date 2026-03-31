/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // Rename wallet_address -> wallet
  const walletField = collection.schema.getFieldByName("wallet_address")
  if (walletField) {
    walletField.name = "wallet"
    walletField.id = "text_wallet"
    collection.schema.updateField(walletField)
  }

  // Rename publicKey -> daccPublickey
  const publicKeyField = collection.schema.getFieldByName("publicKey")
  if (publicKeyField) {
    publicKeyField.name = "daccPublickey"
    publicKeyField.id = "text_daccPublickey"
    publicKeyField.pattern = "^daccPublickey_"
    collection.schema.updateField(publicKeyField)
  }

  // Remove encrypted_private_key field
  const encryptedKeyField = collection.schema.getFieldByName("encrypted_private_key")
  if (encryptedKeyField) {
    collection.schema.removeField(encryptedKeyField.id)
  }

  // Add new pin field (hidden)
  const pinField = new SchemaField()
  pinField.id = "text_pin"
  pinField.name = "pin"
  pinField.type = "text"
  pinField.hidden = true
  pinField.required = false
  pinField.system = false
  collection.schema.addField(pinField)

  // Add new eip7702_enabled field (bool)
  const eip7702EnabledField = new SchemaField()
  eip7702EnabledField.id = "bool_eip7702_enabled"
  eip7702EnabledField.name = "eip7702_enabled"
  eip7702EnabledField.type = "bool"
  eip7702EnabledField.hidden = false
  eip7702EnabledField.required = false
  eip7702EnabledField.system = false
  collection.schema.addField(eip7702EnabledField)

  // Add new eip7702_hash field (text)
  const eip7702HashField = new SchemaField()
  eip7702HashField.id = "text_eip7702_hash"
  eip7702HashField.name = "eip7702_hash"
  eip7702HashField.type = "text"
  eip7702HashField.hidden = false
  eip7702HashField.required = false
  eip7702HashField.system = false
  collection.schema.addField(eip7702HashField)

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // Rollback: rename wallet -> wallet_address
  const walletField = collection.schema.getFieldByName("wallet")
  if (walletField) {
    walletField.name = "wallet_address"
    walletField.id = "text_wallet_address"
    collection.schema.updateField(walletField)
  }

  // Rollback: rename daccPublickey -> publicKey
  const daccField = collection.schema.getFieldByName("daccPublickey")
  if (daccField) {
    daccField.name = "publicKey"
    daccField.id = "text_publicKey"
    daccField.pattern = "^0x[a-fA-F0-9]{40}$"
    collection.schema.updateField(daccField)
  }

  // Rollback: add back encrypted_private_key
  const encryptedKeyField = new SchemaField()
  encryptedKeyField.id = "text_encrypted_private_key"
  encryptedKeyField.name = "encrypted_private_key"
  encryptedKeyField.type = "text"
  encryptedKeyField.hidden = true
  encryptedKeyField.required = false
  encryptedKeyField.system = false
  collection.schema.addField(encryptedKeyField)

  // Rollback: remove pin field
  const pinField = collection.schema.getFieldByName("pin")
  if (pinField) {
    collection.schema.removeField(pinField.id)
  }

  // Rollback: remove eip7702_enabled field
  const eip7702EnabledField = collection.schema.getFieldByName("eip7702_enabled")
  if (eip7702EnabledField) {
    collection.schema.removeField(eip7702EnabledField.id)
  }

  // Rollback: remove eip7702_hash field
  const eip7702HashField = collection.schema.getFieldByName("eip7702_hash")
  if (eip7702HashField) {
    collection.schema.removeField(eip7702HashField.id)
  }

  return dao.saveCollection(collection)
})
