// TDG Test: Field Name Migration
// Tests that all hooks use correct dacc-js field names
// Run: cd apps/backend && ./pocketbase serve --publicDir ./pb_public

import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const HOOKS_DIR = join(__dirname, "../pb_hooks");

describe("Field Name Migration - dacc-js", () => {
  const deprecatedFields = {
    "wallet_address": "wallet",
    "publicKey": "daccPublickey",
    "encrypted_private_key": "removed (dacc-js handles internally)"
  };

  const hooksToCheck = [
    "03-wallet-api-endpoint.pb.js",
    "05-auth-token.pb.js",
    "06-referral-chain.pb.js",
    "08-wallet-balance.pb.js",
    "07-register-user.pb.js",
    "09-withdraw-usdt.pb.js",
    "10-spend-usdt.pb.js",
    "11-transfer-usdt.pb.js",
    "12-update-tier.pb.js",
    "15-mint-food-nft.pb.js",
    "16-feed-egg.pb.js"
  ];

  test("should not use deprecated field: wallet_address", () => {
    const errors = [];

    for (const hookFile of hooksToCheck) {
      const filePath = join(HOOKS_DIR, hookFile);
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        if (line.includes("wallet_address") && !line.trim().startsWith("//")) {
          errors.push(`${hookFile}:${idx + 1} - ${line.trim()}`);
        }
      });
    }

    if (errors.length > 0) {
      console.error("❌ Found deprecated 'wallet_address' references:");
      errors.forEach(err => console.error(`  ${err}`));
    }

    expect(errors.length).toBe(0);
  });

  test("should not use deprecated field: publicKey", () => {
    const errors = [];

    for (const hookFile of hooksToCheck) {
      const filePath = join(HOOKS_DIR, hookFile);
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // Skip lines that are comments or mention daccPublickey
        if (line.includes("publicKey") && 
            !line.includes("daccPublickey") && 
            !line.trim().startsWith("//")) {
          errors.push(`${hookFile}:${idx + 1} - ${line.trim()}`);
        }
      });
    }

    if (errors.length > 0) {
      console.error("❌ Found deprecated 'publicKey' references:");
      errors.forEach(err => console.error(`  ${err}`));
    }

    expect(errors.length).toBe(0);
  });

  test("should use correct field: wallet", () => {
    // Check that hooks use 'wallet' field
    const hookFile = "01-create-wallet.pb.js";
    const filePath = join(HOOKS_DIR, hookFile);
    const content = readFileSync(filePath, "utf-8");

    expect(content).toContain('record.set("wallet"');
  });

  test("should use correct field: daccPublickey", () => {
    // Check that hooks use 'daccPublickey' field
    const hookFile = "01-create-wallet.pb.js";
    const filePath = join(HOOKS_DIR, hookFile);
    const content = readFileSync(filePath, "utf-8");

    expect(content).toContain('record.set("daccPublickey"');
  });

  test("should use correct field: pin", () => {
    // Check that hooks use 'pin' field (dacc-js password)
    const hookFile = "01-create-wallet.pb.js";
    const filePath = join(HOOKS_DIR, hookFile);
    const content = readFileSync(filePath, "utf-8");

    expect(content).toContain('record.set("pin"');
  });
});
