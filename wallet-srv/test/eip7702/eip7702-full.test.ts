import { describe, test, expect, beforeEach } from "bun:test";

const SERVER_PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

describe("EIP-7702 Account Abstraction - Full Suite", () => {
  const TEST_WALLET = {
    daccPublickey: "daccPublickey_test_0x1234567890123456789012345678901234567890",
    passwordSecretkey: "TestPassword123!@#",
    address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    smartAccount: "0xSmartAccount1234567890123456789012345678901234"
  };

  describe("POST /api/v2/eip7702/authorize", () => {
    test.skip("should authorize EIP-7702 for smart account", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          chainId: 56
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(body.data.smartAccount).toBe(TEST_WALLET.smartAccount);
      expect(body.data.chainId).toBe(56);
      expect(body.data.status).toBe("authorized");
    });

    test("should require daccPublickey", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount
        })
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("MISSING_REQUIRED_FIELDS");
    });

    test("should reject unsupported chain ID", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          chainId: 99999
        })
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNSUPPORTED_CHAIN");
    });
  });

  describe("POST /api/v2/eip7702/execute", () => {
    test.skip("should execute transaction via paymaster", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          smartAccount: TEST_WALLET.smartAccount,
          to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
          data: "0x",
          value: "0",
          chainId: 56
        })
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(body.data.gasSponsored).toBe(true);
    });

    test("should require smartAccount for execution", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daccPublickey: TEST_WALLET.daccPublickey,
          passwordSecretkey: TEST_WALLET.passwordSecretkey,
          address: TEST_WALLET.address,
          to: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45"
        })
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("MISSING_REQUIRED_FIELDS");
    });
  });

  describe("GET /api/v2/eip7702/status", () => {
    test("should get EIP-7702 status", async () => {
      const response = await fetch(
        `${SERVER_URL}/api/v2/eip7702/status?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45&chainId=56`
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.address).toBe("0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45");
      expect(typeof body.data.eip7702Enabled).toBe("boolean");
      expect(body.data.chainId).toBe(56);
    });

    test("should require address parameter", async () => {
      const response = await fetch(`${SERVER_URL}/api/v2/eip7702/status`);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("MISSING_ADDRESS");
    });
  });
});
