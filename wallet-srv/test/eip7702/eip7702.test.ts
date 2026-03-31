import { describe, test, expect } from "bun:test";

describe("EIP-7702 Account Abstraction", () => {
  test("should authorize EIP-7702 for smart account", async () => {
    const response = await fetch("http://localhost:3001/api/v2/eip7702/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smartAccount: "0xSmartAccount123456789012345678901234567890"
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(body.data.smartAccount).toBe("0xSmartAccount123456789012345678901234567890");
  });

  test("should require smartAccount parameter", async () => {
    const response = await fetch("http://localhost:3001/api/v2/eip7702/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("MISSING_SMART_ACCOUNT");
  });

  test("should get EIP-7702 status", async () => {
    const response = await fetch("http://localhost:3001/api/v2/eip7702/status?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.address).toBe("0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");
    expect(typeof body.data.eip7702Enabled).toBe("boolean");
  });

  test("should require address for status", async () => {
    const response = await fetch("http://localhost:3001/api/v2/eip7702/status");

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("MISSING_ADDRESS");
  });
});
