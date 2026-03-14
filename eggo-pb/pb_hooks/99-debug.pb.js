// ===== DEBUG HOOK =====
// Debug utilities and logging for eggo-pb

console.log("Setting up debug hooks...");

// Log all requests for debugging (enabled for OAuth troubleshooting)
routerUse((next) => {
  return (c) => {
    const start = Date.now();
    const method = c.request().method;
    const path = c.request().url.path;
    
    // Log OAuth-specific requests with full query params
    if (path.includes('/api/collections/users/auth-methods') || path.includes('/api/oauth2-redirect')) {
      const query = c.request().url.query;
      console.log(`[${new Date().toISOString()}] ${method} ${path}?${new URLSearchParams(query)} - Started`);
    } else {
      console.log(`[${new Date().toISOString()}] ${method} ${path} - Started`);
    }
    
    try {
      const result = next(c);
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${method} ${path} - Completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${new Date().toISOString()}] ${method} ${path} - Failed in ${duration}ms:`, error.message);
      throw error;
    }
  };
});

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
console.log("  - GET /api/debug/info");
console.log("  - POST /api/debug/test-wallet (dev only)");
