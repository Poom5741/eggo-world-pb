// ===== DEBUG HOOK =====
// Debug utilities and logging for eggo-pb

console.log("Setting up debug hooks...");

// Add OAuth debug endpoint to inspect provider config
routerAdd('GET', '/api/debug/oauth-config', (c) => {
  const authMethods = $app.dao().findAuthMethods('users');
  const lineProvider = authMethods.oauth2?.providers?.find(p => p.name === 'line');
  return c.json(200, {
    environmentConfig: globalThis.EGGO_CONFIG?.line || {},
    pocketbaseProvider: lineProvider || null,
    callbackUrlCheck: {
      expected: 'http://localhost:8090/api/oauth2-redirect',
      lineConsoleConfigured: globalThis.EGGO_CONFIG?.line?.callbackUrls?.includes('http://localhost:8090/api/oauth2-redirect') || false
    }
  });
});

console.log("Debug hooks registered successfully");
console.log("Available debug endpoints:");
console.log("  - GET /api/debug/oauth-config");