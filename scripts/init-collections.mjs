#!/usr/bin/env node
/**
 * PocketBase Collection Init Script
 * Creates or updates all Eggo World collections
 */

import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from wallet-api/.env
const envPath = path.join(__dirname, "../wallet-api/.env");
const backendEnvPath = path.join(__dirname, "../apps/backend/.env");

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, "utf8");
    envContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const idx = line.indexOf("=");
        if (idx > 0) {
          const key = line.substring(0, idx).trim();
          const value = line.substring(idx + 1).trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnvFile(envPath);
loadEnvFile(backendEnvPath);

const PB_URL = process.env.POCKETBASE_URL || "https://pb.eggoworld.io";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

// LINE OAuth2 credentials (for production provider config)
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "";
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in wallet-api/.env");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function authenticateAdmin() {
  try {
    const auth = await pb.send("/api/collections/_superusers/auth-with-password", {
      method: "POST",
      body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    pb.authStore.save(auth?.token, auth?.record);
    console.log("✅ Admin authenticated");
    return true;
  } catch (e) {
    console.error("❌ Admin authentication failed:", e.message || e);
    return false;
  }
}

// Collection ID cache
const collectionIds = {};

async function getCollectionId(name) {
  if (collectionIds[name]) return collectionIds[name];
  try {
    const col = await pb.collections.getOne(name);
    collectionIds[name] = col.id;
    return col.id;
  } catch (e) {
    console.error(`❌ Could not get collection ID for ${name}`);
    throw e;
  }
}

async function upsertCollection(name, schema) {
  try {
    // Check if exists and get existing fields
    const existing = await pb.collections.getOne(name);
    
    // Build merged schema preserving system fields, autodate fields, and existing field IDs
    const existingFields = existing.fields || [];
    const systemFields = existingFields.filter(f => f.system || f.type === 'autodate');
    const customFields = schema.fields || [];
    
    // For each custom field, check if it already exists (preserve ID)
    const mergedFields = customFields.map(newField => {
      const existingField = existingFields.find(f => f.name === newField.name);
      if (existingField) {
        // Preserve the existing field's ID
        return { ...newField, id: existingField.id };
      }
      return newField;
    });
    
    // Add system fields if not already present
    const finalFields = [...systemFields];

    // Ensure autodate fields exist for all collections (defense against SDK/server version mismatches)
    const autodateFields = [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false, presentable: false, system: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true, presentable: false, system: false }
    ];
    for (const adField of autodateFields) {
      if (!finalFields.find(f => f.name === adField.name)) {
        finalFields.push(adField);
      }
    }

    for (const field of mergedFields) {
      if (!finalFields.find(f => f.name === field.name)) {
        finalFields.push(field);
      }
    }
    
    const updateSchema = { ...schema, fields: finalFields };
    
    // Update
    try {
      await pb.collections.update(name, updateSchema);
      console.log(`✅ Updated: ${name}`);
    } catch (updateError) {
      console.error(`❌ Update error for ${name}:`, updateError.message);
      if (updateError.data) console.error("   Data:", JSON.stringify(updateError.data, null, 2));
      if (schema.indexes) {
        console.log(`⚠️  Retrying ${name} without indexes...`);
        const { indexes, ...rest } = updateSchema;
        try {
          await pb.collections.update(name, rest);
          console.log(`⚠️  Updated (indexes skipped): ${name}`);
        } catch (retryError) {
          console.error(`❌ Retry failed for ${name}:`, retryError.message);
          if (retryError.data) console.error("   Data:", JSON.stringify(retryError.data, null, 2));
          throw retryError;
        }
      } else {
        throw updateError;
      }
    }
  } catch (e) {
    if (e.status === 404) {
      // Create new - ensure autodate fields are included
      const createFields = schema.fields || [];
      const autodateFields = [
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false, presentable: false, system: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true, presentable: false, system: false }
      ];
      const finalCreateFields = [...createFields];
      for (const adField of autodateFields) {
        if (!finalCreateFields.find(f => f.name === adField.name)) {
          finalCreateFields.push(adField);
        }
      }
      const createSchema = { ...schema, fields: finalCreateFields };

      try {
        await pb.collections.create({ ...createSchema, name });
        console.log(`✅ Created: ${name}`);
      } catch (createError) {
        console.error(`❌ Create error for ${name}:`, createError.message);
        if (createError.data) console.error("   Data:", JSON.stringify(createError.data, null, 2));
        if (schema.indexes) {
          console.log(`⚠️  Retrying ${name} creation without indexes...`);
          const { indexes, ...rest } = createSchema;
          try {
            await pb.collections.create({ ...rest, name });
            console.log(`⚠️  Created (indexes skipped): ${name}`);
          } catch (retryError) {
            console.error(`❌ Retry create failed for ${name}:`, retryError.message);
            if (retryError.data) console.error("   Data:", JSON.stringify(retryError.data, null, 2));
            throw retryError;
          }
        } else {
          throw createError;
        }
      }
    } else {
      console.error(`❌ Failed to process ${name}:`, e.message);
      if (e.data) console.error("   Data:", JSON.stringify(e.data, null, 2));
      // Don't throw - continue with other collections
      return false;
    }
  }
}

