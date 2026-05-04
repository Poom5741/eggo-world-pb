// ===== DEBUG HOOK =====
// Debug utilities and logging for eggo-pb

console.log("Setting up debug hooks...");

// Add OAuth debug endpoint to inspect provider config
routerAdd('GET', '/api/debug/oauth-config', (c) => {
  const authMethods = $app.dao().findAuthMethods('users');
  const lineProvider = authMethods.oauth2?.providers?.find(p => p.name === 'line');
  return c.json(200, {
    environmentConfig: {
      channelId: $os.getenv("LINE_CHANNEL_ID") ? $os.getenv("LINE_CHANNEL_ID").substring(0, 4) + "..." : "",
      callbackUrls: [$os.getenv("LINE_CALLBACK_URL") || ""]
    },
    pocketbaseProvider: lineProvider || null,
    callbackUrlCheck: {
      expected: 'http://localhost:8090/api/oauth2-redirect',
      lineConsoleConfigured: ($os.getenv("LINE_CALLBACK_URL") || "").includes('http://localhost:8090/api/oauth2-redirect')
    }
  });
});

console.log("Debug hooks registered successfully");
console.log("Available debug endpoints:");
console.log("  - GET /api/debug/oauth-config");
console.log("  - POST /api/debug/http-test");

routerAdd('POST', '/api/debug/http-test', (c) => {
  var resp = $http.send({
    url: "http://wallet-api:3001/api/wallet/create",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "identity"
    },
    body: '{"passwordSecretkey":"TestPassword12345!","publicEncryption":false}'
  });

  var result = {
    statusCode: resp.statusCode,
    keys: Object.keys(resp)
  };

  // Try to get body each way
  if (resp.raw && resp.raw.length > 0) {
    var bodyStr = "";
    for (var j = 0; j < resp.raw.length; j++) {
      bodyStr += String.fromCharCode(resp.raw[j]);
    }
    result.rawLength = bodyStr.length;
    result.rawPreview = bodyStr.substring(0, 200);
  }

  return c.json(200, result);
});