import { describe, test, expect } from "bun:test";

const PB_URL = Bun.env.PB_URL || "http://localhost:8090";

describe("Users Collection Schema", () => {
  test("should have correct field structure", async () => {
    // Get users collection schema
    const response = await fetch(`${PB_URL}/api/collections/users`);
    const collection = await response.json();

    // Check NEW fields exist
    const fieldNames = collection.schema.map(f => f.name);
    
    expect(fieldNames).toContain("wallet");
    expect(fieldNames).toContain("pin");
    expect(fieldNames).toContain("daccPublickey");
    expect(fieldNames).toContain("eip7702_enabled");
    expect(fieldNames).toContain("eip7702_hash");

    // Check OLD fields are removed
    expect(fieldNames).not.toContain("wallet_address");
    expect(fieldNames).not.toContain("publicKey");
    expect(fieldNames).not.toContain("encrypted_private_key");

    // Check pin field is hidden
    const pinField = collection.schema.find(f => f.name === "pin");
    expect(pinField).toBeDefined();
    expect(pinField.hidden).toBe(true);
  });
});