async function main() {
  console.log("🚀 Starting PocketBase collection initialization...\n");

  if (!(await authenticateAdmin())) {
    process.exit(1);
  }

  // Pre-fetch collection IDs for relations
  console.log("📋 Resolving collection IDs...");
  const usersId = "_pb_users_auth_";

  // 1) Update users (auth) collection
  console.log("\n🔄 Updating users collection...");
  try {
    const existing = await pb.collections.getOne("users");
    
    // Build custom fields preserving existing IDs
    const customFields = [
      { name: "name", type: "text", required: false, max: 255 },
      { name: "avatar", type: "file", required: false, maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"] },
      { name: "externalId", type: "text", required: true },
      { name: "wallet", type: "text", required: false, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "pin", type: "text", required: false, hidden: true },
      { name: "daccPublickey", type: "text", required: false, pattern: "^daccPublickey_" },
      { name: "eip7702_enabled", type: "bool", required: false },
      { name: "eip7702_hash", type: "text", required: false },
      { name: "wallet_version", type: "number", required: false, min: 0, max: 10, onlyInt: true },
      { name: "encrypted_private_key", type: "text", required: false, max: 1024, hidden: true },
      { name: "usdt_balance", type: "number", required: false, min: 0, max: 999999999 },
      { name: "usdt_total_earned", type: "number", required: false, min: 0, max: 999999999 },
      { name: "total_direct_recruits", type: "number", required: false, min: 0, max: 999999, onlyInt: true },
      { name: "lifetime_food_items", type: "number", required: false, min: 0, max: 999999, onlyInt: true },
      { name: "food_nft_count", type: "number", required: false, min: 0, max: 999999, onlyInt: true },
      { name: "total_food_consumed", type: "number", required: false, min: 0, max: 999999, onlyInt: true },
      { name: "highest_tier_reached", type: "text", required: false, max: 20 },
      { name: "referrer_id", type: "relation", required: false, collectionId: usersId, cascadeDelete: false, maxSelect: 1 },
      { name: "referral_chain", type: "text", required: false },
      { name: "admin", type: "bool", required: false },
      { name: "claimed_recruitment_tier", type: "number", required: false, min: 0, max: 10, onlyInt: true },
      { name: "kyc_required_globally", type: "bool", required: false },
      // Autodate fields (explicitly added back since they were accidentally removed)
      { name: "created", type: "autodate", onCreate: true, onUpdate: false, presentable: false, system: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true, presentable: false, system: false },
    ];

    const existingFields = existing.fields || [];
    const systemFields = existingFields.filter(f => f.system || f.type === 'autodate');
    
    // Merge custom fields with existing IDs
    const mergedFields = customFields.map(newField => {
      const existingField = existingFields.find(f => f.name === newField.name);
      if (existingField) {
        return { ...newField, id: existingField.id };
      }
      return newField;
    });
    
    // Ensure autodate fields exist
    const autodateFields = existingFields.filter(f => f.type === 'autodate');
    for (const autoField of autodateFields) {
      if (!mergedFields.find(f => f.name === autoField.name)) {
        mergedFields.push(autoField);
      }
    }
    
    // Add system fields first, then custom fields (including preserved autodates)
    const finalFields = [...systemFields];
    for (const field of mergedFields) {
      if (!finalFields.find(f => f.name === field.name)) {
        finalFields.push(field);
      }
    }

    const usersSchema = {
      type: "auth",
      fields: finalFields,
      indexes: [
        "CREATE UNIQUE INDEX `idx_externalId` ON `users` (`externalId`)",
        "CREATE UNIQUE INDEX `idx_wallet` ON `users` (`wallet`) WHERE `wallet` != ''",
        "CREATE UNIQUE INDEX `idx_daccPublickey` ON `users` (`daccPublickey`) WHERE `daccPublickey` != ''",
        "CREATE INDEX `idx_users_referrer_id` ON `users` (`referrer_id`)",
        "CREATE INDEX `idx_users_highest_tier` ON `users` (`highest_tier_reached`)",
      ],
      listRule: "id = @request.auth.id",
      viewRule: "id = @request.auth.id",
      createRule: "",
      updateRule: "id = @request.auth.id",
      deleteRule: "id = @request.auth.id",
      authRule: "",
      manageRule: null,
      oauth2: {
        providers: [
          {
            name: "oidc",
            displayName: "Line",
            clientId: LINE_CHANNEL_ID || "2009441873",
            clientSecret: LINE_CHANNEL_SECRET || "",
            authURL: "https://access.line.me/oauth2/v2.1/authorize",
            tokenURL: "https://api.line.me/oauth2/v2.1/token",
            userInfoURL: "https://api.line.me/oauth2/v2.1/userinfo",
            scopes: ["openid", "profile"],
            pkce: true,
            extra: {}
          }
        ],
        mappedFields: {
          id: "externalId",
          name: "name",
          username: "",
          avatarURL: "avatar"
        },
        enabled: true
      },
      passwordAuth: {
        enabled: false,
        identityFields: ["email"]
      },
      mfa: { enabled: false, duration: 1800, rule: "" },
      otp: { enabled: false, duration: 180, length: 8 },
      authToken: { duration: 604800 },
      passwordResetToken: { duration: 1800 },
      emailChangeToken: { duration: 1800 },
      verificationToken: { duration: 259200 },
      fileToken: { duration: 180 },
    };

    try {
      await pb.collections.update("users", usersSchema);
      console.log("✅ Updated: users");
    } catch (updateError) {
      console.error(`❌ Update error for users:`, updateError.message);
      if (updateError.data) console.error("   Data:", JSON.stringify(updateError.data, null, 2));
      console.log("⚠️  Retrying users without indexes...");
      const { indexes, ...rest } = usersSchema;
      try {
        await pb.collections.update("users", rest);
        console.log("⚠️  Updated (indexes skipped): users");
      } catch (retryError) {
        console.error(`❌ Retry failed for users:`, retryError.message);
        if (retryError.data) console.error("   Data:", JSON.stringify(retryError.data, null, 2));
        throw retryError;
      }
    }
  } catch (e) {
    console.error("❌ Failed to update users:", e.message);
    if (e.data) console.error("   Data:", JSON.stringify(e.data, null, 2));
  }

  // 2) Create/update egg_nfts and animal_nfts first (no cross-dependencies)
  await upsertCollection("egg_nfts", {
    type: "base",
    fields: [
      { name: "egg_id", type: "number", required: false, min: 0 },
      { name: "owner", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "token_id", type: "number", required: true, unique: true, min: 0 },
      { name: "contract_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "food_count", type: "number", required: true, min: 0, max: 20 },
      { name: "is_hatched", type: "bool", required: false },
      { name: "is_breeding_egg", type: "bool", required: false },
      { name: "parent1_animal_id", type: "number", required: false, min: 0 },
      { name: "parent2_animal_id", type: "number", required: false, min: 0 },
      { name: "rarity_upgrade_count", type: "number", required: false, min: 0, max: 10 },
      { name: "generation", type: "number", required: false, min: 0 },
      { name: "rarity_seed", type: "number", required: false },
      { name: "is_hatching", type: "bool", required: false },
      { name: "vrf_request_id", type: "text", required: false },
      { name: "vrf_transaction_hash", type: "text", required: false },
      { name: "is_burned", type: "bool", required: false },
      { name: "burned_at", type: "date", required: false },
      { name: "referral_chain", type: "json", required: false },
      { name: "tx_hash", type: "text", required: true, unique: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "minted_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX `idx_egg_nfts_owner` ON `egg_nfts` (`owner`)",
      "CREATE INDEX `idx_egg_nfts_token_id` ON `egg_nfts` (`token_id`)",
      "CREATE INDEX `idx_egg_nfts_is_hatched` ON `egg_nfts` (`is_hatched`)",
    ],
    listRule: "@request.auth.id != '' && owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && owner = @request.auth.id",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
  });

  await upsertCollection("animal_nfts", {
    type: "base",
    fields: [
      { name: "animal_id", type: "number", required: false, min: 0 },
      { name: "token_id", type: "number", required: true, unique: true, min: 0 },
      { name: "owner", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "species", type: "select", required: true, values: ["Chicken", "Duck", "Pig", "Cow", "Sheep", "Dog", "Cat", "Rabbit"] },
      { name: "rarity", type: "select", required: true, values: ["Common", "Rare", "Epic", "Legendary"] },
      { name: "generation", type: "number", required: true, min: 0 },
      { name: "parent_egg_id", type: "number", required: false, min: 0 },
      { name: "parent1_animal_id", type: "number", required: false, min: 0 },
      { name: "parent2_animal_id", type: "number", required: false, min: 0 },
      { name: "food_type_distribution", type: "json", required: false },
      { name: "rarity_upgrade_count", type: "number", required: false, min: 0, max: 10 },
      { name: "is_burned", type: "bool", required: false },
      { name: "burned_at", type: "date", required: false },
      { name: "contract_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "tx_hash", type: "text", required: true, unique: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "minted_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX `idx_animal_nfts_owner` ON `animal_nfts` (`owner`)",
      "CREATE INDEX `idx_animal_nfts_token_id` ON `animal_nfts` (`token_id`)",
      "CREATE INDEX `idx_animal_nfts_generation` ON `animal_nfts` (`generation`)",
      "CREATE INDEX `idx_animal_nfts_rarity` ON `animal_nfts` (`rarity`)",
    ],
    listRule: "@request.auth.id != '' && owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && owner = @request.auth.id",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
  });

  // Now get actual IDs for collections that might have been just created
  const eggNftsId = await getCollectionId("egg_nfts");
  const animalNftsId = await getCollectionId("animal_nfts");

  // Continue with collections that depend on egg_nfts / animal_nfts
  await upsertCollection("food_nfts", {
    type: "base",
    fields: [
      { name: "food_id", type: "number", required: true, unique: true, min: 0 },
      { name: "token_id", type: "number", required: true, min: 0 },
      { name: "owner", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "food_type", type: "select", required: true, values: ["grain", "fish", "insects", "herb"] },
      { name: "is_consumed", type: "bool", required: true },
      { name: "consumed_by_egg", type: "relation", required: false, collectionId: eggNftsId, cascadeDelete: false, maxSelect: 1 },
      { name: "is_burned", type: "bool", required: false },
      { name: "burned_at", type: "date", required: false },
      { name: "contract_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "tx_hash", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "minted_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX `idx_food_nfts_owner` ON `food_nfts` (`owner`)",
      "CREATE INDEX `idx_food_nfts_is_consumed` ON `food_nfts` (`is_consumed`)",
      "CREATE INDEX `idx_food_nfts_food_type` ON `food_nfts` (`food_type`)",
    ],
    listRule: "@request.auth.id != '' && owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && owner = @request.auth.id",
    createRule: null,
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: null,
  });

  await upsertCollection("egg_consumption_logs", {
    type: "base",
    fields: [
      { name: "egg", type: "relation", required: true, collectionId: eggNftsId, cascadeDelete: true, maxSelect: 1 },
      { name: "food_items", type: "json", required: true },
      { name: "food_type_distribution", type: "json", required: false },
      { name: "total_food_count", type: "number", required: true, min: 0 },
      { name: "fed_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX `idx_consumption_egg` ON `egg_consumption_logs` (`egg`)",
    ],
    listRule: "@request.auth.id != '' && egg.owner = @request.auth.id",
    viewRule: "@request.auth.id != '' && egg.owner = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: "@request.auth.id != '' && egg.owner = @request.auth.id",
  });

  await upsertCollection("marketplace_listings", {
    type: "base",
    fields: [
      { name: "nft_id", type: "text", required: true },
      { name: "nft_type", type: "select", required: true, values: ["Egg", "Food", "Animal"] },
      { name: "name", type: "text", required: true },
      { name: "description", type: "text", required: false },
      { name: "rarity", type: "text", required: true },
      { name: "price", type: "number", required: true, min: 0 },
      { name: "price_symbol", type: "text", required: false, default: "USDT" },
      { name: "seller", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "seller_name", type: "text", required: false },
      { name: "buyer", type: "relation", required: false, collectionId: usersId, cascadeDelete: false, maxSelect: 1 },
      { name: "image_url", type: "text", required: false },
      { name: "status", type: "select", required: true, values: ["active", "sold", "cancelled"] },
      { name: "transaction_hash", type: "text", required: false, pattern: "^0x[a-fA-F0-9]{64}$" },
    ],
    indexes: [
      "CREATE INDEX `idx_marketplace_listings_seller` ON `marketplace_listings` (`seller`)",
      "CREATE INDEX `idx_marketplace_listings_buyer` ON `marketplace_listings` (`buyer`)",
      "CREATE INDEX `idx_marketplace_listings_status` ON `marketplace_listings` (`status`)",
      "CREATE INDEX `idx_marketplace_listings_nft_type` ON `marketplace_listings` (`nft_type`)",
    ],
    listRule: "status = 'active'",
    viewRule: "status = 'active' || seller = @request.auth.id || buyer = @request.auth.id",
    createRule: "@request.auth.id != '' && seller = @request.auth.id",
    updateRule: "seller = @request.auth.id && status = 'active'",
    deleteRule: "seller = @request.auth.id",
  });

  await upsertCollection("resale_listings", {
    type: "base",
    fields: [
      { name: "nft_id", type: "relation", required: true, collectionId: animalNftsId, cascadeDelete: true, maxSelect: 1 },
      { name: "animal_id", type: "number", required: true, min: 1 },
      { name: "seller_id", type: "relation", required: true, collectionId: usersId, cascadeDelete: false, maxSelect: 1 },
      { name: "buyer_id", type: "relation", required: false, collectionId: usersId, cascadeDelete: false, maxSelect: 1 },
      { name: "price", type: "number", required: true, min: 0.01 },
      { name: "rarity", type: "select", required: true, values: ["Common", "Rare", "Epic", "Legendary"] },
      { name: "species", type: "select", required: true, values: ["Chicken", "Duck", "Pig", "Cow", "Sheep", "Dog", "Cat", "Rabbit"] },
      { name: "generation", type: "number", required: true, min: 0 },
      { name: "royalty_recipients", type: "json", required: false },
      { name: "status", type: "select", required: true, values: ["active", "sold", "cancelled"] },
      { name: "listed_at", type: "date", required: true },
      { name: "sold_at", type: "date", required: false },
    ],
    indexes: [
      "CREATE INDEX `idx_resale_listings_seller` ON `resale_listings` (`seller_id`)",
      "CREATE INDEX `idx_resale_listings_status` ON `resale_listings` (`status`)",
      "CREATE INDEX `idx_resale_listings_animal_id` ON `resale_listings` (`animal_id`)",
      "CREATE INDEX `idx_resale_listings_rarity` ON `resale_listings` (`rarity`)",
      "CREATE INDEX `idx_resale_listings_species` ON `resale_listings` (`species`)",
      "CREATE INDEX `idx_resale_listings_price` ON `resale_listings` (`price`)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && seller_id = @request.auth.id",
    updateRule: "@request.auth.id != '' && seller_id = @request.auth.id",
    deleteRule: "@request.auth.id != '' && seller_id = @request.auth.id && status = 'active'",
  });

  await upsertCollection("tier_badges", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "token_id", type: "number", required: true, min: 1, max: 3 },
      { name: "tier_name", type: "select", required: true, values: ["Seedling", "Grower", "Farmer"] },
      { name: "contract_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "tx_hash", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "minted_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_tier_badges_user_token` ON `tier_badges` (`user`, `token_id`)",
      "CREATE INDEX `idx_tier_badges_contract` ON `tier_badges` (`contract_address`)",
      "CREATE INDEX `idx_tier_badges_tx_hash` ON `tier_badges` (`tx_hash`)",
    ],
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "",
    deleteRule: "",
  });

  await upsertCollection("tier_claims", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "tier", type: "select", required: true, values: ["seedling", "grower", "farmer"] },
      { name: "usdt_amount", type: "number", required: true, min: 0 },
      { name: "tx_hash", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "token_id", type: "number", required: true, min: 1, max: 3 },
      { name: "claimed_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_tier_claims_user_tier` ON `tier_claims` (`user`, `tier`)",
      "CREATE INDEX `idx_tier_claims_tx_hash` ON `tier_claims` (`tx_hash`)",
      "CREATE INDEX `idx_tier_claims_claimed_at` ON `tier_claims` (`claimed_at`)",
    ],
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "",
    deleteRule: "",
  });

  await upsertCollection("commission_records", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "level", type: "number", required: true, min: 1, max: 4 },
      { name: "amount", type: "number", required: true, min: 0 },
      { name: "tx_hash", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "from_egg", type: "relation", required: true, collectionId: eggNftsId, cascadeDelete: false, maxSelect: 1 },
      { name: "claimed", type: "bool", required: true },
      { name: "claimed_at", type: "date", required: false },
      { name: "block_number", type: "number", required: false, min: 0 },
    ],
    indexes: [
      "CREATE INDEX `idx_commission_user` ON `commission_records` (`user`)",
      "CREATE INDEX `idx_commission_claimed` ON `commission_records` (`claimed`)",
      "CREATE INDEX `idx_commission_tx_hash` ON `commission_records` (`tx_hash`)",
    ],
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: null,
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: null,
  });

  await upsertCollection("transactions", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "type", type: "select", required: true, values: ["mint_egg", "mint_food", "buy_nft", "sell_nft", "commission", "withdraw", "feed_egg", "hatch_egg"] },
      { name: "amount_usdt", type: "number", required: true },
      { name: "status", type: "select", required: true, values: ["confirmed", "pending", "failed"] },
      { name: "tx_hash", type: "text", required: false, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "description", type: "text", required: false },
    ],
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "user = @request.auth.id",
    updateRule: null,
    deleteRule: null,
  });

  await upsertCollection("transaction_logs", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: false, maxSelect: 1 },
      { name: "tx_hash", type: "text", required: false, max: 255 },
      { name: "tx_type", type: "text", required: true, max: 50, pattern: "^(mint|buy|feed|hatch|breed)$" },
      { name: "status", type: "text", required: true, max: 20, pattern: "^(success|failed|pending)$" },
      { name: "error_message", type: "text", required: false, max: 1000 },
      { name: "gas_used", type: "number", required: false, min: 0, onlyInt: true },
    ],
    indexes: [
      "CREATE INDEX `idx_user_transaction_logs` ON `transaction_logs` (`user`)",
      "CREATE INDEX `idx_tx_hash_transaction_logs` ON `transaction_logs` (`tx_hash`) WHERE `tx_hash` IS NOT NULL",
      "CREATE INDEX `idx_tx_type_transaction_logs` ON `transaction_logs` (`tx_type`)",
      "CREATE INDEX `idx_status_transaction_logs` ON `transaction_logs` (`status`)",
      "CREATE INDEX `idx_timestamp_transaction_logs` ON `transaction_logs` (`created`)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "",
    updateRule: "",
    deleteRule: null,
  });

  await upsertCollection("deposits", {
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "amount", type: "number", required: true, min: 0, max: 999999999 },
      { name: "tx_hash", type: "text", required: true, unique: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "from_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "block_number", type: "number", required: true, min: 0, onlyInt: true },
      { name: "block_hash", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{64}$" },
      { name: "confirmations", type: "number", required: true, min: 0, onlyInt: true },
      { name: "status", type: "select", required: false, values: ["pending", "confirmed", "failed"] },
      { name: "confirmed_at", type: "date", required: false },
      { name: "log_index", type: "number", required: true, min: 0 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_deposits_tx_hash` ON `deposits` (`tx_hash`)",
      "CREATE INDEX `idx_deposits_user` ON `deposits` (`user`)",
      "CREATE INDEX `idx_deposits_status` ON `deposits` (`status`)",
      "CREATE INDEX `idx_deposits_block_number` ON `deposits` (`block_number`)",
      "CREATE INDEX `idx_deposits_confirmations` ON `deposits` (`confirmations`)",
      "CREATE UNIQUE INDEX `idx_deposits_tx_hash_log` ON `deposits` (`tx_hash`, `log_index`)",
    ],
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  await upsertCollection("withdrawals", {
    type: "base",
    fields: [
      { name: "user_id", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "amount", type: "number", required: true, min: 0, max: 999999999 },
      { name: "fee", type: "number", required: false, min: 0, max: 999999999 },
      { name: "external_wallet_address", type: "text", required: true, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "status", type: "select", required: false, values: ["pending", "processing", "completed", "failed"] },
      { name: "tx_hash", type: "text", required: false, pattern: "^0x[a-fA-F0-9]{64}$" },
    ],
    indexes: [
      "CREATE INDEX `idx_withdrawals_user_id` ON `withdrawals` (`user_id`)",
      "CREATE INDEX `idx_withdrawals_status` ON `withdrawals` (`status`)",
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });

  await upsertCollection("referrals", {
    type: "base",
    fields: [
      { name: "referrer_id", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "referee_id", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "level", type: "number", required: true, min: 1, max: 4, onlyInt: true },
    ],
    indexes: [
      "CREATE INDEX `idx_referrals_referrer_id` ON `referrals` (`referrer_id`)",
      "CREATE INDEX `idx_referrals_referee_id` ON `referrals` (`referee_id`)",
      "CREATE INDEX `idx_referrals_level` ON `referrals` (`level`)",
      "CREATE UNIQUE INDEX `idx_referrals_unique_pair` ON `referrals` (`referrer_id`, `referee_id`, `level`)",
    ],
    listRule: "@request.auth.id != '' && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    viewRule: "@request.auth.id != '' && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
    createRule: "",
    updateRule: null,
    deleteRule: null,
  });

  await upsertCollection("user_wallets", {
    type: "base",
    fields: [
      { name: "user_id", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "usdt_balance", type: "number", required: false, min: 0, max: 999999999 },
      { name: "total_earned", type: "number", required: false, min: 0, max: 999999999 },
      { name: "total_spent", type: "number", required: false, min: 0, max: 999999999 },
      { name: "total_withdrawn", type: "number", required: false, min: 0, max: 999999999 },
      { name: "wallet_address", type: "text", required: false, pattern: "^0x[a-fA-F0-9]{40}$" },
      { name: "last_transaction_at", type: "date", required: false },
      { name: "last_polled_block", type: "number", required: false, min: 0, max: 999999999 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_user_wallets_user_id` ON `user_wallets` (`user_id`)",
      "CREATE INDEX `idx_user_wallets_wallet_address` ON `user_wallets` (`wallet_address`)",
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "@request.auth.id != '' && @request.auth.id = user_id.id",
  });

  await upsertCollection("wallet_configs", {
    type: "base",
    fields: [
      { name: "key", type: "text", required: true, max: 50 },
      { name: "value", type: "number", required: true },
      { name: "description", type: "text", required: false, max: 255 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_wallet_configs_key` ON `wallet_configs` (`key`)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  await upsertCollection("sync_state", {
    type: "base",
    fields: [
      { name: "id", type: "text", required: true, unique: true, pattern: "^config$" },
      { name: "lastProcessedBlock", type: "number", required: true, min: 0 },
      { name: "lastSyncTimestamp", type: "date", required: false },
      { name: "status", type: "select", required: false, values: ["syncing", "error", "idle"] },
      { name: "last_error", type: "text", required: false },
      { name: "failed_block", type: "number", required: false, min: 0 },
    ],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  console.log("\n✅ All collections initialized successfully!");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message || err);
  process.exit(1);
});
