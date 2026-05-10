#!/usr/bin/env node
/**
 * Convert Collection JSON Files to PocketBase Import Format
 * 
 * Reads simplified JSON schemas from apps/backend/collections/
 * and converts them to the full PocketBase API format.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionsDir = path.join(__dirname, "../apps/backend/collections");
const outputDir = path.join(__dirname, "../apps/backend/collections-converted");

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🔄 Converting collection schemas to PocketBase format...\n");

// Field type conversion map
function convertField(field) {
  const baseField = {
    id: `field_${field.name}_${Math.random().toString(36).substr(2, 9)}`,
    name: field.name,
    type: field.type,
    required: field.required || false,
    presentable: field.presentable || false,
    system: false,
    hidden: field.hidden || false,
  };

  // Add type-specific options
  switch (field.type) {
    case "text":
      return {
        ...baseField,
        autogeneratePattern: field.pattern || "",
        max: field.max || 0,
        min: field.min || 0,
        pattern: field.pattern || "",
        primaryKey: field.unique || false,
      };

    case "number":
      return {
        ...baseField,
        max: field.options?.max || null,
        min: field.options?.min || 0,
        onlyInt: field.onlyInt || false,
      };

    case "select":
      return {
        ...baseField,
        maxSelect: field.options?.maxSelect || 1,
        values: field.options?.values || [],
      };

    case "email":
      return {
        ...baseField,
        exceptDomains: null,
        onlyDomains: null,
      };

    case "url":
      return {
        ...baseField,
        exceptDomains: null,
        onlyDomains: null,
      };

    case "date":
      return {
        ...baseField,
        max: "",
        min: "",
      };

    case "bool":
      return baseField;

    case "relation":
      return {
        ...baseField,
        collectionId: field.options?.collectionId || "",
        cascadeDelete: field.options?.cascadeDelete || false,
        minSelect: field.options?.minSelect || null,
        maxSelect: field.options?.maxSelect || 1,
      };

    case "file":
      return {
        ...baseField,
        maxSelect: field.options?.maxSelect || 1,
        maxSize: field.options?.maxSize || 5242880,
        mimeTypes: field.options?.mimeTypes || [],
        protected: field.protected || false,
        thumbs: field.options?.thumbs || [],
      };

    case "editor":
    case "json":
      return baseField;

    default:
      console.warn(`⚠️  Unknown field type: ${field.type}`);
      return baseField;
  }
}

// Process each JSON file
const jsonFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.json'));

let converted = 0;
let errors = 0;

for (const file of jsonFiles) {
  try {
    const filePath = path.join(collectionsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Handle both array and object format
    const collectionData = Array.isArray(data) ? data[0] : data;
    
    if (!collectionData || !collectionData.name) {
      console.log(`⚠️  Skipping invalid file: ${file}`);
      continue;
    }

    console.log(`📝 Converting: ${collectionData.name}`);

    // Convert schema fields to PocketBase format
    const convertedFields = (collectionData.schema || []).map(convertField);

    // Build the full PocketBase format
    const pocketbaseFormat = {
      id: collectionData.id || `collection_${collectionData.name}`,
      name: collectionData.name,
      type: collectionData.type || "base",
      system: collectionData.system || false,
      listRule: collectionData.listRule || null,
      viewRule: collectionData.viewRule || null,
      createRule: collectionData.createRule || null,
      updateRule: collectionData.updateRule || null,
      deleteRule: collectionData.deleteRule || null,
      fields: convertedFields,
      indexes: collectionData.indexes || [],
    };

    // Add auth-specific fields if it's an auth collection
    if (collectionData.type === "auth") {
      pocketbaseFormat.authRule = collectionData.authRule || "";
      pocketbaseFormat.manageRule = collectionData.manageRule || null;
      pocketbaseFormat.authAlert = {
        enabled: true,
        emailTemplate: {
          subject: "Login from a new location",
          body: "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>"
        }
      };
      pocketbaseFormat.oauth2 = {
        mappedFields: { id: "", name: "", username: "", avatarURL: "" },
        enabled: false
      };
      pocketbaseFormat.passwordAuth = {
        enabled: true,
        identityFields: ["email"]
      };
      pocketbaseFormat.mfa = { enabled: false, duration: 1800, rule: "" };
      pocketbaseFormat.otp = { enabled: false, duration: 180, length: 8 };
      pocketbaseFormat.authToken = { duration: 604800 };
      pocketbaseFormat.passwordResetToken = { duration: 1800 };
      pocketbaseFormat.emailChangeToken = { duration: 1800 };
      pocketbaseFormat.verificationToken = { duration: 259200 };
      pocketbaseFormat.fileToken = { duration: 180 };
    }

    // Write converted file
    const outputPath = path.join(outputDir, file);
    fs.writeFileSync(outputPath, JSON.stringify([pocketbaseFormat], null, 2));
    
    console.log(`✅ Converted: ${collectionData.name} (${convertedFields.length} fields)\n`);
    converted++;

  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
    errors++;
  }
}

console.log("\n" + "=".repeat(60));
console.log("📊 Conversion Summary:");
console.log("=".repeat(60));
console.log(`✅ Converted: ${converted}`);
console.log(`❌ Errors: ${errors}`);
console.log(`\n📁 Output directory: ${outputDir}`);
console.log("\nYou can now use these converted files with the import script!");
