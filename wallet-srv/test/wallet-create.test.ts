import { describe, test, expect } from "bun:test";

describe("Wallet Creation with dacc-js", () => {
  test("should create wallet with password", async () => {
    const response = await fetch("http://localhost:3001/api/v1/wallet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: "TestPassword123!@#"
      })
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(body.data.daccPublickey).toMatch(/^daccPublickey_/);
    expect(body.data.daccPublickey).toBeDefined();
  });

  test("should validate password length", async () => {
    const response = await fetch("http://localhost:3001/api/v1/wallet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordSecretkey: "short"
      })
    });

    expect(response.status).toBe(400);
  });
});
