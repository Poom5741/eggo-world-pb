import { describe, test, expect } from "bun:test";

describe("Health Check", () => {
  test("should return 200 and service status", async () => {
    const response = await fetch("http://localhost:3001/health");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      status: "ok",
      service: "wallet-srv",
      version: expect.any(String)
    });
  });
});
