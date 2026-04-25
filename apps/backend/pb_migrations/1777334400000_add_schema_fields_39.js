/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add 10 new schema fields across 4 collections
 * Phase 39-01: Collection Schema Updates
 *
 * Adds fields to support VRF hatching, NFT burn, KYC toggle, and recruitment tier tracking.
 *
 * Collections updated:
 *   - users: claimed_recruitment_tier (number), kyc_required_globally (bool)
 *   - egg_nfts: is_hatching (bool), vrf_request_id (text), vrf_transaction_hash (text),
 *               is_burned (bool), burned_at (date)
 *   - food_nfts: is_burned (bool), burned_at (date)
 *   - animal_nfts: is_burned (bool), burned_at (date)
 */

migrate((app) => {
  // === users collection ===
  const usersCollection = app.findCollectionByNameOrId("users")

  usersCollection.fields.add(
    new Field({
      name: "claimed_recruitment_tier",
      type: "number",
      required: false,
      unique: false,
      options: {
        min: 0,
        max: 10,
      },
    })
  )

  usersCollection.fields.add(
    new Field({
      name: "kyc_required_globally",
      type: "bool",
      required: false,
      unique: false,
      options: {},
    })
  )

  app.saveCollection(usersCollection)

  // === egg_nfts collection ===
  const eggNftsCollection = app.findCollectionByNameOrId("egg_nfts")

  eggNftsCollection.fields.add(
    new Field({
      name: "is_hatching",
      type: "bool",
      required: false,
      unique: false,
      options: {},
    })
  )

  eggNftsCollection.fields.add(
    new Field({
      name: "vrf_request_id",
      type: "text",
      required: false,
      unique: false,
      options: {},
    })
  )

  eggNftsCollection.fields.add(
    new Field({
      name: "vrf_transaction_hash",
      type: "text",
      required: false,
      unique: false,
      options: {},
    })
  )

  eggNftsCollection.fields.add(
    new Field({
      name: "is_burned",
      type: "bool",
      required: false,
      unique: false,
      options: {},
    })
  )

  eggNftsCollection.fields.add(
    new Field({
      name: "burned_at",
      type: "date",
      required: false,
      unique: false,
      options: {},
    })
  )

  app.saveCollection(eggNftsCollection)

  // === food_nfts collection ===
  const foodNftsCollection = app.findCollectionByNameOrId("food_nfts")

  foodNftsCollection.fields.add(
    new Field({
      name: "is_burned",
      type: "bool",
      required: false,
      unique: false,
      options: {},
    })
  )

  foodNftsCollection.fields.add(
    new Field({
      name: "burned_at",
      type: "date",
      required: false,
      unique: false,
      options: {},
    })
  )

  app.saveCollection(foodNftsCollection)

  // === animal_nfts collection ===
  const animalNftsCollection = app.findCollectionByNameOrId("animal_nfts")

  animalNftsCollection.fields.add(
    new Field({
      name: "is_burned",
      type: "bool",
      required: false,
      unique: false,
      options: {},
    })
  )

  animalNftsCollection.fields.add(
    new Field({
      name: "burned_at",
      type: "date",
      required: false,
      unique: false,
      options: {},
    })
  )

  return app.saveCollection(animalNftsCollection)
}, (app) => {
  // === ROLLBACK: Remove fields from all 4 collections ===

  // --- users collection ---
  const usersCollection = app.findCollectionByNameOrId("users")
  let field = usersCollection.fields.findOne("claimed_recruitment_tier")
  if (field) {
    usersCollection.fields.remove(field)
  }
  field = usersCollection.fields.findOne("kyc_required_globally")
  if (field) {
    usersCollection.fields.remove(field)
  }
  app.saveCollection(usersCollection)

  // --- egg_nfts collection ---
  const eggNftsCollection = app.findCollectionByNameOrId("egg_nfts")
  ;["is_hatching", "vrf_request_id", "vrf_transaction_hash", "is_burned", "burned_at"].forEach(
    (name) => {
      const f = eggNftsCollection.fields.findOne(name)
      if (f) {
        eggNftsCollection.fields.remove(f)
      }
    }
  )
  app.saveCollection(eggNftsCollection)

  // --- food_nfts collection ---
  const foodNftsCollection = app.findCollectionByNameOrId("food_nfts")
  ;["is_burned", "burned_at"].forEach((name) => {
    const f = foodNftsCollection.fields.findOne(name)
    if (f) {
      foodNftsCollection.fields.remove(f)
    }
  })
  app.saveCollection(foodNftsCollection)

  // --- animal_nfts collection ---
  const animalNftsCollection = app.findCollectionByNameOrId("animal_nfts")
  ;["is_burned", "burned_at"].forEach((name) => {
    const f = animalNftsCollection.fields.findOne(name)
    if (f) {
      animalNftsCollection.fields.remove(f)
    }
  })

  return app.saveCollection(animalNftsCollection)
})