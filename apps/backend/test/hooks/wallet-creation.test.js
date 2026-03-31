import { describe, test, expect } from "bun:test";

const PB_URL = Bun.env.PB_URL || "http://localhost:8090";

describe("Wallet Creation Hook", () => {
  test("should create wallet when user is created", async () => {
    // Create test user via PocketBase
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: "test123456",
      passwordConfirm: "test123456",
      name: "Test User"
    };

    const response = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const user = await response.json();

    // Verify hook fired and created wallet
    expect(user.wallet).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(user.daccPublickey).toMatch(/^daccPublickey_/);
    expect(user.pin).toBeDefined();
    expect(user.pin).not.toBe("");
  });
});
