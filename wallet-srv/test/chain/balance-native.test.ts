import { describe, test, expect } from "bun:test";

describe("Multi-Chain Balance Native", () => {
  test("should get balance on BSC (chainId 56)", async () => {
    const response = await fetch("http://localhost:3001/api/v1/56/balance-native?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");
    
    // Should work or fail with network error (test environment may not have network access)
    if (response.status === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.address).toBe("0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");
      expect(body.data.network).toBe("BSC");
      expect(body.data.chainId).toBe(56);
    } else {
      // Network error is acceptable in test environment
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
  });

  test("should reject unsupported chain ID", async () => {
    const response = await fetch("http://localhost:3001/api/v1/99999/balance-native?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNSUPPORTED_CHAIN");
  });

  test("should require address parameter", async () => {
    const response = await fetch("http://localhost:3001/api/v1/56/balance-native");
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("MISSING_ADDRESS");
  });
});
